'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface DailyData {
  date: string
  messages: number
  tasks: number
  revenue: number
  newClients: number
}

interface Totals {
  messages: number
  tasks: number
  revenue: number
  newClients: number
}

interface AgentBreakdown {
  agent: string
  tasks: number
  emoji: string
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('7d')
  const [data, setData] = useState<{ daily: DailyData[]; totals: Totals; agentBreakdown: AgentBreakdown[] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/analytics?range=${range}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [range])

  const maxMessages = data ? Math.max(...data.daily.map(d => d.messages)) : 1
  const maxRevenue = data ? Math.max(...data.daily.map(d => d.revenue)) : 1

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: "'Space Grotesk', sans-serif", color: '#fff' }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/dashboard" style={{ color: '#555', textDecoration: 'none', fontSize: '14px' }}>← Dashboard</Link>
          <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
          <span style={{ fontWeight: '700', fontSize: '16px' }}>Analytics</span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['7d', '30d', '90d'] as const).map(r => (
            <button key={r} onClick={() => setRange(r)} style={{
              padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600',
              border: `1px solid ${range === r ? '#00F5FF' : 'rgba(255,255,255,0.08)'}`,
              background: range === r ? 'rgba(0,245,255,0.1)' : 'transparent',
              color: range === r ? '#00F5FF' : '#666', cursor: 'pointer',
              fontFamily: "'Space Grotesk', sans-serif"
            }}>{r}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#555' }}>Cargando datos...</div>
        ) : data ? (
          <>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '40px' }}>
              {[
                { label: 'Mensajes procesados', value: data.totals.messages.toLocaleString(), color: '#00F5FF', icon: '💬' },
                { label: 'Tareas completadas', value: data.totals.tasks.toLocaleString(), color: '#9B59B6', icon: '✅' },
                { label: 'Revenue gestionado', value: `$${data.totals.revenue.toLocaleString()}`, color: '#FFD700', icon: '💰' },
                { label: 'Nuevos clientes', value: data.totals.newClients.toString(), color: '#2ecc71', icon: '👤' },
              ].map(kpi => (
                <div key={kpi.label} style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '12px', padding: '20px'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{kpi.icon}</div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: kpi.color }}>{kpi.value}</div>
                  <div style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>{kpi.label}</div>
                  <div style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>Últimos {range}</div>
                </div>
              ))}
            </div>

            {/* Messages Chart */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '24px', color: '#fff' }}>
                Mensajes procesados por día
              </h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '120px' }}>
                {data.daily.map((d, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{
                      width: '100%', background: 'linear-gradient(180deg, #00F5FF, rgba(0,245,255,0.3))',
                      borderRadius: '3px 3px 0 0',
                      height: `${(d.messages / maxMessages) * 100}%`,
                      minHeight: '4px', transition: 'height 0.3s'
                    }} title={`${d.date}: ${d.messages} mensajes`} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', color: '#444', fontSize: '11px' }}>
                <span>{data.daily[0]?.date}</span>
                <span>{data.daily[Math.floor(data.daily.length / 2)]?.date}</span>
                <span>{data.daily[data.daily.length - 1]?.date}</span>
              </div>
            </div>

            {/* Revenue Chart */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '24px', color: '#fff' }}>
                Revenue gestionado por día (USD)
              </h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '120px' }}>
                {data.daily.map((d, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{
                      width: '100%', background: 'linear-gradient(180deg, #FFD700, rgba(255,215,0,0.3))',
                      borderRadius: '3px 3px 0 0',
                      height: `${(d.revenue / maxRevenue) * 100}%`,
                      minHeight: '4px'
                    }} title={`${d.date}: $${d.revenue}`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Agent Breakdown */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '24px', color: '#fff' }}>
                Tareas por agente
              </h3>
              {data.agentBreakdown.map(agent => (
                <div key={agent.agent} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '18px', width: '24px' }}>{agent.emoji}</span>
                  <div style={{ width: '80px', color: '#aaa', fontSize: '13px', textTransform: 'capitalize' }}>{agent.agent}</div>
                  <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '4px',
                      background: 'linear-gradient(90deg, #9B59B6, #00F5FF)',
                      width: `${(agent.tasks / data.totals.tasks) * 100}%`,
                      transition: 'width 0.5s'
                    }} />
                  </div>
                  <div style={{ width: '60px', textAlign: 'right', color: '#666', fontSize: '13px' }}>
                    {agent.tasks} tareas
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px', color: '#555' }}>Error cargando analytics</div>
        )}
      </div>
    </div>
  )
}
