import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { PLANS, type PlanId } from '@/lib/stripe/plans'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-05-28.basil'
})

export async function POST(req: NextRequest) {
  try {
    const { planId, email, userId } = await req.json()

    const plan = PLANS[planId as PlanId]
    if (!plan) {
      return NextResponse.json({ error: 'Plan no válido' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: plan.currency,
            product_data: {
              name: `JARVIS ${plan.name}`,
              description: plan.features.join(' • '),
              metadata: { planId }
            },
            unit_amount: plan.price * 100,
            recurring: { interval: plan.interval }
          },
          quantity: 1
        }
      ],
      metadata: { userId, planId },
      success_url: `${appUrl}/dashboard?payment=success&plan=${planId}`,
      cancel_url: `${appUrl}/pricing?payment=cancelled`,
      allow_promotion_codes: true
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Error al crear sesión de pago' }, { status: 500 })
  }
}
