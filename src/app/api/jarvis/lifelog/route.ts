import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/auth/supabase-client'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

// POST — analyze image from GoPro and save to lifelog
export async function POST(req: NextRequest) {
  const supabase = getServerSupabase()
  const body = await req.json()
  const { tenantId = 'demo-tenant', imageBase64, imageUrl, source = 'gopro', location } = body

  if (!imageBase64 && !imageUrl) {
    return NextResponse.json({ error: 'Image required' }, { status: 400 })
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // Analyze image with Claude Vision
  const imageContent = imageBase64
    ? { type: 'base64' as const, media_type: 'image/jpeg' as const, data: imageBase64 }
    : { type: 'url' as const, url: imageUrl }

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: imageContent },
        {
          type: 'text',
          text: `Analiza esta imagen de la GoPro de Jose Luis. Responde SOLO en JSON:
{
  "description": "descripción breve de qué está pasando",
  "activity": "actividad principal (trabajando/reunión/comiendo/caminando/etc)",
  "people_detected": ["lista de personas si hay"],
  "objects_detected": ["objetos importantes"],
  "mood": "estimación del ambiente (productivo/relajado/social/etc)",
  "key_moment": true/false
}`
        }
      ]
    }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  let analysis = {}
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
  } catch { analysis = {} }

  // Save to lifelog
  const { data, error } = await supabase
    .from('jarvis_lifelogs')
    .insert({
      tenant_id: tenantId,
      image_url: imageUrl || null,
      source,
      location: location || null,
      ...analysis,
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If key moment, save as memory too
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((analysis as any).key_moment) {
    await supabase.from('jarvis_memories').insert({
      tenant_id: tenantId,
      type: 'event',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      content: (analysis as any).description,
      importance: 7,
      tags: ['lifelog', 'gopro'],
    })
  }

  return NextResponse.json({ log: data, analysis })
}

// GET — retrieve lifelogs
export async function GET(req: NextRequest) {
  const supabase = getServerSupabase()
  const tenantId = req.nextUrl.searchParams.get('tenantId') || 'demo-tenant'
  const date = req.nextUrl.searchParams.get('date')
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50')

  let query = supabase
    .from('jarvis_lifelogs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('captured_at', { ascending: false })
    .limit(limit)

  if (date) {
    query = query
      .gte('captured_at', `${date}T00:00:00`)
      .lte('captured_at', `${date}T23:59:59`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ logs: data || [] })
}
