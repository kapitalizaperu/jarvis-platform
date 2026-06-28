import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/auth/supabase-client'
import { summarizeSession } from '@/lib/jarvis/rag'

export const dynamic = 'force-dynamic'

// GET — list sessions or get session history
export async function GET(req: NextRequest) {
  const supabase = getServerSupabase()
  const tenantId = req.nextUrl.searchParams.get('tenantId') || 'demo-tenant'
  const userId = req.nextUrl.searchParams.get('userId') || 'default'
  const sessionId = req.nextUrl.searchParams.get('sessionId')

  if (sessionId) {
    // Get full session history
    const { data, error } = await supabase
      .from('jarvis_conversations')
      .select('role, content, created_at, summary')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ messages: data || [] })
  }

  // List all sessions
  const { data, error } = await supabase
    .from('jarvis_conversations')
    .select('session_id, created_at, content')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .eq('role', 'user')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Group by session
  const sessions: Record<string, { sessionId: string; firstMessage: string; date: string; messageCount: number }> = {}
  for (const msg of (data || [])) {
    if (!sessions[msg.session_id]) {
      sessions[msg.session_id] = {
        sessionId: msg.session_id,
        firstMessage: msg.content.slice(0, 80),
        date: msg.created_at,
        messageCount: 1,
      }
    } else {
      sessions[msg.session_id].messageCount++
    }
  }

  return NextResponse.json({ sessions: Object.values(sessions).slice(0, 20) })
}

// POST — summarize and close a session
export async function POST(req: NextRequest) {
  const { tenantId = 'demo-tenant', sessionId, userId = 'default' } = await req.json()

  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

  try {
    const summary = await summarizeSession(tenantId, sessionId, userId)
    return NextResponse.json({ summary, sessionId })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
