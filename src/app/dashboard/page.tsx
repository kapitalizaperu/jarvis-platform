'use client'

import { useState, useEffect } from 'react'
import { signOut } from '@/lib/auth/auth-helpers'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Agent { id: string; name: string; type: string; status: 'active'|'paused'|'building'; icon: string; tasksToday: number; color: string }
interface Task { id: string; title: string; agent: string; status: 'running'|'completed'|'failed'; time: string }
interface Metric { label: string; value: string; change: string; up: boolean; icon: string; color: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const AGENTS: Agent[] = [
  { id:'1', name:'Orquestador', type:'orchestrator', status:'active', icon:'🧠', tasksToday:142, color:'#00F5FF' },
  { id:'2', name:'Marketing', type:'marketing', status:'active', icon:'📱', tasksToday:28, color:'#9B59B6' },
  { id:'3', name:'Ventas', type:'sales', status:'active', icon:'🎯', tasksToday:47, color:'#FFD700' },
  { id:'4', name:'Dev (Jules)', type:'dev', status:'building', icon:'💻', tasksToday:3, color:'#00F5FF' },
  { id:'5', name:'Video', type:'video', status:'active', icon:'🎬', tasksToday:12, color:'#9B59B6' },
  { id:'6', name:'Financiero', type:'financial', status:'active', icon:'💰', tasksToday:8, color:'#FFD700' },
  { id:'7', name:'RRHH', type:'hr', status:'paused', icon:'👥', tasksToday:0, color:'#666' },
  { id:'8', name:'Personal', type:'personal', status:'active', icon:'📅', tasksToday:15, color:'#00F5FF' },
  { id:'9', name:'Control PC', type:'computer', status:'active', icon:'🖥️', tasksToday:7, color:'#FF6B35' },
]

const METRICS: Metric[] = [
  { label:'Revenue clientes', value:'$48,200', change:'+23%', up:true, icon:'💰', color:'#00F5FF' },
  { label:'Conversaciones hoy', value:'1,847', change:'+12%', up:true, icon:'💬', color:'#9B59B6' },
  { label:'Tareas completadas', value:'342', change:'+8%', up:true, icon:'✅', color:'#FFD700' },
  { label:'Posts publicados', value:'67', change:'100%', up:true, icon:'📱', color:'#9B59B6' },
  { label:'Llamadas IA', value:'124', change:'+31%', up:true, icon:'📞', color:'#00F5FF' },
  { label:'Clientes activos', value:'38', change:'+5', up:true, icon:'👤', color:'#FFD700' },
]

const LIVE_TASKS: Task[] = [
  { id:'1', title:'Generando posts semana para Chifa Dragón de Oro', agent:'Marketing', status:'running', time:'hace 2min' },
  { id:'2', title:'Respondiendo 12 mensajes de WhatsApp — Salón Bella', agent:'Ventas', status:'running', time:'hace 5min' },
  { id:'3', title:'Construyendo sistema de facturación — TechPeru', agent:'Dev (Jules)', status:'running', time:'hace 18min' },
  { id:'4', title:'Analizando P&L de octubre — Distribuidora López', agent:'Financiero', status:'completed', time:'hace 30min' },
  { id:'5', title:'Video de testimonial generado — BeautyBox', agent:'Video', status:'completed', time:'hace 1h' },
  { id:'6', title:'Abrió Excel y actualizó ventas del día — TechPeru', agent:'Control PC', status:'completed', time:'hace 45min' },
  { id:'7', title:'Instalando software de facturación — Distribuidora López', agent:'Control PC', status:'running', time:'hace 3min' },
]

export default function JarvisDashboard() {
  const router = useRouter()
  const [now, setNow] = useState(new Date())
  const [chat, setChat] = useState<{role:string;content:string}[]>([
    { role:'assistant', content:'Buenos días. Hoy tienes 38 clientes activos, 342 tareas completadas y $48,200 en revenue gestionado. ¿En qué quieres que me enfoque primero?' }
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [activeTab, setActiveTab] = useState<'tasks'|'agents'|'clients'|'skills'>('tasks')

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  async function send() {
    if (!input.trim() || busy) return
    const msg = input.trim()
    setInput('')
    setChat(c => [...c, { role:'user', content:msg }])
    setBusy(true)
    try {
      const res = await fetch('/api/jarvis/chat', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          messages: [...chat, { role:'user', content:msg }],
          tenantId: 'demo',
          channel: 'web',
        }),
      })
      const data = await res.json()
      setChat(c => [...c, { role:'assistant', content: data.response ?? 'Error al procesar tu mensaje.' }])
    } catch {
      setChat(c => [...c, { role:'assistant', content:'Error de conexión. Verifica tu API key.' }])
    }
    setBusy(false)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white" style={{ fontFamily:'Inter, sans-serif' }}>

      {/* Top Bar */}
      <div className="border-b px-6 py-3 flex items-center justify-between" style={{ borderColor:'rgba(255,255,255,0.06)', background:'rgba(0,0,0,0.5)', backdropFilter:'blur(20px)', position:'sticky', top:0, zIndex:50 }}>
        <div className="flex items-center gap-4">
          <span className="font-black text-xl" style={{ fontFamily:'Space Grotesk', background:'linear-gradient(135deg,#00F5FF,#9B59B6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            JARVIS
          </span>
          <span style={{ color:'rgba(255,255,255,0.2)' }}>|</span>
          <span className="text-xs text-gray-500 uppercase tracking-widest">Command Center</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ animation:'pulse 2s infinite' }} />
            {AGENTS.filter(a=>a.status==='active').length} agentes activos
          </span>
          <span>{now.toLocaleDateString('es',{weekday:'long',day:'numeric',month:'short'})}</span>
          <span className="text-white font-bold tabular-nums text-sm">
            {now.toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard/clients')}
            style={{ color:'#555', background:'none', border:'none', cursor:'pointer', fontSize:'12px', fontFamily:'Space Grotesk' }}>Clientes</button>
          <button onClick={() => router.push('/dashboard/analytics')}
            style={{ color:'#555', background:'none', border:'none', cursor:'pointer', fontSize:'12px', fontFamily:'Space Grotesk' }}>Analytics</button>
          <button onClick={() => router.push('/dashboard/voice')}
            style={{ color:'#00F5FF', background:'rgba(0,245,255,0.1)', border:'1px solid rgba(0,245,255,0.2)', borderRadius:'6px', cursor:'pointer', fontSize:'12px', fontFamily:'Space Grotesk', padding:'4px 10px', fontWeight:'700' }}>🎙️ Voz</button>
          <button onClick={() => router.push('/dashboard/vision')}
            style={{ color:'#00FF88', background:'rgba(0,255,136,0.1)', border:'1px solid rgba(0,255,136,0.2)', borderRadius:'6px', cursor:'pointer', fontSize:'12px', fontFamily:'Space Grotesk', padding:'4px 10px', fontWeight:'700' }}>👁️ Visión</button>
          <button onClick={() => router.push('/dashboard/computer-use')}
            style={{ color:'#FF6B35', background:'rgba(255,107,53,0.1)', border:'1px solid rgba(255,107,53,0.2)', borderRadius:'6px', cursor:'pointer', fontSize:'12px', fontFamily:'Space Grotesk', padding:'4px 10px', fontWeight:'700' }}>🖥️ PC</button>
          <button onClick={() => router.push('/dashboard/schedule')}
            style={{ color:'#555', background:'none', border:'none', cursor:'pointer', fontSize:'12px', fontFamily:'Space Grotesk' }}>⏰ Programadas</button>
          <button onClick={() => router.push('/dashboard/settings')}
            style={{ color:'#555', background:'none', border:'none', cursor:'pointer', fontSize:'12px', fontFamily:'Space Grotesk' }}>Config</button>
          <button
            onClick={() => router.push('/admin')}
            style={{ color:'#555', background:'none', border:'none', cursor:'pointer', fontSize:'12px', fontFamily:'Space Grotesk' }}
          >Admin</button>
          <button
            onClick={async () => { await signOut(); document.cookie='sb-access-token=; path=/; max-age=0'; router.push('/auth/login') }}
            style={{ color:'#555', background:'none', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'6px', cursor:'pointer', fontSize:'12px', padding:'6px 12px', fontFamily:'Space Grotesk' }}
          >Salir</button>
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ background:'linear-gradient(135deg,#00F5FF20,#9B59B620)', border:'1px solid rgba(0,245,255,0.2)' }}>A</div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="p-6 grid grid-cols-12 gap-4" style={{ height:'calc(100vh - 57px)' }}>

