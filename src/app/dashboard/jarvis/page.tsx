'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'

const AGENT_ID = 'agent_1901kw5xzvhae04tzbm13n8s376j'
type VoiceStatus = 'idle' | 'connecting' | 'connected' | 'speaking' | 'listening' | 'error'
type Message = { role: 'user' | 'jarvis'; text: string; time: string }

// ─── JARVIS Face Canvas ────────────────────────────────────────────────────────

function JarvisFace({ status }: { status: VoiceStatus }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width = 320
    const H = canvas.height = 380

    // Face dot map — ellipse + features
    const dots: { x: number; y: number; r: number; baseAlpha: number; phase: number }[] = []

    const cx = W / 2, cy = H / 2 - 10
    const faceW = 110, faceH = 140

    // Generate face silhouette dots
    for (let i = 0; i < 2000; i++) {
      const angle = Math.random() * Math.PI * 2
      const rx = (Math.random() * 0.4 + 0.6) * faceW
      const ry = (Math.random() * 0.4 + 0.6) * faceH
      const x = cx + Math.cos(angle) * rx * (Math.random() * 0.95 + 0.05)
      const y = cy + Math.sin(angle) * ry * (Math.random() * 0.95 + 0.05)

      // Check if inside face ellipse
      const inFace = ((x - cx) ** 2 / faceW ** 2 + (y - cy) ** 2 / faceH ** 2) < 1

      if (inFace) {
        dots.push({
          x, y,
          r: Math.random() * 1.8 + 0.4,
          baseAlpha: Math.random() * 0.5 + 0.3,
          phase: Math.random() * Math.PI * 2,
        })
      }
    }

    // Add outline dots (denser on edge)
    for (let a = 0; a < Math.PI * 2; a += 0.025) {
      for (let ri = 0; ri < 3; ri++) {
        const jitter = (ri - 1) * 3 + (Math.random() - 0.5) * 4
        const rx2 = faceW + jitter, ry2 = faceH + jitter
        dots.push({
          x: cx + Math.cos(a) * rx2,
          y: cy + Math.sin(a) * ry2,
          r: Math.random() * 1.2 + 0.6,
          baseAlpha: 0.6 + Math.random() * 0.4,
          phase: Math.random() * Math.PI * 2,
        })
      }
    }

    // Eye positions
    const eyeL = { x: cx - 38, y: cy - 28 }
    const eyeR = { x: cx + 38, y: cy - 28 }
    for (let a = 0; a < Math.PI * 2; a += 0.15) {
      for (const eye of [eyeL, eyeR]) {
        dots.push({ x: eye.x + Math.cos(a) * 18, y: eye.y + Math.sin(a) * 10, r: 1.5, baseAlpha: 0.9, phase: Math.random() * Math.PI * 2 })
        dots.push({ x: eye.x + Math.cos(a) * 10, y: eye.y + Math.sin(a) * 6, r: 1.2, baseAlpha: 0.7, phase: Math.random() * Math.PI * 2 })
      }
    }

    // Nose bridge
    for (let i = 0; i < 20; i++) {
      dots.push({ x: cx + (Math.random() - 0.5) * 8, y: cy - 10 + i * 4, r: 1, baseAlpha: 0.5, phase: Math.random() * Math.PI * 2 })
    }

    // Mouth
    for (let a = -0.6; a < Math.PI + 0.6; a += 0.12) {
      dots.push({ x: cx + Math.cos(a) * 32, y: cy + 58 + Math.sin(a) * 10, r: 1.4, baseAlpha: 0.8, phase: Math.random() * Math.PI * 2 })
    }

    // Scan line particles above head
    for (let i = 0; i < 80; i++) {
      const a = (Math.random() - 0.5) * Math.PI
      dots.push({
        x: cx + Math.cos(a) * (faceW + 10 + Math.random() * 40),
        y: cy - faceH - Math.random() * 50,
        r: Math.random() * 1.2,
        baseAlpha: Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
      })
    }

    const isActive = status === 'speaking' || status === 'listening' || status === 'connected'
    const isSpeaking = status === 'speaking'

    const draw = (t: number) => {
      timeRef.current = t * 0.001
      ctx.clearRect(0, 0, W, H)

      // Background glow
      const grd = ctx.createRadialGradient(cx, cy, 20, cx, cy, 200)
      grd.addColorStop(0, 'rgba(0,100,200,0.08)')
      grd.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grd
      ctx.fillRect(0, 0, W, H)

      for (const d of dots) {
        const wave = Math.sin(timeRef.current * (isSpeaking ? 4 : 1.5) + d.phase)
        const pulse = isActive ? 0.3 : 0.1
        const alpha = Math.max(0, Math.min(1, d.baseAlpha + wave * pulse))
        const r = d.r + (isActive ? Math.abs(wave) * 0.6 : 0)

        // Glow
        const glowR = r * 4
        const glow = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, glowR)
        glow.addColorStop(0, `rgba(0,200,255,${alpha * 0.5})`)
        glow.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(d.x, d.y, glowR, 0, Math.PI * 2)
        ctx.fill()

        // Core dot
        ctx.fillStyle = `rgba(${isSpeaking ? '100,220,255' : '0,180,255'},${alpha})`
        ctx.beginPath()
        ctx.arc(d.x, d.y, r, 0, Math.PI * 2)
        ctx.fill()
      }

      // Scan line effect
      const scanY = (timeRef.current * 60) % (H + 40) - 20
      const scanGrad = ctx.createLinearGradient(0, scanY - 4, 0, scanY + 4)
      scanGrad.addColorStop(0, 'rgba(0,200,255,0)')
      scanGrad.addColorStop(0.5, `rgba(0,200,255,${isActive ? 0.25 : 0.1})`)
      scanGrad.addColorStop(1, 'rgba(0,200,255,0)')
      ctx.fillStyle = scanGrad
      ctx.fillRect(0, scanY - 4, W, 8)

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [status])

  return <canvas ref={canvasRef} width={320} height={380} style={{ display: 'block' }} />
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function JarvisUnified() {
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
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conversationRef = useRef<any>(null)
  const cameraVideoRef = useRef<HTMLVideoElement>(null)
  const screenVideoRef = useRef<HTMLVideoElement>(null)
  const captureCanvasRef = useRef<HTMLCanvasElement>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const visionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const panelsRef = useRef<HTMLDivElement>(null)

  const now = () => new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })

  useEffect(() => {
    setMounted(true)
    // GSAP entrance animations
    const initGSAP = async () => {
      const { gsap } = await import('gsap')
      gsap.fromTo('.jarvis-header', { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' })
      gsap.fromTo('.jarvis-face-panel', { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.2 })
      gsap.fromTo('.jarvis-panel', { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.1, delay: 0.5 })
    }
    initGSAP()
  }, [])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

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
    cameraStreamRef.current = null; setCameraOn(false)
    if (visionIntervalRef.current) clearInterval(visionIntervalRef.current)
  }, [])

  // ─── Screen ───────────────────────────────────────────────────────────────
  const startScreen = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      screenStreamRef.current = stream
      if (screenVideoRef.current) { screenVideoRef.current.srcObject = stream; screenVideoRef.current.play() }
      setScreenOn(true)
      stream.getVideoTracks()[0].onended = () => setScreenOn(false)
    } catch { setError('No se pudo capturar la pantalla') }
  }, [])

  const stopScreen = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach(t => t.stop())
    screenStreamRef.current = null; setScreenOn(false)
  }, [])

  // ─── Vision ───────────────────────────────────────────────────────────────
  const captureFrame = (videoEl: HTMLVideoElement, w = 640, h = 480) => {
    if (!captureCanvasRef.current) return null
    captureCanvasRef.current.width = w; captureCanvasRef.current.height = h
    const ctx = captureCanvasRef.current.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(videoEl, 0, 0, w, h)
    return captureCanvasRef.current.toDataURL('image/jpeg', 0.7).split(',')[1]
  }

  const analyzeVision = useCallback(async () => {
    const frames = []
    if (cameraVideoRef.current && cameraOn) {
      const b64 = captureFrame(cameraVideoRef.current); if (b64) frames.push({ type: 'camera', base64: b64 })
    }
    if (screenVideoRef.current && screenOn) {
      const b64 = captureFrame(screenVideoRef.current, 1280, 720); if (b64) frames.push({ type: 'screen', base64: b64 })
    }
    if (!frames.length) return
    try {
      const res = await fetch('/api/jarvis/vision', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frames, question: 'Describe brevemente qué ves.', tenantId: 'demo-tenant', mode: frames.length > 1 ? 'both' : frames[0].type })
      })
      const data = await res.json()
      if (data.whatISee) setLastSeen(data.whatISee)
    } catch { /* non-critical */ }
  }, [cameraOn, screenOn]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── PC Control ───────────────────────────────────────────────────────────
  const connectPC = useCallback(() => {
    const ws = new WebSocket('ws://localhost:8765'); wsRef.current = ws
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      if (msg.type === 'connected') { setPcConnected(true); addPcLog('✅ PC conectada y lista') }
      else if (msg.type === 'status') addPcLog(msg.message)
      else if (msg.type === 'thinking') addPcLog(`🧠 ${msg.reasoning}`)
      else if (msg.type === 'action' && msg.action) {
        const a = msg.action
        addPcLog(a.type === 'click' ? `🖱️ Click (${a.x},${a.y})` : a.type === 'type' ? `⌨️ "${a.text}"` : `⚙️ ${a.type}`)
      }
      else if (msg.type === 'screenshot') setPcScreenshot(msg.data)
      else if (msg.type === 'done') { addPcLog(msg.message || '✅ Listo'); setPcRunning(false) }
      else if (msg.type === 'error') { addPcLog(`❌ ${msg.message}`); setPcRunning(false) }
    }
    ws.onerror = () => { addPcLog('❌ Error — ¿está el agente corriendo?'); setPcConnected(false) }
    ws.onclose = () => { setPcConnected(false); setPcRunning(false) }
  }, [])

  const addPcLog = (t: string) => setPcLogs(p => [...p.slice(-60), t])

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
        onError: () => { setError('Error con voz'); setVoiceStatus('error') },
        onModeChange: ({ mode }: { mode: string }) => {
          setVoiceStatus(mode === 'speaking' ? 'speaking' : mode === 'listening' ? 'listening' : 'connected')
        },
        onMessage: ({ message, source }: { message: string; source: string }) => {
          setMessages(p => [...p, { role: source === 'user' ? 'user' : 'jarvis', text: message, time: now() }])
        },
      })
      conversationRef.current = conversation
    } catch { setError('No se pudo conectar. Verifica micrófono.'); setVoiceStatus('error') }
  }, [cameraOn, startCamera])

  const stopVoice = useCallback(async () => {
    if (conversationRef.current) { await conversationRef.current.endSession(); conversationRef.current = null }
    stopCamera(); stopScreen(); setVoiceStatus('idle')
  }, [stopCamera, stopScreen])

  useEffect(() => () => { stopCamera(); stopScreen() }, [stopCamera, stopScreen])

  // ─── Redesign ─────────────────────────────────────────────────────────────
  const applyRedesign = useCallback(async () => {
    setRedesigning(true)
    try {
      const res = await fetch('/api/jarvis/redesign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: redesignUrl || undefined, instruction: redesignInstruction || 'Hazlo más futurista' })
      })
      const data = await res.json()
      if (data.theme) setMessages(p => [...p, { role: 'jarvis', text: `✨ Diseño actualizado: ${data.theme.styleName}`, time: now() }])
      setShowRedesign(false); setRedesignUrl(''); setRedesignInstruction('')
    } catch { setError('Error al rediseñar') }
    setRedesigning(false)
  }, [redesignUrl, redesignInstruction])

  const isVoiceActive = voiceStatus !== 'idle' && voiceStatus !== 'error'

  const statusColor = voiceStatus === 'listening' ? '#00FF88' : voiceStatus === 'speaking' ? '#00CFFF' : voiceStatus === 'connecting' ? '#FFD700' : voiceStatus === 'error' ? '#ff6b6b' : '#00CFFF'

  const statusLabel = { idle: 'INACTIVO', connecting: 'CONECTANDO', connected: 'EN LÍNEA', listening: 'ESCUCHANDO', speaking: 'HABLANDO', error: 'ERROR' }[voiceStatus]

  if (!mounted) return null

  return (
    <div style={{ minHeight: '100vh', background: '#020B18', color: '#fff', fontFamily: "'Space Grotesk', sans-serif", overflow: 'hidden' }}>
      <canvas ref={captureCanvasRef} style={{ display: 'none' }} />

      {/* ── Ambient background ──────────────────────────────────────────── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: '800px', height: '800px', background: 'radial-gradient(ellipse, rgba(0,80,160,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '10%', width: '400px', height: '400px', background: 'radial-gradient(ellipse, rgba(0,40,100,0.1) 0%, transparent 70%)', borderRadius: '50%' }} />
        {/* Grid lines */}
        <svg width="100%" height="100%" style={{ opacity: 0.04 }}>
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#00CFFF" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="jarvis-header" style={{ position: 'relative', zIndex: 10, background: 'rgba(2,11,24,0.85)', borderBottom: '1px solid rgba(0,200,255,0.12)', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '16px', backdropFilter: 'blur(24px)' }}>
        <Link href="/dashboard" style={{ color: 'rgba(0,200,255,0.5)', textDecoration: 'none', fontSize: '18px' }}>←</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg,#0050FF,#00CFFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>⚡</div>
          <span style={{ fontWeight: 900, fontSize: '18px', letterSpacing: '0.15em', background: 'linear-gradient(135deg,#00CFFF,#0080FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>J.A.R.V.I.S</span>
          <span style={{ color: 'rgba(0,200,255,0.3)', fontSize: '11px', letterSpacing: '0.2em' }}>CONTROL CENTER</span>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '20px', alignItems: 'center' }}>
          {[
            { label: 'VOZ', on: isVoiceActive, color: statusColor },
            { label: 'CÁMARA', on: cameraOn, color: '#00FF88' },
            { label: 'PANTALLA', on: screenOn, color: '#9B59B6' },
            { label: 'PC', on: pcConnected, color: '#FFD700' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', letterSpacing: '0.1em' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.on ? s.color : '#1a2a3a', boxShadow: s.on ? `0 0 8px ${s.color}` : 'none', transition: 'all 0.3s' }} />
              <span style={{ color: s.on ? s.color : '#2a4a6a' }}>{s.label}</span>
            </div>
          ))}
          <button onClick={() => setShowRedesign(v => !v)} style={{ padding: '5px 14px', background: showRedesign ? 'rgba(0,200,255,0.15)' : 'transparent', border: '1px solid rgba(0,200,255,0.2)', borderRadius: '8px', color: '#00CFFF', cursor: 'pointer', fontSize: '12px', letterSpacing: '0.08em' }}>
            🎨 DISEÑAR
          </button>
        </div>
      </div>

      {/* ── Redesign bar ────────────────────────────────────────────────── */}
      {showRedesign && (
        <div style={{ position: 'relative', zIndex: 10, background: 'rgba(0,15,35,0.95)', borderBottom: '1px solid rgba(0,200,255,0.1)', padding: '14px 24px', display: 'flex', gap: '10px', alignItems: 'center', backdropFilter: 'blur(20px)' }}>
          <span style={{ color: 'rgba(0,200,255,0.6)', fontSize: '12px', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>REDISEÑAR JARVIS →</span>
          <input value={redesignUrl} onChange={e => setRedesignUrl(e.target.value)} placeholder="URL de referencia (ej: https://linear.app)" style={{ flex: 1, background: 'rgba(0,200,255,0.05)', border: '1px solid rgba(0,200,255,0.15)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '13px', outline: 'none' }} />
          <input value={redesignInstruction} onChange={e => setRedesignInstruction(e.target.value)} placeholder="Instrucción: más oscuro, neón rojo, estilo Apple..." style={{ flex: 1, background: 'rgba(0,200,255,0.05)', border: '1px solid rgba(0,200,255,0.15)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '13px', outline: 'none' }} />
          <button onClick={applyRedesign} disabled={redesigning} style={{ padding: '8px 20px', background: redesigning ? 'rgba(0,200,255,0.1)' : 'linear-gradient(135deg,#0050FF,#00CFFF)', border: 'none', borderRadius: '8px', color: redesigning ? '#00CFFF' : '#000', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>
            {redesigning ? '⏳ Analizando...' : '✨ Aplicar'}
          </button>
        </div>
      )}

      {/* ── Main layout ─────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '380px 1fr 1fr', gridTemplateRows: 'calc(100vh - 53px - 1px)', gap: '1px', background: 'rgba(0,200,255,0.06)' }}>

        {/* ── LEFT: JARVIS Face ─────────────────────────────────────────── */}
        <div className="jarvis-face-panel" style={{ background: '#020B18', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '32px 24px', overflow: 'hidden', position: 'relative' }}>

          {/* Title */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.3em', color: 'rgba(0,200,255,0.5)', marginBottom: '4px' }}>INTELIGENCIA ARTIFICIAL</div>
            <div style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '0.1em', background: 'linear-gradient(180deg,#fff 0%,#00CFFF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>JARVIS</div>
          </div>

          {/* JARVIS Face */}
          <div style={{ position: 'relative' }}>
            {/* Outer ring glow */}
            <div style={{ position: 'absolute', inset: '-20px', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(0,100,200,0.15) 0%, transparent 70%)', transition: 'all 0.5s' }} />
            <JarvisFace status={voiceStatus} />
            {/* Status badge below face */}
            <div style={{ position: 'absolute', bottom: '-12px', left: '50%', transform: 'translateX(-50%)', background: `${statusColor}15`, border: `1px solid ${statusColor}50`, borderRadius: '20px', padding: '3px 14px', fontSize: '10px', letterSpacing: '0.2em', color: statusColor, whiteSpace: 'nowrap', transition: 'all 0.3s' }}>
              {statusLabel}
            </div>
          </div>

          {/* Voice controls */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>
            {/* Main button */}
            <button onClick={isVoiceActive ? stopVoice : startVoice} style={{ width: '80px', height: '80px', borderRadius: '50%', border: `2px solid ${isVoiceActive ? '#ff4444' : statusColor}`, background: isVoiceActive ? 'rgba(255,50,50,0.1)' : `${statusColor}15`, cursor: 'pointer', fontSize: '30px', boxShadow: `0 0 30px ${isVoiceActive ? '#ff444440' : statusColor + '30'}`, transition: 'all 0.3s', color: '#fff' }}>
              {voiceStatus === 'connecting' ? '⏳' : isVoiceActive ? '⏹' : '🎙️'}
            </button>

            {/* Camera + Screen toggles */}
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button onClick={cameraOn ? stopCamera : startCamera} style={{ flex: 1, padding: '8px', background: cameraOn ? 'rgba(0,255,136,0.1)' : 'rgba(0,200,255,0.05)', border: `1px solid ${cameraOn ? '#00FF88' : 'rgba(0,200,255,0.15)'}`, borderRadius: '10px', color: cameraOn ? '#00FF88' : 'rgba(0,200,255,0.4)', cursor: 'pointer', fontSize: '12px', transition: 'all 0.3s' }}>
                📷 {cameraOn ? 'Apagar' : 'Cámara'}
              </button>
              <button onClick={screenOn ? stopScreen : startScreen} style={{ flex: 1, padding: '8px', background: screenOn ? 'rgba(155,89,182,0.1)' : 'rgba(0,200,255,0.05)', border: `1px solid ${screenOn ? '#9B59B6' : 'rgba(0,200,255,0.15)'}`, borderRadius: '10px', color: screenOn ? '#9B59B6' : 'rgba(0,200,255,0.4)', cursor: 'pointer', fontSize: '12px', transition: 'all 0.3s' }}>
                🖥️ {screenOn ? 'Apagar' : 'Pantalla'}
              </button>
            </div>

            {/* What JARVIS sees */}
            {lastSeen && (
              <div style={{ width: '100%', background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.1)', borderRadius: '10px', padding: '10px 12px', fontSize: '11px', color: 'rgba(0,255,136,0.7)', lineHeight: 1.6 }}>
                👁️ {lastSeen.slice(0, 120)}
              </div>
            )}

            {error && <div style={{ width: '100%', background: 'rgba(255,50,50,0.05)', border: '1px solid rgba(255,50,50,0.2)', borderRadius: '10px', padding: '8px 12px', color: '#ff6b6b', fontSize: '12px', textAlign: 'center' }}>{error}</div>}
          </div>
        </div>

        {/* ── CENTER: Camera + Screen + Transcript ──────────────────────── */}
        <div style={{ background: '#020B18', display: 'flex', flexDirection: 'column', gap: '1px' }}>

          {/* Camera feed */}
          <div className="jarvis-panel" style={{ flex: 1, background: '#030D1E', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 5, display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(2,11,24,0.8)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(0,255,136,0.2)', fontSize: '11px', color: '#00FF88', letterSpacing: '0.1em', backdropFilter: 'blur(10px)' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: cameraOn ? '#00FF88' : '#333', boxShadow: cameraOn ? '0 0 6px #00FF88' : 'none' }} />
              CÁMARA — JARVIS TE VE
            </div>
            <video ref={cameraVideoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: cameraOn ? 'block' : 'none' }} />
            {!cameraOn && (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '1px solid rgba(0,200,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>📷</div>
                <div style={{ fontSize: '12px', color: 'rgba(0,200,255,0.3)', letterSpacing: '0.15em' }}>CÁMARA INACTIVA</div>
                <button onClick={startCamera} style={{ padding: '6px 16px', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '8px', color: '#00FF88', cursor: 'pointer', fontSize: '12px' }}>Activar</button>
              </div>
            )}
          </div>

          {/* Screen capture */}
          <div className="jarvis-panel" style={{ flex: 1, background: '#030D1E', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 5, display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(2,11,24,0.8)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(155,89,182,0.3)', fontSize: '11px', color: '#9B59B6', letterSpacing: '0.1em', backdropFilter: 'blur(10px)' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: screenOn ? '#9B59B6' : '#333', boxShadow: screenOn ? '0 0 6px #9B59B6' : 'none' }} />
              PANTALLA — JARVIS VE TU PC
            </div>
            <video ref={screenVideoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'contain', display: screenOn ? 'block' : 'none' }} />
            {!screenOn && (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '1px solid rgba(155,89,182,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🖥️</div>
                <div style={{ fontSize: '12px', color: 'rgba(155,89,182,0.5)', letterSpacing: '0.15em' }}>CAPTURA INACTIVA</div>
                <button onClick={startScreen} style={{ padding: '6px 16px', background: 'rgba(155,89,182,0.08)', border: '1px solid rgba(155,89,182,0.3)', borderRadius: '8px', color: '#9B59B6', cursor: 'pointer', fontSize: '12px' }}>Compartir pantalla</button>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Transcript + PC Control ───────────────────────────── */}
        <div style={{ background: '#020B18', display: 'flex', flexDirection: 'column', gap: '1px' }}>

          {/* Transcript */}
          <div className="jarvis-panel" ref={panelsRef} style={{ flex: 1, background: '#030D1E', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(0,200,255,0.08)', fontSize: '11px', letterSpacing: '0.15em', color: 'rgba(0,200,255,0.4)', display: 'flex', justifyContent: 'space-between' }}>
              <span>💬 CONVERSACIÓN</span>
              <span style={{ color: 'rgba(0,200,255,0.25)' }}>{messages.length} mensajes</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {messages.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'rgba(0,200,255,0.2)', marginTop: '40px', textAlign: 'center' }}>
                  <div style={{ fontSize: '36px' }}>🎙️</div>
                  <div style={{ fontSize: '12px', letterSpacing: '0.15em' }}>PRESIONA EL BOTÓN<br />PARA HABLAR CON JARVIS</div>
                </div>
              ) : messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ fontSize: '10px', color: 'rgba(0,200,255,0.3)', marginBottom: '3px', letterSpacing: '0.1em' }}>
                    {m.role === 'user' ? 'TÚ' : 'JARVIS'} · {m.time}
                  </div>
                  <div style={{ maxWidth: '88%', background: m.role === 'user' ? 'rgba(0,120,255,0.12)' : 'rgba(0,200,255,0.06)', border: `1px solid ${m.role === 'user' ? 'rgba(0,120,255,0.25)' : 'rgba(0,200,255,0.12)'}`, borderRadius: '12px', padding: '8px 12px', fontSize: '13px', lineHeight: 1.6, color: m.role === 'user' ? '#a0d4ff' : '#c0eeff' }}>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* PC Control */}
          <div className="jarvis-panel" style={{ height: '260px', background: '#030D1E', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,200,0,0.08)', fontSize: '11px', letterSpacing: '0.15em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'rgba(255,200,0,0.5)' }}>🖱️ COMPUTER USE</span>
              {!pcConnected
                ? <button onClick={connectPC} style={{ padding: '3px 12px', background: 'rgba(255,200,0,0.08)', border: '1px solid rgba(255,200,0,0.25)', borderRadius: '6px', color: '#FFD700', cursor: 'pointer', fontSize: '11px' }}>Conectar PC</button>
                : <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#FFD700', boxShadow: '0 0 6px #FFD700' }} />
                  <span style={{ color: '#FFD700', fontSize: '11px' }}>CONECTADO</span>
                  <button onClick={() => { wsRef.current?.close(); wsRef.current = null; setPcConnected(false) }} style={{ padding: '2px 8px', background: 'rgba(255,50,50,0.08)', border: '1px solid rgba(255,50,50,0.2)', borderRadius: '4px', color: '#ff6b6b', cursor: 'pointer', fontSize: '10px' }}>✕</button>
                </div>
              }
            </div>

            {/* PC Screenshot small preview */}
            {pcScreenshot && (
              <div style={{ height: '80px', overflow: 'hidden', borderBottom: '1px solid rgba(255,200,0,0.06)', position: 'relative' }}>
                <img src={`data:image/jpeg;base64,${pcScreenshot}`} alt="PC" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, #030D1E 100%)' }} />
              </div>
            )}

            {/* Logs */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px 12px', fontFamily: 'monospace', fontSize: '11px' }}>
              {pcLogs.length === 0
                ? <div style={{ color: 'rgba(255,200,0,0.2)', padding: '4px', letterSpacing: '0.1em' }}>
                  {pcConnected ? 'LISTO · Escribe una tarea abajo' : 'Inicia el agente: node jarvis/computer-use/index.js'}
                </div>
                : pcLogs.slice(-15).map((l, i) => (
                  <div key={i} style={{ color: l.startsWith('✅') ? '#00FF88' : l.startsWith('❌') ? '#ff6b6b' : l.startsWith('🧠') ? '#FFD700' : l.startsWith('🖱️') || l.startsWith('⌨️') ? '#00CFFF' : 'rgba(255,200,0,0.5)', lineHeight: 1.8 }}>{l}</div>
                ))
              }
            </div>

            {/* Task input */}
            <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,200,0,0.08)', display: 'flex', gap: '8px' }}>
              <input value={pcTask} onChange={e => setPcTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendPcTask()} placeholder={pcConnected ? 'Dile a JARVIS qué hacer...' : 'Conecta el agente primero'} disabled={!pcConnected || pcRunning} style={{ flex: 1, background: 'rgba(255,200,0,0.04)', border: '1px solid rgba(255,200,0,0.12)', borderRadius: '8px', padding: '7px 10px', color: '#fff', fontSize: '12px', outline: 'none', fontFamily: 'inherit' }} />
              <button onClick={sendPcTask} disabled={!pcConnected || pcRunning || !pcTask.trim()} style={{ width: '36px', height: '36px', background: pcConnected && !pcRunning ? 'rgba(255,200,0,0.15)' : 'rgba(255,200,0,0.04)', border: '1px solid rgba(255,200,0,0.2)', borderRadius: '8px', color: '#FFD700', cursor: pcConnected ? 'pointer' : 'not-allowed', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {pcRunning ? '⏳' : '▶'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
