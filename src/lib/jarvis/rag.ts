// JARVIS RAG — Retrieval Augmented Generation
// Memoria persistente entre sesiones usando pgvector + OpenAI embeddings

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getSupabase() {
  return createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

// Generate embedding using OpenAI (cheapest: $0.02/1M tokens)
async function generateEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text.slice(0, 8000),
        model: 'text-embedding-3-small',
      }),
    })
    const data = await res.json()
    return data.data?.[0]?.embedding || null
  } catch {
    return null
  }
}

// Save a message to conversation history
export async function saveConversationMessage({
  tenantId,
  userId = 'default',
  sessionId,
  role,
  content,
  summary,
}: {
  tenantId: string
  userId?: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  summary?: string
}) {
  const supabase = getSupabase()

  // Generate embedding for semantic search
  const textToEmbed = summary || content
  const embedding = await generateEmbedding(textToEmbed)

  const { data, error } = await supabase
    .from('jarvis_conversations')
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      session_id: sessionId,
      role,
      content,
      summary: summary || null,
      embedding: embedding ? JSON.stringify(embedding) : null,
    })
    .select()
    .single()

  if (error) console.error('RAG save error:', error)
  return data
}

// Retrieve relevant past conversations using semantic search
export async function retrieveRelevantMemories({
  tenantId,
  userId = 'default',
  query,
  limit = 5,
  threshold = 0.65,
}: {
  tenantId: string
  userId?: string
  query: string
  limit?: number
  threshold?: number
}): Promise<string> {
  const supabase = getSupabase()

  // Try vector search first
  const embedding = await generateEmbedding(query)

  let memories: { content: string; role: string; created_at: string; similarity?: number }[] = []

  if (embedding) {
    const { data } = await supabase.rpc('search_memories', {
      query_embedding: JSON.stringify(embedding),
      match_tenant_id: tenantId,
      match_user_id: userId,
      match_threshold: threshold,
      match_count: limit,
    })
    memories = data || []
  }

  // Fallback: full-text search if no vector results
  if (memories.length === 0) {
    const keywords = query.split(' ').filter(w => w.length > 3).slice(0, 5).join(' | ')
    if (keywords) {
      const { data } = await supabase
        .from('jarvis_conversations')
        .select('content, role, created_at')
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .textSearch('content', keywords, { config: 'spanish' })
        .order('created_at', { ascending: false })
        .limit(limit)
      memories = data || []
    }
  }

  // Always include recent conversations for context
  const { data: recent } = await supabase
    .from('jarvis_conversations')
    .select('content, role, created_at')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)

  const recentMsgs = recent || []

  // Merge and deduplicate
  const allMemories = [...memories]
  for (const r of recentMsgs) {
    if (!allMemories.find(m => m.content === r.content)) {
      allMemories.push(r)
    }
  }

  if (allMemories.length === 0) return ''

  // Format as context
  const contextLines = allMemories
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(-15)
    .map(m => {
      const time = new Date(m.created_at).toLocaleDateString('es-PE')
      const who = m.role === 'user' ? 'Jose Luis' : 'JARVIS'
      return `[${time}] ${who}: ${m.content.slice(0, 200)}`
    })
    .join('\n')

  return `\n\n## Conversaciones anteriores relevantes:\n${contextLines}\n`
}

// Get full session history (for continuing a conversation)
export async function getSessionHistory(
  tenantId: string,
  sessionId: string,
  userId = 'default'
) {
  const supabase = getSupabase()

  const { data } = await supabase
    .from('jarvis_conversations')
    .select('role, content, created_at')
    .eq('tenant_id', tenantId)
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(50)

  return data || []
}

// Summarize and save a complete session
export async function summarizeSession(
  tenantId: string,
  sessionId: string,
  userId = 'default'
) {
  const messages = await getSessionHistory(tenantId, sessionId, userId)
  if (messages.length < 2) return null

  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const conversation = messages
    .map(m => `${m.role === 'user' ? 'Jose' : 'JARVIS'}: ${m.content}`)
    .join('\n')

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: `Resume esta conversación en 2-3 oraciones, capturando los puntos más importantes y decisiones tomadas:\n\n${conversation.slice(0, 3000)}`
    }]
  })

  const summary = response.content[0].type === 'text' ? response.content[0].text : ''

  // Save summary as a special memory
  const supabase = getSupabase()
  await supabase.from('jarvis_memories').insert({
    tenant_id: tenantId,
    user_id: userId,
    type: 'conversation_summary',
    content: summary,
    importance: 6,
    tags: ['session', sessionId],
  })

  return summary
}
