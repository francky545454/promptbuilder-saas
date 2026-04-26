import { stripe, PACK } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (e) {
    return NextResponse.json({ error: 'Webhook signature invalide' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.user_id

    if (userId) {
      const supabase = createServiceClient()

      // Add credits
      const { data: profile } = await supabase
        .from('profiles').select('credits').eq('id', userId).single()

      if (profile) {
        await supabase.from('profiles')
          .update({ credits: profile.credits + PACK.credits, total_purchased: profile.credits + PACK.credits })
          .eq('id', userId)
      }

      // Log transaction
      await supabase.from('transactions').insert({
        user_id: userId,
        stripe_payment_id: session.payment_intent as string,
        amount_eur: PACK.priceEur,
        credits_purchased: PACK.credits,
        status: 'completed'
      })
    }
  }

  return NextResponse.json({ received: true })
}
