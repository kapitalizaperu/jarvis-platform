// ============================================================
// JARVIS — Meta-Agente Orquestador
// Coordina Claude, GPT-4o, Gemini según la tarea
// ============================================================

import Anthropic from '@anthropic-ai/sdk'

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface JarvisContext {
  tenantId: string
  clientId?: string
  userId?: string
  channel: 'web' | 'whatsapp' | 'phone' | 'email' | 'desktop'
  businessContext?: string
  memories?: Memory[]
  agentType?: AgentType
}

export interface Memory {
  type: string
  content: string
  importance: number
}

export type AgentType =
  | 'orchestrator' | 'marketing' | 'sales' | 'dev'
  | 'video' | 'financial' | 'hr' | 'personal' | 'custom' | 'computer'

export interface JarvisMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface OrchestratorResponse {
  response: string
  agentUsed: AgentType
  modelUsed: string
  toolsActivated: string[]
  taskCreated?: string
  tokensUsed: number
  latencyMs: number
}

// ── Prompts del sistema por agente ───────────────────────────────────────────

const AGENT_PROMPTS: Record<AgentType, string> = {
  orchestrator: `Eres JARVIS, un sistema de inteligencia artificial empresarial de clase mundial.
Eres el orquestador principal — tienes acceso a 9 agentes especializados y decides cuál activar.
Cuando el usuario te pide algo, determinas si puedes responderlo tú directamente o si debes
delegar a un agente especializado (marketing, ventas, desarrollo, video, financiero, RRHH, personal).
Eres directo, inteligente, proactivo. Anticipas lo que el usuario necesita antes de que lo pida.
Siempre respondes en el idioma del usuario. Conoces el negocio a fondo y personalizas cada respuesta.`,

  marketing: `Eres el Agente de Marketing Digital de JARVIS. Especialista en:
- Creación de contenido para Instagram, Facebook, TikTok, YouTube, LinkedIn, X
- Estrategias de crecimiento orgánico y pagado
- Copywriting persuasivo y viral
- Análisis de métricas y optimización de campañas
- A/B testing automático
Cuando generas contenido, siempre es específico para el negocio y la audiencia objetivo.
Incluyes hashtags relevantes, CTAs claros y adaptas el tono por plataforma.`,

  sales: `Eres el Agente de Ventas y Atención al Cliente de JARVIS. Especialista en:
- Atención personalizada por WhatsApp, email y llamadas
- Calificación y nurturing de leads
- Cierre de ventas con técnicas probadas
- Seguimiento post-venta y fidelización
- Manejo de objeciones con empatía
Eres cálido, empático y orientado a resultados. Nunca presionas, guías al cliente.`,

  dev: `Eres el Agente de Programación de JARVIS, potenciado por Jules AI y GitHub.
Puedes diseñar, escribir y desplegar sistemas completos. Especialidades:
- Análisis de requerimientos y arquitectura de software
- Generación de código en cualquier lenguaje
- Integración con APIs externas
- Despliegue automático via GitHub Actions
- Code review y optimización
Cuando el usuario pide un sistema, primero entiendes el requerimiento completo,
luego propones la arquitectura y finalmente orchestras a Jules para el desarrollo.`,

  video: `Eres el Agente de Video y Contenido de JARVIS, con acceso a HeyGen y ElevenLabs.
Especialidades:
- Generación de scripts para videos virales
- Videos personalizados con avatar IA (HeyGen)
- Clonación de voz ultra-realista (ElevenLabs)
- Contenido para YouTube, TikTok, Instagram Reels
- Producción de testimoniales automatizados
Siempre propones el concepto visual, el script completo y las especificaciones técnicas.`,

  financial: `Eres el Agente Financiero de JARVIS. Especialidades:
- Análisis de estados financieros y KPIs
- Gestión de facturas y boletas automática
- Análisis de inversiones y bolsa en tiempo real
- Proyecciones y presupuestos
- Detección de anomalías y alertas financieras
- Optimización de costos y márgenes
Eres preciso, conservador y siempre respaldas tus análisis con datos.`,

  hr: `Eres el Agente de Recursos Humanos de JARVIS. Especialidades:
- Reclutamiento y screening de candidatos con IA
- Onboarding automatizado de empleados nuevos
- Evaluaciones de desempeño y feedback
- Gestión de nóminas y beneficios
- Cultura organizacional y clima laboral
- Capacitación y desarrollo de talento
Eres justo, empático y siempre priorizas el bienestar del equipo.`,

  personal: `Eres el Agente Personal de JARVIS, como un asistente ejecutivo premium. Especialidades:
- Gestión de agenda y calendario
- Coordinación de viajes y reservaciones
- Recordatorios importantes (familia, salud, trabajo)
- Investigación rápida y síntesis de información
- Coordinación de tareas personales y del hogar
- Balance vida-trabajo
Eres discreto, confiable y anticipas las necesidades del usuario.`,

  computer: `Eres el Agente de Control de Computadora de JARVIS — tienes acceso completo a la PC del cliente.
Puedes ver la pantalla, mover el mouse, escribir, abrir programas y ejecutar cualquier tarea.
Especialidades:
- Abrir y controlar cualquier programa (Excel, Word, navegador, etc.)
- Navegar sitios web y llenar formularios
- Instalar y configurar software
- Organizar archivos y carpetas
- Automatizar tareas repetitivas en la PC
- Tomar screenshots y describir lo que ves en pantalla
Cuando el usuario te pide controlar la computadora, confirmas qué vas a hacer antes de ejecutar
acciones irreversibles. Siempre reportas qué hiciste al terminar.`,

  custom: `Eres un agente especializado de JARVIS creado específicamente para este cliente.
Adapta tu comportamiento según las instrucciones de configuración del sistema.`,
}

