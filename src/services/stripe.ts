/**
 * Stripe Checkout Service
 * Opens Stripe Checkout for subscription payments.
 * Uses Supabase Edge Function as backend to create checkout sessions.
 */

type Plan = 'basic' | 'pro'
type BillingPeriod = 'monthly' | 'annual'

export interface SubscriptionStatus {
  isActive: boolean
  plan: string | null
  expiresAt: string | null
}

// Supabase project URL
const SUPABASE_URL = 'https://aiqpmtroekgrzyjcqkbl.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpcXBtdHJvZWtncnp5amNxa2JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMjg2MTUsImV4cCI6MjA4MjgwNDYxNX0.Im4Kq8FzBV0ydSSkqcgcMxmP_KWZLL2OONFxeL8ppe8'

const SUB_STORAGE_KEY = 'tsla_subscription'

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
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
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
 * If session_id is present, verify the checkout with the server.
 */
export async function handlePaymentRedirect(): Promise<SubscriptionStatus | null> {
  if (typeof window === 'undefined') return null

  const params = new URLSearchParams(window.location.search)
  const payment = params.get('payment')
  const sessionId = params.get('session_id')

  if (payment !== 'success' || !sessionId) return null

  // Verify the session with our edge function
  try {
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/check-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ session_id: sessionId }),
    })

    const data = await resp.json()

    if (data.is_active) {
      const status: SubscriptionStatus = {
        isActive: true,
        plan: data.plan || 'pro',
        expiresAt: data.expires_at || null,
      }
      // Cache subscription locally
      try { localStorage.setItem(SUB_STORAGE_KEY, JSON.stringify(status)) } catch {}
      // Clean URL params
      window.history.replaceState({}, '', window.location.pathname + window.location.hash)
      return status
    }
  } catch (err) {
    console.error('Failed to verify payment session:', err)
  }

  return null
}

/**
 * Check subscription by email (for returning users).
 */
export async function checkSubscriptionByEmail(email: string): Promise<SubscriptionStatus> {
  try {
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/check-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ email }),
    })

    const data = await resp.json()

    const status: SubscriptionStatus = {
      isActive: data.is_active || false,
      plan: data.plan || null,
      expiresAt: data.expires_at || null,
    }

    if (status.isActive) {
      try { localStorage.setItem(SUB_STORAGE_KEY, JSON.stringify(status)) } catch {}
    }

    return status
  } catch (err) {
    console.error('Failed to check subscription:', err)
    return { isActive: false, plan: null, expiresAt: null }
  }
}

/**
 * Get cached subscription status (from localStorage).
 */
export function getCachedSubscription(): SubscriptionStatus | null {
  if (typeof window === 'undefined') return null
  try {
    const cached = localStorage.getItem(SUB_STORAGE_KEY)
    if (cached) return JSON.parse(cached) as SubscriptionStatus
  } catch {}
  return null
}

/**
 * Clear cached subscription.
 */
export function clearSubscriptionCache(): void {
  try { localStorage.removeItem(SUB_STORAGE_KEY) } catch {}
}
