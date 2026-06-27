'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const PLANS = [
  {
    id: 'agency',
    level: 'Nivel 1',
    name: 'Agencia',
    price: 297,
    desc: 'Para agencias y emprendedores que venden IA a negocios',
    features: ['Hasta 10 clientes Nivel 2', 'JARVIS con 5 agentes activos', 'WhatsApp + llamadas IA', 'Marketing automático 6 redes', 'Dashboard de administración', 'Soporte prioritario'],
    color: '#00F5FF',
    highlight: false,
  },
  {
    id: 'elite',
    level: 'Nivel 1 Pro',
    name: 'Agencia Elite',
    price: 597,
    desc: 'Para agencias que quieren escalar rápido con más clientes',
    features: ['Hasta 50 clientes Nivel 2', 'JARVIS con 9 agentes activos', 'Todo lo del plan Agencia', 'Videos IA personalizados (HeyGen)', 'Control de escritorio con IA', 'API personalizada', 'White-label básico'],
    color: '#9B59B6',
    highlight: true,
  },
  {
    id: 'enterprise',
    level: 'Nivel 1 Elite',
    name: 'Enterprise',
    price: 1497,
    desc: 'Para las agencias más ambiciosas de LATAM',
    features: ['Clientes ilimitados', 'Todos los agentes activos', 'White-label completo', 'Integración custom (CRM, ERP)', 'Account manager dedicado', 'SLA 99.9% garantizado', 'Onboarding personalizado'],
    color: '#FFD700',
    highlight: false,
  }
]

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

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
        // No Stripe configured yet, send to register
        router.push(`/auth/register?plan=${planId}`)
      }
    } catch {
      router.push(`/auth/register?plan=${planId}`)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: "'Space Grotesk', sans-serif", color: '#fff', padding: '60px 20px' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(0,245,255,0.06) 0%, transparent 50%)' }} />

      <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative' }}>
        {/* Nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '80px' }}>
          <Link href="/" style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-1px', background: 'linear-gradient(135deg, #00F5FF, #9B59B6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' }}>
            JARVIS
          </Link>
          <Link href="/auth/login" style={{ color: '#888', textDecoration: 'none', fontSize: '14px' }}>
            Ya tengo cuenta →
          </Link>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{ fontSize: '48px', fontWeight: '900', letterSpacing: '-2px', lineHeight: 1.1, marginBottom: '16px' }}>
            Precios para agencias<br />
            <span style={{ background: 'linear-gradient(135deg, #00F5FF, #9B59B6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              que quieren dominar LATAM
            </span>
          </h1>
          <p style={{ color: '#888', fontSize: '18px' }}>
            Sin contratos. Cancela cuando quieras. ROI garantizado.
          </p>
        </div>

        {/* Plans */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {PLANS.map(plan => (
            <div key={plan.id} style={{
              background: plan.highlight ? `rgba(${plan.color === '#9B59B6' ? '155,89,182' : '0,245,255'},0.05)` : 'rgba(255,255,255,0.02)',
              border: `1px solid ${plan.highlight ? plan.color + '50' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '16px', padding: '32px',
              position: 'relative', overflow: 'hidden',
              transform: plan.highlight ? 'scale(1.02)' : 'none'
            }}>
              {plan.highlight && (
                <div style={{
                  position: 'absolute', top: '16px', right: '16px',
                  background: 'linear-gradient(135deg, #9B59B6, #00F5FF)',
                  padding: '4px 12px', borderRadius: '100px',
                  fontSize: '11px', fontWeight: '700', color: '#fff', letterSpacing: '0.5px'
                }}>MÁS POPULAR</div>
              )}

              <div style={{ fontSize: '12px', color: plan.color, fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
                {plan.level}
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>{plan.name}</div>
              <div style={{ fontSize: '42px', fontWeight: '900', color: plan.color, letterSpacing: '-2px', marginBottom: '4px' }}>
                ${plan.price}<span style={{ fontSize: '16px', fontWeight: '400', color: '#666' }}>/mes</span>
              </div>
              <p style={{ color: '#666', fontSize: '13px', marginBottom: '28px', lineHeight: '1.5' }}>{plan.desc}</p>

              <div style={{ marginBottom: '28px' }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                    <span style={{ color: plan.color, fontSize: '14px', marginTop: '1px', flexShrink: 0 }}>✓</span>
                    <span style={{ color: '#ccc', fontSize: '14px' }}>{f}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleCheckout(plan.id)}
                disabled={loading === plan.id}
                style={{
                  width: '100%', padding: '14px',
                  background: plan.highlight ? `linear-gradient(135deg, ${plan.color}, #0080FF)` : 'transparent',
                  border: `1px solid ${plan.color}50`,
                  borderRadius: '8px',
                  color: plan.highlight ? '#000' : plan.color,
                  fontSize: '15px', fontWeight: '700', cursor: 'pointer',
                  fontFamily: "'Space Grotesk', sans-serif", transition: 'all 0.2s'
                }}
              >
                {loading === plan.id ? 'Redirigiendo...' : `Empezar con ${plan.name} →`}
              </button>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', color: '#444', fontSize: '13px', marginTop: '40px' }}>
          ¿Tienes preguntas? Escríbenos a{' '}
          <a href="mailto:hola@jarvis.ai" style={{ color: '#00F5FF', textDecoration: 'none' }}>hola@jarvis.ai</a>
        </p>
      </div>
    </div>
  )
}
