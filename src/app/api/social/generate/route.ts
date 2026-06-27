// POST /api/social/generate — Generar contenido para redes sociales
import { NextRequest, NextResponse } from 'next/server'
import { generateSocialPost, generateWeeklyCalendar } from '@/lib/jarvis/agents/marketing'

export async function POST(req: NextRequest) {
  try {
    const { mode, platform, platforms, businessName, industry, topic, weekTheme, businessContext } = await req.json()

    if (mode === 'weekly') {
      const calendar = await generateWeeklyCalendar({
        businessName,
        industry,
        platforms: platforms ?? ['instagram', 'facebook'],
        businessContext,
        weekTheme,
      })
      return NextResponse.json({ calendar })
    }

    const post = await generateSocialPost({
      platform: platform ?? 'instagram',
      businessName,
      industry,
      topic,
      businessContext,
    })
    return NextResponse.json({ post })

  } catch (error) {
    console.error('Social generate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
