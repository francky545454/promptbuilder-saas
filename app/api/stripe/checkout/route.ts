import { createClient } from '@/lib/supabase/server'
import { stripe, PACK } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: user.email,
    line_items: [{
      price: process.env.STRIPE_PRICE_ID,
      quantity: 1
    }],
    metadata: { user_id: user.id },
    success_url: `${appUrl}/buy/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/buy`,
    locale: 'fr',
  })

  return NextResponse.json({ url: session.url })
}
