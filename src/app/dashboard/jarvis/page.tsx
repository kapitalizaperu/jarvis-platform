'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'

type Status = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error'
type Message = { role: 'user' | 'jarvis'; text: string; time: string }

// ─── JARVIS Face ──────────────────────────────────────────────────────────────
function JarvisFace({ status }: { status: Status }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = 300; canvas.height = 360

    const W = 300, H = 360, cx = 150, cy = 175
    const fW = 100, fH = 130

    // Build dot field
    const dots: { x: number; y: number; r: number; a: number; p: number }[] = []
    for (let i = 0; i < 1800; i++) {
      const angle = Math.random() * Math.PI * 2
      const rx = fW * (Math.random() * 0.9 + 0.1)
      const ry = fH * (Math.random() * 0.9 + 0.1)
      const x = cx + Math.cos(angle) * rx
      const y = cy + Math.sin(angle) * ry
      if ((x - cx) ** 2 / fW ** 2 + (y - cy) ** 2 / fH ** 2 < 1) {
        dots.push({ x, y, r: Math.random() * 1.6 + 0.3, a: Math.random() * 0.5 + 0.2, p: Math.random() * Math.PI * 2 })
      }
    }
    // Outline
    for (let a = 0; a < Math.PI * 2; a += 0.022) {
      for (let j = -2; j <= 2; j++) {
        dots.push({ x: cx + Math.cos(a) * (fW + j * 2), y: cy + Math.sin(a) * (fH + j * 2), r: 1, a: 0.7, p: Math.random() * Math.PI * 2 })
      }
    }
    // Eyes
    for (const ex of [cx - 36, cx + 36]) {
      for (let a = 0; a < Math.PI * 2; a += 0.14) {
        dots.push({ x: ex + Math.cos(a) * 16, y: cy - 30 + Math.sin(a) * 9, r: 1.4, a: 0.9, p: Math.random() * Math.PI * 2 })
        dots.push({ x: ex + Math.cos(a) * 8, y: cy - 30 + Math.sin(a) * 5, r: 1, a: 0.6, p: Math.random() * Math.PI * 2 })
      }
    }
    // Mouth
    for (let a = 0.1; a < Math.PI - 0.1; a += 0.1) {
      dots.push({ x: cx + Math.cos(a) * 28, y: cy + 55 + Math.sin(a) * 8, r: 1.3, a: 0.8, p: Math.random() * Math.PI * 2 })
    }
    // Scan spikes on top
    for (let i = 0; i < 60; i++) {
      const a2 = (Math.random() - 0.5) * Math.PI
      dots.push({ x: cx + Math.cos(a2) * (fW + 10 + Math.random() * 35), y: cy - fH - Math.random() * 40, r: 0.8, a: 0.3, p: Math.random() * Math.PI * 2 })
    }

    const draw = (t: number) => {
      const time = t * 0.001
      ctx.clearRect(0, 0, W, H)

      // Ambient glow
      const bg = ctx.createRadialGradient(cx, cy, 10, cx, cy, 190)
      bg.addColorStop(0, 'rgba(0,80,180,0.1)')
      bg.addColorStop(1, 'transparent')
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

      const isSpeaking = status === 'speaking'
      const isListening = status === 'listening'
      const isThinking = status === 'thinking'
      const speed = isSpeaking ? 5 : isListening ? 2 : 1
      const pulse = isSpeaking ? 0.4 : isListening ? 0.25 : 0.1
      const r = isSpeaking ? [0, 210, 255] : isThinking ? [255, 200, 0] : [0, 170, 255]

      for (const d of dots) {
        const wave = Math.sin(time * speed + d.p)
        const alpha = Math.max(0, Math.min(1, d.a + wave * pulse))
        const size = d.r + (isSpeaking ? Math.abs(wave) * 0.8 : 0)
        const grd = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, size * 5)
        grd.addColorStop(0, `rgba(${r[0]},${r[1]},${r[2]},${alpha * 0.4})`)
        grd.addColorStop(1, 'transparent')
        ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(d.x, d.y, size * 5, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = `rgba(${r[0]},${r[1]},${r[2]},${alpha})`
        ctx.beginPath(); ctx.arc(d.x, d.y, size, 0, Math.PI * 2); ctx.fill()
      }

      // Scan line
      const sy = (time * 55) % (H + 30) - 15
      const sg = ctx.createLinearGradient(0, sy - 3, 0, sy + 3)
      sg.addColorStop(0, 'transparent')
      sg.addColorStop(0.5, `rgba(0,200,255,${isSpeaking ? 0.3 : 0.12})`)
      sg.addColorStop(1, 'transparent')
      ctx.fillStyle = sg; ctx.fillRect(0, sy - 3, W, 6)

      animRef.current = requestAnimationFrame(draw)
    }
    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [status])

  return <canvas ref={canvasRef} width={300} height={360} style={{ display: 'block' }} />
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function JarvisPage() {
  const [status, setStatus] = useState<Status>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [cameraOn, setCameraOn] = useState(false)
  const [screenOn, setScreenOn] = useState(false)
  const [pcConnected, setPcConnected] = useState(false)
  const [pcLogs, setPcLogs] = useState<string[]>([])
  const [pcTask, setPcTask] = useState('')
  const [pcRunning, setPcRunning] = useState(false)
  const [pcScreenshot, setPcScreenshot] = useState<string | null>(null)
  const [showRedesign, setShowRedesign] = useState(false)
  const [redesignUrl, setRedesignUrl] = useState('')
  const [redesignNote, setRedesignNote] = useState('')
  const [redesigning, setRedesigning] = useState(false)
  const [statusText, setStatusText] = useState('Toca para hablar')
  const [mounted, setMounted] = useState(false)

  const cameraVideoRef = useRef<HTMLVideoElement>(null)
  const screenVideoRef = useRef<HTMLVideoElement>(null)
  const captureCanvasRef = useRef<HTMLCanvasElement>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const historyRef = useRef<{ role: string; content: string }[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isListeningRef = useRef(false)
  const visionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sessionIdRef = useRef(`session_${Date.now()}`)

  const now = () => new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })

  useEffect(() => {
    setMounted(true)
    const init = async () => {
      const { gsap } = await import('gsap')
      gsap.fromTo('.j-header', { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' })
      gsap.fromTo('.j-face', { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.9, ease: 'power3.out', delay: 0.15 })
      gsap.fromTo('.j-panel', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.08, delay: 0.3 })
    }
    init()
  }, [])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // ─── Capture frame ────────────────────────────────────────────────────────
  const captureFrame = useCallback((videoEl: HTMLVideoElement, w = 640, h = 480) => {
    if (!captureCanvasRef.current || !videoEl.videoWidth) return null
    captureCanvasRef.current.width = w; captureCanvasRef.current.height = h
    const ctx = captureCanvasRef.current.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(videoEl, 0, 0, w, h)
    return captureCanvasRef.current.toDataURL('image/jpeg', 0.7).split(',')[1]
  }, [])

  // ─── Camera ───────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      cameraStreamRef.current = stream
      if (cameraVideoRef.current) { cameraVideoRef.current.srcObject = stream; await cameraVideoRef.current.play() }
      setCameraOn(true)
    } catch { setStatusText('No se pudo acceder a la cámara') }
  }, [])

  const stopCamera = useCallback(() => {
    cameraStreamRef.current?.getTracks().forEach(t => t.stop())
    cameraStreamRef.current = null; setCameraOn(false)
  }, [])

  // ─── Screen ───────────────────────────────────────────────────────────────
  const startScreen = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      screenStreamRef.current = stream
      if (screenVideoRef.current) { screenVideoRef.current.srcObject = stream; await screenVideoRef.current.play() }
      setScreenOn(true)
      stream.getVideoTracks()[0].onended = () => setScreenOn(false)
    } catch { setStatusText('No se pudo capturar la pantalla') }
  }, [])

  const stopScreen = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach(t => t.stop())
    screenStreamRef.current = null; setScreenOn(false)
  }, [])

  useEffect(() => () => { stopCamera(); stopScreen() }, [stopCamera, stopScreen])

  // ─── Speak with ElevenLabs TTS ────────────────────────────────────────────
  const speak = useCallback(async (text: string) => {
    setStatus('speaking'); setStatusText('JARVIS habla...')
    try {
      const res = await fetch('/api/jarvis/tts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      if (!res.ok) throw new Error('TTS failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      if (audioRef.current) { audioRef.current.pause(); URL.revokeObjectURL(audioRef.current.src) }
      const audio = new Audio(url)
      audioRef.current = audio
      await new Promise<void>((resolve) => {
        audio.onended = () => resolve()
        audio.onerror = () => resolve()
        audio.play().catch(() => resolve())
      })
      URL.revokeObjectURL(url)
    } catch {
      // TTS failed silently — still show text
    }
    setStatus('idle'); setStatusText('Toca para hablar')
  }, [])

  // ─── Process user speech ─────────────────────────────────────────────────
  const processUserSpeech = useCallback(async (text: string) => {
    if (!text.trim()) return
    setStatus('thinking'); setStatusText('JARVIS piensa...')

    const userMsg: Message = { role: 'user', text, time: now() }
    setMessages(p => [...p, userMsg])

    // Capture frames
    const cameraBase64 = cameraVideoRef.current && cameraOn ? captureFrame(cameraVideoRef.current) : null
    const screenBase64 = screenVideoRef.current && screenOn ? captureFrame(screenVideoRef.current, 1280, 720) : null

    // Detect PC command
    const isPcCommand = /abr[ei]|haz clic|escrib[ei]|busca|cierra|abre|click|ejecuta|ctrl|abre el/i.test(text)

    try {
      const res = await fetch('/api/jarvis/vision-chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          cameraBase64,
          screenBase64,
          sessionId: sessionIdRef.current,
          userId: 'jose-luis',
          tenantId: 'demo-tenant',
          history: historyRef.current,
        })
      })
      const data = await res.json()
      const reply = data.reply || 'Lo siento, hubo un error.'

      // If PC command and agent connected — send to PC
      if (isPcCommand && pcConnected && wsRef.current?.readyState === 1) {
        wsRef.current.send(JSON.stringify({ type: 'task', task: text }))
        setPcRunning(true); setPcLogs([]); setPcScreenshot(null)
      }

      historyRef.current = [...historyRef.current.slice(-8),
        { role: 'user', content: text },
        { role: 'assistant', content: reply }
      ]

      setMessages(p => [...p, { role: 'jarvis', text: reply, time: now() }])
      await speak(reply)
    } catch {
      setStatus('error'); setStatusText('Error — intenta de nuevo')
    }
  }, [cameraOn, screenOn, captureFrame, speak, pcConnected])

  // ─── Speech Recognition ───────────────────────────────────────────────────
  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { setStatusText('Navegador no soporta reconocimiento de voz'); return }

    const recognition = new SR()
    recognition.lang = 'es-ES'
    recognition.continuous = false
    recognition.interimResults = false
    recognitionRef.current = recognition
    isListeningRef.current = true

    recognition.onstart = () => { setStatus('listening'); setStatusText('JARVIS escucha...') }
    recognition.onresult = (e: { results: { [0]: { [0]: { transcript: string } } } }) => {
      const transcript = e.results[0][0].transcript
      processUserSpeech(transcript)
    }
    recognition.onerror = () => { setStatus('idle'); setStatusText('Toca para hablar') }
    recognition.onend = () => {
      if (status !== 'thinking' && status !== 'speaking') {
        setStatus('idle'); setStatusText('Toca para hablar')
      }
    }
    recognition.start()
  }, [processUserSpeech, status])

  const stopListening = useCallback(() => {
    isListeningRef.current = false
    recognitionRef.current?.stop()
    setStatus('idle'); setStatusText('Toca para hablar')
  }, [])

  const toggleVoice = useCallback(async () => {
    if (status === 'idle' || status === 'error') {
      if (!cameraOn) await startCamera()
      startListening()
    } else {
      stopListening()
      audioRef.current?.pause()
    }
  }, [status, cameraOn, startCamera, startListening, stopListening])

  // ─── PC Control ───────────────────────────────────────────────────────────
  const connectPC = useCallback(() => {
    const ws = new WebSocket('ws://localhost:8765'); wsRef.current = ws
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'connected') { setPcConnected(true); addLog('✅ PC conectada') }
        else if (msg.type === 'status' && msg.message) addLog(msg.message)
        else if (msg.type === 'thinking') addLog(`🧠 ${msg.reasoning}`)
        else if (msg.type === 'action' && msg.action) {
          const a = msg.action
          addLog(a.type === 'click' ? `🖱️ Click (${a.x},${a.y})` : a.type === 'type' ? `⌨️ "${a.text}"` : `⚙️ ${a.type}`)
        }
        else if (msg.type === 'screenshot' && msg.data) setPcScreenshot(msg.data)
        else if (msg.type === 'done') { addLog(msg.message || '✅ Listo'); setPcRunning(false) }
        else if (msg.type === 'error') { addLog(`❌ ${msg.message}`); setPcRunning(false) }
      } catch { /* ignore */ }
    }
    ws.onerror = () => { addLog('❌ Error — ¿está node index.js corriendo?'); setPcConnected(false) }
    ws.onclose = () => { setPcConnected(false); setPcRunning(false) }
  }, [])

  const addLog = (t: string) => setPcLogs(p => [...p.slice(-50), t])

  const sendPcTask = () => {
    if (!pcTask.trim() || !wsRef.current || wsRef.current.readyState !== 1) return
    setPcRunning(true); setPcLogs([]); setPcScreenshot(null)
    addLog(`🚀 ${pcTask}`)
    wsRef.current.send(JSON.stringify({ type: 'task', task: pcTask }))
    setPcTask('')
  }

  // ─── Redesign ─────────────────────────────────────────────────────────────
  const applyRedesign = useCallback(async () => {
    setRedesigning(true)
    try {
      await fetch('/api/jarvis/redesign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: redesignUrl || undefined, instruction: redesignNote || 'Hazlo más futurista' })
      })
      setMessages(p => [...p, { role: 'jarvis', text: '✨ Diseño actualizado.', time: now() }])
      setShowRedesign(false); setRedesignUrl(''); setRedesignNote('')
    } catch { /* ignore */ }
    setRedesigning(false)
  }, [redesignUrl, redesignNote])

  const isActive = status !== 'idle' && status !== 'error'
  const btnColor = status === 'listening' ? '#00FF88' : status === 'speaking' ? '#00CFFF' : status === 'thinking' ? '#FFD700' : '#00CFFF'

  if (!mounted) return null

  return (
    <div style={{ height: '100vh', background: '#020B18', color: '#fff', fontFamily: "'Space Grotesk', sans-serif", display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <canvas ref={captureCanvasRef} style={{ display: 'none' }} />

      {/* Grid background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.04 }}>
        <svg width="100%" height="100%">
          <defs><pattern id="g" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0L0 0 0 60" fill="none" stroke="#00CFFF" strokeWidth="0.5" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#g)" />
        </svg>
      </div>
      <div style={{ position: 'fixed', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '700px', height: '700px', background: 'radial-gradient(ellipse, rgba(0,70,150,0.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }} />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="j-header" style={{ position: 'relative', zIndex: 10, background: 'rgba(2,11,24,0.9)', borderBottom: '1px solid rgba(0,200,255,0.1)', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '16px', backdropFilter: 'blur(24px)', flexShrink: 0 }}>
        <Link href="/dashboard" style={{ color: 'rgba(0,200,255,0.4)', textDecoration: 'none' }}>←</Link>
        <span style={{ fontWeight: 900, fontSize: '18px', letterSpacing: '0.15em', background: 'linear-gradient(135deg,#00CFFF,#0050FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>J.A.R.V.I.S</span>
        <span style={{ color: 'rgba(0,200,255,0.25)', fontSize: '11px', letterSpacing: '0.2em' }}>CONTROL TOTAL</span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '20px', alignItems: 'center', fontSize: '11px', letterSpacing: '0.1em' }}>
          {[
            { label: 'VOZ', on: isActive, color: btnColor },
            { label: 'CÁMARA', on: cameraOn, color: '#00FF88' },
            { label: 'PANTALLA', on: screenOn, color: '#9B59B6' },
            { label: 'PC', on: pcConnected, color: '#FFD700' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: s.on ? s.color : '#1a2a3a', boxShadow: s.on ? `0 0 6px ${s.color}` : 'none', transition: 'all 0.3s' }} />
              <span style={{ color: s.on ? s.color : '#2a4a6a' }}>{s.label}</span>
            </div>
          ))}
          <button onClick={() => setShowRedesign(v => !v)} style={{ padding: '4px 12px', background: 'transparent', border: '1px solid rgba(0,200,255,0.2)', borderRadius: '6px', color: '#00CFFF', cursor: 'pointer', fontSize: '11px' }}>🎨 DISEÑAR</button>
        </div>
      </div>

      {showRedesign && (
        <div style={{ position: 'relative', zIndex: 10, background: 'rgba(0,10,25,0.95)', borderBottom: '1px solid rgba(0,200,255,0.08)', padding: '12px 24px', display: 'flex', gap: '10px', alignItems: 'center', backdropFilter: 'blur(20px)' }}>
          <span style={{ color: 'rgba(0,200,255,0.5)', fontSize: '12px', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>REDISEÑAR →</span>
          <input value={redesignUrl} onChange={e => setRedesignUrl(e.target.value)} placeholder="URL de referencia" style={{ flex: 1, background: 'rgba(0,200,255,0.04)', border: '1px solid rgba(0,200,255,0.12)', borderRadius: '8px', padding: '7px 12px', color: '#fff', fontSize: '12px', outline: 'none' }} />
          <input value={redesignNote} onChange={e => setRedesignNote(e.target.value)} placeholder="Instrucción: más oscuro, neón verde, estilo Apple..." style={{ flex: 1, background: 'rgba(0,200,255,0.04)', border: '1px solid rgba(0,200,255,0.12)', borderRadius: '8px', padding: '7px 12px', color: '#fff', fontSize: '12px', outline: 'none' }} />
          <button onClick={applyRedesign} disabled={redesigning} style={{ padding: '7px 18px', background: 'linear-gradient(135deg,#0050FF,#00CFFF)', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '12px', opacity: redesigning ? 0.6 : 1 }}>
            {redesigning ? '⏳' : '✨ Aplicar'}
          </button>
        </div>
      )}

      {/* ── Grid ──────────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'grid', gridTemplateColumns: '340px 1fr 1fr', gridTemplateRows: '1fr 240px', gap: '1px', background: 'rgba(0,200,255,0.06)', overflow: 'hidden' }}>

        {/* ── JARVIS Face + Controls ────────────────────────────────────── */}
        <div className="j-face" style={{ background: '#020B18', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 24px', gridRow: '1 / 3', overflow: 'hidden' }}>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10px', letterSpacing: '0.3em', color: 'rgba(0,200,255,0.4)' }}>INTELIGENCIA ARTIFICIAL</div>
            <div style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '0.12em', background: 'linear-gradient(180deg,#fff,#00CFFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>JARVIS</div>
          </div>

          {/* Face */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: '-24px', borderRadius: '50%', background: `radial-gradient(ellipse, ${btnColor}12 0%, transparent 70%)`, transition: 'all 0.5s' }} />
            <JarvisFace status={status} />
            <div style={{ position: 'absolute', bottom: '-14px', left: '50%', transform: 'translateX(-50%)', background: `${btnColor}15`, border: `1px solid ${btnColor}50`, borderRadius: '20px', padding: '3px 16px', fontSize: '10px', letterSpacing: '0.2em', color: btnColor, whiteSpace: 'nowrap', transition: 'all 0.4s' }}>
              {statusText.toUpperCase()}
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', width: '100%' }}>

            {/* Main mic button */}
            <button onClick={toggleVoice} style={{ width: '76px', height: '76px', borderRadius: '50%', border: `2px solid ${isActive ? '#ff4444' : btnColor}`, background: isActive ? 'rgba(255,50,50,0.08)' : `${btnColor}12`, cursor: 'pointer', fontSize: '28px', boxShadow: `0 0 25px ${isActive ? '#ff444430' : btnColor + '25'}`, transition: 'all 0.3s' }}>
              {status === 'listening' ? '🎙️' : status === 'thinking' ? '⏳' : status === 'speaking' ? '🔊' : isActive ? '⏹' : '🎙️'}
            </button>

            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button onClick={cameraOn ? stopCamera : startCamera} style={{ flex: 1, padding: '7px 0', background: cameraOn ? 'rgba(0,255,136,0.08)' : 'rgba(0,200,255,0.04)', border: `1px solid ${cameraOn ? '#00FF88' : 'rgba(0,200,255,0.12)'}`, borderRadius: '10px', color: cameraOn ? '#00FF88' : 'rgba(0,200,255,0.35)', cursor: 'pointer', fontSize: '12px', transition: 'all 0.3s' }}>
                📷 {cameraOn ? 'ON' : 'OFF'}
              </button>
              <button onClick={screenOn ? stopScreen : startScreen} style={{ flex: 1, padding: '7px 0', background: screenOn ? 'rgba(155,89,182,0.08)' : 'rgba(0,200,255,0.04)', border: `1px solid ${screenOn ? '#9B59B6' : 'rgba(0,200,255,0.12)'}`, borderRadius: '10px', color: screenOn ? '#9B59B6' : 'rgba(0,200,255,0.35)', cursor: 'pointer', fontSize: '12px', transition: 'all 0.3s' }}>
                🖥️ {screenOn ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* PC button */}
            {!pcConnected
              ? <button onClick={connectPC} style={{ width: '100%', padding: '8px', background: 'rgba(255,200,0,0.06)', border: '1px solid rgba(255,200,0,0.2)', borderRadius: '10px', color: '#FFD700', cursor: 'pointer', fontSize: '12px' }}>🖱️ Conectar control de PC</button>
              : <div style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,200,0,0.06)', border: '1px solid rgba(255,200,0,0.2)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#FFD700', fontSize: '12px' }}>🖱️ PC conectada</span>
                <button onClick={() => { wsRef.current?.close(); setPcConnected(false) }} style={{ background: 'none', border: 'none', color: 'rgba(255,200,0,0.4)', cursor: 'pointer', fontSize: '12px' }}>✕</button>
              </div>
            }

            <div style={{ fontSize: '11px', color: 'rgba(0,200,255,0.3)', textAlign: 'center', lineHeight: 1.7 }}>
              {cameraOn ? '👁️ JARVIS te ve en tiempo real' : '💡 Activa la cámara para que JARVIS te vea'}<br />
              {pcConnected ? '🖱️ Puedes pedirle que haga cosas en tu PC' : '🖥️ Inicia node index.js para control de PC'}
            </div>
          </div>
        </div>

        {/* ── Camera feed ───────────────────────────────────────────────── */}
        <div className="j-panel" style={{ background: '#030D1E', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 5, display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(2,11,24,0.85)', padding: '4px 10px', borderRadius: '6px', border: `1px solid ${cameraOn ? 'rgba(0,255,136,0.3)' : 'rgba(0,200,255,0.1)'}`, fontSize: '10px', letterSpacing: '0.12em', backdropFilter: 'blur(12px)' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: cameraOn ? '#00FF88' : '#1a3a2a', boxShadow: cameraOn ? '0 0 6px #00FF88' : 'none' }} />
            <span style={{ color: cameraOn ? '#00FF88' : 'rgba(0,200,255,0.3)' }}>JARVIS TE VE</span>
          </div>
          <video ref={cameraVideoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: cameraOn ? 'block' : 'none' }} />
          {!cameraOn && (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '1px solid rgba(0,255,136,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>📷</div>
              <div style={{ fontSize: '12px', color: 'rgba(0,200,255,0.25)', letterSpacing: '0.15em' }}>CÁMARA INACTIVA</div>
              <button onClick={startCamera} style={{ padding: '7px 18px', background: 'rgba(0,255,136,0.07)', border: '1px solid rgba(0,255,136,0.25)', borderRadius: '8px', color: '#00FF88', cursor: 'pointer', fontSize: '12px' }}>Activar</button>
            </div>
          )}
        </div>

        {/* ── Screen ────────────────────────────────────────────────────── */}
        <div className="j-panel" style={{ background: '#030D1E', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 5, display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(2,11,24,0.85)', padding: '4px 10px', borderRadius: '6px', border: `1px solid ${screenOn ? 'rgba(155,89,182,0.4)' : 'rgba(0,200,255,0.1)'}`, fontSize: '10px', letterSpacing: '0.12em', backdropFilter: 'blur(12px)' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: screenOn ? '#9B59B6' : '#1a1a2a', boxShadow: screenOn ? '0 0 6px #9B59B6' : 'none' }} />
            <span style={{ color: screenOn ? '#9B59B6' : 'rgba(0,200,255,0.3)' }}>VE TU PANTALLA</span>
          </div>
          <video ref={screenVideoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'contain', display: screenOn ? 'block' : 'none' }} />
          {!screenOn && (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '1px solid rgba(155,89,182,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>🖥️</div>
              <div style={{ fontSize: '12px', color: 'rgba(155,89,182,0.4)', letterSpacing: '0.15em' }}>PANTALLA NO COMPARTIDA</div>
              <button onClick={startScreen} style={{ padding: '7px 18px', background: 'rgba(155,89,182,0.07)', border: '1px solid rgba(155,89,182,0.25)', borderRadius: '8px', color: '#9B59B6', cursor: 'pointer', fontSize: '12px' }}>Compartir</button>
            </div>
          )}
        </div>

        {/* ── Transcript ────────────────────────────────────────────────── */}
        <div className="j-panel" style={{ background: '#030D1E', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '9px 14px', borderBottom: '1px solid rgba(0,200,255,0.07)', fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(0,200,255,0.35)', display: 'flex', justifyContent: 'space-between' }}>
            <span>💬 CONVERSACIÓN</span>
            <span>{messages.length} MSG</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {messages.length === 0
              ? <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '30px', textAlign: 'center', color: 'rgba(0,200,255,0.2)' }}>
                <div style={{ fontSize: '32px' }}>🎙️</div>
                <div style={{ fontSize: '11px', letterSpacing: '0.15em', lineHeight: 1.8 }}>TOCA EL BOTÓN Y HABLA<br />JARVIS TE ESCUCHA, VE Y RESPONDE</div>
              </div>
              : messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ fontSize: '9px', color: 'rgba(0,200,255,0.25)', marginBottom: '3px', letterSpacing: '0.1em' }}>
                    {m.role === 'user' ? 'TÚ' : 'JARVIS'} · {m.time}
                  </div>
                  <div style={{ maxWidth: '90%', background: m.role === 'user' ? 'rgba(0,100,255,0.1)' : 'rgba(0,200,255,0.05)', border: `1px solid ${m.role === 'user' ? 'rgba(0,100,255,0.2)' : 'rgba(0,200,255,0.1)'}`, borderRadius: '12px', padding: '7px 12px', fontSize: '13px', lineHeight: 1.6, color: m.role === 'user' ? '#90c0ff' : '#b0e8ff' }}>
                    {m.text}
                  </div>
                </div>
              ))
            }
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ── PC Control ────────────────────────────────────────────────── */}
        <div className="j-panel" style={{ background: '#030D1E', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '9px 14px', borderBottom: '1px solid rgba(255,200,0,0.07)', fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(255,200,0,0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🖱️ COMPUTER USE</span>
            {pcConnected && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#FFD700', boxShadow: '0 0 6px #FFD700' }} />}
          </div>
          {pcScreenshot && (
            <div style={{ height: '70px', overflow: 'hidden', borderBottom: '1px solid rgba(255,200,0,0.05)', position: 'relative' }}>
              <img src={`data:image/jpeg;base64,${pcScreenshot}`} alt="PC" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75 }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, #030D1E 100%)' }} />
            </div>
          )}
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 12px', fontFamily: 'monospace', fontSize: '11px' }}>
            {pcLogs.length === 0
              ? <div style={{ color: 'rgba(255,200,0,0.2)', lineHeight: 1.8, paddingTop: '4px' }}>
                {pcConnected ? 'Listo. Escribe o dile por voz qué hacer.' : 'Inicia el agente:\nnode jarvis/computer-use/index.js'}
              </div>
              : pcLogs.slice(-14).map((l, i) => (
                <div key={i} style={{ lineHeight: 1.9, color: l.startsWith('✅') ? '#00FF88' : l.startsWith('❌') ? '#ff6b6b' : l.startsWith('🧠') ? '#FFD700' : l.startsWith('🖱️') || l.startsWith('⌨️') ? '#00CFFF' : 'rgba(255,200,0,0.45)' }}>{l}</div>
              ))
            }
          </div>
          <div style={{ padding: '8px 10px', borderTop: '1px solid rgba(255,200,0,0.07)', display: 'flex', gap: '6px' }}>
            <input value={pcTask} onChange={e => setPcTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendPcTask()} placeholder={pcConnected ? 'Tarea para JARVIS en tu PC...' : 'Conecta el agente primero'} disabled={!pcConnected || pcRunning} style={{ flex: 1, background: 'rgba(255,200,0,0.03)', border: '1px solid rgba(255,200,0,0.1)', borderRadius: '8px', padding: '7px 10px', color: '#fff', fontSize: '12px', outline: 'none', fontFamily: 'inherit' }} />
            <button onClick={sendPcTask} disabled={!pcConnected || pcRunning || !pcTask.trim()} style={{ width: '34px', height: '34px', background: pcConnected && !pcRunning ? 'rgba(255,200,0,0.12)' : 'transparent', border: '1px solid rgba(255,200,0,0.15)', borderRadius: '8px', color: '#FFD700', cursor: pcConnected ? 'pointer' : 'not-allowed', fontSize: '14px' }}>
              {pcRunning ? '⏳' : '▶'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
