import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { frames, question, tenantId = 'demo-tenant', mode } = await req.json()

    if (!frames || frames.length === 0) {
      return NextResponse.json({ error: 'No frames provided' }, { status: 400 })
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    // Build content with all frames
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content: any[] = []

    for (const frame of frames) {
      const label = frame.type === 'camera' ? '📷 CÁMARA (lo que ve Jose Luis)' : '🖥️ PANTALLA (lo que Jose Luis está mirando en su PC)'
      content.push({ type: 'text', text: `--- ${label} ---` })
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: 'image/jpeg', data: frame.base64 }
      })
    }

    const contextText = mode === 'both'
      ? 'Tienes acceso a la cámara de Jose Luis (puedes verlo a él) Y a su pantalla (puedes ver lo que está haciendo en la computadora).'
      : mode === 'camera'
      ? 'Estás viendo a Jose Luis a través de su cámara web.'
      : 'Estás viendo la pantalla de la computadora de Jose Luis.'

    content.push({
      type: 'text',
      text: `Eres JARVIS, el asistente personal de IA de Jose Luis. ${contextText}

Pregunta/instrucción: ${question}

Responde en JSON:
{
  "whatISee": "descripción directa y específica de lo que ves (personas, pantalla, actividad)",
  "description": "análisis detallado respondiendo la pregunta",
  "suggestions": "recomendación o acción útil basada en lo que ves (opcional)"
}

Sé específico, útil y en español.`
    })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'

    let result = { whatISee: '', description: '', suggestions: '' }
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { whatISee: text, description: '', suggestions: '' }
    } catch {
      result = { whatISee: text, description: '', suggestions: '' }
    }

    // Save to lifelog if camera is active
    if (frames.some((f: { type: string }) => f.type === 'camera')) {
      try {
        const { getServerSupabase } = await import('@/lib/auth/supabase-client')
        const supabase = getServerSupabase()
        await supabase.from('jarvis_lifelogs').insert({
          tenant_id: tenantId,
          description: result.whatISee,
          activity: 'vision_check',
          source: 'webcam',
          mood: 'unknown',
        })
      } catch { /* non-critical */ }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Vision error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