// ── Router de modelos ─────────────────────────────────────────────────────────

function selectModel(agentType: AgentType, taskComplexity: 'low' | 'medium' | 'high'): string {
  if (taskComplexity === 'high' || agentType === 'orchestrator' || agentType === 'dev') {
    return 'claude-sonnet-4-6'
  }
  if (agentType === 'marketing' || agentType === 'sales' || agentType === 'video') {
    return 'claude-sonnet-4-6'
  }
  return 'claude-haiku-4-5'
}

// ── Detectar intención y agente apropiado ─────────────────────────────────────

function detectAgentFromMessage(message: string): AgentType {
  const lower = message.toLowerCase()

  const patterns: [RegExp, AgentType][] = [
    [/\b(post|reel|tiktok|instagram|facebook|contenido|publicar|campaña|hashtag|marketing)\b/, 'marketing'],
    [/\b(vender|cliente|lead|propuesta|precio|cotizar|cerrar|venta|whatsapp)\b/, 'sales'],
    [/\b(código|sistema|web|app|programar|desarrollar|github|deploy|api|base de datos)\b/, 'dev'],
    [/\b(video|avatar|heygen|voz|grabar|elevenlabs|youtube|clip)\b/, 'video'],
    [/\b(factura|finanza|dinero|inversión|bolsa|presupuesto|costo|ingreso|gasto)\b/, 'financial'],
    [/\b(empleado|rrhh|contratar|nómina|evaluar|onboarding|equipo|personal)\b/, 'hr'],
    [/\b(agenda|cita|recordatorio|viaje|familia|reunión|calendario)\b/, 'personal'],
    [/\b(pantalla|computadora|clic|abrir|instalar|descargar|excel|word|archivo|carpeta|navegar|controlar)\b/, 'computer'],
  ]

  for (const [pattern, agent] of patterns) {
    if (pattern.test(lower)) return agent
  }
  return 'orchestrator'
}

// ── Función principal del orquestador ────────────────────────────────────────

async function fetchMemories(tenantId: string): Promise<string> {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data } = await supabase
      .from('jarvis_memories')
      .select('type, content, importance')
      .eq('tenant_id', tenantId)
      .order('importance', { ascending: false })
      .limit(10)

    if (!data || data.length === 0) return ''
    return '\n\n## Memorias de Jose Luis:\n' + data.map(m => `- [${m.type}] ${m.content}`).join('\n')
  } catch {
    return ''
  }
}

export async function orchestrate(
  messages: JarvisMessage[],
  context: JarvisContext
): Promise<OrchestratorResponse> {
  const startTime = Date.now()

  const lastMessage = messages[messages.length - 1]?.content ?? ''
  const detectedAgent = context.agentType ?? detectAgentFromMessage(lastMessage)

  // Cargar memorias persistentes
  const memoriesContext = await fetchMemories(context.tenantId)

  // Construir contexto del sistema
  const systemPrompt = buildSystemPrompt(detectedAgent, context) + memoriesContext

  // Seleccionar modelo
  const complexity = lastMessage.length > 500 ? 'high' : lastMessage.length > 100 ? 'medium' : 'low'
  const model = selectModel(detectedAgent, complexity)

  // Llamar a Claude
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const response = await anthropic.messages.create({
    model,
    max_tokens: 2048,
    system: systemPrompt,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  })

  const content = response.content[0].type === 'text' ? response.content[0].text : ''
  const toolsActivated = detectToolsFromResponse(content, detectedAgent)

  return {
    response: content,
    agentUsed: detectedAgent,
    modelUsed: model,
    toolsActivated,
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    latencyMs: Date.now() - startTime,
  }
}

