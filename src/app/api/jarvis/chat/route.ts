// POST /api/jarvis/chat — Chat principal con JARVIS (todos los canales)
import { NextRequest, NextResponse } from 'next/server'
import { orchestrate } from '@/lib/jarvis/orchestrator'

export async function POST(req: NextRequest) {
  try {
    const { messages, tenantId, clientId, channel, businessContext, agentType } = await req.json()

    if (!tenantId || !messages?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await orchestrate(messages, {
      tenantId,
      clientId,
      channel: channel ?? 'web',
      businessContext,
      agentType,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('JARVIS chat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
