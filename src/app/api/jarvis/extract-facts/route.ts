import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { userMessage, jarvisReply, existingFacts = [] } = await req.json()
    if (!userMessage || !jarvisReply) return NextResponse.json({ facts: [] })

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const existingList = existingFacts.length > 0
      ? `\nYa sé estos datos (no los repitas):\n${existingFacts.slice(-20).map((f: string) => `- ${f}`).join('\n')}`
      : ''

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: `Analiza este intercambio y extrae 0-3 datos NUEVOS e IMPORTANTES sobre Jose Luis que valgan la pena recordar permanentemente. Solo incluye datos realmente útiles (no cosas triviales). Si no hay datos nuevos, responde solo con "ninguno".${existingList}

Jose Luis dijo: "${userMessage}"
JARVIS respondió: "${jarvisReply}"

Datos nuevos a recordar (uno por línea, empezando con "- "):`,
      }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    if (!text || text.toLowerCase() === 'ninguno') return NextResponse.json({ facts: [] })

    const facts = text
      .split('\n')
      .filter(l => l.trim().startsWith('-'))
      .map(l => l.trim().slice(2).trim())
      .filter(f => f.length > 5)
      .slice(0, 3)

    return NextResponse.json({ facts })
  } catch (error) {
    console.error('Extract facts error:', error)
    return NextResponse.json({ facts: [] })
  }
}