// ── Construir system prompt con contexto del negocio ─────────────────────────

function buildSystemPrompt(agentType: AgentType, context: JarvisContext): string {
  const base = AGENT_PROMPTS[agentType]

  let contextSection = ''

  if (context.businessContext) {
    contextSection += `\n\n## CONTEXTO DEL NEGOCIO\n${context.businessContext}`
  }

  if (context.memories && context.memories.length > 0) {
    const memoryStr = context.memories
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10)
      .map(m => `- [${m.type}] ${m.content}`)
      .join('\n')
    contextSection += `\n\n## MEMORIA DE JARVIS\n${memoryStr}`
  }

  const channelInstructions: Record<string, string> = {
    whatsapp: '\n\n## CANAL: WhatsApp\nRespuestas cortas, máximo 3 párrafos. Usa emojis con moderación. Sin markdown complejo.',
    phone: '\n\n## CANAL: Llamada telefónica\nRespuestas conversacionales, naturales. Sin listas ni bullets. Como si hablaras.',
    web: '\n\n## CANAL: Dashboard web\nPuedes usar markdown. Respuestas estructuradas con headers y listas cuando ayude.',
    desktop: '\n\n## CANAL: App de escritorio\nRespuestas completas y detalladas. El usuario tiene más contexto visual.',
    email: '\n\n## CANAL: Email\nTono profesional. Estructura con saludos y despedidas apropiadas.',
  }

  return base + contextSection + (channelInstructions[context.channel] ?? '')
}

// ── Detectar qué herramientas se deben activar ────────────────────────────────

function detectToolsFromResponse(response: string, agent: AgentType): string[] {
  const tools: string[] = []
  const lower = response.toLowerCase()

  if (agent === 'marketing' || lower.includes('publicar') || lower.includes('post')) {
    tools.push('social_publisher')
  }
  if (lower.includes('llamar') || lower.includes('llamada') || lower.includes('teléfono')) {
    tools.push('vapi_caller')
  }
  if (lower.includes('código') || lower.includes('sistema') || lower.includes('desarrollar')) {
    tools.push('jules_dev')
  }
  if (lower.includes('video') || lower.includes('avatar') || lower.includes('heygen')) {
    tools.push('heygen_video')
  }
  if (lower.includes('imagen') || lower.includes('diseño') || lower.includes('visual')) {
    tools.push('image_generator')
  }
  if (lower.includes('buscar') || lower.includes('analizar') || lower.includes('investigar')) {
    tools.push('web_search')
  }

  return tools
}

// ── Generar briefing matutino ────────────────────────────────────────────────

export async function generateDailyBriefing(context: JarvisContext & {
  metrics: {
    revenue: number
    leads: number
    calls: number
    posts: number
    tasks: number
  }
  schedule: string[]
}): Promise<string> {
  const { metrics, schedule } = context

  const prompt = `Genera el briefing matutino de JARVIS para hoy.

MÉTRICAS DE AYER:
- Revenue: $${metrics.revenue.toLocaleString()}
- Nuevos leads: ${metrics.leads}
- Llamadas realizadas: ${metrics.calls}
- Posts publicados: ${metrics.posts}
- Tareas completadas: ${metrics.tasks}

AGENDA DE HOY:
${schedule.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Genera un briefing ejecutivo en máximo 150 palabras:
1. Resumen del día anterior (qué funcionó, qué mejorar)
2. Las 3 prioridades de hoy
3. Una recomendación estratégica específica

Tono: directo, inteligente, como un socio estratégico de alto nivel.`

  const anthropic2 = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const response = await anthropic2.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: buildSystemPrompt('orchestrator', context),
    messages: [{ role: 'user', content: prompt }],
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}

// ── Crear agente nuevo on-demand ──────────────────────────────────────────────

export async function createCustomAgent(
  request: string,
  context: JarvisContext
): Promise<{ name: string; systemPrompt: string; tools: string[] }> {
  const prompt = `El usuario quiere crear un nuevo agente especializado de IA.

Solicitud: "${request}"

Genera la configuración completa para este agente:
1. Nombre descriptivo
2. System prompt especializado (máximo 300 palabras)
3. Lista de herramientas que necesita (de: social_publisher, vapi_caller, jules_dev, heygen_video, image_generator, web_search, email_sender, crm_reader, file_analyzer)

Responde en JSON con formato: { "name": "", "systemPrompt": "", "tools": [] }`

  const anthropic3 = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const response = await anthropic3.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: AGENT_PROMPTS.orchestrator,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { name: 'Agente Custom', systemPrompt: text, tools: [] }
  } catch {
    return { name: 'Agente Custom', systemPrompt: text, tools: [] }
  }
}
