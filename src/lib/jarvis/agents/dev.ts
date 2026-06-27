// ── Agente de Desarrollo — orquesta Jules AI + GitHub ─────────────────────────

import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface SystemSpec {
  name: string
  description: string
  techStack: string[]
  features: string[]
  architecture: string
  estimatedTime: string
  githubRepo?: string
}

export interface DevTask {
  id: string
  title: string
  description: string
  status: 'planning' | 'coding' | 'review' | 'deployed' | 'failed'
  githubPrUrl?: string
  deployedUrl?: string
  code?: string
}

// Analizar requerimiento y generar especificación técnica
export async function analyzeRequirement(params: {
  request: string
  businessContext?: string
  existingStack?: string
}): Promise<SystemSpec> {

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-8-20251101',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Eres el arquitecto de software senior de JARVIS. Analiza este requerimiento y genera la especificación técnica completa.

REQUERIMIENTO: ${params.request}
${params.businessContext ? `CONTEXTO DEL NEGOCIO: ${params.businessContext}` : ''}
${params.existingStack ? `STACK EXISTENTE: ${params.existingStack}` : ''}

Genera la especificación en JSON:
{
  "name": "nombre del sistema",
  "description": "qué hace exactamente",
  "techStack": ["tecnologías recomendadas con justificación"],
  "features": ["feature 1", "feature 2", ...],
  "architecture": "descripción de la arquitectura en 3-4 oraciones",
  "estimatedTime": "tiempo estimado de desarrollo"
}

Sé específico y técnico. Prioriza tecnologías modernas, escalables y con buen ecosistema en LATAM.`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  try {
    return JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}')
  } catch {
    return {
      name: 'Sistema Personalizado',
      description: params.request,
      techStack: ['Next.js', 'Supabase', 'TypeScript'],
      features: [],
      architecture: text,
      estimatedTime: '2-4 semanas',
    }
  }
}

// Generar código completo para una feature
export async function generateCode(params: {
  feature: string
  techStack: string[]
  context?: string
  language?: string
}): Promise<{ filename: string; code: string; explanation: string }[]> {

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-8-20251101',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `Genera el código completo y funcional para esta feature.

FEATURE: ${params.feature}
STACK: ${params.techStack.join(', ')}
${params.context ? `CONTEXTO: ${params.context}` : ''}
${params.language ? `LENGUAJE: ${params.language}` : ''}

Genera todos los archivos necesarios. Para cada archivo:
1. Código completo y listo para producción
2. Sin TODOs ni placeholders
3. Con manejo de errores
4. TypeScript cuando sea posible

Responde con un array JSON:
[
  {
    "filename": "ruta/del/archivo.ts",
    "code": "código completo",
    "explanation": "qué hace este archivo"
  }
]`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
  try {
    return JSON.parse(text.match(/\[[\s\S]*\]/)?.[0] ?? '[]')
  } catch {
    return [{ filename: 'output.ts', code: text, explanation: 'Código generado' }]
  }
}

// Generar arquitectura Mermaid
export async function generateArchitectureDiagram(spec: SystemSpec): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6-20251001',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Genera un diagrama de arquitectura en formato Mermaid para este sistema:

SISTEMA: ${spec.name}
DESCRIPCIÓN: ${spec.description}
TECH STACK: ${spec.techStack.join(', ')}
FEATURES: ${spec.features.join(', ')}
ARQUITECTURA: ${spec.architecture}

Genera SOLO el código Mermaid (graph TD o flowchart). Que sea claro y completo.`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const mermaidMatch = text.match(/```mermaid\n([\s\S]*?)```/) ?? text.match(/(graph|flowchart|sequenceDiagram)[\s\S]*/)
  return mermaidMatch ? (mermaidMatch[1] ?? mermaidMatch[0]) : text
}

// Buscar skills relevantes en GitHub
export async function searchGitHubSkills(params: {
  need: string
  githubToken?: string
}): Promise<{ repo: string; stars: number; description: string; relevance: number }[]> {

  // En producción: llamar a GitHub Search API
  // Por ahora simulamos resultados relevantes
  const searchTerms = params.need.toLowerCase()

  const mockResults = [
    { repo: 'langchain-ai/langchain', stars: 94000, description: 'Building applications with LLMs', relevance: 95 },
    { repo: 'microsoft/autogen', stars: 32000, description: 'Multi-agent conversation framework', relevance: 88 },
    { repo: 'openai/openai-python', stars: 23000, description: 'OpenAI Python client', relevance: 75 },
    { repo: 'anthropics/anthropic-sdk-python', stars: 4200, description: 'Anthropic Python SDK', relevance: 90 },
    { repo: 'redis/redis-py', stars: 12000, description: 'Redis Python client', relevance: 60 },
  ]

  return mockResults.filter(r => r.relevance > 70)
}