        {/* Left: Metrics */}
        <div className="col-span-3 flex flex-col gap-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            {METRICS.map((m,i) => (
              <div key={i} className="rounded-2xl p-4" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-xl mb-2">{m.icon}</div>
                <div className="text-xl font-black" style={{ color:m.color }}>{m.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{m.label}</div>
                <div className="text-xs mt-1" style={{ color: m.up ? '#4ade80' : '#f87171' }}>
                  {m.up ? '↑' : '↓'} {m.change}
                </div>
              </div>
            ))}
          </div>

          {/* Agents */}
          <div className="rounded-2xl p-4 flex-1" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Agentes</h3>
            <div className="space-y-2">
              {AGENTS.map(agent => (
                <div key={agent.id} className="flex items-center gap-3 p-2 rounded-xl" style={{ background:'rgba(255,255,255,0.02)' }}>
                  <span className="text-lg">{agent.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{agent.name}</div>
                    <div className="text-xs text-gray-600">{agent.tasksToday} tareas hoy</div>
                  </div>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{
                    background: agent.status==='active' ? '#4ade80' : agent.status==='building' ? '#FFD700' : '#666',
                    animation: agent.status==='active' ? 'pulse 2s infinite' : 'none',
                  }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Live Activity */}
        <div className="col-span-6 flex flex-col gap-4">

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
            {(['tasks','agents','clients','skills'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-all"
                style={{ background: activeTab===tab ? 'rgba(0,245,255,0.1)' : 'transparent', color: activeTab===tab ? '#00F5FF' : '#666', border: activeTab===tab ? '1px solid rgba(0,245,255,0.2)' : '1px solid transparent' }}>
                {tab === 'tasks' ? 'Tareas live' : tab === 'agents' ? 'Agentes' : tab === 'clients' ? 'Clientes' : 'Skills'}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 rounded-2xl p-4 overflow-y-auto" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
            {activeTab === 'tasks' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Actividad en tiempo real</h3>
                  <span className="flex items-center gap-1 text-xs" style={{ color:'#4ade80' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ animation:'pulse 2s infinite' }} />
                    Live
                  </span>
                </div>
                {LIVE_TASKS.map(task => (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.04)' }}>
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{
                      background: task.status==='running' ? '#00F5FF' : task.status==='completed' ? '#4ade80' : '#f87171',
                      animation: task.status==='running' ? 'pulse 1.5s infinite' : 'none',
                    }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 leading-snug">{task.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{task.agent} · {task.time}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{
                      background: task.status==='running' ? 'rgba(0,245,255,0.1)' : task.status==='completed' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                      color: task.status==='running' ? '#00F5FF' : task.status==='completed' ? '#4ade80' : '#f87171',
                    }}>
                      {task.status==='running' ? '⟳ Corriendo' : task.status==='completed' ? '✓ Listo' : '✗ Error'}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'clients' && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Clientes Nivel 2</h3>
                {['Chifa Dragón de Oro','Salón Bella','TechPeru SAC','BeautyBox','Distribuidora López','Gym Force'].map((client,i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.04)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs" style={{ background:'rgba(0,245,255,0.1)', color:'#00F5FF' }}>
                        {client[0]}
                      </div>
                      <span className="text-sm font-medium">{client}</span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-green-400" style={{ animation:'pulse 2s infinite' }} />
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'skills' && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Skills de GitHub instaladas</h3>
                {[
                  { name:'sentiment-analyzer', stars:'2.4k', status:'active' },
                  { name:'invoice-generator', stars:'891', status:'active' },
                  { name:'lead-scorer', stars:'1.2k', status:'sandbox' },
                  { name:'competitor-monitor', stars:'634', status:'sandbox' },
                  { name:'social-scheduler', stars:'3.1k', status:'active' },
                ].map((skill,i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.04)' }}>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">🐙</span>
                      <span className="text-sm font-mono text-gray-300">{skill.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-600">⭐ {skill.stars}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{
                        background: skill.status==='active' ? 'rgba(0,245,255,0.1)' : 'rgba(255,215,0,0.1)',
                        color: skill.status==='active' ? '#00F5FF' : '#FFD700',
                      }}>
                        {skill.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: JARVIS Chat */}
        <div className="col-span-3 flex flex-col rounded-2xl overflow-hidden" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
          {/* Header */}
          <div className="p-4 border-b flex items-center gap-3" style={{ borderColor:'rgba(255,255,255,0.06)' }}>
            <div className="relative">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg" style={{ background:'linear-gradient(135deg,rgba(0,245,255,0.2),rgba(155,89,182,0.2))', border:'1px solid rgba(0,245,255,0.3)' }}>
                🤖
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0A0A0A]" style={{ background:'#4ade80', animation:'pulse 2s infinite' }} />
            </div>
            <div>
              <p className="font-bold text-sm">JARVIS</p>
              <p className="text-xs" style={{ color:'#4ade80' }}>Orquestador activo</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chat.map((msg,i) => (
              <div key={i} className={`flex ${msg.role==='user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed" style={{
                  background: msg.role==='user' ? 'linear-gradient(135deg,#00F5FF20,#9B59B620)' : 'rgba(255,255,255,0.04)',
                  border: msg.role==='user' ? '1px solid rgba(0,245,255,0.2)' : '1px solid rgba(255,255,255,0.06)',
                  color: msg.role==='user' ? '#00F5FF' : '#ddd',
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-3 flex gap-1" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)' }}>
                  {[0,1,2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background:'#00F5FF', animation:`bounce 1s ${i*0.15}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t flex gap-2" style={{ borderColor:'rgba(255,255,255,0.06)' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key==='Enter' && send()}
              placeholder="Habla con JARVIS..."
              className="flex-1 px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none"
              style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'white' }}
            />
            <button
              onClick={send}
              disabled={busy || !input.trim()}
              className="p-2.5 rounded-xl transition-all"
              style={{ background: busy || !input.trim() ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#00F5FF,#9B59B6)' }}
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill={busy || !input.trim() ? '#666' : '#0A0A0A'}>
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
