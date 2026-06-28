// POST /api/jarvis/briefing — Briefing matutino automático
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { generateDailyBriefing } from '@/lib/jarvis/orchestrator'

export async function POST(req: NextRequest) {
  try {
    const { tenantId, clientId, metrics, schedule, businessContext } = await req.json()

    const briefing = await generateDailyBriefing({
      tenantId,
      clientId,
      channel: 'web',
      businessContext,
      metrics: metrics ?? { revenue: 0, leads: 0, calls: 0, posts: 0, tasks: 0 },
      schedule: schedule ?? [],
    })

    return NextResponse.json({ briefing })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
