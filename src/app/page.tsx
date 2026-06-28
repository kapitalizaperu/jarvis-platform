'use client'

import { useState, useEffect } from 'react'

// ─── Design Tokens ────────────────────────────────────────────────────────────
const DS = {
  bg: '#020B18',
  surface: '#030D1E',
  primary: '#00CFFF',
  secondary: '#0050FF',
  accent: '#00FF88',
  warning: '#FFD700',
  text: '#ffffff',
  muted: 'rgba(0,200,255,0.4)',
  border: 'rgba(0,200,255,0.12)',
  font: "'Space Grotesk', sans-serif",
  glass: 'rgba(3,13,30,0.85)',
  glow: '0 0 30px rgba(0,200,255,0.15)',
  gradientText: 'linear-gradient(135deg, #00CFFF, #0050FF)',
}

// ─── Data ────────────────────────────────────────────────────────────────────

const AGENTS = [
  { icon: '🧠', name: 'Orquestador', desc: 'El cerebro central. Coordina todos los agentes y toma decisiones en milisegundos.', color: '#00CFFF' },
  { icon: '📱', name: 'Marketing', desc: 'Crea y publica contenido en todas las redes. Analiza métricas y optimiza campañas solo.', color: '#0050FF' },
  { icon: '💻', name: 'Desarrollo', desc: 'Con Jules AI escribe, despliega y mantiene código completo sin intervención humana.', color: '#00CFFF' },
  { icon: '🎯', name: 'Ventas', desc: 'Atiende clientes por WhatsApp, email y llamadas. Cierra tratos mientras duermes.', color: '#FFD700' },
  { icon: '🎬', name: 'Video & Contenido', desc: 'Genera videos personalizados con HeyGen, clona tu voz y produce contenido 4K.', color: '#0050FF' },
  { icon: '💰', name: 'Financiero', desc: 'Analiza bolsa, gestiona facturas, genera estados de cuenta y detecta anomalías.', color: '#FFD700' },
  { icon: '👥', name: 'Recursos Humanos', desc: 'Recluta, onboarda y gestiona tu equipo con IA. Evaluaciones y nóminas automáticas.', color: '#00CFFF' },
  { icon: '📅', name: 'Personal', desc: 'Tu asistente de vida: agenda, familia, recordatorios, viajes y todo lo personal.', color: '#0050FF' },
]

const AI_STACK = [
  { name: 'Claude', company: 'Anthropic', use: 'Razonamiento profundo' },
  { name: 'GPT-4o', company: 'OpenAI', use: 'Visión e imágenes' },
  { name: 'Gemini', company: 'Google', use: 'Datos masivos' },
  { name: 'Jules', company: 'Google', use: 'Código autónomo' },
  { name: 'HeyGen', company: 'HeyGen', use: 'Videos con avatar' },
  { name: 'ElevenLabs', company: 'ElevenLabs', use: 'Voz ultra-real' },
  { name: 'Vapi', company: 'Vapi.ai', use: 'Llamadas IA' },
  { name: 'Midjourney', company: 'MJ', use: 'Imágenes premium' },
]

