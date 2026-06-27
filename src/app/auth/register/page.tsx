'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp, signIn } from '@/lib/auth/auth-helpers'

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
      // Auto-login after register
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
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
    padding: '12px 16px', color: '#fff', fontSize: '15px',
    outline: 'none', boxSizing: 'border-box', fontFamily: "'Space Grotesk', sans-serif"
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0A0A0F',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Space Grotesk', sans-serif", padding: '20px'
    }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 70% 0%, rgba(155,89,182,0.08) 0%, transparent 60%)' }} />

      <div style={{ width: '100%', maxWidth: '500px', position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            fontSize: '42px', fontWeight: '800', letterSpacing: '-2px',
            background: 'linear-gradient(135deg, #00F5FF, #9B59B6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>JARVIS</div>
          <p style={{ color: '#666', marginTop: '8px', fontSize: '14px' }}>
            Crea tu agencia de IA en 2 minutos
          </p>
        </div>

        {/* Steps indicator */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', justifyContent: 'center' }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              width: s === step ? '40px' : '8px', height: '8px', borderRadius: '4px',
              background: s <= step ? '#00F5FF' : 'rgba(255,255,255,0.1)',
              transition: 'all 0.3s'
            }} />
          ))}
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(155,89,182,0.2)',
          borderRadius: '16px', padding: '40px', backdropFilter: 'blur(20px)'
        }}>
          {step === 1 && (
            <>
              <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: '700', marginBottom: '28px' }}>
                Elige tu plan
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                {PLANS.map(plan => (
                  <div
                    key={plan.id}
                    onClick={() => update('plan', plan.id)}
                    style={{
                      border: `1px solid ${form.plan === plan.id ? '#00F5FF' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '10px', padding: '16px 20px', cursor: 'pointer',
                      background: form.plan === plan.id ? 'rgba(0,245,255,0.05)' : 'transparent',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div>
                      <div style={{ color: '#fff', fontWeight: '600', fontSize: '15px' }}>{plan.label}</div>
                      <div style={{ color: '#666', fontSize: '13px', marginTop: '2px' }}>{plan.desc}</div>
                    </div>
                    <div style={{ color: form.plan === plan.id ? '#00F5FF' : '#888', fontWeight: '700', fontSize: '15px' }}>
                      {plan.price}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                style={{
                  width: '100%', padding: '14px',
                  background: 'linear-gradient(135deg, #00F5FF, #0080FF)',
                  border: 'none', borderRadius: '8px', color: '#000',
                  fontSize: '16px', fontWeight: '700', cursor: 'pointer',
                  fontFamily: "'Space Grotesk', sans-serif"
                }}
              >
                Continuar →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: '700', marginBottom: '28px' }}>
                Crear tu cuenta
              </h2>

              {error && (
                <div style={{
                  background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.3)',
                  borderRadius: '8px', padding: '12px 16px', color: '#ff6b6b',
                  fontSize: '14px', marginBottom: '20px'
                }}>{error}</div>
              )}

              <form onSubmit={handleRegister}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Tu nombre</label>
                    <input style={inputStyle} placeholder="Jose Luis" value={form.name}
                      onChange={e => update('name', e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Agencia</label>
                    <input style={inputStyle} placeholder="Mi Agencia IA" value={form.agencyName}
                      onChange={e => update('agencyName', e.target.value)} required />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Email</label>
                  <input style={inputStyle} type="email" placeholder="tu@agencia.com" value={form.email}
                    onChange={e => update('email', e.target.value)} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
                  <div>
                    <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Contraseña</label>
                    <input style={inputStyle} type="password" placeholder="Min. 8 caracteres" value={form.password}
                      onChange={e => update('password', e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Confirmar</label>
                    <input style={inputStyle} type="password" placeholder="Repetir contraseña" value={form.confirmPassword}
                      onChange={e => update('confirmPassword', e.target.value)} required />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={() => setStep(1)} style={{
                    padding: '14px 20px', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#aaa',
                    fontSize: '15px', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif"
                  }}>← Atrás</button>
                  <button type="submit" disabled={loading} style={{
                    flex: 1, padding: '14px',
                    background: loading ? 'rgba(0,245,255,0.3)' : 'linear-gradient(135deg, #00F5FF, #0080FF)',
                    border: 'none', borderRadius: '8px', color: '#000',
                    fontSize: '16px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: "'Space Grotesk', sans-serif"
                  }}>
                    {loading ? 'Creando cuenta...' : 'Crear agencia ✨'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        <p style={{ color: '#555', fontSize: '13px', textAlign: 'center', marginTop: '24px' }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/auth/login" style={{ color: '#00F5FF', textDecoration: 'none' }}>
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
