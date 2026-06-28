'use client'

import { useState } from 'react'
import Link from 'next/link'
import { resetPassword } from '@/lib/auth/auth-helpers'

const DS = {
  bg: '#020B18',
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
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
      `}</style>

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
        </div>

        {/* Card */}
        <div style={{
          background: DS.glass, backdropFilter: 'blur(20px)',
          border: `1px solid ${DS.border}`,
          borderRadius: '20px', padding: '44px',
          boxShadow: '0 0 60px rgba(0,80,255,0.08)',
        }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '56px', marginBottom: '20px', display: 'inline-block', animation: 'float 4s ease-in-out infinite' }}>📧</div>
              <h2 style={{ color: DS.text, fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>
                Revisa tu email
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', lineHeight: 1.7, marginBottom: '8px' }}>
                Enviamos un link a{' '}
                <span style={{ color: DS.primary, fontWeight: 600 }}>{email}</span>
                {' '}para resetear tu contraseña.
              </p>
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px', marginBottom: '28px' }}>
                Si no lo ves, revisa tu carpeta de spam.
              </p>
              <div style={{
                width: '100%', height: '1px',
                background: `linear-gradient(90deg, transparent, ${DS.border}, transparent)`,
                marginBottom: '28px',
              }} />
              <Link href="/auth/login" style={{
                display: 'inline-block', padding: '12px 28px', borderRadius: '12px',
                background: DS.gradientText, color: DS.bg, textDecoration: 'none',
                fontWeight: 700, fontSize: '14px',
              }}>← Volver al login</Link>
            </div>
          ) : (
            <>
              <h2 style={{ color: DS.text, fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
                Resetear contraseña
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '32px', lineHeight: 1.6 }}>
                Te enviamos un link para crear una nueva contraseña.
              </p>

              {error && (
                <div style={{
                  background: 'rgba(255,50,50,0.08)', border: '1px solid rgba(255,50,50,0.25)',
                  borderRadius: '10px', padding: '12px 16px', color: '#ff6b6b',
                  fontSize: '14px', marginBottom: '24px',
                }}>{error}</div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '28px' }}>
                  <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="tu@agencia.com"
                    style={{
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
                    }}
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

                <button type="submit" disabled={loading} style={{
                  width: '100%', padding: '15px',
                  background: loading ? 'rgba(0,207,255,0.2)' : DS.gradientText,
                  border: 'none', borderRadius: '12px',
                  color: loading ? 'rgba(255,255,255,0.4)' : DS.bg,
                  fontSize: '16px', fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: DS.font,
                  boxShadow: loading ? 'none' : '0 0 30px rgba(0,207,255,0.2)',
                  transition: 'all 0.2s',
                }}>
                  {loading ? 'Enviando...' : 'Enviar link de reseteo →'}
                </button>
              </form>

              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '14px', textAlign: 'center', marginTop: '24px' }}>
                <Link href="/auth/login" style={{ color: DS.primary, textDecoration: 'none' }}>
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
