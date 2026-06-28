'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'

const AGENT_ID = 'agent_1901kw5xzvhae04tzbm13n8s376j'

type VoiceStatus = 'idle' | 'connecting' | 'connected' | 'speaking' | 'listening' | 'error'
type Message = { role: 'user' | 'jarvis'; text: string; time: string }

interface Theme {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  surfaceColor: string
  borderColor: string
  textColor: string
  textMuted: string
  glowColor: string
  glowIntensity: string
  gradientFrom: string
  gradientTo: string
  borderRadius: string
  fontFamily: string
  blur: string
  styleName: string
  description: string
}

const DEFAULT_THEME: Theme = {
  primaryColor: '#00F5FF', secondaryColor: '#9B59B6', accentColor: '#00FF88',
  backgroundColor: '#0A0A0F', surfaceColor: '#111118', borderColor: 'rgba(0,245,255,0.15)',
  textColor: '#ffffff', textMuted: '#666688', glowColor: '#00F5FF', glowIntensity: '40',
  gradientFrom: '#00F5FF', gradientTo: '#9B59B6', borderRadius: '16',
  fontFamily: 'Space Grotesk', blur: '20', styleName: 'JARVIS Default', description: 'Tema futurista por defecto'
}

export default function JarvisUnified() {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME)
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [cameraOn, setCameraOn] = useState(false)
  const [screenOn, setScreenOn] = useState(false)
  const [pcConnected, setPcConnected] = useState(false)
  const [lastSeen, setLastSeen] = useState('')
  const [pcLogs, setPcLogs] = useState<string[]>([])
  const [pcTask, setPcTask] = useState('')
  const [pcRunning, setPcRunning] = useState(false)
  const [pcScreenshot, setPcScreenshot] = useState<string | null>(null)
  const [showRedesign, setShowRedesign] = useState(false)
  const [redesignUrl, setRedesignUrl] = useState('')
  const [redesignInstruction, setRedesignInstruction] = useState('')
  const [redesigning, setRedesigning] = useState(false)
  const [pulseSize, setPulseSize] = useState(1)
  const [error, setError] = useState('')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conversationRef = useRef<any>(null)
  const pulseRef = useRef<number>(0)
  const cameraVideoRef = useRef<HTMLVideoElement>(null)
  const screenVideoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const visionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load saved theme
  useEffect(() => {
    const saved = localStorage.getItem('jarvis-theme')
    if (saved) try { setTheme(JSON.parse(saved)) } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Pulse animation
  useEffect(() => {
    const active = voiceStatus === 'speaking' || voiceStatus === 'listening' || voiceStatus === 'connected'
    if (active) {
      const animate = () => { setPulseSize(1 + Math.sin(Date.now() / 400) * 0.12); pulseRef.current = requestAnimationFrame(animate) }
      pulseRef.current = requestAnimationFrame(animate)
    } else { cancelAnimationFrame(pulseRef.current); setPulseSize(1) }
    return () => cancelAnimationFrame(pulseRef.current)
  }, [voiceStatus])

  const t = theme
  const isVoiceActive = voiceStatus !== 'idle' && voiceStatus !== 'error'

  const getVoiceColor = () => {
    if (voiceStatus === 'listening') return t.accentColor
    if (voiceStatus === 'speaking') return t.primaryColor
    if (voiceStatus === 'connecting') return '#FFD700'
    if (voiceStatus === 'error') return '#ff6b6b'
    return t.primaryColor
  }

  const now = () => new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })

  // ─── Camera ───────────────────────────────────────────────────────────────

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      cameraStreamRef.current = stream
      if (cameraVideoRef.current) { cameraVideoRef.current.srcObject = stream; cameraVideoRef.current.play() }
      setCameraOn(true)
      visionIntervalRef.current = setInterval(() => analyzeVision(), 20000)
      setTimeout(() => analyzeVision(), 2000)
    } catch { setError('No se pudo acceder a la cámara') }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const stopCamera = useCallback(() => {
    cameraStreamRef.current?.getTracks().forEach(t => t.stop())
    cameraStreamRef.current = null
    setCameraOn(false)
    if (visionIntervalRef.current) clearInterval(visionIntervalRef.current)
  }, [])

  // ─── Screen ───────────────────────────────────────────────────────────────

  const startScreen = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { width: 1920, height: 1080 } })
      screenStreamRef.current = stream
      if (screenVideoRef.current) { screenVideoRef.current.srcObject = stream; screenVideoRef.current.play() }
      setScreenOn(true)
      stream.getVideoTracks()[0].onended = () => setScreenOn(false)
    } catch { setError('No se pudo capturar la pantalla') }
  }, [])

  const stopScreen = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach(t => t.stop())
    screenStreamRef.current = null
    setScreenOn(false)
  }, [])

  // ─── Vision Analysis ──────────────────────────────────────────────────────

  const captureFrame = (videoEl: HTMLVideoElement, w = 640, h = 480) => {
    if (!canvasRef.current) return null
    canvasRef.current.width = w; canvasRef.current.height = h
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(videoEl, 0, 0, w, h)
    return canvasRef.current.toDataURL('image/jpeg', 0.7).split(',')[1]
  }

  const analyzeVision = useCallback(async () => {
    const frames = []
    if (cameraVideoRef.current && cameraOn) {
      const b64 = captureFrame(cameraVideoRef.current)
      if (b64) frames.push({ type: 'camera', base64: b64 })
    }
    if (screenVideoRef.current && screenOn) {
      const b64 = captureFrame(screenVideoRef.current, 1280, 720)
      if (b64) frames.push({ type: 'screen', base64: b64 })
    }
    if (frames.length === 0) return
    try {
      const res = await fetch('/api/jarvis/vision', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frames, question: 'Describe brevemente qué ves.', tenantId: 'demo-tenant', mode: frames.length > 1 ? 'both' : frames[0].type })
      })
      const data = await res.json()
      if (data.whatISee) setLastSeen(data.whatISee)
    } catch { /* non-critical */ }
  }, [cameraOn, screenOn]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── PC Control (WebSocket) ───────────────────────────────────────────────

  const connectPC = useCallback(() => {
    const ws = new WebSocket('ws://localhost:8765')
    wsRef.current = ws
    ws.onopen = () => addPcLog('🔗 Conectando...')
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      if (msg.type === 'connected') { setPcConnected(true); addPcLog('✅ PC conectada') }
      else if (msg.type === 'status' && msg.message) addPcLog(msg.message)
      else if (msg.type === 'thinking') addPcLog(`🧠 ${msg.reasoning}`)
      else if (msg.type === 'action' && msg.action) {
        const a = msg.action
        if (a.type === 'click') addPcLog(`🖱️ Click (${a.x},${a.y})`)
        else if (a.type === 'type') addPcLog(`⌨️ "${a.text}"`)
        else addPcLog(`⚙️ ${a.type}`)
      }
      else if (msg.type === 'screenshot' && msg.data) setPcScreenshot(msg.data)
      else if (msg.type === 'done') { addPcLog(msg.message || '✅ Listo'); setPcRunning(false) }
      else if (msg.type === 'error') { addPcLog(`❌ ${msg.message}`); setPcRunning(false) }
    }
    ws.onerror = () => { addPcLog('❌ Error de conexión'); setPcConnected(false) }
    ws.onclose = () => { setPcConnected(false); setPcRunning(false) }
  }, [])

  const disconnectPC = () => { wsRef.current?.close(); wsRef.current = null; setPcConnected(false) }

  const addPcLog = (text: string) => setPcLogs(p => [...p.slice(-50), text])

  const sendPcTask = () => {
    if (!pcTask.trim() || !wsRef.current || wsRef.current.readyState !== 1) return
    setPcRunning(true); setPcLogs([]); setPcScreenshot(null)
    addPcLog(`🚀 ${pcTask}`)
    wsRef.current.send(JSON.stringify({ type: 'task', task: pcTask }))
  }

  // ─── Voice ────────────────────────────────────────────────────────────────

  const startVoice = useCallback(async () => {
    setError(''); setVoiceStatus('connecting')
    if (!cameraOn) await startCamera()
    try {
      const { Conversation } = await import('@11labs/client')
      const conversation = await Conversation.startSession({
        agentId: AGENT_ID,
        onConnect: () => setVoiceStatus('connected'),
        onDisconnect: () => { setVoiceStatus('idle'); conversationRef.current = null },
        onError: () => { setError('Error con JARVIS voz'); setVoiceStatus('error') },
        onModeChange: ({ mode }: { mode: string }) => {
          if (mode === 'speaking') setVoiceStatus('speaking')
          else if (mode === 'listening') setVoiceStatus('listening')
        },
        onMessage: ({ message, source }: { message: string; source: string }) => {
          setMessages(prev => [...prev, { role: source === 'user' ? 'user' : 'jarvis', text: message, time: now() }])
        },
      })
      conversationRef.current = conversation
    } catch { setError('No se pudo conectar. Verifica el micrófono.'); setVoiceStatus('error') }
  }, [cameraOn, startCamera])

  const stopVoice = useCallback(async () => {
    if (conversationRef.current) { await conversationRef.current.endSession(); conversationRef.current = null }
    stopCamera(); stopScreen()
    setVoiceStatus('idle')
  }, [stopCamera, stopScreen])

  useEffect(() => () => { stopCamera(); stopScreen() }, [stopCamera, stopScreen])

  // ─── Redesign ─────────────────────────────────────────────────────────────

  const applyRedesign = useCallback(async () => {
    if (!redesignUrl && !redesignInstruction) return
    setRedesigning(true)
    try {
      const res = await fetch('/api/jarvis/redesign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: redesignUrl || undefined, instruction: redesignInstruction || 'Hazlo más futurista' })
      })
      const data = await res.json()
      if (data.theme) {
        setTheme(data.theme)
        localStorage.setItem('jarvis-theme', JSON.stringify(data.theme))
        setMessages(p => [...p, { role: 'jarvis', text: `Diseño actualizado: ${data.theme.styleName} — ${data.theme.description}`, time: now() }])
        setShowRedesign(false)
        setRedesignUrl(''); setRedesignInstruction('')
      }
    } catch { setError('Error al rediseñar') }
    setRedesigning(false)
  }, [redesignUrl, redesignInstruction])

  const resetTheme = () => { setTheme(DEFAULT_THEME); localStorage.removeItem('jarvis-theme') }

  // ─── Voice status text ────────────────────────────────────────────────────

  const voiceStatusText = {
    idle: 'Toca para hablar', connecting: 'Conectando...', connected: 'Habla ahora',
    listening: 'Escuchando...', speaking: 'JARVIS habla...', error: 'Error'
  }[voiceStatus]

  const vc = getVoiceColor()

  return (
    <div style={{ minHeight: '100vh', background: t.backgroundColor, fontFamily: `'${t.fontFamily}', sans-serif`, color: t.textColor, display: 'flex', flexDirection: 'column', transition: 'all 0.5s' }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ background: `${t.surfaceColor}cc`, borderBottom: `1px solid ${t.borderColor}`, padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '16px', backdropFilter: `blur(${t.blur}px)`, position: 'sticky', top: 0, zIndex: 50, flexShrink: 0 }}>
        <Link href="/dashboard" style={{ color: t.textMuted, textDecoration: 'none', fontSize: '18px' }}>←</Link>
        <span style={{ fontWeight: 900, fontSize: '20px', background: `linear-gradient(135deg,${t.gradientFrom},${t.gradientTo})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          J.A.R.V.I.S
        </span>
        <span style={{ color: t.textMuted, fontSize: '12px' }}>·</span>
        <span style={{ color: t.textMuted, fontSize: '12px' }}>Control Total</span>

        {/* Status indicators */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '16px', alignItems: 'center', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isVoiceActive ? vc : t.textMuted }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isVoiceActive ? vc : '#444', boxShadow: isVoiceActive ? `0 0 8px ${vc}` : 'none' }} />
            {voiceStatusText}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: cameraOn ? t.accentColor : t.textMuted }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: cameraOn ? t.accentColor : '#444' }} />
            Cámara
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: screenOn ? t.secondaryColor : t.textMuted }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: screenOn ? t.secondaryColor : '#444' }} />
            Pantalla
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: pcConnected ? '#FFD700' : t.textMuted }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: pcConnected ? '#FFD700' : '#444' }} />
            PC
          </div>
          <button onClick={() => setShowRedesign(v => !v)} style={{ padding: '4px 12px', background: showRedesign ? `${t.primaryColor}20` : 'transparent', border: `1px solid ${t.borderColor}`, borderRadius: '8px', color: t.primaryColor, cursor: 'pointer', fontSize: '12px' }}>
            🎨 Diseño
          </button>
          <button onClick={resetTheme} style={{ padding: '4px 8px', background: 'transparent', border: `1px solid ${t.borderColor}`, borderRadius: '8px', color: t.textMuted, cursor: 'pointer', fontSize: '11px' }}>
            Reset
          </button>
        </div>
      </div>

      {/* ── Redesign Panel ─────────────────────────────────────────────── */}
      {showRedesign && (
        <div style={{ background: t.surfaceColor, borderBottom: `1px solid ${t.borderColor}`, padding: '16px 24px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: t.textMuted, fontSize: '13px', whiteSpace: 'nowrap' }}>🎨 Rediseñar JARVIS:</span>
          <input value={redesignUrl} onChange={e => setRedesignUrl(e.target.value)} placeholder="Pega un link de referencia (ej: https://linear.app)" style={{ flex: 1, minWidth: '200px', background: t.backgroundColor, border: `1px solid ${t.borderColor}`, borderRadius: '8px', padding: '8px 12px', color: t.textColor, fontSize: '13px', outline: 'none' }} />
          <input value={redesignInstruction} onChange={e => setRedesignInstruction(e.target.value)} placeholder="Instrucción: hazlo más oscuro, más neón, estilo Apple..." style={{ flex: 1, minWidth: '200px', background: t.backgroundColor, border: `1px solid ${t.borderColor}`, borderRadius: '8px', padding: '8px 12px', color: t.textColor, fontSize: '13px', outline: 'none' }} />
          <button onClick={applyRedesign} disabled={redesigning} style={{ padding: '8px 20px', background: `linear-gradient(135deg,${t.gradientFrom},${t.gradientTo})`, border: 'none', borderRadius: '8px', color: '#000', fontWeight: '700', cursor: 'pointer', fontSize: '13px', opacity: redesigning ? 0.6 : 1 }}>
            {redesigning ? '⏳ Analizando...' : '✨ Aplicar'}
          </button>
          {t.styleName !== 'JARVIS Default' && <span style={{ color: t.primaryColor, fontSize: '12px' }}>Tema: {t.styleName}</span>}
        </div>
      )}

      {/* ── Main Grid ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '280px 1fr 1fr', gridTemplateRows: '1fr 220px', gap: '1px', background: t.borderColor, overflow: 'hidden' }}>

        {/* ── Panel 1: JARVIS Avatar + Voice ─────────────────────────── */}
        <div style={{ background: t.backgroundColor, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', gap: '20px', gridRow: '1 / 2' }}>

          {/* Sphere */}
          <div style={{ position: 'relative', width: '160px', height: '160px' }}>
            {[1.3, 1.15].map((scale, i) => (
              <div key={i} style={{ position: 'absolute', inset: `${-i * 20}px`, borderRadius: '50%', border: `1px solid ${vc}`, opacity: isVoiceActive ? 0.4 - i * 0.15 : 0.1, transition: 'opacity 0.5s' }} />
            ))}
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `radial-gradient(circle at 35% 35%, ${vc}30, #000080 50%, #000 100%)`, border: `2px solid ${vc}`, boxShadow: `0 0 ${isVoiceActive ? 60 : 20}px ${vc}30`, transform: `scale(${pulseSize})`, transition: 'box-shadow 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '56px' }}>
              🤖
            </div>
          </div>

          {/* Voice status */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: vc, fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>{voiceStatusText}</div>
            {lastSeen && <div style={{ color: t.accentColor + '99', fontSize: '11px', maxWidth: '220px', lineHeight: 1.5 }}>👁️ {lastSeen.slice(0, 80)}</div>}
          </div>

          {/* Voice button */}
          <button onClick={isVoiceActive ? stopVoice : startVoice} style={{ width: '72px', height: '72px', borderRadius: '50%', border: 'none', background: isVoiceActive ? 'linear-gradient(135deg,#ff4444,#aa0000)' : `linear-gradient(135deg,${t.gradientFrom},${t.gradientTo})`, cursor: 'pointer', fontSize: '28px', boxShadow: `0 0 30px ${isVoiceActive ? '#ff444460' : vc + '40'}`, transform: voiceStatus === 'listening' ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.3s' }}>
            {isVoiceActive ? '⏹' : '🎙️'}
          </button>

          {/* Vision controls */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={cameraOn ? stopCamera : startCamera} style={{ padding: '6px 12px', background: cameraOn ? `${t.accentColor}20` : t.surfaceColor, border: `1px solid ${cameraOn ? t.accentColor : t.borderColor}`, borderRadius: '8px', color: cameraOn ? t.accentColor : t.textMuted, cursor: 'pointer', fontSize: '12px' }}>
              {cameraOn ? '📷 ON' : '📷 OFF'}
            </button>
            <button onClick={screenOn ? stopScreen : startScreen} style={{ padding: '6px 12px', background: screenOn ? `${t.secondaryColor}20` : t.surfaceColor, border: `1px solid ${screenOn ? t.secondaryColor : t.borderColor}`, borderRadius: '8px', color: screenOn ? t.secondaryColor : t.textMuted, cursor: 'pointer', fontSize: '12px' }}>
              {screenOn ? '🖥️ ON' : '🖥️ OFF'}
            </button>
          </div>

          {error && <div style={{ background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.3)', borderRadius: '8px', padding: '8px 12px', color: '#ff6b6b', fontSize: '12px', textAlign: 'center', maxWidth: '220px' }}>{error}</div>}
        </div>

        {/* ── Panel 2: Cámara (te ve) ─────────────────────────────────── */}
        <div style={{ background: t.backgroundColor, position: 'relative', overflow: 'hidden', gridRow: '1 / 2' }}>
          <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 10, background: `${t.surfaceColor}cc`, padding: '4px 10px', borderRadius: '6px', fontSize: '11px', color: t.accentColor, border: `1px solid ${t.accentColor}40` }}>
            📷 JARVIS te ve
          </div>
          <video ref={cameraVideoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: cameraOn ? 'block' : 'none' }} playsInline muted />
          {!cameraOn && (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: t.textMuted }}>
              <div style={{ fontSize: '48px' }}>📷</div>
              <div style={{ fontSize: '13px' }}>Cámara apagada</div>
              <button onClick={startCamera} style={{ padding: '8px 16px', background: `${t.accentColor}20`, border: `1px solid ${t.accentColor}`, borderRadius: '8px', color: t.accentColor, cursor: 'pointer', fontSize: '12px' }}>Encender</button>
            </div>
          )}
        </div>

        {/* ── Panel 3: Pantalla (ve tu screen) ───────────────────────── */}
        <div style={{ background: t.backgroundColor, position: 'relative', overflow: 'hidden', gridRow: '1 / 2' }}>
          <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 10, background: `${t.surfaceColor}cc`, padding: '4px 10px', borderRadius: '6px', fontSize: '11px', color: t.secondaryColor, border: `1px solid ${t.secondaryColor}40` }}>
            🖥️ JARVIS ve tu pantalla
          </div>
          <video ref={screenVideoRef} style={{ width: '100%', height: '100%', objectFit: 'contain', display: screenOn ? 'block' : 'none' }} playsInline muted />
          {!screenOn && (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: t.textMuted }}>
              <div style={{ fontSize: '48px' }}>🖥️</div>
              <div style={{ fontSize: '13px' }}>Captura de pantalla apagada</div>
              <button onClick={startScreen} style={{ padding: '8px 16px', background: `${t.secondaryColor}20`, border: `1px solid ${t.secondaryColor}`, borderRadius: '8px', color: t.secondaryColor, cursor: 'pointer', fontSize: '12px' }}>Compartir pantalla</button>
            </div>
          )}
        </div>

        {/* ── Panel 4: Transcripción ──────────────────────────────────── */}
        <div style={{ background: t.surfaceColor, display: 'flex', flexDirection: 'column', overflow: 'hidden', gridRow: '2 / 3' }}>
          <div style={{ padding: '8px 12px', borderBottom: `1px solid ${t.borderColor}`, fontSize: '11px', color: t.textMuted }}>💬 Conversación</div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {messages.length === 0
              ? <div style={{ color: t.textMuted, fontSize: '12px', padding: '8px' }}>Presiona 🎙️ para empezar</div>
              : messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: '6px', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '85%', background: m.role === 'user' ? `${t.primaryColor}30` : t.backgroundColor, border: `1px solid ${m.role === 'user' ? t.primaryColor + '40' : t.borderColor}`, borderRadius: `${t.borderRadius}px`, padding: '6px 10px', fontSize: '12px', color: t.textColor, lineHeight: 1.5 }}>
                    {m.text}
                    <div style={{ fontSize: '10px', color: t.textMuted, marginTop: '2px' }}>{m.time}</div>
                  </div>
                </div>
              ))
            }
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ── Panel 5: PC Screenshot ──────────────────────────────────── */}
        <div style={{ background: t.surfaceColor, display: 'flex', flexDirection: 'column', overflow: 'hidden', gridRow: '2 / 3' }}>
          <div style={{ padding: '8px 12px', borderBottom: `1px solid ${t.borderColor}`, fontSize: '11px', color: t.textMuted }}>🖱️ Vista PC (Computer Use)</div>
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {pcScreenshot
              ? <img src={`data:image/jpeg;base64,${pcScreenshot}`} alt="PC" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              : <div style={{ color: t.textMuted, fontSize: '12px', textAlign: 'center' }}>
                {pcConnected ? 'Listo — envía una tarea abajo' : 'Conecta el agente PC'}
              </div>
            }
          </div>
        </div>

        {/* ── Panel 6: PC Control ─────────────────────────────────────── */}
        <div style={{ background: t.surfaceColor, display: 'flex', flexDirection: 'column', overflow: 'hidden', gridRow: '2 / 3' }}>
          <div style={{ padding: '8px 12px', borderBottom: `1px solid ${t.borderColor}`, fontSize: '11px', color: t.textMuted, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⚙️ Control PC</span>
            {!pcConnected
              ? <button onClick={connectPC} style={{ padding: '2px 10px', background: `${t.primaryColor}20`, border: `1px solid ${t.primaryColor}`, borderRadius: '6px', color: t.primaryColor, cursor: 'pointer', fontSize: '11px' }}>Conectar</button>
              : <button onClick={disconnectPC} style={{ padding: '2px 10px', background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.3)', borderRadius: '6px', color: '#ff6b6b', cursor: 'pointer', fontSize: '11px' }}>✕ Desconectar</button>
            }
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px', fontSize: '11px', fontFamily: 'monospace' }}>
            {pcLogs.slice(-20).map((l, i) => <div key={i} style={{ color: l.startsWith('✅') ? t.accentColor : l.startsWith('❌') ? '#ff6b6b' : l.startsWith('🧠') ? '#FFD700' : t.textMuted, lineHeight: 1.6 }}>{l}</div>)}
          </div>
          <div style={{ padding: '8px', borderTop: `1px solid ${t.borderColor}`, display: 'flex', gap: '6px' }}>
            <input value={pcTask} onChange={e => setPcTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendPcTask()} placeholder="Dile a JARVIS qué hacer en tu PC..." disabled={!pcConnected || pcRunning} style={{ flex: 1, background: t.backgroundColor, border: `1px solid ${t.borderColor}`, borderRadius: '8px', padding: '6px 10px', color: t.textColor, fontSize: '12px', outline: 'none' }} />
            <button onClick={sendPcTask} disabled={!pcConnected || pcRunning || !pcTask.trim()} style={{ padding: '6px 12px', background: pcConnected ? `linear-gradient(135deg,${t.gradientFrom},${t.gradientTo})` : t.surfaceColor, border: 'none', borderRadius: '8px', color: pcConnected ? '#000' : t.textMuted, cursor: pcConnected ? 'pointer' : 'not-allowed', fontSize: '12px', fontWeight: 700 }}>
              {pcRunning ? '⏳' : '▶'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
