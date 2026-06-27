'use client'

import { useState, useEffect, useRef } from 'react'

// ─── Data ────────────────────────────────────────────────────────────────────

const AGENTS = [
  { icon: '🧠', name: 'Orquestador', desc: 'El cerebro central. Coordina todos los agentes y toma decisiones en milisegundos.', color: '#00F5FF' },
  { icon: '📱', name: 'Marketing', desc: 'Crea y publica contenido en todas las redes. Analiza métricas y optimiza campañas solo.', color: '#9B59B6' },
  { icon: '💻', name: 'Desarrollo', desc: 'Con Jules AI escribe, despliega y mantiene código completo sin intervención humana.', color: '#00F5FF' },
  { icon: '🎯', name: 'Ventas', desc: 'Atiende clientes por WhatsApp, email y llamadas. Cierra tratos mientras duermes.', color: '#FFD700' },
  { icon: '🎬', name: 'Video & Contenido', desc: 'Genera videos personalizados con HeyGen, clona tu voz y produce contenido 4K.', color: '#9B59B6' },
  { icon: '💰', name: 'Financiero', desc: 'Analiza bolsa, gestiona facturas, genera estados de cuenta y detecta anomalías.', color: '#FFD700' },
  { icon: '👥', name: 'Recursos Humanos', desc: 'Recluta, onboarda y gestiona tu equipo con IA. Evaluaciones y nóminas automáticas.', color: '#00F5FF' },
  { icon: '📅', name: 'Personal', desc: 'Tu asistente de vida: agenda, familia, recordatorios, viajes y todo lo personal.', color: '#9B59B6' },
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
    color: '#00F5FF',
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
    color: '#9B59B6',
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

// ─── Particle Background ──────────────────────────────────────────────────────

function Particles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 3 + 1 + 'px',
            height: Math.random() * 3 + 1 + 'px',
            left: Math.random() * 100 + '%',
            background: i % 3 === 0 ? '#00F5FF' : i % 3 === 1 ? '#9B59B6' : '#FFD700',
            opacity: Math.random() * 0.5 + 0.1,
            animation: `particle ${Math.random() * 15 + 10}s linear ${Math.random() * 10}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

// ─── JARVIS Circle ────────────────────────────────────────────────────────────

function JarvisOrb({ active }: { active: boolean }) {
  return (
    <div className="relative flex items-center justify-center w-64 h-64 mx-auto">
      {/* Outer rings */}
      <div className="absolute inset-0 rounded-full border border-cyan-400/10 animate-spin-slow" />
      <div className="absolute inset-4 rounded-full border border-purple-500/20" style={{ animation: 'spin-slow 15s linear infinite reverse' }} />
      <div className="absolute inset-8 rounded-full border border-yellow-400/10 animate-spin-slow" style={{ animationDuration: '8s' }} />

      {/* Glow */}
      <div className="absolute inset-16 rounded-full blur-xl" style={{ background: active ? 'rgba(0,245,255,0.3)' : 'rgba(0,245,255,0.1)', transition: 'all 0.5s' }} />

      {/* Core */}
      <div
        className="relative z-10 w-32 h-32 rounded-full flex items-center justify-center text-5xl"
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgba(0,245,255,0.3), rgba(155,89,182,0.2), #0A0A0A)',
          border: '1px solid rgba(0,245,255,0.4)',
          boxShadow: active ? '0 0 60px rgba(0,245,255,0.5), 0 0 120px rgba(0,245,255,0.2)' : '0 0 30px rgba(0,245,255,0.2)',
          transition: 'all 0.5s',
        }}
      >
        🤖
      </div>

      {/* Orbiting dots */}
      {[0, 60, 120, 180, 240, 300].map((deg, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: i % 2 === 0 ? '#00F5FF' : '#9B59B6',
            top: '50%',
            left: '50%',
            transform: `rotate(${deg}deg) translateX(120px) translateY(-50%)`,
            boxShadow: `0 0 8px ${i % 2 === 0 ? '#00F5FF' : '#9B59B6'}`,
          }}
        />
      ))}
    </div>
  )
}

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
    <span className="text-gradient-cyan">
      {displayed}<span className="animate-blink">|</span>
    </span>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function JarvisLanding() {
  const [orbActive, setOrbActive] = useState(false)
  const [activeAgent, setActiveAgent] = useState<number | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setOrbActive(true), 1000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden">
      <Particles />

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black"
              style={{ background: 'linear-gradient(135deg, #00F5FF20, #9B59B620)', border: '1px solid rgba(0,245,255,0.3)' }}
            >
              J
            </div>
            <span className="font-black text-xl tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              JARVIS
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'rgba(0,245,255,0.1)', color: '#00F5FF', border: '1px solid rgba(0,245,255,0.2)' }}
            >
              BETA
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            {['Capacidades', 'Agentes', 'Precios', 'Marketplace'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-white transition-colors">{item}</a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <a href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">Entrar</a>
            <a
              href="#precios"
              className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
              style={{ background: 'linear-gradient(135deg, #00F5FF, #9B59B6)', color: '#0A0A0A' }}
            >
              Empezar →
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 grid-lines mesh-gradient">

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-10"
          style={{ background: 'rgba(0,245,255,0.05)', border: '1px solid rgba(0,245,255,0.2)', color: '#00F5FF' }}
        >
          <span className="w-2 h-2 rounded-full animate-pulse-cyan" style={{ background: '#00F5FF' }} />
          10 IAs trabajando en paralelo · Disponible en LATAM
        </div>

        {/* Orb */}
        <div className="mb-10">
          <JarvisOrb active={orbActive} />
        </div>

        {/* Headline */}
        <h1
          className="text-5xl md:text-7xl lg:text-8xl font-black leading-none mb-6"
          style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.03em' }}
        >
          El cerebro de IA<br />
          que{' '}
          <TypeWriter texts={[
            'vende por ti.',
            'programa solo.',
            'nunca duerme.',
            'escala tu empresa.',
            'hace llamadas.',
            'crea contenido.',
          ]} />
        </h1>

        <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
          JARVIS es la plataforma de IA empresarial omnicanal con{' '}
          <strong className="text-white">9 agentes especializados</strong>,{' '}
          voz humana real, videos con avatar y capacidad de escribir y desplegar código solo.
          Todo en un sistema que tú controlas.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <a
            href="#precios"
            className="px-10 py-4 rounded-2xl font-bold text-lg transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #00F5FF, #9B59B6)', color: '#0A0A0A' }}
          >
            Activar JARVIS →
          </a>
          <a
            href="#capacidades"
            className="px-10 py-4 rounded-2xl font-semibold text-lg glass border border-white/10 hover:border-white/20 transition-all"
          >
            Ver capacidades
          </a>
        </div>

        {/* AI Stack pills */}
        <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
          {AI_STACK.map(ai => (
            <div
              key={ai.name}
              className="text-xs px-3 py-1.5 rounded-full glass"
              style={{ border: '1px solid rgba(255,255,255,0.08)', color: '#aaa' }}
            >
              {ai.name} · <span className="text-gray-500">{ai.use}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="capacidades" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-sm font-semibold mb-4" style={{ color: '#00F5FF', letterSpacing: '0.2em' }}>CAPACIDADES</p>
            <h2 className="text-4xl md:text-6xl font-black mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Una IA que hace todo
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              No es un chatbot. Es un sistema operativo de inteligencia artificial para tu empresa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="glass rounded-2xl p-6 hover:border-cyan-400/30 transition-all group cursor-default"
                style={{ border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-lg mb-2 group-hover:text-gradient-cyan transition-all">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AGENTES ── */}
      <section id="agentes" className="py-32 px-6" style={{ background: 'rgba(0,245,255,0.02)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-sm font-semibold mb-4" style={{ color: '#9B59B6', letterSpacing: '0.2em' }}>AGENTES ESPECIALIZADOS</p>
            <h2 className="text-4xl md:text-6xl font-black mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              9 expertos trabajando<br />por tu empresa
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Cada agente es un especialista. El Orquestador los coordina a todos en tiempo real.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {AGENTS.map((agent, i) => (
              <div
                key={i}
                className="glass rounded-2xl p-6 cursor-pointer transition-all duration-300"
                style={{
                  border: `1px solid ${activeAgent === i ? agent.color + '50' : 'rgba(255,255,255,0.06)'}`,
                  boxShadow: activeAgent === i ? `0 0 30px ${agent.color}20` : 'none',
                  transform: activeAgent === i ? 'translateY(-4px)' : 'none',
                }}
                onMouseEnter={() => setActiveAgent(i)}
                onMouseLeave={() => setActiveAgent(null)}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                  style={{ background: agent.color + '15', border: `1px solid ${agent.color}30` }}
                >
                  {agent.icon}
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ color: activeAgent === i ? agent.color : 'white' }}>
                  {agent.name}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">{agent.desc}</p>
              </div>
            ))}
          </div>

          {/* Create on demand */}
          <div
            className="mt-8 glass rounded-2xl p-8 text-center"
            style={{ border: '1px solid rgba(255,215,0,0.2)' }}
          >
            <p className="text-2xl mb-2">✨</p>
            <h3 className="font-bold text-xl mb-2 text-gradient-gold">+ Crea agentes nuevos por voz</h3>
            <p className="text-gray-400">
              Di <span className="text-white font-mono text-sm px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.05)' }}>"JARVIS, necesito un agente de logística"</span> y lo crea en minutos.
            </p>
          </div>
        </div>
      </section>

      {/* ── MARKETPLACE ── */}
      <section id="marketplace" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-semibold mb-4" style={{ color: '#FFD700', letterSpacing: '0.2em' }}>MARKETPLACE</p>
              <h2 className="text-4xl md:text-5xl font-black mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Un ecosistema que<br />crece solo
              </h2>
              <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                JARVIS se conecta a GitHub y busca nuevas capacidades automáticamente.
                Desarrolladores externos crean plugins y ganan comisiones. Tú tienes un sistema
                que se vuelve más poderoso con el tiempo sin que hagas nada.
              </p>
              <div className="space-y-4">
                {[
                  { icon: '🐙', text: 'Busca skills en GitHub automáticamente' },
                  { icon: '⭐', text: 'Evalúa calidad por stars y actividad antes de instalar' },
                  { icon: '🔒', text: 'Sandbox seguro — prueba antes de activar en producción' },
                  { icon: '💸', text: 'Comisiones automáticas para desarrolladores externos' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-gray-300">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass rounded-3xl p-8" style={{ border: '1px solid rgba(255,215,0,0.15)' }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg">Skills instaladas</h3>
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(0,245,255,0.1)', color: '#00F5FF' }}>247 disponibles</span>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'sentiment-analyzer', stars: '2.4k', status: 'activo' },
                  { name: 'invoice-generator', stars: '891', status: 'activo' },
                  { name: 'lead-scorer', stars: '1.2k', status: 'instalando...' },
                  { name: 'competitor-monitor', stars: '634', status: 'sandbox' },
                ].map((skill, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">🐙</span>
                      <span className="text-sm font-mono text-gray-300">{skill.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">⭐ {skill.stars}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{
                        background: skill.status === 'activo' ? 'rgba(0,245,255,0.1)' : skill.status === 'sandbox' ? 'rgba(255,215,0,0.1)' : 'rgba(155,89,182,0.1)',
                        color: skill.status === 'activo' ? '#00F5FF' : skill.status === 'sandbox' ? '#FFD700' : '#9B59B6',
                      }}>
                        {skill.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="precios" className="py-32 px-6" style={{ background: 'rgba(155,89,182,0.02)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-sm font-semibold mb-4" style={{ color: '#9B59B6', letterSpacing: '0.2em' }}>PRECIOS</p>
            <h2 className="text-4xl md:text-6xl font-black mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Planes que crecen<br />contigo
            </h2>
            <p className="text-xl text-gray-400">Sin permanencia. Cancela cuando quieras.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan, i) => (
              <div
                key={i}
                className="relative glass rounded-3xl p-8 transition-all"
                style={{
                  border: `1px solid ${plan.highlight ? plan.color + '40' : 'rgba(255,255,255,0.06)'}`,
                  boxShadow: plan.highlight ? `0 0 60px ${plan.color}15` : 'none',
                  transform: plan.highlight ? 'scale(1.02)' : 'none',
                }}
              >
                {plan.highlight && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full"
                    style={{ background: plan.color, color: '#0A0A0A' }}
                  >
                    MÁS POPULAR
                  </div>
                )}
                <div className="mb-2">
                  <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: plan.color + '15', color: plan.color }}>
                    {plan.level}
                  </span>
                </div>
                <h3 className="text-2xl font-black mt-3 mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{plan.name}</h3>
                <p className="text-sm text-gray-400 mb-6">{plan.desc}</p>
                <div className="mb-8">
                  <span className="text-5xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    ${plan.price}
                  </span>
                  <span className="text-gray-400 ml-2">USD/{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <span style={{ color: plan.color }}>✓</span>
                      <span className="text-gray-300">{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#contacto"
                  className="block text-center py-3 rounded-xl font-bold transition-all hover:opacity-90"
                  style={plan.highlight
                    ? { background: `linear-gradient(135deg, ${plan.color}, #9B59B6)`, color: '#0A0A0A' }
                    : { background: plan.color + '15', color: plan.color, border: `1px solid ${plan.color}30` }
                  }
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section id="contacto" className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div
            className="glass rounded-3xl p-16"
            style={{ border: '1px solid rgba(0,245,255,0.15)', background: 'radial-gradient(ellipse at center, rgba(0,245,255,0.05) 0%, transparent 70%)' }}
          >
            <div className="text-6xl mb-6 animate-float">🤖</div>
            <h2 className="text-4xl md:text-6xl font-black mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Activa JARVIS<br />
              <span className="text-gradient-cyan">en tu empresa hoy</span>
            </h2>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Las primeras 10 agencias que se registren obtienen 3 meses al precio de Agencia
              con acceso completo a todas las funciones Elite.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://wa.me/?text=Quiero%20activar%20JARVIS"
                className="px-10 py-4 rounded-2xl font-bold text-lg transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #00F5FF, #9B59B6)', color: '#0A0A0A' }}
              >
                Hablar con ventas →
              </a>
              <a
                href="#precios"
                className="px-10 py-4 rounded-2xl font-semibold text-lg glass border border-white/10 hover:border-white/20 transition-all"
              >
                Ver planes
              </a>
            </div>
            <p className="text-sm text-gray-500 mt-6">Sin contrato · Cancela cuando quieras · Soporte 24/7</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t py-12 px-6" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-black text-xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>JARVIS</span>
            <span className="text-gray-600 text-sm">— Inteligencia Artificial Empresarial</span>
          </div>
          <p className="text-gray-600 text-sm">© 2026 JARVIS. Todos los derechos reservados.</p>
          <div className="flex gap-6 text-sm text-gray-600">
            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
            <a href="#" className="hover:text-white transition-colors">Términos</a>
            <a href="#" className="hover:text-white transition-colors">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
