'use client'

import { useState, useEffect, useRef } from 'react'

type Message = {
  type: 'status' | 'error' | 'done' | 'thinking' | 'action' | 'screenshot' | 'connected'
  message?: string
  reasoning?: string
  progress?: string
  action?: { type: string; x?: number; y?: number; text?: string; key?: string }
  data?: string
}

export default function ComputerUsePage() {
  const [connected, setConnected] = useState(false)
  const [task, setTask] = useState('')
  const [running, setRunning] = useState(false)
  const [logs, setLogs] = useState<{ text: string; type: string }[]>([])
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  function addLog(text: string, type = 'info') {
    setLogs(prev => [...prev, { text, type }])
  }

  function connect() {
    try {
      const ws = new WebSocket('ws://localhost:8765')
      wsRef.current = ws

      ws.onopen = () => {
        addLog('🔗 Conectando con JARVIS Computer Use...', 'info')
      }

      ws.onmessage = (event) => {
        try {
          const msg: Message = JSON.parse(event.data)

          if (msg.type === 'connected') {
            setConnected(true)
            addLog('✅ JARVIS Computer Use conectado y listo', 'success')
          } else if (msg.type === 'status' && msg.message) {
            addLog(msg.message, 'info')
          } else if (msg.type === 'thinking') {
            addLog(`🧠 ${msg.reasoning}`, 'thinking')
            if (msg.progress) addLog(`📋 Progreso: ${msg.progress}`, 'progress')
          } else if (msg.type === 'action' && msg.action) {
            const a = msg.action
            if (a.type === 'click') addLog(`🖱️ Click en (${a.x}, ${a.y})`, 'action')
            else if (a.type === 'type') addLog(`⌨️ Escribiendo: "${a.text}"`, 'action')
            else if (a.type === 'key') addLog(`⌨️ Tecla: ${a.key}`, 'action')
            else addLog(`⚙️ Acción: ${a.type}`, 'action')
          } else if (msg.type === 'screenshot' && msg.data) {
            setScreenshot(msg.data)
          } else if (msg.type === 'done' && msg.message) {
            addLog(msg.message, 'success')
            setRunning(false)
          } else if (msg.type === 'error' && msg.message) {
            addLog(msg.message, 'error')
            setRunning(false)
          }
        } catch {
          addLog('Mensaje inválido recibido', 'error')
        }
      }

      ws.onerror = () => {
        addLog('❌ Error de conexión. ¿Está corriendo el agente?', 'error')
        setConnected(false)
      }

      ws.onclose = () => {
        setConnected(false)
        setRunning(false)
        addLog('🔌 Desconectado del agente', 'info')
      }
    } catch {
      addLog('Error al conectar WebSocket', 'error')
    }
  }

  function disconnect() {
    wsRef.current?.close()
    wsRef.current = null
    setConnected(false)
  }

  function sendTask() {
    if (!task.trim() || !wsRef.current || wsRef.current.readyState !== 1) return
    setRunning(true)
    setLogs([])
    setScreenshot(null)
    addLog(`🚀 Enviando tarea: ${task}`, 'info')
    wsRef.current.send(JSON.stringify({ type: 'task', task }))
  }

  function requestScreenshot() {
    if (!wsRef.current || wsRef.current.readyState !== 1) return
    wsRef.current.send(JSON.stringify({ type: 'screenshot' }))
  }

  const examples = [
    'Abre el Bloc de Notas y escribe "Hola desde JARVIS"',
    'Busca en Google Chrome "noticias de tecnología"',
    'Toma un screenshot de la pantalla',
    'Abre la Calculadora y calcula 123 × 456',
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-purple-400">🖥️ Computer Use</h1>
          <p className="text-gray-400 mt-1">JARVIS controla tu PC con IA — clicks, teclado, y más</p>
        </div>

        {/* Setup Instructions */}
        {!connected && (
          <div className="bg-gray-900 border border-yellow-500/30 rounded-xl p-5 mb-6">
            <h2 className="text-yellow-400 font-semibold mb-3">⚠️ Primero inicia el agente local</h2>
            <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm">
              <p className="text-gray-400 mb-2"># 1. Instala dependencias (solo la primera vez)</p>
              <p className="text-green-400">cd &quot;C:\Users\KAPIT\Desktop\claude code\jarvis\computer-use&quot;</p>
              <p className="text-green-400 mb-3">npm install</p>
              <p className="text-gray-400 mb-2"># 2. Inicia el agente con tu API key</p>
              <p className="text-green-400">set ANTHROPIC_API_KEY=tu-api-key &amp;&amp; node index.js</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Controls */}
          <div className="space-y-4">
            {/* Connection */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-200">Agente Local</h2>
                <div className={`flex items-center gap-2 text-sm ${connected ? 'text-green-400' : 'text-gray-500'}`}>
                  <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
                  {connected ? 'Conectado' : 'Desconectado'}
                </div>
              </div>
              {!connected ? (
                <button
                  onClick={connect}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
                >
                  Conectar Agente
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={requestScreenshot}
                    className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                  >
                    📸 Screenshot
                  </button>
                  <button
                    onClick={disconnect}
                    className="py-2 px-4 bg-red-800 hover:bg-red-700 rounded-lg text-sm transition-colors"
                  >
                    Desconectar
                  </button>
                </div>
              )}
            </div>

            {/* Task Input */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
              <h2 className="font-semibold text-gray-200 mb-3">Dar tarea a JARVIS</h2>
              <textarea
                value={task}
                onChange={e => setTask(e.target.value)}
                placeholder="Ej: Abre Chrome y busca el clima de Lima..."
                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500"
                rows={3}
                disabled={!connected || running}
                onKeyDown={e => e.key === 'Enter' && e.ctrlKey && sendTask()}
              />
              <button
                onClick={sendTask}
                disabled={!connected || running || !task.trim()}
                className="w-full mt-3 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-medium transition-colors"
              >
                {running ? '⏳ Ejecutando...' : '▶ Ejecutar tarea'}
              </button>
              <p className="text-xs text-gray-500 mt-2">Ctrl+Enter para ejecutar</p>
            </div>

            {/* Examples */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
              <h2 className="font-semibold text-gray-200 mb-3">Ejemplos</h2>
              <div className="space-y-2">
                {examples.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => setTask(ex)}
                    disabled={!connected || running}
                    className="w-full text-left text-sm text-gray-400 hover:text-purple-300 hover:bg-gray-800 rounded-lg p-2 transition-colors disabled:opacity-50"
                  >
                    → {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Screenshot + Logs */}
          <div className="space-y-4">
            {/* Screenshot */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              <h2 className="font-semibold text-gray-200 mb-3">Vista de Pantalla</h2>
              {screenshot ? (
                <img
                  src={`data:image/jpeg;base64,${screenshot}`}
                  alt="Pantalla de JARVIS"
                  className="w-full rounded-lg border border-gray-700"
                />
              ) : (
                <div className="w-full h-48 bg-gray-800 rounded-lg flex items-center justify-center text-gray-600">
                  <div className="text-center">
                    <p className="text-2xl mb-2">🖥️</p>
                    <p className="text-sm">Aquí aparecerá la pantalla</p>
                  </div>
                </div>
              )}
            </div>

            {/* Logs */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              <h2 className="font-semibold text-gray-200 mb-3">Log de actividad</h2>
              <div className="h-64 overflow-y-auto space-y-1 font-mono text-xs">
                {logs.length === 0 ? (
                  <p className="text-gray-600">Sin actividad aún...</p>
                ) : (
                  logs.map((log, i) => (
                    <div
                      key={i}
                      className={`px-2 py-1 rounded ${
                        log.type === 'error' ? 'text-red-400' :
                        log.type === 'success' ? 'text-green-400' :
                        log.type === 'thinking' ? 'text-yellow-300' :
                        log.type === 'action' ? 'text-blue-300' :
                        log.type === 'progress' ? 'text-purple-300' :
                        'text-gray-400'
                      }`}
                    >
                      {log.text}
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