const PLANS = [
  {
    level: 'Nivel 1',
    name: 'Agencia',
    price: '297',
    period: 'mes',
    desc: 'Para agencias y emprendedores que venden IA a negocios',
    features: [
      'Hasta 10 clientes Nivel 2',
      'JARVIS con 5 agentes activos',
      'WhatsApp + llamadas IA',
      'Marketing automático 6 redes',
      'Dashboard de administración',
      'Soporte prioritario',
    ],
    cta: 'Empezar como agencia',
    color: '#00CFFF',
    highlight: false,
  },
  {
    level: 'Nivel 1 Pro',
    name: 'Agencia Elite',
    price: '697',
    period: 'mes',
    desc: 'El sistema completo para agencias que quieren escalar rápido',
    features: [
      'Clientes Nivel 2 ilimitados',
      'Todos los agentes (9+)',
      'Videos HeyGen + voz ElevenLabs',
      'Jules AI — código autónomo',
      'GitHub skills autónomo',
      'App desktop + móvil',
      'Marketplace de extensiones',
      'White-label completo',
    ],
    cta: 'Quiero el sistema completo →',
    color: '#FFD700',
    highlight: true,
  },
  {
    level: 'Nivel 2',
    name: 'Negocio',
    price: '97',
    period: 'mes',
    desc: 'Para negocios finales — lo paga el cliente de tu agencia',
    features: [
      'JARVIS personalizado para el negocio',
      'Redes sociales automáticas',
      'WhatsApp empresarial con IA',
      'Reportes y métricas KPI',
      'Integración con su punto de venta',
    ],
    cta: 'Para mis clientes',
    color: '#0050FF',
    highlight: false,
  },
]

const FEATURES = [
  { icon: '🎙️', title: 'Voz 100% Humana', desc: 'ElevenLabs + Vapi.ai para llamadas que nadie sabe que son IA' },
  { icon: '📹', title: 'Videos con Avatar', desc: 'HeyGen genera videos personalizados con tu cara y voz clonada' },
  { icon: '🐙', title: 'GitHub Autónomo', desc: 'JARVIS instala nuevas capacidades solo desde GitHub' },
  { icon: '⚡', title: 'Deploy Instantáneo', desc: 'Jules AI escribe y despliega código completo por voz' },
  { icon: '🌐', title: 'Omnicanal', desc: 'WhatsApp, llamadas, email, redes sociales — todo unificado' },
  { icon: '🔐', title: 'Multi-Tenant Seguro', desc: 'Cada cliente aislado. Tú controlas todo desde el Nivel 0' },
  { icon: '📊', title: 'Análisis en Tiempo Real', desc: 'KPIs, finanzas, bolsa y métricas de negocio — siempre visibles' },
  { icon: '🤖', title: 'Aprende Solo', desc: 'RAG + memoria persistente. JARVIS mejora con cada interacción' },
]

// ─── Grid Background ──────────────────────────────────────────────────────────
const GRID_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(0,200,255,0.04)' stroke-width='1'/%3E%3C/svg%3E")`

