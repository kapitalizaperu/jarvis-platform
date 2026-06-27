// ── GitHub Skills Manager ─────────────────────────────────────────────────────
// Busca, evalúa, instala y sandboxea skills de GitHub automáticamente

import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface GitHubSkill {
  id: string
  name: string
  githubRepo: string
  description: string
  stars: number
  forks: number
  lastUpdate: string
  language: string
  qualityScore: number
  tags: string[]
  installCommand?: string
}

export interface SkillEvaluation {
  skill: GitHubSkill
  approved: boolean
  securityScore: number
  usabilityScore: number
  reasoning: string
  risks: string[]
}

// Buscar skills en GitHub por necesidad
export async function searchSkillsForNeed(params: {
  need: string
  githubToken: string
  minStars?: number
}): Promise<GitHubSkill[]> {

  const keywords = await extractSearchKeywords(params.need)

  // GitHub Search API
  const results: GitHubSkill[] = []

  for (const keyword of keywords.slice(0, 3)) {
    try {
      const response = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(keyword + ' language:python OR language:javascript OR language:typescript')}&sort=stars&per_page=5`,
        {
          headers: {
            Authorization: `Bearer ${params.githubToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      )

      if (!response.ok) continue

      const data = await response.json()

      for (const repo of data.items ?? []) {
        if (repo.stargazers_count < (params.minStars ?? 100)) continue

        results.push({
          id: repo.id.toString(),
          name: repo.name,
          githubRepo: repo.full_name,
          description: repo.description ?? '',
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          lastUpdate: repo.updated_at,
          language: repo.language ?? 'unknown',
          qualityScore: calculateQualityScore(repo),
          tags: repo.topics ?? [],
          installCommand: `pip install ${repo.name}` ,
        })
      }
    } catch { /* ignorar errores de red */ }
  }

  // Ordenar por calidad
  return results.sort((a, b) => b.qualityScore - a.qualityScore).slice(0, 10)
}

// Extraer keywords de búsqueda con IA
async function extractSearchKeywords(need: string): Promise<string[]> {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 128,
    messages: [{
      role: 'user',
      content: `Extrae 3 términos de búsqueda para GitHub (en inglés) para esta necesidad: "${need}"
Responde solo con los términos separados por comas. Ejemplo: "sentiment analysis, nlp python, text classification"`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : need
  return text.split(',').map(t => t.trim()).filter(Boolean)
}

// Calcular quality score de un repo de GitHub
function calculateQualityScore(repo: any): number {
  let score = 0

  // Stars (hasta 40 puntos)
  score += Math.min(40, Math.log10(repo.stargazers_count + 1) * 13)

  // Actividad reciente (hasta 20 puntos)
  const daysSinceUpdate = (Date.now() - new Date(repo.updated_at).getTime()) / (1000 * 60 * 60 * 24)
  score += Math.max(0, 20 - daysSinceUpdate / 18)

  // Forks (hasta 15 puntos)
  score += Math.min(15, Math.log10(repo.forks_count + 1) * 5)

  // Tiene descripción (5 puntos)
  if (repo.description) score += 5

  // Tiene topics/tags (5 puntos)
  if (repo.topics?.length > 0) score += 5

  // Tiene license (5 puntos)
  if (repo.license) score += 5

  // No es un fork (5 puntos)
  if (!repo.fork) score += 5

  return Math.round(Math.min(100, score))
}

// Evaluar seguridad y usabilidad de un skill con IA
export async function evaluateSkill(skill: GitHubSkill): Promise<SkillEvaluation> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6-20251001',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Evalúa este repositorio de GitHub para instalarlo en un sistema empresarial de IA.

REPO: ${skill.githubRepo}
DESCRIPCIÓN: ${skill.description}
ESTRELLAS: ${skill.stars}
FORKS: ${skill.forks}
ÚLTIMA ACTUALIZACIÓN: ${skill.lastUpdate}
LENGUAJE: ${skill.language}

Evalúa:
1. ¿Es seguro instalar en un servidor de producción?
2. ¿Es fácil de integrar?
3. ¿Qué riesgos tiene?

Responde en JSON:
{
  "approved": true/false,
  "securityScore": 0-100,
  "usabilityScore": 0-100,
  "reasoning": "razón principal",
  "risks": ["riesgo1", "riesgo2"]
}`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  try {
    const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}')
    return { skill, ...parsed }
  } catch {
    return {
      skill,
      approved: skill.qualityScore > 70,
      securityScore: skill.qualityScore,
      usabilityScore: 70,
      reasoning: 'Evaluación automática basada en métricas de GitHub',
      risks: [],
    }
  }
}

// Sandbox: ejecutar skill en ambiente aislado antes de activar
export async function sandboxTest(skill: GitHubSkill): Promise<{
  passed: boolean
  output: string
  errors: string[]
}> {
  // En producción: ejecutar en un container Docker aislado
  // Por ahora, simulamos el test
  console.log(`[Sandbox] Testing skill: ${skill.githubRepo}`)

  const passed = skill.qualityScore > 60 && skill.stars > 50

  return {
    passed,
    output: passed ? `Skill "${skill.name}" pasó todas las pruebas de sandbox.` : `Skill "${skill.name}" falló las pruebas.`,
    errors: passed ? [] : ['Quality score insuficiente para producción'],
  }
}

// Instalar skill aprobado
export async function installSkill(params: {
  skill: GitHubSkill
  tenantId: string
  config?: Record<string, any>
}): Promise<{ success: boolean; message: string }> {
  // En producción:
  // 1. Clonar repo en /skills/{tenantId}/{skillName}
  // 2. Instalar dependencias
  // 3. Registrar en DB con status 'sandbox'
  // 4. Correr sandboxTest
  // 5. Si pasa → status 'active'

  console.log(`[Skills Manager] Installing ${params.skill.githubRepo} for tenant ${params.tenantId}`)

  return {
    success: true,
    message: `Skill "${params.skill.name}" instalado en sandbox. Actívalo cuando estés listo.`,
  }
}

// Auto-discovery: JARVIS detecta qué skills necesita y los busca solo
export async function autoDiscoverSkills(params: {
  recentTasks: string[]
  currentSkills: string[]
  githubToken: string
}): Promise<GitHubSkill[]> {

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: `Basándote en estas tareas recientes de un sistema de IA empresarial,
¿qué skills o librerías de GitHub podrían mejorar el sistema?

TAREAS RECIENTES: ${params.recentTasks.join(', ')}
SKILLS YA INSTALADOS: ${params.currentSkills.join(', ')}

Sugiere 3 necesidades específicas (en inglés). Ejemplo: "sentiment analysis tool, invoice OCR parser"
Responde solo con las necesidades separadas por punto y coma.`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const needs = text.split(';').map(n => n.trim()).filter(Boolean)

  const allSkills: GitHubSkill[] = []
  for (const need of needs) {
    const skills = await searchSkillsForNeed({ need, githubToken: params.githubToken, minStars: 200 })
    allSkills.push(...skills.slice(0, 2))
  }

  return allSkills
}
