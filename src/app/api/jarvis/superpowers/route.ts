import { NextRequest, NextResponse } from 'next/server'
import { superpowersRouter, brainstorm, debugSystematically, writePlan, generateTests, verifyBeforeComplete } from '@/lib/jarvis/agents/superpowers'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { message, skill, context, tenantId } = await req.json()

    let result

    switch (skill) {
      case 'brainstorming':
        result = { response: await brainstorm(message, context || '', tenantId || 'default') }
        break
      case 'systematic-debugging':
        result = { response: await debugSystematically(message, context || '') }
        break
      case 'writing-plans':
        result = { response: await writePlan(message, context || '') }
        break
      case 'test-driven-development':
        result = { response: await generateTests(message) }
        break
      case 'verification-before-completion':
        result = await verifyBeforeComplete(message, context || '')
        break
      default:
        result = await superpowersRouter(message, context || '')
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Superpowers error:', error)
    return NextResponse.json({ error: 'Error ejecutando skill' }, { status: 500 })
  }
}
