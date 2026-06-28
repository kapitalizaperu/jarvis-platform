// ── Agente de Ventas y Atención al Cliente ────────────────────────────────────

import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Responder mensaje de cliente (WhatsApp / web)
export async function respondToCustomer(params: {
  customerMessage: string
  conversationHistory: { role: string; content: string }[]
  businessName: string
  businessContext: string
  productCatalog?: string
  tone?: 'formal' | 'casual' | 'friendly'
}): Promise<{ response: string; intent: string; shouldEscalate: boolean }> {

  const system = `Eres el agente de ventas y atención al cliente de ${params.businessName}.
${params.businessContext}
${params.productCatalog ? `\nCATÁLOGO:\n${params.productCatalog}` : ''}

Reglas:
- Responde SIEMPRE en el idioma del cliente
- Sé ${params.tone === 'formal' ? 'formal y profesional' : params.tone === 'casual' ? 'casual y cercano' : 'amigable y cálido'}
- Nunca inventes precios o información que no tengas
- Si no sabes algo, ofrece comunicarte con el equipo
- Cuando el cliente esté listo para comprar, da el siguiente paso claro
- Respuestas cortas y directas (máx 150 palabras para WhatsApp)`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 512,
    system,
    messages: [
      ...params.conversationHistory.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: params.customerMessage },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  // Detectar intención
  const lower = params.customerMessage.toLowerCase()
  let intent = 'inquiry'
  if (/comprar|quiero|precio|costo|cuánto/.test(lower)) intent = 'purchase_intent'
  if (/problema|queja|mal|error|falla/.test(lower)) intent = 'complaint'
  if (/gracias|perfecto|excelente/.test(lower)) intent = 'satisfied'

  // Escalar si es queja grave o el bot no puede resolver
  const shouldEscalate = intent === 'complaint' || text.toLowerCase().includes('comunicar con') || text.toLowerCase().includes('equipo')

  return { response: text, intent, shouldEscalate }
}

// Calificar lead
export async function qualifyLead(params: {
  leadInfo: Record<string, string>
  businessContext: string
}): Promise<{ score: number; tier: 'hot' | 'warm' | 'cold'; reasoning: string; nextStep: string }> {

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Califica este lead del 1-100 para el negocio.

NEGOCIO: ${params.businessContext}
INFO DEL LEAD: ${JSON.stringify(params.leadInfo, null, 2)}

Responde en JSON: { "score": 0-100, "tier": "hot|warm|cold", "reasoning": "por qué", "nextStep": "acción inmediata recomendada" }`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  try {
    const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}')
    return json
  } catch {
    return { score: 50, tier: 'warm', reasoning: text, nextStep: 'Hacer seguimiento en 24h' }
  }
}

// Generar propuesta de ventas
export async function generateSalesProposal(params: {
  clientName: string
  businessNeed: string
  ourProducts: string
  budget?: string
  businessContext: string
}): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Genera una propuesta de ventas profesional y persuasiva.

CLIENTE: ${params.clientName}
NECESIDAD: ${params.businessNeed}
NUESTROS PRODUCTOS/SERVICIOS: ${params.ourProducts}
${params.budget ? `PRESUPUESTO: ${params.budget}` : ''}
CONTEXTO: ${params.businessContext}

La propuesta debe:
1. Empezar reconociendo el problema del cliente
2. Presentar la solución específica (no genérica)
3. Mostrar el valor y ROI esperado
4. Tener un pricing claro
5. CTA específico con urgencia

Formato: profesional pero no corporativo rígido. Máx 400 palabras.`,
    }],
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}
