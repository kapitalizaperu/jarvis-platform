import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/auth/supabase-client'

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('tenantId')
    const range = req.nextUrl.searchParams.get('range') || '7d'

    // Days to look back
    const days = range === '30d' ? 30 : range === '90d' ? 90 : 7

    // In production this would query real Supabase data
    // For now return realistic mock data that demonstrates the analytics shape

    const now = new Date()
    const dailyData = Array.from({ length: days }, (_, i) => {
      const date = new Date(now)
      date.setDate(date.getDate() - (days - 1 - i))
      const dayOfWeek = date.getDay()
      // Higher on weekdays
      const multiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 0.4 : 1
      return {
        date: date.toISOString().split('T')[0],
        messages: Math.floor((80 + Math.random() * 120) * multiplier),
        tasks: Math.floor((20 + Math.random() * 40) * multiplier),
        revenue: Math.floor((500 + Math.random() * 1500) * multiplier),
        newClients: Math.floor(Math.random() * 3 * multiplier),
      }
    })

    const totals = dailyData.reduce((acc, d) => ({
      messages: acc.messages + d.messages,
      tasks: acc.tasks + d.tasks,
      revenue: acc.revenue + d.revenue,
      newClients: acc.newClients + d.newClients,
    }), { messages: 0, tasks: 0, revenue: 0, newClients: 0 })

    const agentBreakdown = [
      { agent: 'marketing', tasks: Math.floor(totals.tasks * 0.28), emoji: '📱' },
      { agent: 'sales', tasks: Math.floor(totals.tasks * 0.35), emoji: '🎯' },
      { agent: 'financial', tasks: Math.floor(totals.tasks * 0.12), emoji: '💰' },
      { agent: 'dev', tasks: Math.floor(totals.tasks * 0.08), emoji: '💻' },
      { agent: 'video', tasks: Math.floor(totals.tasks * 0.09), emoji: '🎬' },
      { agent: 'personal', tasks: Math.floor(totals.tasks * 0.05), emoji: '📅' },
      { agent: 'computer', tasks: Math.floor(totals.tasks * 0.03), emoji: '🖥️' },
    ]

    return NextResponse.json({
      success: true,
      range,
      days,
      totals,
      daily: dailyData,
      agentBreakdown,
      tenantId
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Error cargando analytics' }, { status: 500 })
  }
}
