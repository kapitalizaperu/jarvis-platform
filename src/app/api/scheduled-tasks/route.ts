import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/auth/supabase-client'

export const dynamic = 'force-dynamic'

function calculateNextRun(schedule: string, hour: number, minute: number): Date {
  const now = new Date()
  const next = new Date()
  next.setHours(hour, minute, 0, 0)

  switch (schedule) {
    case 'hourly':
      next.setTime(now.getTime() + 60 * 60 * 1000)
      break
    case 'daily':
      if (next <= now) next.setDate(next.getDate() + 1)
      break
    case 'weekly':
      if (next <= now) next.setDate(next.getDate() + 7)
      break
    case 'monthly':
      if (next <= now) next.setMonth(next.getMonth() + 1)
      break
    case 'mon': case 'tue': case 'wed': case 'thu': case 'fri': case 'sat': case 'sun': {
      const dayMap: Record<string, number> = { sun:0, mon:1, tue:2, wed:3, thu:4, fri:5, sat:6 }
      const target = dayMap[schedule]
      const diff = (target + 7 - now.getDay()) % 7 || 7
      next.setDate(now.getDate() + diff)
      break
    }
    default:
      if (next <= now) next.setDate(next.getDate() + 1)
  }
  return next
}

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId') || 'demo-tenant'
  const supabase = getServerSupabase()

  const { data, error } = await supabase
    .from('scheduled_tasks')
    .select('*, scheduled_task_logs(ran_at, success, result)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tasks: data || [] })
}

export async function POST(req: NextRequest) {
  const supabase = getServerSupabase()
  const body = await req.json()
  const { tenantId, name, prompt, agentType, schedule, hour = 9, minute = 0, businessContext } = body

  if (!tenantId || !name || !prompt || !schedule) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const nextRun = calculateNextRun(schedule, hour, minute)

  const { data, error } = await supabase
    .from('scheduled_tasks')
    .insert({
      tenant_id: tenantId,
      name,
      prompt,
      agent_type: agentType || 'orchestrator',
      schedule,
      hour,
      minute,
      next_run_at: nextRun.toISOString(),
      business_context: businessContext || null,
      status: 'active',
      run_count: 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ task: data })
}

export async function PATCH(req: NextRequest) {
  const supabase = getServerSupabase()
  const { id, status } = await req.json()

  const { data, error } = await supabase
    .from('scheduled_tasks')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ task: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = getServerSupabase()
  const id = req.nextUrl.searchParams.get('id')

  const { error } = await supabase.from('scheduled_tasks').delete().eq('id', id!)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
