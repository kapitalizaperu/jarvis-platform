'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/auth/supabase-client'

interface Client {
  id: string
  name: string
  business_name: string
  email: string
  phone: string
  industry: string
  status: 'active' | 'paused' | 'cancelled'
  agents_enabled: string[]
  created_at: string
}

const MOCK_CLIENTS: Client[] = [
  { id:'1', name:'Carlos García', business_name:'Chifa Dragón de Oro', email:'carlos@chifa.pe', phone:'+51 987 654 321', industry:'Restaurantes', status:'active', agents_enabled:['marketing','sales','financial'], created_at:'2026-01-15' },
  { id:'2', name:'María López', business_name:'Salón Bella', email:'maria@bella.pe', phone:'+51 976 543 210', industry:'Servicios', status:'active', agents_enabled:['sales','marketing'], created_at:'2026-02-01' },
  { id:'3', name:'Jorge Ramos', business_name:'TechPeru SAC', email:'jorge@techperu.pe', phone:'+51 965 432 109', industry:'Tecnología', status:'active', agents_enabled:['dev','sales','financial'], created_at:'2026-02-10' },
  { id:'4', name:'Ana Torres', business_name:'Distribuidora López', email:'ana@lopez.pe', phone:'+51 954 321 098', industry:'Manufactura', status:'paused', agents_enabled:['financial'], created_at:'2026-01-20' },
  { id:'5', name:'Luis Mendoza', business_name:'BeautyBox Peru', email:'luis@beautybox.pe', phone:'+51 943 210 987', industry:'E-commerce', status:'active', agents_enabled:['marketing','video','sales'], created_at:'2026-03-01' },
]

const STATUS_COLORS = { active: '#2ecc71', paused: '#FFD700', cancelled: '#e74c3c' }
const STATUS_LABELS = { active: 'Activo', paused: 'Pausado', cancelled: 'Cancelado' }

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [newClient, setNewClient] = useState({ name: '', business_name: '', email: '', phone: '', industry: '' })

  const filtered = clients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.business_name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || c.status === filter
    return matchSearch && matchFilter
  })

  function addClient() {
    const client: Client = {
      id: Date.now().toString(),
      ...newClient,
      status: 'active',
      agents_enabled: ['sales'],
      created_at: new Date().toISOString().split('T')[0]
    }
    setClients(prev => [client, ...prev])
    setNewClient({ name: '', business_name: '', email: '', phone: '', industry: '' })
    setShowAdd(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: "'Space Grotesk', sans-serif", color: '#fff' }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/dashboard" style={{ color: '#555', textDecoration: 'none', fontSize: '14px' }}>← Dashboard</Link>
          <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
          <span style={{ fontWeight: '700', fontSize: '16px' }}>Mis Clientes</span>
        </div>
        <button onClick={() => setShowAdd(true)} style={{
          background: 'linear-gradient(135deg, #00F5FF, #0080FF)', border: 'none',
          borderRadius: '8px', padding: '8px 20px', color: '#000', fontWeight: '700',
          cursor: 'pointer', fontSize: '14px', fontFamily: "'Space Grotesk', sans-serif"
        }}>+ Agregar cliente</button>
      </div>

      <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Total clientes', value: clients.length, color: '#00F5FF' },
            { label: 'Activos', value: clients.filter(c => c.status === 'active').length, color: '#2ecc71' },
            { label: 'Pausados', value: clients.filter(c => c.status === 'paused').length, color: '#FFD700' },
            { label: 'Agentes activos', value: clients.reduce((acc, c) => acc + c.agents_enabled.length, 0), color: '#9B59B6' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '10px', padding: '16px'
            }}>
              <div style={{ fontSize: '28px', fontWeight: '800', color: stat.color }}>{stat.value}</div>
              <div style={{ color: '#666', fontSize: '13px', marginTop: '2px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cliente o negocio..."
            style={{
              flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px', padding: '10px 16px', color: '#fff', fontSize: '14px',
              outline: 'none', fontFamily: "'Space Grotesk', sans-serif"
            }}
          />
          {(['all', 'active', 'paused'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
              border: `1px solid ${filter === f ? '#00F5FF' : 'rgba(255,255,255,0.08)'}`,
              background: filter === f ? 'rgba(0,245,255,0.08)' : 'transparent',
              color: filter === f ? '#00F5FF' : '#666', cursor: 'pointer',
              fontFamily: "'Space Grotesk', sans-serif"
            }}>{{ all: 'Todos', active: 'Activos', paused: 'Pausados' }[f]}</button>
          ))}
        </div>

        {/* Clients Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {filtered.map(client => (
            <div key={client.id} style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px', padding: '20px', cursor: 'pointer', transition: 'border-color 0.2s'
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,245,255,0.2)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '15px', color: '#fff' }}>{client.business_name}</div>
                  <div style={{ color: '#666', fontSize: '13px', marginTop: '2px' }}>{client.name}</div>
                </div>
                <span style={{
                  background: `${STATUS_COLORS[client.status]}15`, color: STATUS_COLORS[client.status],
                  padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '600'
                }}>● {STATUS_LABELS[client.status]}</span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                {client.agents_enabled.map(agent => (
                  <span key={agent} style={{
                    background: 'rgba(0,245,255,0.06)', border: '1px solid rgba(0,245,255,0.15)',
                    color: '#00F5FF', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '500'
                  }}>{agent}</span>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#555' }}>
                <span>📧 {client.email}</span>
                <span>📱 {client.phone}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Client Modal */}
      {showAdd && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{
            background: '#111', border: '1px solid rgba(0,245,255,0.2)', borderRadius: '16px',
            padding: '32px', width: '100%', maxWidth: '480px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px' }}>Agregar nuevo cliente</h3>
            {[
              { field: 'name', label: 'Nombre del contacto', placeholder: 'Carlos García' },
              { field: 'business_name', label: 'Nombre del negocio', placeholder: 'Restaurante El Dragón' },
              { field: 'email', label: 'Email', placeholder: 'carlos@negocio.com' },
              { field: 'phone', label: 'WhatsApp', placeholder: '+51 987 654 321' },
              { field: 'industry', label: 'Industria', placeholder: 'Restaurantes' },
            ].map(({ field, label, placeholder }) => (
              <div key={field} style={{ marginBottom: '16px' }}>
                <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '6px' }}>{label}</label>
                <input
                  value={newClient[field as keyof typeof newClient]}
                  onChange={e => setNewClient(prev => ({ ...prev, [field]: e.target.value }))}
                  placeholder={placeholder}
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px',
                    outline: 'none', boxSizing: 'border-box', fontFamily: "'Space Grotesk', sans-serif"
                  }}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setShowAdd(false)} style={{
                flex: 1, padding: '12px', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                color: '#888', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif"
              }}>Cancelar</button>
              <button onClick={addClient} style={{
                flex: 2, padding: '12px', background: 'linear-gradient(135deg, #00F5FF, #0080FF)',
                border: 'none', borderRadius: '8px', color: '#000', fontWeight: '700',
                cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif"
              }}>Agregar cliente</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
