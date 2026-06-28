import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    if (!messages?.length) return NextResponse.json({ summary: '' })

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const conversation = messages
      .map((m: { role: string; content: string }) =>
        `${m.role === 'user' ? 'Jose Luis' : 'JARVIS'}: ${m.content}`)
      .join('\n')

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Resume en 3-5 oraciones los puntos más importantes de estas conversaciones. Captura: qué le interesa a Jose Luis, qué problemas mencionó, qué decisiones tomaron, y cualquier dato personal importante. Escribe en español desde la perspectiva de JARVIS (yo vi, yo supe, etc).

CONVERSACIONES:
${conversation.slice(0, 4000)}

RESUMEN:`
      }]
    })

    const summary = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Summarize error:', error)
    return NextResponse.json({ summary: '' })
  }
}
