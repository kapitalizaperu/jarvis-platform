import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/auth/supabase-client'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

// GET — retrieve memories for a tenant
export async function GET(req: NextRequest) {
  const supabase = getServerSupabase()
  const tenantId = req.nextUrl.searchParams.get('tenantId') || 'demo-tenant'
  const type = req.nextUrl.searchParams.get('type')
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20')

  let query = supabase
    .from('jarvis_memories')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('importance', { ascending: false })
    .order('last_accessed', { ascending: false })
    .limit(limit)

  if (type) query = query.eq('type', type)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ memories: data || [] })
}

// POST — save a new memory
export async function POST(req: NextRequest) {
  const supabase = getServerSupabase()
  const body = await req.json()
  const { tenantId = 'demo-tenant', type, content, importance = 5, tags } = body

  if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 })

  const { data, error } = await supabase
    .from('jarvis_memories')
    .insert({ tenant_id: tenantId, type: type || 'general', content, importance, tags })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ memory: data })
}

// POST /api/jarvis/memory/extract — extract memories from conversation
export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { tenantId = 'demo-tenant', conversation } = body

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Analiza esta conversación y extrae memorias importantes para guardar.
Responde SOLO con JSON array: [{"type":"preference|fact|goal|person|event","content":"...","importance":1-10,"tags":["..."]}]

Conversación:
${conversation}

Solo extrae información realmente importante y duradera. Máximo 5 memorias.`
    }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]'

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    const memories = jsonMatch ? JSON.parse(jsonMatch[0]) : []

    const supabase = getServerSupabase()
    const saved = []
    for (const mem of memories) {
      const { data } = await supabase
        .from('jarvis_memories')
        .insert({ tenant_id: tenantId, ...mem })
        .select().single()
      if (data) saved.push(data)
    }

    return NextResponse.json({ saved, count: saved.length })
  } catch {
    return NextResponse.json({ error: 'Failed to parse memories' }, { status: 500 })
  }
}
