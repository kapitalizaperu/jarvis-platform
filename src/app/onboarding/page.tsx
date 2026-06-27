'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/auth/supabase-client'

const AGENTS_LIST = [
  { id: 'marketing', icon: '📱', name: 'Marketing', desc: 'Redes sociales, contenido, campañas' },
  { id: 'sales', icon: '🎯', name: 'Ventas', desc: 'WhatsApp, llamadas, cierre de deals' },
  { id: 'financial', icon: '💰', name: 'Financiero', desc: 'Facturas, análisis, reportes' },
  { id: 'dev', icon: '💻', name: 'Desarrollo', desc: 'Código, apps, automatizaciones' },
  { id: 'hr', icon: '👥', name: 'RRHH', desc: 'Reclutamiento, onboarding, nómina' },
  { id: 'personal', icon: '📅', name: 'Asistente Personal', desc: 'Agenda, tareas, recordatorios' },
  { id: 'video', icon: '🎬', name: 'Video & Contenido', desc: 'Videos IA, HeyGen, ElevenLabs' },
  { id: 'computer', icon: '🖥️', name: 'Control PC', desc: 'Control de escritorio, automatizaciones' },
]

const INDUSTRIES = ['E-commerce', 'Restaurantes', 'Salud', 'Educación', 'Inmobiliaria', 'Servicios', 'Manufactura', 'Finanzas']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedAgents, setSelectedAgents] = useState<string[]>(['marketing', 'sales'])
  const [industry, setIndustry] = useState('')
  const [clientCount, setClientCount] = useState('1-5')
  const [saving, setSaving] = useState(false)

  function toggleAgent(id: string) {
    setSelectedAgents(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  async function handleFinish() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Save onboarding data to user metadata
        await supabase.auth.updateUser({
          data: {
            onboarding_complete: true,
            active_agents: selectedAgents,
            industry,
            client_count: clientCount
          }
        })
      }
      router.push('/dashboard')
    } catch {
      router.push('/dashboard')
    }
  }

  const steps = ['Agentes', 'Industria', 'Listo']

  return (
    <div style={{
      minHeight: '100vh', background: '#0A0A0F',
      fontFamily: "'Space Grotesk', sans-serif", padding: '40px 20px'
    }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(0,245,255,0.06) 0%, transparent 60%)' }} />

      <div style={{ maxWidth: '700px', margin: '0 auto', position: 'relative' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            fontSize: '36px', fontWeight: '800', letterSpacing: '-1.5px',
            background: 'linear-gradient(135deg, #00F5FF, #9B59B6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>JARVIS</div>
          <h1 style={{ color: '#fff', fontSize: '26px', fontWeight: '700', marginTop: '16px' }}>
            Configura tu agencia ✨
          </h1>
          <p style={{ color: '#666', fontSize: '15px', marginTop: '8px' }}>
            Solo 3 pasos para activar tu IA
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0', marginBottom: '48px' }}>
          {steps.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: i + 1 <= step ? 'linear-gradient(135deg, #00F5FF, #0080FF)' : 'rgba(255,255,255,0.08)',
                  border: i + 1 === step ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: i + 1 <= step ? '#000' : '#555', fontWeight: '700', fontSize: '14px',
                  margin: '0 auto'
                }}>{i + 1}</div>
                <div style={{ color: i + 1 === step ? '#00F5FF' : '#555', fontSize: '12px', marginTop: '6px' }}>{s}</div>
              </div>
              {i < steps.length - 1 && (
                <div style={{
                  width: '80px', height: '1px', margin: '0 8px', marginBottom: '18px',
                  background: i + 1 < step ? 'linear-gradient(90deg, #00F5FF, #0080FF)' : 'rgba(255,255,255,0.1)'
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Choose agents */}
        {step === 1 && (
          <div>
            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
              ¿Qué agentes quieres activar?
            </h2>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '28px' }}>
              Elige los agentes de IA para tu agencia. Puedes cambiarlos después.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '40px' }}>
              {AGENTS_LIST.map(agent => (
                <div
                  key={agent.id}
                  onClick={() => toggleAgent(agent.id)}
                  style={{
                    border: `1px solid ${selectedAgents.includes(agent.id) ? '#00F5FF' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '12px', padding: '16px', cursor: 'pointer',
                    background: selectedAgents.includes(agent.id) ? 'rgba(0,245,255,0.05)' : 'rgba(255,255,255,0.02)',
                    transition: 'all 0.2s', position: 'relative'
                  }}
                >
                  {selectedAgents.includes(agent.id) && (
                    <div style={{
                      position: 'absolute', top: '10px', right: '12px',
                      color: '#00F5FF', fontSize: '16px'
                    }}>✓</div>
                  )}
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>{agent.icon}</div>
                  <div style={{ color: '#fff', fontWeight: '600', fontSize: '15px' }}>{agent.name}</div>
                  <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>{agent.desc}</div>
                </div>
              ))}
            </div>

            <button onClick={() => setStep(2)} style={{
              width: '100%', padding: '14px',
              background: 'linear-gradient(135deg, #00F5FF, #0080FF)',
              border: 'none', borderRadius: '8px', color: '#000',
              fontSize: '16px', fontWeight: '700', cursor: 'pointer',
              fontFamily: "'Space Grotesk', sans-serif"
            }}>
              Continuar con {selectedAgents.length} agente{selectedAgents.length !== 1 ? 's' : ''} →
            </button>
          </div>
        )}

        {/* Step 2: Industry */}
        {step === 2 && (
          <div>
            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
              ¿En qué industrias trabajan tus clientes?
            </h2>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '28px' }}>
              Esto permite a JARVIS personalizar las respuestas para tu nicho.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '32px' }}>
              {INDUSTRIES.map(ind => (
                <button
                  key={ind}
                  onClick={() => setIndustry(ind)}
                  style={{
                    padding: '10px 20px',
                    border: `1px solid ${industry === ind ? '#00F5FF' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '100px',
                    background: industry === ind ? 'rgba(0,245,255,0.1)' : 'transparent',
                    color: industry === ind ? '#00F5FF' : '#aaa',
                    cursor: 'pointer', fontSize: '14px', fontWeight: '500',
                    transition: 'all 0.2s', fontFamily: "'Space Grotesk', sans-serif"
                  }}
                >{ind}</button>
              ))}
            </div>

            <div style={{ marginBottom: '40px' }}>
              <label style={{ color: '#aaa', fontSize: '14px', display: 'block', marginBottom: '12px' }}>
                ¿Cuántos clientes manejarás aproximadamente?
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {['1-5', '6-20', '21-50', '50+'].map(range => (
                  <button
                    key={range}
                    onClick={() => setClientCount(range)}
                    style={{
                      flex: 1, padding: '12px',
                      border: `1px solid ${clientCount === range ? '#9B59B6' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '8px',
                      background: clientCount === range ? 'rgba(155,89,182,0.1)' : 'transparent',
                      color: clientCount === range ? '#C39BD3' : '#aaa',
                      cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                      fontFamily: "'Space Grotesk', sans-serif", transition: 'all 0.2s'
                    }}
                  >{range}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setStep(1)} style={{
                padding: '14px 24px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#aaa',
                fontSize: '15px', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif"
              }}>← Atrás</button>
              <button onClick={() => setStep(3)} disabled={!industry} style={{
                flex: 1, padding: '14px',
                background: industry ? 'linear-gradient(135deg, #00F5FF, #0080FF)' : 'rgba(255,255,255,0.1)',
                border: 'none', borderRadius: '8px', color: industry ? '#000' : '#555',
                fontSize: '16px', fontWeight: '700', cursor: industry ? 'pointer' : 'not-allowed',
                fontFamily: "'Space Grotesk', sans-serif"
              }}>Continuar →</button>
            </div>
          </div>
        )}

        {/* Step 3: Ready */}
        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '80px', marginBottom: '24px', lineHeight: 1 }}>🚀</div>
            <h2 style={{ color: '#fff', fontSize: '28px', fontWeight: '800', marginBottom: '16px' }}>
              ¡Tu agencia está lista!
            </h2>
            <p style={{ color: '#888', fontSize: '15px', lineHeight: '1.7', marginBottom: '40px', maxWidth: '440px', margin: '0 auto 40px' }}>
              JARVIS está configurado con <span style={{ color: '#00F5FF' }}>{selectedAgents.length} agentes</span> activos
              para la industria de <span style={{ color: '#9B59B6' }}>{industry}</span>.
              <br /><br />
              Tu IA ya está trabajando. Entra al dashboard para verlo en acción.
            </p>

            <div style={{
              background: 'rgba(0,245,255,0.04)', border: '1px solid rgba(0,245,255,0.1)',
              borderRadius: '12px', padding: '20px', marginBottom: '32px', textAlign: 'left'
            }}>
              {selectedAgents.map(id => {
                const a = AGENTS_LIST.find(a => a.id === id)!
                return (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
                    <span style={{ fontSize: '20px' }}>{a.icon}</span>
                    <div>
                      <div style={{ color: '#fff', fontWeight: '600', fontSize: '14px' }}>{a.name}</div>
                      <div style={{ color: '#666', fontSize: '12px' }}>Activo y listo</div>
                    </div>
                    <div style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', background: '#00F5FF', boxShadow: '0 0 6px #00F5FF' }} />
                  </div>
                )
              })}
            </div>

            <button onClick={handleFinish} disabled={saving} style={{
              width: '100%', padding: '16px',
              background: saving ? 'rgba(0,245,255,0.3)' : 'linear-gradient(135deg, #00F5FF, #9B59B6)',
              border: 'none', borderRadius: '10px', color: '#fff',
              fontSize: '17px', fontWeight: '800', cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.3px'
            }}>
              {saving ? 'Activando...' : 'Entrar al Dashboard →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
