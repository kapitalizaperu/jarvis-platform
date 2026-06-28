import { NextRequest, NextResponse } from 'next/server'
import { orchestrate } from '@/lib/jarvis/orchestrator'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, tenantId = 'demo-tenant', voiceId } = body

    if (!message) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 })
    }

    const elevenKey = process.env.ELEVENLABS_API_KEY
    if (!elevenKey) {
      return NextResponse.json({ error: 'ElevenLabs not configured' }, { status: 500 })
    }

    // 1. Get JARVIS text response
    let textResponse = ''
    try {
      const result = await orchestrate(
        [{ role: 'user', content: message }],
        { tenantId, channel: 'web', agentType: 'orchestrator' }
      )
      textResponse = result.response
    } catch (orchErr) {
      console.error('Orchestrator error:', orchErr)
      return NextResponse.json({ error: 'Orchestrator failed', detail: String(orchErr) }, { status: 500 })
    }

    // 2. Convert to speech via ElevenLabs
    const selectedVoice = voiceId || 'pNInz6obpgDQGcFmaJgB' // Adam - deep, professional

    try {
      const elevenRes = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': elevenKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
          },
          body: JSON.stringify({
            text: textResponse,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.8,
              style: 0.2,
              use_speaker_boost: true,
            },
          }),
        }
      )

      if (!elevenRes.ok) {
        const err = await elevenRes.text()
        console.error('ElevenLabs error:', err)
        // Return text even if audio fails
        return NextResponse.json({ text: textResponse, audioError: err })
      }

      const audioBuffer = await elevenRes.arrayBuffer()
      const audioBase64 = Buffer.from(audioBuffer).toString('base64')

      return NextResponse.json({
        text: textResponse,
        audio: audioBase64,
        audioFormat: 'audio/mpeg',
      })
    } catch (elevenErr) {
      console.error('ElevenLabs fetch error:', elevenErr)
      return NextResponse.json({ text: textResponse, audioError: String(elevenErr) })
    }
  } catch (err) {
    console.error('Voice route error:', err)
    return NextResponse.json({ error: 'Internal error', detail: String(err) }, { status: 500 })
  }
}
