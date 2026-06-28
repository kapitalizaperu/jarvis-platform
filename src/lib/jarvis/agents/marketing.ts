// ── Agente de Marketing Digital ───────────────────────────────────────────────

import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type Platform = 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'linkedin' | 'x' | 'threads'

export interface SocialContent {
  platform: Platform
  caption: string
  hashtags: string[]
  cta: string
  imagePrompt: string
  videoScript?: string
  bestTimeToPost: string
}

export interface ContentCalendar {
  weekOf: string
  posts: SocialContent[]
}

// Generar contenido para una plataforma específica
export async function generateSocialPost(params: {
  platform: Platform
  businessName: string
  industry: string
  topic?: string
  tone?: string
  businessContext?: string
}): Promise<SocialContent> {
  const platformGuide: Record<Platform, string> = {
    instagram: 'Texto corto (máx 150 chars antes del "más"), emojis estratégicos, 20-30 hashtags, enfoque visual',
    facebook: 'Texto más largo (300-500 chars), storytelling, pocos hashtags (3-5), link friendly',
    tiktok: 'Hook en las primeras 3 palabras, texto brevísimo, hashtags trending, viral y entretenido',
    youtube: 'Descripción SEO (500+ chars), keywords naturales, timestamps, links en descripción',
    linkedin: 'Profesional, insights del industria, sin hashtags en exceso (3-5), párrafos cortos',
    x: 'Máx 280 caracteres, directo, controversial o informativo, 1-2 hashtags máximo',
    threads: 'Conversacional, opiniones, threads de varios mensajes, sin hashtags',
  }

  const prompt = `Eres el mejor especialista en marketing digital de Latinoamérica.

NEGOCIO: ${params.businessName}
INDUSTRIA: ${params.industry}
PLATAFORMA: ${params.platform.toUpperCase()}
GUÍA DE PLATAFORMA: ${platformGuide[params.platform]}
${params.topic ? `TEMA: ${params.topic}` : ''}
${params.tone ? `TONO: ${params.tone}` : ''}
${params.businessContext ? `CONTEXTO: ${params.businessContext}` : ''}

Genera un post optimizado para esta plataforma que:
1. Sea auténtico y no se sienta como publicidad genérica
2. Genere engagement real (comentarios, guardados, compartidos)
3. Tenga un CTA claro pero no agresivo
4. Sea específico para ESTE negocio, no genérico

Responde en JSON exacto:
{
  "caption": "texto completo del post",
  "hashtags": ["hashtag1", "hashtag2"],
  "cta": "llamada a la acción",
  "imagePrompt": "prompt detallado en inglés para generar la imagen con IA",
  "bestTimeToPost": "hora y razón",
  ${params.platform === 'tiktok' || params.platform === 'youtube' ? '"videoScript": "script completo del video",' : ''}
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const jsonMatch = text.match(/\{[\s\S]*\}/)

  try {
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
    return { platform: params.platform, ...parsed }
  } catch {
    return {
      platform: params.platform,
      caption: text,
      hashtags: [],
      cta: '',
      imagePrompt: '',
      bestTimeToPost: '12:00 PM',
    }
  }
}

// Generar calendario completo de 7 días para todas las plataformas
export async function generateWeeklyCalendar(params: {
  businessName: string
  industry: string
  platforms: Platform[]
  businessContext?: string
  weekTheme?: string
}): Promise<ContentCalendar> {
  const posts: SocialContent[] = []

  // Generar 1 post por día por plataforma conectada
  const topics = [
    'tip o consejo útil del industria',
    'detrás de escenas del negocio',
    'producto o servicio estrella',
    'testimonio o caso de éxito',
    'pregunta que genera engagement',
    'oferta o promoción especial',
    'contenido educativo del industria',
  ]

  for (let i = 0; i < Math.min(params.platforms.length * 7, 21); i++) {
    const platform = params.platforms[i % params.platforms.length]
    const topic = topics[Math.floor(i / params.platforms.length) % topics.length]

    const post = await generateSocialPost({
      platform,
      businessName: params.businessName,
      industry: params.industry,
      topic: params.weekTheme ? `${params.weekTheme} — ${topic}` : topic,
      businessContext: params.businessContext,
    })
    posts.push(post)
  }

  return {
    weekOf: new Date().toISOString().split('T')[0],
    posts,
  }
}

// Analizar performance y generar recomendaciones
export async function analyzePerformance(params: {
  metrics: {
    platform: Platform
    reach: number
    engagement: number
    clicks: number
    topPost?: string
  }[]
  businessContext?: string
}): Promise<string> {
  const metricsText = params.metrics.map(m =>
    `${m.platform}: ${m.reach} alcance, ${m.engagement} engagement, ${m.clicks} clicks${m.topPost ? `, top post: "${m.topPost}"` : ''}`
  ).join('\n')

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Analiza estas métricas de redes sociales y dame 3 recomendaciones específicas y accionables:

${metricsText}

${params.businessContext ? `Contexto: ${params.businessContext}` : ''}

Sé específico, no genérico. Cada recomendación debe poder implementarse esta semana.`,
    }],
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}