// ─── Typing Effect ────────────────────────────────────────────────────────────
function TypeWriter({ texts }: { texts: string[] }) {
  const [current, setCurrent] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const target = texts[current]
    if (!deleting && displayed.length < target.length) {
      const t = setTimeout(() => setDisplayed(target.slice(0, displayed.length + 1)), 60)
      return () => clearTimeout(t)
    }
    if (!deleting && displayed.length === target.length) {
      const t = setTimeout(() => setDeleting(true), 2000)
      return () => clearTimeout(t)
    }
    if (deleting && displayed.length > 0) {
      const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 30)
      return () => clearTimeout(t)
    }
    if (deleting && displayed.length === 0) {
      setDeleting(false)
      setCurrent((current + 1) % texts.length)
    }
  }, [displayed, deleting, current, texts])

  return (
    <span style={{ background: DS.gradientText, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
      {displayed}<span style={{ opacity: 0.8 }}>|</span>
    </span>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function JarvisLanding() {
  const [activeAgent, setActiveAgent] = useState<number | null>(null)

  return (
    <div style={{
      minHeight: '100vh',
      background: DS.bg,
      backgroundImage: GRID_SVG,
      color: DS.text,
      fontFamily: DS.font,
      overflowX: 'hidden',
    }}>
      {/* Global keyframes */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .nav-link:hover { color: #00CFFF !important; }
        .cta-btn:hover { opacity: 0.9; transform: translateY(-2px); }
        .ghost-btn:hover { border-color: rgba(0,200,255,0.4) !important; }
        .agent-card:hover { transform: translateY(-4px); }
        .feature-card:hover { border-color: rgba(0,200,255,0.25) !important; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(2,11,24,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${DS.border}`,
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(0,207,255,0.1)', border: `1px solid rgba(0,207,255,0.3)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: '14px', color: DS.primary,
            }}>J</div>
            <span style={{ fontWeight: 900, fontSize: '20px', letterSpacing: '-0.5px' }}>JARVIS</span>
            <span style={{
              fontSize: '11px', padding: '2px 8px', borderRadius: '100px',
              background: 'rgba(0,207,255,0.08)', color: DS.primary, border: `1px solid rgba(0,207,255,0.2)`,
              fontWeight: 600, letterSpacing: '0.5px',
            }}>BETA</span>
          </div>

          {/* Nav links */}
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            {['Capacidades', 'Agentes', 'Precios', 'Marketplace'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="nav-link" style={{
                color: 'rgba(255,255,255,0.5)', fontSize: '14px', textDecoration: 'none', transition: 'color 0.2s',
              }}>{item}</a>
            ))}
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a href="/auth/login" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', textDecoration: 'none' }}>Entrar</a>
            <a href="#precios" className="cta-btn" style={{
              fontSize: '14px', fontWeight: 700, padding: '10px 20px', borderRadius: '12px',
              background: DS.gradientText, color: DS.bg, textDecoration: 'none', transition: 'all 0.2s',
              display: 'inline-block',
            }}>Empezar →</a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center', padding: '120px 24px 80px',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(0,80,255,0.12) 0%, transparent 60%)',
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '8px 20px', borderRadius: '100px', marginBottom: '40px',
          background: 'rgba(0,207,255,0.05)', border: `1px solid rgba(0,207,255,0.2)`, color: DS.primary,
          fontSize: '13px', fontWeight: 500,
        }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: DS.accent, display: 'inline-block', animation: 'pulse-glow 2s ease-in-out infinite' }} />
          10 IAs trabajando en paralelo · Disponible en LATAM
        </div>

        {/* Orb visual */}
        <div style={{ width: '180px', height: '180px', position: 'relative', margin: '0 auto 48px', animation: 'float 6s ease-in-out infinite' }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '1px solid rgba(0,207,255,0.1)', animation: 'spin-slow 20s linear infinite',
          }} />
          <div style={{
            position: 'absolute', inset: '12px', borderRadius: '50%',
            border: '1px solid rgba(0,80,255,0.15)', animation: 'spin-slow 14s linear infinite reverse',
          }} />
          <div style={{
            position: 'absolute', inset: '30px', borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, rgba(0,207,255,0.25), rgba(0,80,255,0.15), transparent)',
            border: `1px solid rgba(0,207,255,0.3)`,
            boxShadow: `0 0 60px rgba(0,207,255,0.2), inset 0 0 40px rgba(0,80,255,0.1)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px',
          }}>🤖</div>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(44px, 8vw, 88px)', fontWeight: 900, lineHeight: 1.0,
          letterSpacing: '-0.03em', marginBottom: '24px', fontFamily: DS.font,
        }}>
          El cerebro de IA<br />
          que{' '}
          <TypeWriter texts={['vende por ti.', 'programa solo.', 'nunca duerme.', 'escala tu empresa.', 'hace llamadas.', 'crea contenido.']} />
        </h1>

        <p style={{ fontSize: '20px', color: 'rgba(255,255,255,0.55)', maxWidth: '640px', margin: '0 auto 40px', lineHeight: 1.7 }}>
          JARVIS es la plataforma de IA empresarial omnicanal con{' '}
          <strong style={{ color: DS.text }}>9 agentes especializados</strong>,{' '}
          voz humana real, videos con avatar y capacidad de escribir y desplegar código solo.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '64px' }}>
          <a href="#precios" className="cta-btn" style={{
            padding: '16px 36px', borderRadius: '14px', fontWeight: 700, fontSize: '17px',
            background: DS.gradientText, color: DS.bg, textDecoration: 'none', transition: 'all 0.2s',
            boxShadow: '0 0 40px rgba(0,207,255,0.2)',
          }}>Activar JARVIS →</a>
          <a href="#capacidades" className="ghost-btn" style={{
            padding: '16px 36px', borderRadius: '14px', fontWeight: 600, fontSize: '17px',
            background: 'rgba(3,13,30,0.85)', backdropFilter: 'blur(20px)',
            border: `1px solid ${DS.border}`, color: DS.text, textDecoration: 'none', transition: 'all 0.2s',
          }}>Ver capacidades</a>
        </div>

        {/* AI Stack pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', maxWidth: '700px', margin: '0 auto' }}>
          {AI_STACK.map(ai => (
            <div key={ai.name} style={{
              fontSize: '12px', padding: '6px 14px', borderRadius: '100px',
              background: 'rgba(3,13,30,0.85)', backdropFilter: 'blur(20px)',
              border: `1px solid ${DS.border}`, color: 'rgba(255,255,255,0.4)',
            }}>
              {ai.name} <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 4px' }}>·</span> {ai.use}
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="capacidades" style={{ padding: '120px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: DS.primary, letterSpacing: '0.2em', marginBottom: '16px', textTransform: 'uppercase' }}>Capacidades</p>
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, marginBottom: '20px', fontFamily: DS.font }}>
              Una IA que hace todo
            </h2>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)', maxWidth: '560px', margin: '0 auto' }}>
              No es un chatbot. Es un sistema operativo de inteligencia artificial para tu empresa.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card" style={{
                background: DS.glass, backdropFilter: 'blur(20px)',
                border: `1px solid ${DS.border}`, borderRadius: '16px', padding: '28px',
                transition: 'all 0.2s', cursor: 'default',
              }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>{f.icon}</div>
                <h3 style={{ fontWeight: 700, fontSize: '17px', marginBottom: '8px', color: DS.text }}>{f.title}</h3>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AGENTES ── */}
      <section id="agentes" style={{ padding: '120px 24px', background: 'rgba(0,80,255,0.03)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: DS.secondary, letterSpacing: '0.2em', marginBottom: '16px', textTransform: 'uppercase' }}>Agentes Especializados</p>
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, marginBottom: '20px', fontFamily: DS.font }}>
              9 expertos trabajando<br />por tu empresa
            </h2>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)', maxWidth: '560px', margin: '0 auto' }}>
              Cada agente es un especialista. El Orquestador los coordina a todos en tiempo real.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {AGENTS.map((agent, i) => (
              <div
                key={i}
                className="agent-card"
                style={{
                  background: DS.glass, backdropFilter: 'blur(20px)',
                  border: `1px solid ${activeAgent === i ? agent.color + '40' : DS.border}`,
                  borderRadius: '16px', padding: '28px', cursor: 'pointer',
                  transition: 'all 0.25s',
                  boxShadow: activeAgent === i ? `0 0 30px ${agent.color}15` : 'none',
                }}
                onMouseEnter={() => setActiveAgent(i)}
                onMouseLeave={() => setActiveAgent(null)}
              >
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px', fontSize: '24px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
                  background: agent.color + '12', border: `1px solid ${agent.color}25`,
                }}>{agent.icon}</div>
                <h3 style={{ fontWeight: 700, fontSize: '17px', marginBottom: '8px', color: activeAgent === i ? agent.color : DS.text }}>
                  {agent.name}
                </h3>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{agent.desc}</p>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: '24px', background: DS.glass, backdropFilter: 'blur(20px)',
            border: `1px solid rgba(255,215,0,0.15)`, borderRadius: '16px',
            padding: '32px', textAlign: 'center',
          }}>
            <p style={{ fontSize: '24px', marginBottom: '8px' }}>✨</p>
            <h3 style={{ fontWeight: 700, fontSize: '20px', marginBottom: '8px', background: 'linear-gradient(135deg, #FFD700, #00CFFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              + Crea agentes nuevos por voz
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.45)' }}>
              Di <span style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 10px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '13px', color: DS.text }}>"JARVIS, necesito un agente de logística"</span> y lo crea en minutos.
            </p>
          </div>
        </div>
      </section>

      {/* ── MARKETPLACE ── */}
      <section id="marketplace" style={{ padding: '120px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: DS.warning, letterSpacing: '0.2em', marginBottom: '16px', textTransform: 'uppercase' }}>Marketplace</p>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, marginBottom: '24px', fontFamily: DS.font }}>
                Un ecosistema que<br />crece solo
              </h2>
              <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.5)', marginBottom: '36px', lineHeight: 1.7 }}>
                JARVIS se conecta a GitHub y busca nuevas capacidades automáticamente. Desarrolladores externos crean plugins y ganan comisiones.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { icon: '🐙', text: 'Busca skills en GitHub automáticamente' },
                  { icon: '⭐', text: 'Evalúa calidad por stars y actividad antes de instalar' },
                  { icon: '🔒', text: 'Sandbox seguro — prueba antes de activar en producción' },
                  { icon: '💸', text: 'Comisiones automáticas para desarrolladores externos' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>{item.icon}</span>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px' }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{
              background: DS.glass, backdropFilter: 'blur(20px)',
              border: `1px solid rgba(255,215,0,0.12)`, borderRadius: '20px', padding: '32px',
              boxShadow: DS.glow,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontWeight: 700, fontSize: '17px' }}>Skills instaladas</h3>
                <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '100px', background: 'rgba(0,207,255,0.1)', color: DS.primary }}>247 disponibles</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { name: 'sentiment-analyzer', stars: '2.4k', status: 'activo' },
                  { name: 'invoice-generator', stars: '891', status: 'activo' },
                  { name: 'lead-scorer', stars: '1.2k', status: 'instalando...' },
                  { name: 'competitor-monitor', stars: '634', status: 'sandbox' },
                ].map((skill, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${DS.border}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '14px' }}>🐙</span>
                      <span style={{ fontSize: '13px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.7)' }}>{skill.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>⭐ {skill.stars}</span>
                      <span style={{
                        fontSize: '11px', padding: '3px 8px', borderRadius: '100px',
                        background: skill.status === 'activo' ? 'rgba(0,255,136,0.1)' : skill.status === 'sandbox' ? 'rgba(255,215,0,0.1)' : 'rgba(0,80,255,0.1)',
                        color: skill.status === 'activo' ? DS.accent : skill.status === 'sandbox' ? DS.warning : DS.secondary,
                      }}>{skill.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="precios" style={{ padding: '120px 24px', background: 'rgba(0,80,255,0.03)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: DS.secondary, letterSpacing: '0.2em', marginBottom: '16px', textTransform: 'uppercase' }}>Precios</p>
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, marginBottom: '16px', fontFamily: DS.font }}>
              Planes que crecen<br />contigo
            </h2>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)' }}>Sin permanencia. Cancela cuando quieras.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', alignItems: 'start' }}>
            {PLANS.map((plan, i) => (
              <div key={i} style={{
                position: 'relative',
                background: DS.glass, backdropFilter: 'blur(20px)',
                border: `1px solid ${plan.highlight ? plan.color + '35' : DS.border}`,
                borderRadius: '20px', padding: '36px',
                boxShadow: plan.highlight ? `0 0 60px ${plan.color}12` : 'none',
                transform: plan.highlight ? 'scale(1.03)' : 'none',
                transition: 'all 0.2s',
              }}>
                {plan.highlight && (
                  <div style={{
                    position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                    background: plan.color, color: DS.bg, fontSize: '11px', fontWeight: 700,
                    padding: '4px 16px', borderRadius: '100px', letterSpacing: '0.5px', whiteSpace: 'nowrap',
                  }}>MÁS POPULAR</div>
                )}
                <span style={{
                  fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '100px',
                  background: plan.color + '15', color: plan.color, letterSpacing: '0.5px', textTransform: 'uppercase',
                }}>{plan.level}</span>
                <h3 style={{ fontSize: '26px', fontWeight: 900, marginTop: '16px', marginBottom: '8px', fontFamily: DS.font }}>{plan.name}</h3>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '24px', lineHeight: 1.5 }}>{plan.desc}</p>
                <div style={{ marginBottom: '28px' }}>
                  <span style={{ fontSize: '52px', fontWeight: 900, fontFamily: DS.font, color: plan.highlight ? plan.color : DS.text }}>${plan.price}</span>
                  <span style={{ color: 'rgba(255,255,255,0.35)', marginLeft: '6px', fontSize: '15px' }}>USD/{plan.period}</span>
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '14px' }}>
                      <span style={{ color: plan.color, fontWeight: 700, marginTop: '1px' }}>✓</span>
                      <span style={{ color: 'rgba(255,255,255,0.65)' }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <a href="#contacto" style={{
                  display: 'block', textAlign: 'center', padding: '14px', borderRadius: '12px',
                  fontWeight: 700, fontSize: '15px', textDecoration: 'none', transition: 'all 0.2s',
                  ...(plan.highlight
                    ? { background: `linear-gradient(135deg, ${plan.color}, #0050FF)`, color: DS.bg }
                    : { background: plan.color + '12', color: plan.color, border: `1px solid ${plan.color}25` }),
                }}>{plan.cta}</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section id="contacto" style={{ padding: '120px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            backdropFilter: 'blur(20px)',
            border: `1px solid rgba(0,207,255,0.18)`, borderRadius: '24px', padding: '80px 48px',
            background: 'radial-gradient(ellipse at center, rgba(0,80,255,0.08) 0%, rgba(3,13,30,0.85) 70%)',
            boxShadow: '0 0 80px rgba(0,80,255,0.08)',
          }}>
            <div style={{ fontSize: '56px', marginBottom: '24px', display: 'inline-block', animation: 'float 5s ease-in-out infinite' }}>🤖</div>
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, marginBottom: '20px', fontFamily: DS.font, lineHeight: 1.1 }}>
              Activa JARVIS<br />
              <span style={{ background: DS.gradientText, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>en tu empresa hoy</span>
            </h2>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)', marginBottom: '40px', maxWidth: '520px', margin: '0 auto 40px', lineHeight: 1.7 }}>
              Las primeras 10 agencias obtienen 3 meses al precio Agencia con acceso completo Elite.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="https://wa.me/?text=Quiero%20activar%20JARVIS" className="cta-btn" style={{
                padding: '16px 36px', borderRadius: '14px', fontWeight: 700, fontSize: '17px',
                background: DS.gradientText, color: DS.bg, textDecoration: 'none', transition: 'all 0.2s',
                boxShadow: '0 0 40px rgba(0,207,255,0.2)',
              }}>Hablar con ventas →</a>
              <a href="#precios" className="ghost-btn" style={{
                padding: '16px 36px', borderRadius: '14px', fontWeight: 600, fontSize: '17px',
                background: 'rgba(3,13,30,0.85)', backdropFilter: 'blur(20px)',
                border: `1px solid ${DS.border}`, color: DS.text, textDecoration: 'none', transition: 'all 0.2s',
              }}>Ver planes</a>
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', marginTop: '24px' }}>Sin contrato · Cancela cuando quieras · Soporte 24/7</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${DS.border}`, padding: '48px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 900, fontSize: '20px', fontFamily: DS.font }}>JARVIS</span>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>— Inteligencia Artificial Empresarial</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>© 2026 JARVIS. Todos los derechos reservados.</p>
          <div style={{ display: 'flex', gap: '24px' }}>
            {['Privacidad', 'Términos', 'Contacto'].map(l => (
              <a key={l} href="#" style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px', textDecoration: 'none' }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
