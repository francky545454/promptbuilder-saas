import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
})

export const PACK = {
  credits: 500,
  priceEur: 19.99,
  name: 'Pack 500 Prompts'
}
