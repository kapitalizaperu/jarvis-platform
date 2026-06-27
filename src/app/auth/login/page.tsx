'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/lib/auth/auth-helpers'
import { supabase } from '@/lib/auth/supabase-client'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // If already logged in, redirect
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
        // Store token in cookie for middleware
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

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0A0F',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Space Grotesk', sans-serif",
      padding: '20px'
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(0,245,255,0.08) 0%, transparent 60%)'
      }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            fontSize: '42px', fontWeight: '800', letterSpacing: '-2px',
            background: 'linear-gradient(135deg, #00F5FF, #9B59B6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>JARVIS</div>
          <p style={{ color: '#666', marginTop: '8px', fontSize: '14px' }}>
            Plataforma de IA para Agencias
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(0,245,255,0.15)',
          borderRadius: '16px',
          padding: '40px',
          backdropFilter: 'blur(20px)'
        }}>
          <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: '700', marginBottom: '28px' }}>
            Iniciar sesión
          </h2>

          {error && (
            <div style={{
              background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.3)',
              borderRadius: '8px', padding: '12px 16px', color: '#ff6b6b',
              fontSize: '14px', marginBottom: '20px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="tu@agencia.com"
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                  padding: '12px 16px', color: '#fff', fontSize: '15px',
                  outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(0,245,255,0.4)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                  padding: '12px 16px', color: '#fff', fontSize: '15px',
                  outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(0,245,255,0.4)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div style={{ textAlign: 'right', marginBottom: '28px' }}>
              <Link href="/auth/forgot-password" style={{ color: '#00F5FF', fontSize: '13px', textDecoration: 'none' }}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: loading ? 'rgba(0,245,255,0.3)' : 'linear-gradient(135deg, #00F5FF, #0080FF)',
                border: 'none', borderRadius: '8px', color: '#000',
                fontSize: '16px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', fontFamily: "'Space Grotesk', sans-serif"
              }}
            >
              {loading ? 'Entrando...' : 'Entrar a JARVIS'}
            </button>
          </form>

          <p style={{ color: '#666', fontSize: '14px', textAlign: 'center', marginTop: '24px' }}>
            ¿No tienes cuenta?{' '}
            <Link href="/auth/register" style={{ color: '#00F5FF', textDecoration: 'none' }}>
              Registrarte como agencia
            </Link>
          </p>
        </div>
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
