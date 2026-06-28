'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'

type Mode = 'idle' | 'camera' | 'screen' | 'both'
type Status = 'idle' | 'capturing' | 'analyzing' | 'ready'

interface Analysis {
  description: string
  whatISee: string
  suggestions?: string
  timestamp: Date
}

export default function VisionPage() {
  const [mode, setMode] = useState<Mode>('idle')
  const [status, setStatus] = useState<Status>('idle')
  const [question, setQuestion] = useState('')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [autoMode, setAutoMode] = useState(false)
  const [error, setError] = useState('')

  const cameraRef = useRef<HTMLVideoElement>(null)
  const screenRef = useRef<HTMLVideoElement>(null)
  const cameraStream = useRef<MediaStream | null>(null)
  const screenStream = useRef<MediaStream | null>(null)
  const autoInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const cameraCanvas = useRef<HTMLCanvasElement>(null)
  const screenCanvas = useRef<HTMLCanvasElement>(null)

  const stopAll = useCallback(() => {
    cameraStream.current?.getTracks().forEach(t => t.stop())
    screenStream.current?.getTracks().forEach(t => t.stop())
    cameraStream.current = null
    screenStream.current = null
    if (autoInterval.current) clearInterval(autoInterval.current)
    setMode('idle')
    setStatus('idle')
    setAutoMode(false)
  }, [])

  useEffect(() => () => stopAll(), [stopAll])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: false,
      })
      cameraStream.current = stream
      if (cameraRef.current) {
        cameraRef.current.srcObject = stream
        await cameraRef.current.play()
      }
      return true
    } catch (e) {
      setError('No se pudo acceder a la cámara: ' + String(e))
      return false
    }
  }

  async function startScreen() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: 1920, height: 1080 },
        audio: false,
      })
      screenStream.current = stream
      if (screenRef.current) {
        screenRef.current.srcObject = stream
        await screenRef.current.play()
      }
      // Auto-stop when user stops sharing
      stream.getVideoTracks()[0].onended = () => {
        screenStream.current = null
        if (mode === 'screen') setMode('idle')
      }
      return true
    } catch (e) {
      setError('No se pudo capturar la pantalla: ' + String(e))
      return false
    }
  }

  async function activateMode(newMode: Mode) {
    setError('')
    stopAll()

    if (newMode === 'camera' || newMode === 'both') {
      const ok = await startCamera()
      if (!ok) return
    }
    if (newMode === 'screen' || newMode === 'both') {
      const ok = await startScreen()
      if (!ok) return
    }

    setMode(newMode)
    setStatus('ready')
  }

  function captureFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement): string | null {
    if (!video.videoWidth) return null
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(video, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
  }

  async function analyzeNow(customQuestion?: string) {
    if (status === 'analyzing') return
    setStatus('analyzing')
    setError('')

    const frames: { type: string; base64: string }[] = []

    if ((mode === 'camera' || mode === 'both') && cameraRef.current && cameraCanvas.current) {
      const frame = captureFrame(cameraRef.current, cameraCanvas.current)
      if (frame) frames.push({ type: 'camera', base64: frame })
    }

    if ((mode === 'screen' || mode === 'both') && screenRef.current && screenCanvas.current) {
      const frame = captureFrame(screenRef.current, screenCanvas.current)
      if (frame) frames.push({ type: 'screen', base64: frame })
    }

    if (frames.length === 0) {
      setError('No hay imagen para analizar')
      setStatus('ready')
      return
    }

    try {
      const res = await fetch('/api/jarvis/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frames,
          question: customQuestion || question || '¿Qué ves? Describe todo lo que observas.',
          tenantId: 'demo-tenant',
          mode,
        }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setAnalysis({
        description: data.description,
        whatISee: data.whatISee,
        suggestions: data.suggestions,
        timestamp: new Date(),
      })
    } catch (e) {
      setError('Error al analizar: ' + String(e))
    } finally {
      setStatus('ready')
    }
  }

  function toggleAutoMode() {
    if (autoMode) {
      if (autoInterval.current) clearInterval(autoInterval.current)
      setAutoMode(false)
    } else {
      setAutoMode(true)
      analyzeNow('Analiza brevemente qué está pasando en la pantalla y con la persona.')
      autoInterval.current = setInterval(() => {
        analyzeNow('Actualización: ¿qué cambió? ¿qué está haciendo Jose Luis ahora?')
      }, 30000)
    }
  }

  const modeColor = {
    idle: '#555',
    camera: '#00FF88',
    screen: '#00F5FF',
    both: '#FFD700',
  }[mode]

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: "'Space Grotesk', sans-serif", color: '#fff', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: 'rgba(0,0,0,0.8)', borderBottom: '1px solid rgba(0,245,255,0.15)', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: '16px', backdropFilter: 'blur(20px)', flexShrink: 0 }}>
        <Link href="/dashboard" style={{ color: '#666', textDecoration: 'none', fontSize: '20px' }}>←</Link>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>👁️ JARVIS Visión</h1>
          <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>JARVIS te ve y ve tu pantalla en tiempo real</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {autoMode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FFD700', fontSize: '13px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFD700', boxShadow: '0 0 8px #FFD700', animation: 'pulse 1s infinite' }} />
              Auto-análisis activo
            </div>
          )}
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: modeColor, boxShadow: `0 0 8px ${modeColor}` }} />
          <span style={{ color: '#666', fontSize: '13px' }}>
            {mode === 'idle' ? 'Sin visión' : mode === 'camera' ? 'Cámara activa' : mode === 'screen' ? 'Pantalla activa' : 'Cámara + Pantalla'}
          </span>
          {mode !== 'idle' && (
            <button onClick={stopAll} style={{ padding: '6px 14px', background: 'rgba(255,50,50,0.15)', border: '1px solid rgba(255,50,50,0.3)', borderRadius: '8px', color: '#ff6b6b', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
              ⏹ Detener
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left: Controls + Video */}
        <div style={{ width: '420px', flexShrink: 0, padding: '24px', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>

          {/* Mode buttons */}
          <div>
            <p style={{ color: '#666', fontSize: '13px', marginBottom: '12px' }}>Selecciona qué ve JARVIS:</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { mode: 'camera' as Mode, icon: '📷', label: 'Solo cámara', desc: 'JARVIS te ve a ti', color: '#00FF88' },
                { mode: 'screen' as Mode, icon: '🖥️', label: 'Solo pantalla', desc: 'JARVIS ve tu PC', color: '#00F5FF' },
                { mode: 'both' as Mode, icon: '👁️', label: 'Todo', desc: 'Cámara + pantalla', color: '#FFD700' },
              ].map(opt => (
                <button key={opt.mode} onClick={() => activateMode(opt.mode)} style={{
                  padding: '14px', borderRadius: '12px', border: `1px solid ${mode === opt.mode ? opt.color : 'rgba(255,255,255,0.08)'}`,
                  background: mode === opt.mode ? `${opt.color}15` : 'rgba(255,255,255,0.03)',
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                  gridColumn: opt.mode === 'both' ? 'span 2' : undefined,
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>{opt.icon}</div>
                  <div style={{ color: mode === opt.mode ? opt.color : '#fff', fontWeight: '700', fontSize: '14px' }}>{opt.label}</div>
                  <div style={{ color: '#555', fontSize: '12px' }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Camera preview */}
          {(mode === 'camera' || mode === 'both') && (
            <div>
              <p style={{ color: '#666', fontSize: '12px', marginBottom: '8px' }}>📷 Tu cámara</p>
              <video ref={cameraRef} autoPlay muted playsInline style={{ width: '100%', borderRadius: '12px', border: '1px solid rgba(0,255,136,0.3)', background: '#000' }} />
            </div>
          )}

          {/* Screen preview */}
          {(mode === 'screen' || mode === 'both') && (
            <div>
              <p style={{ color: '#666', fontSize: '12px', marginBottom: '8px' }}>🖥️ Tu pantalla</p>
              <video ref={screenRef} autoPlay muted playsInline style={{ width: '100%', borderRadius: '12px', border: '1px solid rgba(0,245,255,0.3)', background: '#000' }} />
            </div>
          )}

          {/* Auto mode */}
          {mode !== 'idle' && (
            <button onClick={toggleAutoMode} style={{
              padding: '12px', borderRadius: '12px',
              border: `1px solid ${autoMode ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.1)'}`,
              background: autoMode ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.03)',
              cursor: 'pointer', color: autoMode ? '#FFD700' : '#666',
              fontSize: '13px', fontFamily: 'inherit', textAlign: 'left',
            }}>
              {autoMode ? '⏸ Desactivar auto-análisis' : '🔄 Auto-análisis cada 30 seg'}
              <div style={{ color: '#444', fontSize: '11px', marginTop: '4px' }}>
                JARVIS observa continuamente y guarda como memoria
              </div>
            </button>
          )}

          {error && (
            <div style={{ background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.3)', borderRadius: '10px', padding: '12px', color: '#ff6b6b', fontSize: '13px' }}>
              {error}
            </div>
          )}

          {/* Hidden canvases */}
          <canvas ref={cameraCanvas} style={{ display: 'none' }} />
          <canvas ref={screenCanvas} style={{ display: 'none' }} />
        </div>

        {/* Right: Analysis */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Question input */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '12px' }}>
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && mode !== 'idle' && analyzeNow()}
              placeholder="Pregúntale a JARVIS sobre lo que ve... (Enter para enviar)"
              style={{
                flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '14px',
                outline: 'none', fontFamily: 'inherit',
              }}
            />
            <button
              onClick={() => analyzeNow()}
              disabled={mode === 'idle' || status === 'analyzing'}
              style={{
                padding: '12px 24px', borderRadius: '10px', border: 'none',
                background: mode === 'idle' ? '#333' : 'linear-gradient(135deg, #00F5FF, #0080FF)',
                color: mode === 'idle' ? '#666' : '#000', fontWeight: '700', cursor: mode === 'idle' ? 'not-allowed' : 'pointer',
                fontSize: '14px', fontFamily: 'inherit', whiteSpace: 'nowrap',
              }}
            >
              {status === 'analyzing' ? '⏳ Analizando...' : '👁️ Analizar'}
            </button>
          </div>

          {/* Analysis result */}
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
            {!analysis && mode === 'idle' && (
              <div style={{ textAlign: 'center', marginTop: '80px', color: '#333' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>👁️</div>
                <div style={{ fontSize: '18px', color: '#444', marginBottom: '8px' }}>JARVIS puede verte y ver tu pantalla</div>
                <div style={{ fontSize: '13px', color: '#333' }}>Selecciona un modo arriba para comenzar</div>
              </div>
            )}

            {!analysis && mode !== 'idle' && (
              <div style={{ textAlign: 'center', marginTop: '80px', color: '#333' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>
                  {status === 'analyzing' ? '🔍' : '✅'}
                </div>
                <div style={{ fontSize: '16px', color: '#444' }}>
                  {status === 'analyzing' ? 'JARVIS está analizando...' : 'Listo. Haz una pregunta o presiona Analizar'}
                </div>
              </div>
            )}

            {analysis && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #00F5FF20, #0080FF40)', border: '1px solid rgba(0,245,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🤖</div>
                  <div>
                    <div style={{ fontWeight: '700', color: '#00F5FF' }}>JARVIS</div>
                    <div style={{ color: '#444', fontSize: '12px' }}>{analysis.timestamp.toLocaleTimeString('es-PE')}</div>
                  </div>
                </div>

                {analysis.whatISee && (
                  <div style={{ background: 'rgba(0,245,255,0.05)', border: '1px solid rgba(0,245,255,0.15)', borderRadius: '14px', padding: '20px' }}>
                    <div style={{ color: '#00F5FF', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>👁️ LO QUE VEO</div>
                    <div style={{ color: '#ddd', fontSize: '15px', lineHeight: '1.7' }}>{analysis.whatISee}</div>
                  </div>
                )}

                {analysis.description && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '20px' }}>
                    <div style={{ color: '#aaa', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>📋 ANÁLISIS</div>
                    <div style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.7' }}>{analysis.description}</div>
                  </div>
                )}

                {analysis.suggestions && (
                  <div style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: '14px', padding: '20px' }}>
                    <div style={{ color: '#00FF88', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>💡 SUGERENCIAS</div>
                    <div style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.7' }}>{analysis.suggestions}</div>
                  </div>
                )}

                <button
                  onClick={() => analyzeNow()}
                  disabled={status === 'analyzing'}
                  style={{
                    padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
                    background: 'transparent', color: '#666', cursor: 'pointer',
                    fontSize: '13px', fontFamily: 'inherit',
                  }}
                >
                  🔄 Actualizar análisis
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
