// POST /api/skills/search — Buscar skills en GitHub
// GET  /api/skills/search — Listar skills instalados de un tenant
import { NextRequest, NextResponse } from 'next/server'
import { searchSkillsForNeed, evaluateSkill } from '@/lib/jarvis/skills-manager'

export async function POST(req: NextRequest) {
  try {
    const { need, tenantId, autoEvaluate } = await req.json()

    const githubToken = process.env.GITHUB_TOKEN ?? ''
    const skills = await searchSkillsForNeed({ need, githubToken, minStars: 100 })

    if (autoEvaluate && skills.length > 0) {
      const evaluated = await Promise.all(
        skills.slice(0, 3).map(skill => evaluateSkill(skill))
      )
      return NextResponse.json({ skills, evaluations: evaluated })
    }

    return NextResponse.json({ skills })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
