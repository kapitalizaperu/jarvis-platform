import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { url, imageBase64, instruction } = await req.json()
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content: any[] = []

    if (imageBase64) {
      content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } })
    }

    if (url) {
      content.push({ type: 'text', text: `Referencia de diseño: ${url}` })
    }

    content.push({
      type: 'text',
      text: `Eres un diseñador UI experto. Analiza el estilo visual de la referencia y genera un tema para un dashboard de IA futurista.

Instrucción del usuario: "${instruction || 'Hazlo más futurista'}"

Responde SOLO con este JSON (sin markdown, sin explicación):
{
  "primaryColor": "#00F5FF",
  "secondaryColor": "#9B59B6",
  "accentColor": "#00FF88",
  "backgroundColor": "#0A0A0F",
  "surfaceColor": "#111118",
  "borderColor": "rgba(0,245,255,0.15)",
  "textColor": "#ffffff",
  "textMuted": "#666688",
  "glowColor": "#00F5FF",
  "glowIntensity": "40",
  "gradientFrom": "#00F5FF",
  "gradientTo": "#9B59B6",
  "borderRadius": "16",
  "fontFamily": "Space Grotesk",
  "blur": "20",
  "styleName": "Cyberpunk 2099",
  "description": "Descripción corta del estilo aplicado"
}`
    })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const theme = jsonMatch ? JSON.parse(jsonMatch[0]) : null

    if (!theme) return NextResponse.json({ error: 'No se pudo generar el tema' }, { status: 500 })

    return NextResponse.json({ theme })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
