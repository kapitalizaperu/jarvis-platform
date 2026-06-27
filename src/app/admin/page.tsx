'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/auth/supabase-client'
import { useRouter } from 'next/navigation'

interface Agency {
  id: string
  email: string
  name: string
  plan: string
  clients: number
  status: string
  created_at: string
}

export default function AdminPage() {
  const router = useRouter()
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, mrr: 0, churn: 0 })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'agencies' | 'revenue' | 'system'>('agencies')

  useEffect(() => {
    checkAdminAccess()
  }, [])

  async function checkAdminAccess() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata?.role !== 'owner') {
      router.push('/dashboard')
      return
    }
    loadData()
  }

  async function loadData() {
    // Mock data for now — real data would come from Supabase admin queries
    setAgencies([
      { id: '1', email: 'agencia1@ejemplo.com', name: 'Agencia Digital Pro', plan: 'elite', clients: 23, status: 'active', created_at: '2026-01-15' },
      { id: '2', email: 'capitaliza@peru.com', name: 'Capitaliza Peru', plan: 'agency', clients: 7, status: 'active', created_at: '2026-02-01' },
      { id: '3', email: 'nexus@latam.com', name: 'Nexus LATAM', plan: 'enterprise', clients: 87, status: 'active', created_at: '2026-01-20' },
    ])
    setStats({ total: 3, active: 3, mrr: 297 + 597 + 1497, churn: 0 })
    setLoading(false)
  }

  const PLAN_COLORS: Record<string, string> = {
    agency: '#00F5FF',
    elite: '#9B59B6',
    enterprise: '#FFD700'
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#00F5FF', fontFamily: "'Space Grotesk', sans-serif" }}>Cargando...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: "'Space Grotesk', sans-serif", color: '#fff' }}>
      {/* Sidebar */}
      <div style={{
        position: 'fixed', left: 0, top: 0, bottom: 0, width: '220px',
        background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.06)',
        padding: '24px 0'
      }}>
        <div style={{
          padding: '0 20px 24px',
          fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px',
          background: 'linear-gradient(135deg, #00F5FF, #9B59B6)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>JARVIS Admin</div>

        {(['agencies', 'revenue', 'system'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            width: '100%', padding: '12px 20px', textAlign: 'left',
            background: tab === t ? 'rgba(0,245,255,0.08)' : 'transparent',
            border: 'none', borderLeft: `2px solid ${tab === t ? '#00F5FF' : 'transparent'}`,
            color: tab === t ? '#00F5FF' : '#666', cursor: 'pointer',
            fontSize: '14px', fontFamily: "'Space Grotesk', sans-serif",
            transition: 'all 0.2s', fontWeight: tab === t ? '600' : '400'
          }}>
            {{ agencies: '🏢 Agencias', revenue: '💰 Ingresos', system: '⚙️ Sistema' }[t]}
          </button>
        ))}

        <div style={{ position: 'absolute', bottom: '20px', padding: '0 20px' }}>
          <button onClick={() => router.push('/dashboard')} style={{
            color: '#555', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '13px', fontFamily: "'Space Grotesk', sans-serif"
          }}>← Volver al dashboard</button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ marginLeft: '220px', padding: '40px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Panel de Control</h1>
        <p style={{ color: '#555', fontSize: '14px', marginBottom: '40px' }}>
          {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '40px' }}>
          {[
            { label: 'Agencias Totales', value: stats.total, icon: '🏢', color: '#00F5FF' },
            { label: 'Activas', value: stats.active, icon: '✅', color: '#2ecc71' },
            { label: 'MRR', value: `$${stats.mrr.toLocaleString()}`, icon: '💰', color: '#FFD700' },
            { label: 'Churn Rate', value: `${stats.churn}%`, icon: '📉', color: '#e74c3c' },
          ].map(kpi => (
            <div key={kpi.label} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px', padding: '20px'
            }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{kpi.icon}</div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: kpi.color }}>{kpi.value}</div>
              <div style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>{kpi.label}</div>
            </div>
          ))}
        </div>

        {tab === 'agencies' && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Agencias registradas</h2>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Agencia', 'Email', 'Plan', 'Clientes', 'Estado', 'Registro'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', textAlign: 'left', color: '#555', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {agencies.map((agency, i) => (
                    <tr key={agency.id} style={{ borderBottom: i < agencies.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <td style={{ padding: '16px', color: '#fff', fontWeight: '600' }}>{agency.name}</td>
                      <td style={{ padding: '16px', color: '#888', fontSize: '14px' }}>{agency.email}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          background: `${PLAN_COLORS[agency.plan]}15`,
                          color: PLAN_COLORS[agency.plan],
                          padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: '600'
                        }}>{agency.plan}</span>
                      </td>
                      <td style={{ padding: '16px', color: '#888' }}>{agency.clients}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          background: 'rgba(46,204,113,0.1)', color: '#2ecc71',
                          padding: '4px 10px', borderRadius: '100px', fontSize: '12px'
                        }}>● Activo</span>
                      </td>
                      <td style={{ padding: '16px', color: '#555', fontSize: '13px' }}>{agency.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'revenue' && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Análisis de ingresos</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {[
                { plan: 'Agency ($297)', count: 1, mrr: 297, color: '#00F5FF' },
                { plan: 'Elite ($597)', count: 1, mrr: 597, color: '#9B59B6' },
                { plan: 'Enterprise ($1,497)', count: 1, mrr: 1497, color: '#FFD700' },
              ].map(item => (
                <div key={item.plan} style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '12px', padding: '24px'
                }}>
                  <div style={{ color: item.color, fontWeight: '700', marginBottom: '12px' }}>{item.plan}</div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: '#fff' }}>${item.mrr.toLocaleString()}</div>
                  <div style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>{item.count} agencia{item.count !== 1 ? 's' : ''}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'system' && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Estado del sistema</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { name: 'API de Anthropic', status: 'online', latency: '120ms' },
                { name: 'Supabase DB', status: 'online', latency: '45ms' },
                { name: 'Stripe Payments', status: 'online', latency: '200ms' },
                { name: 'WhatsApp Webhook', status: 'warning', latency: 'Sin config' },
                { name: 'ElevenLabs Voice', status: 'offline', latency: 'Sin API key' },
                { name: 'Vapi.ai Calls', status: 'offline', latency: 'Sin API key' },
              ].map(service => (
                <div key={service.name} style={{
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <div style={{ color: '#fff', fontWeight: '600', fontSize: '14px' }}>{service.name}</div>
                    <div style={{ color: '#555', fontSize: '12px', marginTop: '2px' }}>{service.latency}</div>
                  </div>
                  <div style={{
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: service.status === 'online' ? '#2ecc71' : service.status === 'warning' ? '#FFD700' : '#e74c3c',
                    boxShadow: `0 0 8px ${service.status === 'online' ? '#2ecc71' : service.status === 'warning' ? '#FFD700' : '#e74c3c'}`
                  }} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
