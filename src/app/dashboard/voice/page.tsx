'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'

const AGENT_ID = 'agent_1901kw5xzvhae04tzbm13n8s376j'

type Status = 'idle' | 'connecting' | 'connected' | 'speaking' | 'listening' | 'error'
type Message = { role: 'user' | 'jarvis'; text: string }

export default function VoicePage() {
  const [status, setStatus] = useState<Status>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [error, setError] = useState('')
  const [pulseSize, setPulseSize] = useState(1)
  const [cameraOn, setCameraOn] = useState(false)
  const [lastSeen, setLastSeen] = useState<string>('')
  const [analyzing, setAnalyzing] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conversationRef = useRef<any>(null)
  const pulseRef = useRef<number>(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const visionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const active = status === 'speaking' || status === 'listening' || status === 'connected'
    if (active) {
      const animate = () => {
        setPulseSize(1 + Math.sin(Date.now() / 400) * 0.12)
        pulseRef.current = requestAnimationFrame(animate)
      }
      pulseRef.current = requestAnimationFrame(animate)
    } else {
      cancelAnimationFrame(pulseRef.current)
      setPulseSize(1)
    }
    return () => cancelAnimationFrame(pulseRef.current)
  }, [status])

  // Encender cámara
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setCameraOn(true)
      // Analiza cada 20 segundos mientras habla
      visionIntervalRef.current = setInterval(() => analyzeCamera(), 20000)
      // Primera análisis inmediata
      setTimeout(() => analyzeCamera(), 1500)
    } catch {
      setError('No se pudo acceder a la cámara')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraOn(false)
    if (visionIntervalRef.current) clearInterval(visionIntervalRef.current)
  }, [])

  // Captura frame y lo analiza con Claude Vision
  const analyzeCamera = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || analyzing) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = 640
    canvas.height = 480
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, 640, 480)
    const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1]
    setAnalyzing(true)
    try {
      const res = await fetch('/api/jarvis/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frames: [{ type: 'camera', base64 }],
          question: 'Describe brevemente qué ves: quién es, qué hace, cómo está.',
          tenantId: 'demo-tenant',
          mode: 'camera',
        }),
      })
      const data = await res.json()
      if (data.whatISee) setLastSeen(data.whatISee)
    } catch { /* no critical */ }
    setAnalyzing(false)
  }, [analyzing])

  const startConversation = useCallback(async () => {
    setError('')
    setStatus('connecting')
    // Enciende cámara automáticamente al iniciar conversación
    if (!cameraOn) await startCamera()
    try {
      const { Conversation } = await import('@11labs/client')
      const conversation = await Conversation.startSession({
        agentId: AGENT_ID,
        clientTools: {
          // JARVIS puede pedir ver la cámara en medio de la conversación
          ver_camara: async () => {
            await analyzeCamera()
            return lastSeen || 'No puedo ver nada en este momento'
          },
        },
        onConnect: () => setStatus('connected'),
        onDisconnect: () => { setStatus('idle'); conversationRef.current = null },
        onError: (err: unknown) => {
          console.error('ElevenLabs error:', err)
          setError('Error de conexión con JARVIS')
          setStatus('error')
        },
        onModeChange: ({ mode }: { mode: string }) => {
          if (mode === 'speaking') setStatus('speaking')
          else if (mode === 'listening') setStatus('listening')
        },
        onMessage: ({ message, source }: { message: string; source: string }) => {
          setMessages(prev => [...prev, {
            role: source === 'user' ? 'user' : 'jarvis',
            text: message,
          }])
        },
      })
      conversationRef.current = conversation
    } catch (err) {
      console.error('Failed to start conversation:', err)
      setError('No se pudo conectar. Verifica el micrófono.')
      setStatus('error')
    }
  }, [cameraOn, startCamera, analyzeCamera, lastSeen])

  const endConversation = useCallback(async () => {
    if (conversationRef.current) {
      await conversationRef.current.endSession()
      conversationRef.current = null
    }
    stopCamera()
    setStatus('idle')
  }, [stopCamera])

  useEffect(() => () => { stopCamera() }, [stopCamera])

  const getColor = () => {
    switch (status) {
      case 'listening': return '#00FF88'
      case 'speaking': return '#00F5FF'
      case 'connecting': return '#FFD700'
      case 'connected': return '#00F5FF'
      case 'error': return '#ff6b6b'
      default: return '#0080FF'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'idle': return 'Toca para hablar con JARVIS'
      case 'connecting': return 'Conectando...'
      case 'connected': return 'Conectado — habla ahora'
      case 'listening': return 'JARVIS te escucha...'
      case 'speaking': return 'JARVIS habla...'
      case 'error': return 'Error — toca para reintentar'
    }
  }

  const isActive = status !== 'idle' && status !== 'error'

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: "'Space Grotesk', sans-serif", color: '#fff', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: 'rgba(0,0,0,0.8)', borderBottom: '1px solid rgba(0,245,255,0.15)', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: '16px', backdropFilter: 'blur(20px)', flexShrink: 0 }}>
        <Link href="/dashboard" style={{ color: '#666', textDecoration: 'none', fontSize: '20px' }}>←</Link>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>🎙️ JARVIS — Voz + Visión</h1>
          <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>JARVIS te escucha y te ve en tiempo real</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
          {cameraOn && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#00FF88' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00FF88', animation: 'pulse 1s infinite' }} />
              Cámara activa
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getColor(), boxShadow: isActive ? `0 0 10px ${getColor()}` : 'none', transition: 'all 0.3s' }} />
            <span style={{ color: '#666', fontSize: '13px' }}>{getStatusText()}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left: Cámara + Avatar */}
        <div style={{ width: '400px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', borderRight: '1px solid rgba(255,255,255,0.05)', gap: '24px' }}>

          {/* Cámara o Avatar */}
          <div style={{ position: 'relative', width: '240px', height: '240px', borderRadius: '50%', overflow: 'hidden', border: `2px solid ${getColor()}`, boxShadow: `0 0 ${isActive ? 60 : 20}px ${getColor()}30`, transition: 'all 0.5s' }}>
            {/* Video oculto para captura */}
            <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraOn ? 'block' : 'none', transform: 'scaleX(-1)' }} playsInline muted />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {/* Overlay con avatar si no hay cámara */}
            {!cameraOn && (
              <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 35% 35%, ${getColor()}30, #000080 50%, #000 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '72px', transform: `scale(${pulseSize})`, transition: 'transform 0.05s' }}>
                🤖
              </div>
            )}
            {/* Pulso cuando habla */}
            {isActive && cameraOn && (
              <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle, transparent 60%, ${getColor()}20 100%)`, pointerEvents: 'none' }} />
            )}
          </div>

          {/* Anillos de pulso */}
          {isActive && (
            <div style={{ position: 'absolute', width: '240px', height: '240px', borderRadius: '50%', border: `1px solid ${getColor()}40`, transform: `scale(${pulseSize * 1.1})`, transition: 'transform 0.05s, border-color 0.3s', pointerEvents: 'none' }} />
          )}

          {/* Status */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: getColor(), marginBottom: '6px', transition: 'color 0.3s' }}>
              {getStatusText()}
            </div>
            {lastSeen && (
              <div style={{ color: '#00FF8880', fontSize: '12px', maxWidth: '280px', lineHeight: '1.5' }}>
                👁️ {analyzing ? 'Analizando...' : lastSeen.slice(0, 100)}
              </div>
            )}
          </div>

          {/* Botón principal */}
          <button
            onClick={isActive ? endConversation : startConversation}
            style={{
              width: '90px', height: '90px', borderRadius: '50%', border: 'none',
              background: isActive ? 'linear-gradient(135deg, #ff4444, #aa0000)' : 'linear-gradient(135deg, #00F5FF, #0080FF)',
              cursor: 'pointer', fontSize: '36px',
              boxShadow: isActive ? '0 0 40px #ff444460' : '0 0 30px #00F5FF40',
              transition: 'all 0.3s',
              transform: isActive && status === 'listening' ? 'scale(1.1)' : 'scale(1)',
            }}
          >
            {isActive ? '⏹' : '🎙️'}
          </button>

          {error && (
            <div style={{ background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.3)', borderRadius: '10px', padding: '12px 16px', color: '#ff6b6b', fontSize: '13px', maxWidth: '300px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <div style={{ color: '#333', fontSize: '12px', textAlign: 'center', lineHeight: '1.8' }}>
            <div>🎙️ Al iniciar, JARVIS activa la cámara</div>
            <div>👁️ Analiza lo que ve cada 20 segundos</div>
            <div>⏹ Toca para terminar</div>
          </div>
        </div>

        {/* Right: Transcripción */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#555', fontSize: '13px' }}>
            Transcripción de la conversación
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#333', gap: '16px', marginTop: '80px' }}>
                <div style={{ fontSize: '56px' }}>🎙️👁️</div>
                <div style={{ fontSize: '16px', color: '#444' }}>Presiona el botón — JARVIS te escucha y te ve</div>
                <div style={{ fontSize: '13px', color: '#333' }}>Voz en tiempo real + visión por cámara</div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '12px', alignItems: 'flex-start' }}>
                  {msg.role === 'jarvis' && (
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #00F5FF20, #0080FF40)', border: '1px solid rgba(0,245,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🤖</div>
                  )}
                  <div style={{ maxWidth: '70%', background: msg.role === 'user' ? 'linear-gradient(135deg, #0080FF, #0040aa)' : 'rgba(255,255,255,0.05)', border: msg.role === 'jarvis' ? '1px solid rgba(0,245,255,0.15)' : 'none', borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px', padding: '12px 16px' }}>
                    <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#ddd' }}>{msg.text}</div>
                  </div>
                  {msg.role === 'user' && (
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #0080FF, #0040aa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>👤</div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    </div>
  )
}
