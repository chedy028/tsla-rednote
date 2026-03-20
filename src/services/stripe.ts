/**
 * Stripe Checkout Service
 * Opens Stripe Checkout for subscription payments.
 * Uses Supabase Edge Function as backend to create checkout sessions.
 */

type Plan = 'basic' | 'pro'
type BillingPeriod = 'monthly' | 'annual'

// Supabase project URL
const SUPABASE_URL = 'https://aiqpmtroekgrzyjcqkbl.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpcXBtdHJvZWtncnp5amNxa2JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMjg2MTUsImV4cCI6MjA4MjgwNDYxNX0.Im4Kq8FzBV0ydSSkqcgcMxmP_KWZLL2OONFxeL8ppe8'

/**
 * Redirect user to Stripe Checkout for subscription.
 */
export async function openStripeCheckout(plan: Plan, billingPeriod: BillingPeriod): Promise<void> {
  try {
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/create-stripe-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ plan, billingPeriod }),
    })

    const data = await resp.json()

    if (!resp.ok || !data.url) {
      console.error('Stripe checkout error:', data)
      throw new Error(data.error || 'Failed to create checkout session')
    }

    // Redirect to Stripe Checkout
    window.location.href = data.url
  } catch (err) {
    console.error('Failed to open Stripe checkout:', err)
    throw err
  }
}

/**
 * Check if payment was successful (from URL params after redirect back).
 */
export function checkPaymentStatus(): 'success' | 'cancelled' | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const payment = params.get('payment')
  if (payment === 'success') return 'success'
  if (payment === 'cancelled') return 'cancelled'
  return null
}
