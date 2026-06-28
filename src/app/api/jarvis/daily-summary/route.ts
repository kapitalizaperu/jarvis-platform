import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/auth/supabase-client'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { tenantId = 'demo-tenant', date } = body
  const targetDate = date || new Date().toISOString().split('T')[0]

  const supabase = getServerSupabase()

  // Get lifelogs for the day
  const { data: logs } = await supabase
    .from('jarvis_lifelogs')
    .select('*')
    .eq('tenant_id', tenantId)
    .gte('captured_at', `${targetDate}T00:00:00`)
    .lte('captured_at', `${targetDate}T23:59:59`)
    .order('captured_at', { ascending: true })

  if (!logs || logs.length === 0) {
    return NextResponse.json({ error: 'No lifelogs for this date' }, { status: 404 })
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const logsText = logs.map(l =>
    `[${new Date(l.captured_at).toLocaleTimeString('es-PE')}] ${l.activity}: ${l.description}`
  ).join('\n')

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Basado en estos momentos del día de Jose Luis, genera un resumen ejecutivo.
Responde SOLO en JSON:
{
  "summary": "resumen narrativo del día en 2-3 oraciones",
  "key_events": ["evento 1", "evento 2", "evento 3"],
  "mood_average": "productivo/relajado/estresado/social/mixto",
  "productivity_score": 1-10,
  "insights": "observación importante o patrón detectado"
}

Actividades del día:
${logsText}`
    }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  let summary = {}
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    summary = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
  } catch { summary = {} }

  // Save daily summary
  const { data, error } = await supabase
    .from('jarvis_daily_summaries')
    .upsert({
      tenant_id: tenantId,
      date: targetDate,
      ...summary,
    }, { onConflict: 'tenant_id,date' })
    .select().single()

  // Also save as memory
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((summary as any).summary) {
    await supabase.from('jarvis_memories').insert({
      tenant_id: tenantId,
      type: 'event',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      content: `${targetDate}: ${(summary as any).summary}`,
      importance: 6,
      tags: ['daily-summary', targetDate],
    })
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ summary: data })
}

export async function GET(req: NextRequest) {
  const supabase = getServerSupabase()
  const tenantId = req.nextUrl.searchParams.get('tenantId') || 'demo-tenant'
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '7')

  const { data, error } = await supabase
    .from('jarvis_daily_summaries')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('date', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ summaries: data || [] })
}
