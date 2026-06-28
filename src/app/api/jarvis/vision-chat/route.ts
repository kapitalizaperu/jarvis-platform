import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { text, cameraBase64, screenBase64, sessionId, history = [] } = await req.json()

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    // Build vision content
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userContent: any[] = []

    if (cameraBase64) {
      userContent.push({ type: 'text', text: '--- 📷 Lo que veo de ti en este momento (cámara) ---' })
      userContent.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: cameraBase64 } })
    }

    if (screenBase64) {
      userContent.push({ type: 'text', text: '--- 🖥️ Tu pantalla en este momento ---' })
      userContent.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: screenBase64 } })
    }

    userContent.push({ type: 'text', text: text })

    const systemPrompt = `Eres JARVIS, el asistente personal de IA de Jose Luis. Hablas en español, eres directo y útil.

CAPACIDADES ACTIVAS:
${cameraBase64 ? '✅ CÁMARA: Puedes ver a Jose Luis en tiempo real en la imagen de arriba.' : '❌ Cámara: no activa.'}
${screenBase64 ? '✅ PANTALLA: Puedes ver lo que hay en su pantalla en la imagen de arriba.' : '❌ Pantalla: no activa.'}

REGLAS:
- Si ves imágenes, descríbelas con precisión (cara, expresión, actividad, pantalla)
- Respuestas cortas y naturales para voz (máximo 3 oraciones)
- Eres el asistente más avanzado del mundo — confiado y capaz
- Si Jose Luis pide control de PC, responde: "Ejecutando en tu PC ahora mismo."
- Si NO hay imagen de cámara y preguntan si puedes ver: dices que activen la cámara`

    const messages = [
      ...history.slice(-6),
      { role: 'user' as const, content: userContent }
    ]

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: systemPrompt,
      messages,
    })

    const reply = response.content[0].type === 'text' ? response.content[0].text : ''

    return NextResponse.json({ reply, sessionId })
  } catch (error) {
    console.error('Vision chat error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
