'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  agentType?: string
}

const AGENT_OPTIONS = [
  { value: 'general', label: 'JARVIS General', color: '#00F5FF', icon: '🤖' },
  { value: 'sales', label: 'Agente de Ventas', color: '#9B59B6', icon: '💼' },
  { value: 'support', label: 'Soporte al Cliente', color: '#00FF88', icon: '🎯' },
  { value: 'social', label: 'Redes Sociales', color: '#FF6B35', icon: '📱' },
  { value: 'analytics', label: 'Analytics', color: '#FFD700', icon: '📊' },
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '¡Hola! Soy JARVIS, tu agente de IA. ¿En qué puedo ayudarte hoy? Puedo ayudarte con ventas, soporte, análisis de negocio y más.',
      timestamp: new Date(),
      agentType: 'general'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState('general')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const currentAgent = AGENT_OPTIONS.find(a => a.value === selectedAgent)!

  async function sendMessage() {
    if (!input.trim() || loading) return

    const userMsg: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const apiMessages = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content
      }))

      const res = await fetch('/api/jarvis/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          tenantId: 'demo-tenant',
          channel: 'web',
          agentType: selectedAgent,
          businessContext: {
            businessName: 'Mi Agencia',
            industry: 'marketing',
            language: 'es'
          }
        })
      })

      const data = await res.json()
      const responseText = data.response || data.message || data.content || 'JARVIS no pudo responder. Verifica la conexión.'

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
        agentType: selectedAgent
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error de conexión con JARVIS. Verifica que el servidor esté corriendo.',
        timestamp: new Date(),
        agentType: selectedAgent
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function formatTime(d: Date) {
    return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0A0F',
      fontFamily: "'Space Grotesk', sans-serif",
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(0,0,0,0.8)',
        borderBottom: '1px solid rgba(0,245,255,0.15)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <Link href="/dashboard" style={{ color: '#666', textDecoration: 'none', fontSize: '20px' }}>←</Link>

        {/* JARVIS avatar */}
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          background: `linear-gradient(135deg, ${currentAgent.color}, #0080FF)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', boxShadow: `0 0 20px ${currentAgent.color}40`
        }}>
          {currentAgent.icon}
        </div>

        <div>
          <div style={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>{currentAgent.label}</div>
          <div style={{ color: '#00F5FF', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#00FF88',
              display: 'inline-block',
              boxShadow: '0 0 6px #00FF88'
            }} />
            En línea · JARVIS Platform
          </div>
        </div>

        {/* Agent selector */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          {AGENT_OPTIONS.map(agent => (
            <button
              key={agent.value}
              onClick={() => setSelectedAgent(agent.value)}
              title={agent.label}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: `1px solid ${selectedAgent === agent.value ? agent.color : 'rgba(255,255,255,0.1)'}`,
                background: selectedAgent === agent.value ? `${agent.color}20` : 'transparent',
                color: selectedAgent === agent.value ? agent.color : '#666',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: "'Space Grotesk', sans-serif"
              }}
            >
              {agent.icon} {agent.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxWidth: '860px',
        width: '100%',
        margin: '0 auto'
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            alignItems: 'flex-end',
            gap: '10px'
          }}>
            {msg.role === 'assistant' && (
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${currentAgent.color}, #0080FF)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px'
              }}>
                {currentAgent.icon}
              </div>
            )}

            <div style={{
              maxWidth: '72%',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, #00F5FF20, #0080FF20)'
                : 'rgba(255,255,255,0.04)',
              border: `1px solid ${msg.role === 'user' ? 'rgba(0,245,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              padding: '12px 16px'
            }}>
              <p style={{
                color: '#e8e8e8',
                fontSize: '15px',
                lineHeight: '1.6',
                margin: 0,
                whiteSpace: 'pre-wrap'
              }}>
                {msg.content}
              </p>
              <div style={{ color: '#444', fontSize: '11px', marginTop: '6px', textAlign: 'right' }}>
                {formatTime(msg.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: `linear-gradient(135deg, ${currentAgent.color}, #0080FF)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px'
            }}>
              {currentAgent.icon}
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px 16px 16px 4px',
              padding: '16px 20px',
              display: 'flex',
              gap: '6px',
              alignItems: 'center'
            }}>
              {[0, 1, 2].map(j => (
                <div key={j} style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: currentAgent.color,
                  animation: `pulse 1.2s ease-in-out ${j * 0.2}s infinite`
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{
        borderTop: '1px solid rgba(0,245,255,0.1)',
        padding: '16px 24px',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(20px)'
      }}>
        <div style={{
          maxWidth: '860px',
          margin: '0 auto',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end'
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Escribe un mensaje a ${currentAgent.label}... (Enter para enviar)`}
            rows={1}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(0,245,255,0.2)',
              borderRadius: '12px',
              padding: '14px 18px',
              color: '#fff',
              fontSize: '15px',
              outline: 'none',
              resize: 'none',
              fontFamily: "'Space Grotesk', sans-serif",
              lineHeight: '1.5',
              maxHeight: '120px',
              overflowY: 'auto'
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(0,245,255,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(0,245,255,0.2)'}
            onInput={e => {
              const t = e.target as HTMLTextAreaElement
              t.style.height = 'auto'
              t.style.height = Math.min(t.scrollHeight, 120) + 'px'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
              background: loading || !input.trim()
                ? 'rgba(0,245,255,0.1)'
                : 'linear-gradient(135deg, #00F5FF, #0080FF)',
              border: 'none',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              fontSize: '20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
              boxShadow: loading || !input.trim() ? 'none' : '0 0 20px rgba(0,245,255,0.3)'
            }}
          >
            ➤
          </button>
        </div>
        <p style={{ color: '#333', fontSize: '12px', textAlign: 'center', marginTop: '8px' }}>
          JARVIS · Claude claude-sonnet-4-6 · Presiona Shift+Enter para nueva línea
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,245,255,0.2); border-radius: 2px; }
      `}</style>
    </div>
  )
}
