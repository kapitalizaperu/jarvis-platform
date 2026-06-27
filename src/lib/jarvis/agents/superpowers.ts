import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'
import * as path from 'path'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Cargar skills de Superpowers ──────────────────────────────────────────────

function loadSkill(skillName: string): string {
  const skillPath = path.join(process.cwd(), 'superpowers', 'skills', skillName)
  try {
    const files = fs.readdirSync(skillPath)
    const mdFile = files.find(f => f.endsWith('.md') && !f.includes('Log'))
    if (mdFile) {
      return fs.readFileSync(path.join(skillPath, mdFile), 'utf-8')
    }
  } catch {
    return ''
  }
  return ''
}

export type SuperpowerSkill =
  | 'brainstorming'
  | 'systematic-debugging'
  | 'test-driven-development'
  | 'writing-plans'
  | 'verification-before-completion'
  | 'requesting-code-review'
  | 'finishing-a-development-branch'
  | 'subagent-driven-development'

// ── Brainstorming — antes de cualquier feature nueva ─────────────────────────

export async function brainstorm(
  idea: string,
  projectContext: string,
  tenantId: string
): Promise<string> {
  const skill = loadSkill('brainstorming')

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-8-20251101',
    max_tokens: 2048,
    system: `Eres JARVIS usando la skill de Brainstorming de Superpowers.
${skill}

Contexto del proyecto: ${projectContext}
Tenant: ${tenantId}
Responde siempre en español.`,
    messages: [{ role: 'user', content: idea }]
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}

// ── Debugging sistemático ─────────────────────────────────────────────────────

export async function debugSystematically(
  error: string,
  codeContext: string
): Promise<string> {
  const skill = loadSkill('systematic-debugging')

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-8-20251101',
    max_tokens: 2048,
    system: `Eres JARVIS usando la skill de Debugging Sistemático de Superpowers.
${skill}
Responde siempre en español.`,
    messages: [{
      role: 'user',
      content: `Error encontrado: ${error}\n\nCódigo relevante:\n${codeContext}`
    }]
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}

// ── Escribir plan de implementación ──────────────────────────────────────────

export async function writePlan(
  feature: string,
  requirements: string
): Promise<string> {
  const skill = loadSkill('writing-plans')

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-8-20251101',
    max_tokens: 3000,
    system: `Eres JARVIS usando la skill de Writing Plans de Superpowers.
${skill}
Responde siempre en español. Crea planes detallados y accionables.`,
    messages: [{
      role: 'user',
      content: `Feature a implementar: ${feature}\n\nRequerimientos: ${requirements}`
    }]
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}

// ── Verificación antes de completar ──────────────────────────────────────────

export async function verifyBeforeComplete(
  taskDescription: string,
  workDone: string
): Promise<{ verified: boolean; issues: string[]; report: string }> {
  const skill = loadSkill('verification-before-completion')

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6-20251001',
    max_tokens: 1024,
    system: `Eres JARVIS verificando trabajo completado con la skill de Superpowers.
${skill}
Responde en JSON con este formato:
{ "verified": boolean, "issues": string[], "report": string }`,
    messages: [{
      role: 'user',
      content: `Tarea: ${taskDescription}\n\nTrabajo realizado: ${workDone}`
    }]
  })

  try {
    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return { verified: false, issues: ['Error al parsear respuesta'], report: '' }
  }
}

// ── TDD — Test Driven Development ────────────────────────────────────────────

export async function generateTests(
  feature: string,
  language: string = 'TypeScript'
): Promise<string> {
  const skill = loadSkill('test-driven-development')

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-8-20251101',
    max_tokens: 2048,
    system: `Eres JARVIS usando TDD de Superpowers.
${skill}
Genera tests en ${language}. Responde en español.`,
    messages: [{
      role: 'user',
      content: `Genera tests para: ${feature}`
    }]
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}

// ── Orquestador de Superpowers — detecta qué skill usar ──────────────────────

export async function superpowersRouter(
  userMessage: string,
  context: string
): Promise<{ skill: SuperpowerSkill | null; response: string }> {
  const lower = userMessage.toLowerCase()

  // Detectar qué skill activar según el mensaje
  if (/\b(idea|feature|construir|crear|diseñar|quiero|necesito)\b/.test(lower)) {
    const response = await brainstorm(userMessage, context, 'jarvis')
    return { skill: 'brainstorming', response }
  }

  if (/\b(error|bug|falla|no funciona|problema|crash|excepción)\b/.test(lower)) {
    const response = await debugSystematically(userMessage, context)
    return { skill: 'systematic-debugging', response }
  }

  if (/\b(plan|planificar|roadmap|pasos|implementar|desarrollar)\b/.test(lower)) {
    const response = await writePlan(userMessage, context)
    return { skill: 'writing-plans', response }
  }

  if (/\b(test|prueba|verificar|validar|qa|testing)\b/.test(lower)) {
    const response = await generateTests(userMessage)
    return { skill: 'test-driven-development', response }
  }

  if (/\b(completar|terminé|listo|done|finalizar|revisar)\b/.test(lower)) {
    const result = await verifyBeforeComplete(userMessage, context)
    return { skill: 'verification-before-completion', response: result.report }
  }

  return { skill: null, response: '' }
}

export const SUPERPOWERS_SKILLS = [
  { name: 'brainstorming', trigger: 'Antes de crear cualquier feature nueva', icon: '🧠' },
  { name: 'systematic-debugging', trigger: 'Cuando hay un error o bug', icon: '🔍' },
  { name: 'writing-plans', trigger: 'Antes de implementar algo complejo', icon: '📋' },
  { name: 'test-driven-development', trigger: 'Al implementar features', icon: '✅' },
  { name: 'verification-before-completion', trigger: 'Antes de declarar trabajo completo', icon: '🔒' },
  { name: 'requesting-code-review', trigger: 'Al completar implementaciones', icon: '👀' },
  { name: 'subagent-driven-development', trigger: 'Para tareas independientes paralelas', icon: '⚡' },
  { name: 'finishing-a-development-branch', trigger: 'Al terminar una rama de desarrollo', icon: '🚀' },
]
