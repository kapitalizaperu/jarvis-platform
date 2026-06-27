'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function SettingsPage() {
  const [tab, setTab] = useState<'integrations' | 'agents' | 'account'>('integrations')
  const [saved, setSaved] = useState(false)

  const [keys, setKeys] = useState({
    elevenLabsKey: '',
    vapiKey: '',
    heyGenKey: '',
    twilioSid: '',
    twilioToken: '',
    twilioPhone: '',
    stripeKey: '',
  })

  function save() {
    // In production, save to encrypted storage via API
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
    padding: '10px 14px', color: '#fff', fontSize: '14px',
    outline: 'none', boxSizing: 'border-box', fontFamily: "'Space Grotesk', sans-serif"
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: "'Space Grotesk', sans-serif", color: '#fff' }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 24px',
        display: 'flex', alignItems: 'center', gap: '16px',
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 50
      }}>
        <Link href="/dashboard" style={{ color: '#555', textDecoration: 'none', fontSize: '14px' }}>← Dashboard</Link>
        <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
        <span style={{ fontWeight: '700', fontSize: '16px' }}>Configuración</span>
      </div>

      <div style={{ padding: '32px 24px', maxWidth: '900px', margin: '0 auto' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '32px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '4px' }}>
          {(['integrations', 'agents', 'account'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '10px', borderRadius: '8px',
              background: tab === t ? 'rgba(0,245,255,0.1)' : 'transparent',
              border: 'none', color: tab === t ? '#00F5FF' : '#666',
              cursor: 'pointer', fontSize: '14px', fontWeight: '600',
              fontFamily: "'Space Grotesk', sans-serif"
            }}>{{ integrations: 'Integraciones', agents: 'Agentes', account: 'Mi cuenta' }[t]}</button>
          ))}
        </div>

        {tab === 'integrations' && (
          <div>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '32px' }}>
              Conecta las herramientas de IA para activar todos los agentes de JARVIS.
            </p>

            {/* WhatsApp */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <span style={{ fontSize: '28px' }}>📱</span>
                <div>
                  <div style={{ fontWeight: '700' }}>WhatsApp (Twilio)</div>
                  <div style={{ color: '#666', fontSize: '13px' }}>Para el agente de Ventas</div>
                </div>
                <div style={{ marginLeft: 'auto', color: '#FFD700', fontSize: '12px', background: 'rgba(255,215,0,0.1)', padding: '4px 10px', borderRadius: '100px' }}>Por configurar</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ color: '#aaa', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Account SID</label>
                  <input style={inputStyle} type="password" placeholder="ACxxxxxxxx" value={keys.twilioSid} onChange={e => setKeys(k => ({ ...k, twilioSid: e.target.value }))} />
                </div>
                <div>
                  <label style={{ color: '#aaa', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Auth Token</label>
                  <input style={inputStyle} type="password" placeholder="••••••••" value={keys.twilioToken} onChange={e => setKeys(k => ({ ...k, twilioToken: e.target.value }))} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ color: '#aaa', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Número de WhatsApp</label>
                  <input style={inputStyle} placeholder="+1 415 523 8886" value={keys.twilioPhone} onChange={e => setKeys(k => ({ ...k, twilioPhone: e.target.value }))} />
                </div>
              </div>
              <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(0,245,255,0.04)', borderRadius: '6px', fontSize: '12px', color: '#666' }}>
                Webhook URL: <span style={{ color: '#00F5FF' }}>https://[tu-dominio]/api/webhooks/whatsapp</span>
              </div>
            </div>

            {/* ElevenLabs */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <span style={{ fontSize: '28px' }}>🎙️</span>
                <div>
                  <div style={{ fontWeight: '700' }}>ElevenLabs</div>
                  <div style={{ color: '#666', fontSize: '13px' }}>Voz ultra-real para JARVIS</div>
                </div>
              </div>
              <div>
                <label style={{ color: '#aaa', fontSize: '12px', display: 'block', marginBottom: '6px' }}>API Key</label>
                <input style={inputStyle} type="password" placeholder="xi_••••••••" value={keys.elevenLabsKey} onChange={e => setKeys(k => ({ ...k, elevenLabsKey: e.target.value }))} />
              </div>
            </div>

            {/* Vapi */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <span style={{ fontSize: '28px' }}>📞</span>
                <div>
                  <div style={{ fontWeight: '700' }}>Vapi.ai</div>
                  <div style={{ color: '#666', fontSize: '13px' }}>Llamadas con IA</div>
                </div>
              </div>
              <div>
                <label style={{ color: '#aaa', fontSize: '12px', display: 'block', marginBottom: '6px' }}>API Key</label>
                <input style={inputStyle} type="password" placeholder="vapi_••••••••" value={keys.vapiKey} onChange={e => setKeys(k => ({ ...k, vapiKey: e.target.value }))} />
              </div>
            </div>

            {/* HeyGen */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <span style={{ fontSize: '28px' }}>🎬</span>
                <div>
                  <div style={{ fontWeight: '700' }}>HeyGen</div>
                  <div style={{ color: '#666', fontSize: '13px' }}>Videos con avatar IA</div>
                </div>
              </div>
              <div>
                <label style={{ color: '#aaa', fontSize: '12px', display: 'block', marginBottom: '6px' }}>API Key</label>
                <input style={inputStyle} type="password" placeholder="hg_••••••••" value={keys.heyGenKey} onChange={e => setKeys(k => ({ ...k, heyGenKey: e.target.value }))} />
              </div>
            </div>

            <button onClick={save} style={{
              padding: '14px 40px', background: saved ? 'rgba(46,204,113,0.3)' : 'linear-gradient(135deg, #00F5FF, #0080FF)',
              border: 'none', borderRadius: '8px', color: saved ? '#2ecc71' : '#000',
              fontSize: '15px', fontWeight: '700', cursor: 'pointer',
              fontFamily: "'Space Grotesk', sans-serif", transition: 'all 0.2s'
            }}>
              {saved ? '✓ Guardado' : 'Guardar configuración'}
            </button>
          </div>
        )}

        {tab === 'agents' && (
          <div>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
              Activa o pausa agentes. Los agentes activos consumen créditos de API.
            </p>
            {[
              { id: 'orchestrator', icon: '🧠', name: 'Orquestador', desc: 'Cerebro central — siempre activo', required: true, active: true },
              { id: 'marketing', icon: '📱', name: 'Marketing', desc: 'Redes sociales y contenido', required: false, active: true },
              { id: 'sales', icon: '🎯', name: 'Ventas', desc: 'WhatsApp, llamadas, cierre de deals', required: false, active: true },
              { id: 'financial', icon: '💰', name: 'Financiero', desc: 'Facturas, análisis, reportes', required: false, active: true },
              { id: 'dev', icon: '💻', name: 'Desarrollo', desc: 'Código y automatizaciones', required: false, active: false },
              { id: 'video', icon: '🎬', name: 'Video', desc: 'Videos IA con HeyGen', required: false, active: true },
              { id: 'hr', icon: '👥', name: 'RRHH', desc: 'Reclutamiento y nómina', required: false, active: false },
              { id: 'personal', icon: '📅', name: 'Personal', desc: 'Agenda y recordatorios', required: false, active: true },
              { id: 'computer', icon: '🖥️', name: 'Control PC', desc: 'Automatización de escritorio', required: false, active: true },
            ].map(agent => (
              <div key={agent.id} style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.04)'
              }}>
                <span style={{ fontSize: '24px' }}>{agent.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '15px' }}>{agent.name}</div>
                  <div style={{ color: '#666', fontSize: '13px' }}>{agent.desc}</div>
                </div>
                <div style={{
                  width: '44px', height: '24px', borderRadius: '12px',
                  background: agent.active ? '#00F5FF' : 'rgba(255,255,255,0.1)',
                  cursor: agent.required ? 'not-allowed' : 'pointer',
                  position: 'relative', transition: 'background 0.2s'
                }}>
                  <div style={{
                    position: 'absolute', top: '3px', width: '18px', height: '18px', borderRadius: '50%',
                    background: '#fff', transition: 'left 0.2s',
                    left: agent.active ? '23px' : '3px'
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'account' && (
          <div>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>Información de la agencia</h3>
              {[
                { label: 'Nombre', placeholder: 'Mi Agencia IA' },
                { label: 'Email', placeholder: 'hola@miagencia.com' },
                { label: 'WhatsApp de soporte', placeholder: '+51 987 654 321' },
              ].map(field => (
                <div key={field.label} style={{ marginBottom: '16px' }}>
                  <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '6px' }}>{field.label}</label>
                  <input style={inputStyle} placeholder={field.placeholder} />
                </div>
              ))}
              <button onClick={save} style={{
                padding: '12px 24px', background: 'linear-gradient(135deg, #00F5FF, #0080FF)',
                border: 'none', borderRadius: '8px', color: '#000',
                fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                fontFamily: "'Space Grotesk', sans-serif", marginTop: '8px'
              }}>Guardar cambios</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
