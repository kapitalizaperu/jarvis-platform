// POST /api/jarvis/agent/create — Crear agente nuevo on-demand por voz
import { NextRequest, NextResponse } from 'next/server'
import { createCustomAgent } from '@/lib/jarvis/orchestrator'

export async function POST(req: NextRequest) {
  try {
    const { request, tenantId, clientId } = await req.json()

    if (!request || !tenantId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const agentSpec = await createCustomAgent(request, { tenantId, clientId, channel: 'web' })

    // En producción: guardar en DB y crear container Docker
    return NextResponse.json({ agent: agentSpec, status: 'building' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
