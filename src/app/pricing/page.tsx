'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const DS = {
  bg: '#020B18',
  primary: '#00CFFF',
  secondary: '#0050FF',
  accent: '#00FF88',
  warning: '#FFD700',
  text: '#ffffff',
  border: 'rgba(0,200,255,0.12)',
  glass: 'rgba(3,13,30,0.85)',
  gradientText: 'linear-gradient(135deg, #00CFFF, #0050FF)',
  font: "'Space Grotesk', sans-serif",
}

const GRID_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(0,200,255,0.04)' stroke-width='1'/%3E%3C/svg%3E")`

const PLANS = [
  {
    id: 'agency',
    level: 'Nivel 1',
    name: 'Agencia',
    price: 297,
    desc: 'Para agencias y emprendedores que venden IA a negocios',
    features: ['Hasta 10 clientes Nivel 2', 'JARVIS con 5 agentes activos', 'WhatsApp + llamadas IA', 'Marketing automático 6 redes', 'Dashboard de administración', 'Soporte prioritario'],
    color: '#00CFFF',
    highlight: false,
  },
  {
    id: 'elite',
    level: 'Nivel 1 Pro',
    name: 'Agencia Elite',
    price: 597,
    desc: 'Para agencias que quieren escalar rápido con más clientes',
    features: ['Hasta 50 clientes Nivel 2', 'JARVIS con 9 agentes activos', 'Todo lo del plan Agencia', 'Videos IA personalizados (HeyGen)', 'Control de escritorio con IA', 'API personalizada', 'White-label básico'],
    color: '#FFD700',
    highlight: true,
  },
  {
    id: 'enterprise',
    level: 'Nivel 1 Elite',
    name: 'Enterprise',
    price: 1497,
    desc: 'Para las agencias más ambiciosas de LATAM',
    features: ['Clientes ilimitados', 'Todos los agentes activos', 'White-label completo', 'Integración custom (CRM, ERP)', 'Account manager dedicado', 'SLA 99.9% garantizado', 'Onboarding personalizado'],
    color: '#00FF88',
    highlight: false,
  }
]

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  async function handleCheckout(planId: string) {
    setLoading(planId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, email: '', userId: 'guest' })
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        router.push(`/auth/register?plan=${planId}`)
      }
    } catch {
      router.push(`/auth/register?plan=${planId}`)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: DS.bg,
      backgroundImage: GRID_SVG,
      fontFamily: DS.font,
      color: DS.text,
      padding: '0 20px 80px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        @keyframes pulse-glow { 0%,100%{opacity:.5} 50%{opacity:1} }
      `}</style>

      {/* Background glow */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(0,80,255,0.1) 0%, transparent 60%)',
      }} />

      <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative' }}>
        {/* Nav */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '24px 0 64px',
        }}>
          <Link href="/" style={{
            fontSize: '24px', fontWeight: 900, letterSpacing: '-1px',
            background: DS.gradientText, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            textDecoration: 'none',
          }}>JARVIS</Link>
          <Link href="/auth/login" style={{
            color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '14px',
            padding: '8px 16px', borderRadius: '10px', border: `1px solid ${DS.border}`,
            transition: 'all 0.2s',
          }}>
            Ya tengo cuenta →
          </Link>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '72px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px', borderRadius: '100px', marginBottom: '24px',
            background: 'rgba(0,207,255,0.05)', border: `1px solid rgba(0,207,255,0.15)`,
            color: DS.primary, fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: DS.accent, display: 'inline-block', animation: 'pulse-glow 2s ease-in-out infinite' }} />
            Sin contratos · Cancela cuando quieras
          </div>
          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 60px)', fontWeight: 900,
            letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: '16px',
          }}>
            Precios para agencias<br />
            <span style={{ background: DS.gradientText, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              que quieren dominar LATAM
            </span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '18px' }}>
            ROI garantizado. Sin permanencia.
          </p>
        </div>

        {/* Plans */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', alignItems: 'start' }}>
          {PLANS.map(plan => (
            <div
              key={plan.id}
              onMouseEnter={() => setHovered(plan.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: DS.glass,
                backdropFilter: 'blur(20px)',
                border: `1px solid ${plan.highlight ? plan.color + '30' : hovered === plan.id ? 'rgba(0,207,255,0.2)' : DS.border}`,
                borderRadius: '20px', padding: '36px',
                position: 'relative', overflow: 'visible',
                transform: plan.highlight ? 'scale(1.04)' : hovered === plan.id ? 'translateY(-4px)' : 'none',
                transition: 'all 0.25s',
                boxShadow: plan.highlight
                  ? `0 0 60px ${plan.color}12, 0 0 0 1px ${plan.color}10`
                  : hovered === plan.id ? '0 0 40px rgba(0,207,255,0.08)' : 'none',
              }}
            >
              {plan.highlight && (
                <div style={{
                  position: 'absolute', top: '-14px', right: '20px',
                  background: `linear-gradient(135deg, ${plan.color}, #0050FF)`,
                  padding: '5px 14px', borderRadius: '100px',
                  fontSize: '11px', fontWeight: 700, color: DS.bg, letterSpacing: '0.5px', whiteSpace: 'nowrap',
                }}>MÁS POPULAR</div>
              )}

              <div style={{
                fontSize: '11px', color: plan.color, fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '10px',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <span style={{ width: '18px', height: '18px', borderRadius: '6px', background: plan.color + '15', border: `1px solid ${plan.color}25`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px' }}>✦</span>
                {plan.level}
              </div>

              <div style={{ fontSize: '24px', fontWeight: 800, color: DS.text, marginBottom: '8px' }}>{plan.name}</div>

              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '48px', fontWeight: 900, color: plan.highlight ? plan.color : DS.text, letterSpacing: '-2px' }}>
                  ${plan.price}
                </span>
                <span style={{ fontSize: '15px', fontWeight: 400, color: 'rgba(255,255,255,0.3)', marginLeft: '4px' }}>/mes</span>
              </div>

              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '28px', lineHeight: 1.6 }}>{plan.desc}</p>

              <div style={{
                width: '100%', height: '1px',
                background: `linear-gradient(90deg, transparent, ${plan.color}20, transparent)`,
                marginBottom: '24px',
              }} />

              <div style={{ marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '11px' }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ color: plan.color, fontSize: '13px', marginTop: '1px', flexShrink: 0, fontWeight: 700 }}>✓</span>
                    <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', lineHeight: 1.4 }}>{f}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleCheckout(plan.id)}
                disabled={loading === plan.id}
                style={{
                  width: '100%', padding: '14px',
                  background: plan.highlight
                    ? `linear-gradient(135deg, ${plan.color}, ${DS.secondary})`
                    : 'transparent',
                  border: `1px solid ${plan.color}40`,
                  borderRadius: '12px',
                  color: plan.highlight ? DS.bg : plan.color,
                  fontSize: '15px', fontWeight: 700, cursor: loading === plan.id ? 'not-allowed' : 'pointer',
                  fontFamily: DS.font, transition: 'all 0.2s',
                  opacity: loading === plan.id ? 0.5 : 1,
                  boxShadow: plan.highlight ? `0 0 30px ${plan.color}20` : 'none',
                }}
              >
                {loading === plan.id ? 'Redirigiendo...' : `Empezar con ${plan.name} →`}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ line */}
        <div style={{ textAlign: 'center', marginTop: '56px' }}>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>
            ¿Tienes preguntas? Escríbenos a{' '}
            <a href="mailto:hola@jarvis.ai" style={{ color: DS.primary, textDecoration: 'none', fontWeight: 600 }}>hola@jarvis.ai</a>
          </p>
          <div style={{
            display: 'flex', justifyContent: 'center', gap: '32px', marginTop: '24px', flexWrap: 'wrap',
          }}>
            {['Sin contrato', 'Cancela cuando quieras', 'Soporte 24/7', 'ROI garantizado'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
                <span style={{ color: DS.accent }}>✓</span> {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
