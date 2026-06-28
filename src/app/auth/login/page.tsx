'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/lib/auth/auth-helpers'
import { supabase } from '@/lib/auth/supabase-client'

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

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push(redirect)
    })
  }, [redirect, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { session } = await signIn(email, password)
      if (session) {
        document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=3600; SameSite=Lax`
        router.push(redirect)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión'
      setError(msg === 'Invalid login credentials' ? 'Email o contraseña incorrectos' : msg)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(0,207,255,0.03)',
    border: `1px solid ${DS.border}`,
    borderRadius: '12px',
    padding: '14px 18px',
    color: DS.text,
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: DS.font,
    transition: 'border-color 0.2s, box-shadow 0.2s',
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
        @keyframes pulse-glow { 0%,100%{opacity:.5} 50%{opacity:1} }
      `}</style>

      {/* Background radial glow */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(0,80,255,0.12) 0%, transparent 60%)',
      }} />

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
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
            Plataforma de IA para Agencias
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: DS.glass, backdropFilter: 'blur(20px)',
          border: `1px solid ${DS.border}`,
          borderRadius: '20px', padding: '44px',
          boxShadow: '0 0 60px rgba(0,80,255,0.08), 0 0 0 1px rgba(0,207,255,0.04)',
        }}>
          <h2 style={{ color: DS.text, fontSize: '22px', fontWeight: 700, marginBottom: '32px' }}>
            Iniciar sesión
          </h2>

          {error && (
            <div style={{
              background: 'rgba(255,50,50,0.08)', border: '1px solid rgba(255,50,50,0.25)',
              borderRadius: '10px', padding: '12px 16px', color: '#ff6b6b',
              fontSize: '14px', marginBottom: '24px',
            }}>{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="tu@agencia.com"
                style={inputStyle}
                onFocus={e => {
                  e.target.style.borderColor = 'rgba(0,207,255,0.4)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(0,207,255,0.06)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = DS.border
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={inputStyle}
                onFocus={e => {
                  e.target.style.borderColor = 'rgba(0,207,255,0.4)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(0,207,255,0.06)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = DS.border
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            <div style={{ textAlign: 'right', marginBottom: '32px' }}>
              <Link href="/auth/forgot-password" style={{ color: DS.primary, fontSize: '13px', textDecoration: 'none' }}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '15px',
                background: loading ? 'rgba(0,207,255,0.25)' : DS.gradientText,
                border: 'none', borderRadius: '12px', color: loading ? 'rgba(255,255,255,0.5)' : DS.bg,
                fontSize: '16px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: DS.font, transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 0 30px rgba(0,207,255,0.2)',
              }}
            >
              {loading ? 'Entrando...' : 'Entrar a JARVIS →'}
            </button>
          </form>

          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', textAlign: 'center', marginTop: '28px' }}>
            ¿No tienes cuenta?{' '}
            <Link href="/auth/register" style={{ color: DS.primary, textDecoration: 'none', fontWeight: 600 }}>
              Registrarte como agencia
            </Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.2)', fontSize: '13px', textDecoration: 'none' }}>
            ← Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
