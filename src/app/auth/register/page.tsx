'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp, signIn } from '@/lib/auth/auth-helpers'

const DS = {
  bg: '#020B18',
  surface: '#030D1E',
  primary: '#00CFFF',
  secondary: '#0050FF',
  accent: '#00FF88',
  text: '#ffffff',
  border: 'rgba(0,200,255,0.12)',
  glass: 'rgba(3,13,30,0.85)',
  gradientText: 'linear-gradient(135deg, #00CFFF, #0050FF)',
  font: "'Space Grotesk', sans-serif",
}

const GRID_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(0,200,255,0.04)' stroke-width='1'/%3E%3C/svg%3E")`

const PLANS = [
  { id: 'agency', label: 'Agencia', price: '$297/mes', desc: 'Hasta 10 clientes' },
  { id: 'elite', label: 'Agencia Elite', price: '$597/mes', desc: 'Hasta 50 clientes' },
  { id: 'enterprise', label: 'Enterprise', price: '$1,497/mes', desc: 'Ilimitado' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '', agencyName: '', email: '', password: '', confirmPassword: '', plan: 'agency'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    setLoading(true)
    setError('')
    try {
      await signUp(form.email, form.password, form.name, 'agency')
      const { session } = await signIn(form.email, form.password)
      if (session) {
        document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=3600; SameSite=Lax`
        router.push('/onboarding')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrarse'
      if (msg.includes('already registered')) {
        setError('Este email ya está registrado. Inicia sesión.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(0,207,255,0.03)',
    border: `1px solid ${DS.border}`,
    borderRadius: '12px',
    padding: '13px 16px',
    color: DS.text,
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: DS.font,
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  function focusInput(e: React.FocusEvent<HTMLInputElement>) {
    e.target.style.borderColor = 'rgba(0,207,255,0.4)'
    e.target.style.boxShadow = '0 0 0 3px rgba(0,207,255,0.06)'
  }
  function blurInput(e: React.FocusEvent<HTMLInputElement>) {
    e.target.style.borderColor = DS.border
    e.target.style.boxShadow = 'none'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: DS.bg,
      backgroundImage: GRID_SVG,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: DS.font,
      padding: '24px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>

      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 70% 0%, rgba(0,80,255,0.12) 0%, transparent 60%)',
      }} />

      <div style={{ width: '100%', maxWidth: '520px', position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px', margin: '0 auto 16px',
            background: 'rgba(0,207,255,0.08)', border: `1px solid rgba(0,207,255,0.2)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', fontWeight: 900, color: DS.primary,
            boxShadow: '0 0 30px rgba(0,207,255,0.12)',
          }}>J</div>
          <div style={{
            fontSize: '36px', fontWeight: 900, letterSpacing: '-2px',
            background: DS.gradientText, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>JARVIS</div>
          <p style={{ color: 'rgba(255,255,255,0.35)', marginTop: '8px', fontSize: '14px' }}>
            Crea tu agencia de IA en 2 minutos
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', justifyContent: 'center', alignItems: 'center' }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              height: '6px', borderRadius: '3px',
              width: s === step ? '36px' : '16px',
              background: s <= step ? DS.primary : 'rgba(255,255,255,0.08)',
              transition: 'all 0.3s',
            }} />
          ))}
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginLeft: '8px' }}>Paso {step} de 2</span>
        </div>

        {/* Card */}
        <div style={{
          background: DS.glass, backdropFilter: 'blur(20px)',
          border: `1px solid ${DS.border}`,
          borderRadius: '20px', padding: '40px',
          boxShadow: '0 0 60px rgba(0,80,255,0.08)',
        }}>
          {step === 1 && (
            <>
              <h2 style={{ color: DS.text, fontSize: '22px', fontWeight: 700, marginBottom: '28px' }}>
                Elige tu plan
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                {PLANS.map(plan => (
                  <div
                    key={plan.id}
                    onClick={() => update('plan', plan.id)}
                    style={{
                      border: `1px solid ${form.plan === plan.id ? DS.primary : DS.border}`,
                      borderRadius: '14px', padding: '18px 20px', cursor: 'pointer',
                      background: form.plan === plan.id ? 'rgba(0,207,255,0.06)' : 'rgba(0,207,255,0.02)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      transition: 'all 0.2s',
                      boxShadow: form.plan === plan.id ? '0 0 20px rgba(0,207,255,0.08)' : 'none',
                    }}
                  >
                    <div>
                      <div style={{ color: DS.text, fontWeight: 600, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {form.plan === plan.id && <span style={{ color: DS.accent, fontSize: '12px' }}>✓</span>}
                        {plan.label}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', marginTop: '2px' }}>{plan.desc}</div>
                    </div>
                    <div style={{ color: form.plan === plan.id ? DS.primary : 'rgba(255,255,255,0.3)', fontWeight: 700, fontSize: '14px' }}>
                      {plan.price}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                style={{
                  width: '100%', padding: '15px',
                  background: DS.gradientText,
                  border: 'none', borderRadius: '12px', color: DS.bg,
                  fontSize: '16px', fontWeight: 700, cursor: 'pointer',
                  fontFamily: DS.font, boxShadow: '0 0 30px rgba(0,207,255,0.2)',
                }}
              >
                Continuar →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 style={{ color: DS.text, fontSize: '22px', fontWeight: 700, marginBottom: '28px' }}>
                Crear tu cuenta
              </h2>

              {error && (
                <div style={{
                  background: 'rgba(255,50,50,0.08)', border: '1px solid rgba(255,50,50,0.25)',
                  borderRadius: '10px', padding: '12px 16px', color: '#ff6b6b',
                  fontSize: '14px', marginBottom: '20px',
                }}>{error}</div>
              )}

              <form onSubmit={handleRegister}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '7px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Tu nombre</label>
                    <input style={inputStyle} placeholder="Jose Luis" value={form.name}
                      onChange={e => update('name', e.target.value)} onFocus={focusInput} onBlur={blurInput} required />
                  </div>
                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '7px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Agencia</label>
                    <input style={inputStyle} placeholder="Mi Agencia IA" value={form.agencyName}
                      onChange={e => update('agencyName', e.target.value)} onFocus={focusInput} onBlur={blurInput} required />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '7px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Email</label>
                  <input style={inputStyle} type="email" placeholder="tu@agencia.com" value={form.email}
                    onChange={e => update('email', e.target.value)} onFocus={focusInput} onBlur={blurInput} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '7px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Contraseña</label>
                    <input style={inputStyle} type="password" placeholder="Min. 8 caracteres" value={form.password}
                      onChange={e => update('password', e.target.value)} onFocus={focusInput} onBlur={blurInput} required />
                  </div>
                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '7px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Confirmar</label>
                    <input style={inputStyle} type="password" placeholder="Repetir contraseña" value={form.confirmPassword}
                      onChange={e => update('confirmPassword', e.target.value)} onFocus={focusInput} onBlur={blurInput} required />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={() => setStep(1)} style={{
                    padding: '15px 20px',
                    background: 'rgba(0,207,255,0.04)', border: `1px solid ${DS.border}`,
                    borderRadius: '12px', color: 'rgba(255,255,255,0.5)',
                    fontSize: '14px', cursor: 'pointer', fontFamily: DS.font,
                  }}>← Atrás</button>
                  <button type="submit" disabled={loading} style={{
                    flex: 1, padding: '15px',
                    background: loading ? 'rgba(0,207,255,0.2)' : DS.gradientText,
                    border: 'none', borderRadius: '12px',
                    color: loading ? 'rgba(255,255,255,0.4)' : DS.bg,
                    fontSize: '16px', fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: DS.font, boxShadow: loading ? 'none' : '0 0 30px rgba(0,207,255,0.2)',
                  }}>
                    {loading ? 'Creando cuenta...' : 'Crear agencia ✨'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px', textAlign: 'center', marginTop: '24px' }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/auth/login" style={{ color: DS.primary, textDecoration: 'none', fontWeight: 600 }}>
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
