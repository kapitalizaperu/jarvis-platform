'use client'

import { useState } from 'react'
import Link from 'next/link'
import { resetPassword } from '@/lib/auth/auth-helpers'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al enviar el correo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0A0A0F',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Space Grotesk', sans-serif", padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            fontSize: '42px', fontWeight: '800', letterSpacing: '-2px',
            background: 'linear-gradient(135deg, #00F5FF, #9B59B6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>JARVIS</div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,245,255,0.15)',
          borderRadius: '16px', padding: '40px', backdropFilter: 'blur(20px)'
        }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>
                Revisa tu email
              </h2>
              <p style={{ color: '#888', fontSize: '14px', lineHeight: '1.6' }}>
                Enviamos un link a <span style={{ color: '#00F5FF' }}>{email}</span> para resetear tu contraseña.
              </p>
              <Link href="/auth/login" style={{
                display: 'inline-block', marginTop: '24px',
                color: '#00F5FF', textDecoration: 'none', fontSize: '14px'
              }}>← Volver al login</Link>
            </div>
          ) : (
            <>
              <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>
                Resetear contraseña
              </h2>
              <p style={{ color: '#888', fontSize: '14px', marginBottom: '28px' }}>
                Te enviamos un link para crear una nueva contraseña.
              </p>

              {error && (
                <div style={{
                  background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.3)',
                  borderRadius: '8px', padding: '12px 16px', color: '#ff6b6b', fontSize: '14px', marginBottom: '20px'
                }}>{error}</div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Email</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="tu@agencia.com"
                    style={{
                      width: '100%', background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                      padding: '12px 16px', color: '#fff', fontSize: '15px',
                      outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>
                <button type="submit" disabled={loading} style={{
                  width: '100%', padding: '14px',
                  background: loading ? 'rgba(0,245,255,0.3)' : 'linear-gradient(135deg, #00F5FF, #0080FF)',
                  border: 'none', borderRadius: '8px', color: '#000',
                  fontSize: '16px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: "'Space Grotesk', sans-serif"
                }}>
                  {loading ? 'Enviando...' : 'Enviar link de reseteo'}
                </button>
              </form>

              <p style={{ color: '#555', fontSize: '14px', textAlign: 'center', marginTop: '20px' }}>
                <Link href="/auth/login" style={{ color: '#00F5FF', textDecoration: 'none' }}>
                  ← Volver al login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
