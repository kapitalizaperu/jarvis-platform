'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ScheduledTask {
  id: string
  name: string
  prompt: string
  agent_type: string
  schedule: string
  hour: number
  minute: number
  status: 'active' | 'paused'
  next_run_at: string
  last_run_at?: string
  last_result?: string
  run_count: number
}

const AGENTS = [
  { value: 'orchestrator', label: 'JARVIS General', icon: '🤖' },
  { value: 'marketing', label: 'Marketing', icon: '📱' },
  { value: 'sales', label: 'Ventas', icon: '🎯' },
  { value: 'financial', label: 'Financiero', icon: '💰' },
  { value: 'hr', label: 'RRHH', icon: '👥' },
  { value: 'personal', label: 'Personal', icon: '📅' },
]

const SCHEDULES = [
  { value: 'hourly', label: 'Cada hora' },
  { value: 'daily', label: 'Todos los días' },
  { value: 'mon', label: 'Lunes' },
  { value: 'tue', label: 'Martes' },
  { value: 'wed', label: 'Miércoles' },
  { value: 'thu', label: 'Jueves' },
  { value: 'fri', label: 'Viernes' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
]

const EXAMPLES = [
  { name: 'Posts Instagram lunes', prompt: 'Crea 3 posts para Instagram para esta semana. Incluye caption y hashtags. Tono profesional y moderno.', agent: 'marketing', schedule: 'mon' },
  { name: 'Reporte de ventas diario', prompt: 'Genera un resumen ejecutivo de las ventas del día: métricas clave, leads nuevos y recomendaciones para mañana.', agent: 'sales', schedule: 'daily' },
  { name: 'Resumen financiero semanal', prompt: 'Prepara el reporte financiero semanal: ingresos, gastos, margen y comparativa con la semana anterior.', agent: 'financial', schedule: 'weekly' },
  { name: 'Briefing diario JARVIS', prompt: 'Dame el briefing ejecutivo del día: prioridades, tareas pendientes y recomendación estratégica para hoy.', agent: 'orchestrator', schedule: 'daily' },
]

export default function SchedulePage() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', prompt: '', agentType: 'orchestrator',
    schedule: 'daily', hour: 9, minute: 0
  })

  useEffect(() => { loadTasks() }, [])

  async function loadTasks() {
    setLoading(true)
    try {
      const res = await fetch('/api/scheduled-tasks?tenantId=demo-tenant')
      const data = await res.json()
      setTasks(data.tasks || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function createTask() {
    setSaving(true)
    try {
      const res = await fetch('/api/scheduled-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tenantId: 'demo-tenant' })
      })
      if (res.ok) {
        setShowForm(false)
        setForm({ name: '', prompt: '', agentType: 'orchestrator', schedule: 'daily', hour: 9, minute: 0 })
        loadTasks()
      }
    } finally {
      setSaving(false)
    }
  }

  async function toggleTask(id: string, currentStatus: string) {
    await fetch('/api/scheduled-tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: currentStatus === 'active' ? 'paused' : 'active' })
    })
    loadTasks()
  }

  async function deleteTask(id: string) {
    await fetch(`/api/scheduled-tasks?id=${id}`, { method: 'DELETE' })
    loadTasks()
  }

  function applyExample(ex: typeof EXAMPLES[0]) {
    setForm({ name: ex.name, prompt: ex.prompt, agentType: ex.agent, schedule: ex.schedule, hour: 9, minute: 0 })
    setShowForm(true)
  }

  function formatNextRun(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleString('es-PE', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const agentInfo = (type: string) => AGENTS.find(a => a.value === type) || AGENTS[0]
  const scheduleLabel = (s: string) => SCHEDULES.find(x => x.value === s)?.label || s

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: "'Space Grotesk', sans-serif", color: '#fff' }}>
      {/* Header */}
      <div style={{ background: 'rgba(0,0,0,0.8)', borderBottom: '1px solid rgba(0,245,255,0.15)', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: '16px', backdropFilter: 'blur(20px)' }}>
        <Link href="/dashboard" style={{ color: '#666', textDecoration: 'none', fontSize: '20px' }}>←</Link>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>⏰ Tareas Programadas</h1>
          <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>JARVIS trabaja solo mientras tú descansas</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{
          marginLeft: 'auto', padding: '10px 20px',
          background: 'linear-gradient(135deg, #00F5FF, #0080FF)',
          border: 'none', borderRadius: '10px', color: '#000',
          fontSize: '14px', fontWeight: '700', cursor: 'pointer',
          fontFamily: "'Space Grotesk', sans-serif"
        }}>
          + Nueva tarea
        </button>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Examples */}
        {tasks.length === 0 && !showForm && (
          <div style={{ marginBottom: '32px' }}>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>💡 Empieza con un ejemplo:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {EXAMPLES.map((ex, i) => (
                <button key={i} onClick={() => applyExample(ex)} style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px', padding: '16px', textAlign: 'left', cursor: 'pointer',
                  transition: 'all 0.2s', fontFamily: "'Space Grotesk', sans-serif','"
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,245,255,0.3)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                >
                  <div style={{ color: '#00F5FF', fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>{agentInfo(ex.agent).icon} {ex.name}</div>
                  <div style={{ color: '#666', fontSize: '12px' }}>{scheduleLabel(ex.schedule)} · Agente {agentInfo(ex.agent).label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Create form */}
        {showForm && (
          <div style={{ background: 'rgba(0,245,255,0.03)', border: '1px solid rgba(0,245,255,0.2)', borderRadius: '16px', padding: '24px', marginBottom: '32px' }}>
            <h3 style={{ margin: '0 0 20px', color: '#00F5FF' }}>Nueva tarea programada</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Nombre</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Posts Instagram lunes" style={inputStyle} />
              </div>
              <div>
                <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Agente</label>
                <select value={form.agentType} onChange={e => setForm(f => ({ ...f, agentType: e.target.value }))} style={inputStyle}>
                  {AGENTS.map(a => <option key={a.value} value={a.value}>{a.icon} {a.label}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Instrucción para JARVIS</label>
              <textarea value={form.prompt} onChange={e => setForm(f => ({ ...f, prompt: e.target.value }))}
                placeholder="Crea 3 posts para Instagram esta semana con caption y hashtags..." rows={3}
                style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Frecuencia</label>
                <select value={form.schedule} onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))} style={inputStyle}>
                  {SCHEDULES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Hora</label>
                <select value={form.hour} onChange={e => setForm(f => ({ ...f, hour: Number(e.target.value) }))} style={inputStyle}>
                  {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Minuto</label>
                <select value={form.minute} onChange={e => setForm(f => ({ ...f, minute: Number(e.target.value) }))} style={inputStyle}>
                  {[0, 15, 30, 45].map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={createTask} disabled={saving || !form.name || !form.prompt} style={{
                padding: '12px 24px', background: 'linear-gradient(135deg, #00F5FF, #0080FF)',
                border: 'none', borderRadius: '10px', color: '#000', fontWeight: '700',
                cursor: saving ? 'not-allowed' : 'pointer', fontSize: '14px',
                fontFamily: "'Space Grotesk', sans-serif"
              }}>
                {saving ? 'Guardando...' : '✓ Crear tarea'}
              </button>
              <button onClick={() => setShowForm(false)} style={{
                padding: '12px 24px', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                color: '#666', cursor: 'pointer', fontSize: '14px',
                fontFamily: "'Space Grotesk', sans-serif"
              }}>Cancelar</button>
            </div>
          </div>
        )}

        {/* Tasks list */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#666', padding: '60px' }}>Cargando tareas...</div>
        ) : tasks.length === 0 && !showForm ? (
          <div style={{ textAlign: 'center', color: '#666', padding: '60px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏰</div>
            <p>No tienes tareas programadas aún.<br />Crea una y JARVIS trabajará solo.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tasks.map(task => {
              const agent = agentInfo(task.agent_type)
              return (
                <div key={task.id} style={{
                  background: 'rgba(255,255,255,0.03)', border: `1px solid ${task.status === 'active' ? 'rgba(0,245,255,0.15)' : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: '14px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px'
                }}>
                  {/* Status dot */}
                  <div style={{
                    width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
                    background: task.status === 'active' ? '#00FF88' : '#555',
                    boxShadow: task.status === 'active' ? '0 0 8px #00FF88' : 'none'
                  }} />

                  {/* Agent icon */}
                  <div style={{ fontSize: '24px', flexShrink: 0 }}>{agent.icon}</div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '4px' }}>{task.name}</div>
                    <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>
                      {agent.label} · {scheduleLabel(task.schedule)} a las {String(task.hour).padStart(2,'0')}:{String(task.minute).padStart(2,'0')}
                    </div>
                    <div style={{ color: '#444', fontSize: '11px', display: 'flex', gap: '16px' }}>
                      <span>📅 Próxima: {formatNextRun(task.next_run_at)}</span>
                      {task.last_run_at && <span>✅ Última: {formatNextRun(task.last_run_at)}</span>}
                      <span>🔁 {task.run_count} ejecuciones</span>
                    </div>
                    {task.last_result && (
                      <div style={{ color: '#555', fontSize: '11px', marginTop: '6px', fontStyle: 'italic' }}>
                        "{task.last_result.substring(0, 100)}..."
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button onClick={() => toggleTask(task.id, task.status)} style={{
                      padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                      background: 'transparent', color: task.status === 'active' ? '#FFD700' : '#00FF88',
                      cursor: 'pointer', fontSize: '12px', fontFamily: "'Space Grotesk', sans-serif"
                    }}>
                      {task.status === 'active' ? '⏸ Pausar' : '▶ Activar'}
                    </button>
                    <button onClick={() => deleteTask(task.id)} style={{
                      padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,50,50,0.2)',
                      background: 'transparent', color: '#ff6b6b',
                      cursor: 'pointer', fontSize: '12px', fontFamily: "'Space Grotesk', sans-serif"
                    }}>
                      🗑
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
  padding: '10px 14px', color: '#fff', fontSize: '14px',
  outline: 'none', boxSizing: 'border-box',
  fontFamily: "'Space Grotesk', sans-serif"
}
