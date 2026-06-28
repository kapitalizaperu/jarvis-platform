import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { retrieveRelevantMemories, saveConversationMessage } from '@/lib/jarvis/rag'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const {
      text,
      cameraBase64,
      screenBase64,
      sessionId = `session_${Date.now()}`,
      userId = 'jose-luis',
      tenantId = 'demo-tenant',
      history = [],
      summary = '',
      facts = [],
    } = await req.json()

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    // 1. Recuperar memorias relevantes (RAG)
    let ragContext = ''
    try {
      ragContext = await retrieveRelevantMemories({ tenantId, userId, query: text, limit: 5 })
    } catch { /* non-critical */ }

    // 2. Build vision content
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
    userContent.push({ type: 'text', text })

    const factsBlock = facts.length > 0
      ? `\n📋 LO QUE SÉ SOBRE JOSE LUIS (memoria permanente):\n${facts.map((f: string) => `• ${f}`).join('\n')}\n`
      : ''

    const summaryBlock = summary
      ? `\n🧠 RESUMEN DE CONVERSACIONES ANTERIORES:\n${summary}\n`
      : ''

    const systemPrompt = `Eres JARVIS, el asistente personal de IA de Jose Luis. Hablas en español, eres directo, cálido y útil. NUNCA digas que no recuerdas conversaciones pasadas — tienes memoria persistente.

CAPACIDADES ACTIVAS:
${cameraBase64 ? '✅ CÁMARA: Puedes ver a Jose Luis en tiempo real en la imagen de arriba.' : '❌ Cámara: no activa.'}
${screenBase64 ? '✅ PANTALLA: Puedes ver lo que hay en su pantalla en la imagen de arriba.' : '❌ Pantalla: no activa.'}
${factsBlock}${summaryBlock}${ragContext ? `\n📜 CONTEXTO ADICIONAL:\n${ragContext}\n` : ''}
REGLAS:
- Usa los recuerdos y hechos anteriores para dar contexto y continuidad natural
- Cuando Jose Luis pregunte qué recuerdas, lista hechos concretos de tu memoria
- Si ves imágenes, descríbelas con precisión (cara, expresión, actividad)
- Respuestas cortas y naturales para voz (máximo 3 oraciones)
- Si NO hay imagen de cámara y preguntan si puedes ver: pide que activen la cámara`

    const messages = [
      ...history.slice(-20),
      { role: 'user' as const, content: userContent }
    ]

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 200,
      system: systemPrompt,
      messages,
    })

    const reply = response.content[0].type === 'text' ? response.content[0].text : ''

    // 3. Guardar en memoria (non-blocking)
    Promise.all([
      saveConversationMessage({ tenantId, userId, sessionId, role: 'user', content: text }),
      saveConversationMessage({ tenantId, userId, sessionId, role: 'assistant', content: reply }),
    ]).catch(() => { /* non-critical */ })

    return NextResponse.json({ reply, sessionId })
  } catch (error) {
    console.error('Vision chat error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
