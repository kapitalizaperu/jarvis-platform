import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/auth/supabase-client'
import { orchestrate } from '@/lib/jarvis/orchestrator'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Verify this is called by Vercel Cron
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServerSupabase()
  const now = new Date()

  // Get all active scheduled tasks due to run
  const { data: tasks, error } = await supabase
    .from('scheduled_tasks')
    .select('*')
    .eq('status', 'active')
    .lte('next_run_at', now.toISOString())

  if (error) {
    console.error('Error fetching scheduled tasks:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  if (!tasks || tasks.length === 0) {
    return NextResponse.json({ message: 'No tasks due', ran: 0 })
  }

  const results = []

  for (const task of tasks) {
    try {
      // Execute the task via JARVIS orchestrator
      const result = await orchestrate(
        [{ role: 'user', content: task.prompt }],
        {
          tenantId: task.tenant_id,
          channel: 'web',
          agentType: task.agent_type,
          businessContext: task.business_context,
        }
      )

      // Calculate next run time
      const nextRun = calculateNextRun(task.schedule, now)

      // Update task: log execution, set next run
      await supabase
        .from('scheduled_tasks')
        .update({
          last_run_at: now.toISOString(),
          next_run_at: nextRun.toISOString(),
          last_result: result.response.substring(0, 500),
          run_count: (task.run_count || 0) + 1,
        })
        .eq('id', task.id)

      // Log execution
      await supabase.from('scheduled_task_logs').insert({
        task_id: task.id,
        tenant_id: task.tenant_id,
        ran_at: now.toISOString(),
        result: result.response.substring(0, 1000),
        agent_used: result.agentUsed,
        success: true,
      })

      results.push({ id: task.id, name: task.name, success: true })
    } catch (err) {
      console.error(`Error running task ${task.id}:`, err)
      await supabase.from('scheduled_task_logs').insert({
        task_id: task.id,
        tenant_id: task.tenant_id,
        ran_at: now.toISOString(),
        result: String(err),
        success: false,
      })
      results.push({ id: task.id, name: task.name, success: false })
    }
  }

  return NextResponse.json({ message: 'Done', ran: results.length, results })
}

function calculateNextRun(schedule: string, from: Date): Date {
  const next = new Date(from)
  switch (schedule) {
    case 'hourly':   next.setHours(next.getHours() + 1); break
    case 'daily':    next.setDate(next.getDate() + 1); break
    case 'weekly':   next.setDate(next.getDate() + 7); break
    case 'monthly':  next.setMonth(next.getMonth() + 1); break
    case 'mon':      next.setDate(next.getDate() + ((1 + 7 - next.getDay()) % 7 || 7)); break
    case 'wed':      next.setDate(next.getDate() + ((3 + 7 - next.getDay()) % 7 || 7)); break
    case 'fri':      next.setDate(next.getDate() + ((5 + 7 - next.getDay()) % 7 || 7)); break
    default:         next.setDate(next.getDate() + 1)
  }
  return next
}
