import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getServerSupabase } from '@/lib/auth/supabase-client'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia'
})

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = getServerSupabase()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.CheckoutSession
      const { userId, planId } = session.metadata || {}

      if (userId) {
        // Update user subscription in Supabase
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            plan: planId,
            subscription_status: 'active',
            stripe_customer_id: session.customer as string,
            subscription_id: session.subscription as string
          }
        })
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      // Find user by stripe customer ID and downgrade
      const customerId = subscription.customer as string
      console.log('Subscription cancelled for customer:', customerId)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      console.log('Payment failed for invoice:', invoice.id)
      break
    }
  }

  return NextResponse.json({ received: true })
}
