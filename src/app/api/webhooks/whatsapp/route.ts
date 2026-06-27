// POST /api/webhooks/whatsapp — Webhook de Twilio/WhatsApp Business
// GET  — Verificación de webhook
import { NextRequest, NextResponse } from 'next/server'
import { respondToCustomer } from '@/lib/jarvis/agents/sales'

export async function GET(req: NextRequest) {
  // Verificación de webhook de WhatsApp Business API
  const mode = req.nextUrl.searchParams.get('hub.mode')
  const token = req.nextUrl.searchParams.get('hub.verify_token')
  const challenge = req.nextUrl.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Twilio
    if (body.Body && body.From) {
      const response = await respondToCustomer({
        customerMessage: body.Body,
        conversationHistory: [],
        businessName: 'JARVIS',
        businessContext: 'Sistema de IA empresarial',
        tone: 'friendly',
      })

      // Respuesta en formato TwiML para Twilio
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${response.response}</Message>
</Response>`
      return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } })
    }

    // Meta WhatsApp Business API
    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0]
      const change = entry?.changes?.[0]
      const message = change?.value?.messages?.[0]

      if (message?.type === 'text') {
        const customerMsg = message.text.body
        const phoneNumber = message.from

        // Buscar tenant/cliente por número de teléfono
        // En producción: query a Supabase
        const response = await respondToCustomer({
          customerMessage: customerMsg,
          conversationHistory: [],
          businessName: 'JARVIS',
          businessContext: 'Asistente empresarial',
          tone: 'friendly',
        })

        // Enviar respuesta via Meta API
        const waToken = process.env.META_ACCESS_TOKEN
        const phoneId = change?.value?.metadata?.phone_number_id

        if (waToken && phoneId) {
          await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${waToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: phoneNumber,
              type: 'text',
              text: { body: response.response },
            }),
          })
        }
      }

      return NextResponse.json({ status: 'ok' })
    }

    return NextResponse.json({ status: 'ignored' })
  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
