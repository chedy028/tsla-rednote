/**
 * Supabase Auth Service for H5 Web Users
 * Provides magic link (email OTP) authentication via Supabase Auth.
 *
 * AUTH FLOW:
 *   1. User enters email → sendMagicLink(email)
 *   2. User clicks link in email → handleAuthCallback()
 *   3. Supabase Auth issues JWT → stored in localStorage
 *   4. All Edge Function calls include: Authorization: Bearer <jwt>
 *
 * For WeChat mini program users, the existing auth.ts service is used instead.
 */

// ─── Configuration ───────────────────────────────────────────────────────────

const SUPABASE_URL = 'https://aiqpmtroekgrzyjcqkbl.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpcXBtdHJvZWtncnp5amNxa2JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMjg2MTUsImV4cCI6MjA4MjgwNDYxNX0.Im4Kq8FzBV0ydSSkqcgcMxmP_KWZLL2OONFxeL8ppe8'

const AUTH_STORAGE_KEY = 'supabase_auth_session'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuthSession {
  access_token: string
  refresh_token: string
  expires_at: number // Unix timestamp
  user: {
    id: string
    email: string
  }
}

// ─── Magic Link Authentication ───────────────────────────────────────────────

/**
 * Send a magic link (OTP) to the user's email.
 * User clicks the link → redirected back with tokens in URL hash.
 */
export async function sendMagicLink(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const resp = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        email,
        options: {
          shouldCreateUser: true,
        },
      }),
    })

    if (!resp.ok) {
      const data = await resp.json()
      return { success: false, error: data.error_description || data.msg || 'Failed to send magic link' }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Handle the auth callback after user clicks magic link.
 * Extracts tokens from URL hash fragment and stores the session.
 * Call this on page load.
 */
export function handleAuthCallback(): AuthSession | null {
  if (typeof window === 'undefined') return null

  // Supabase redirects with tokens in the URL hash:
  // #access_token=...&refresh_token=...&expires_in=...&token_type=bearer&type=magiclink
  const hash = window.location.hash.substring(1)
  if (!hash) return null

  const params = new URLSearchParams(hash)
  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  const expiresIn = params.get('expires_in')
  const type = params.get('type')

  if (!accessToken || !refreshToken || type !== 'magiclink') return null

  // Decode the JWT to get user info
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]))
    const session: AuthSession = {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: Math.floor(Date.now() / 1000) + parseInt(expiresIn || '3600', 10),
      user: {
        id: payload.sub,
        email: payload.email,
      },
    }

    // Store session
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))

    // Clean URL hash
    window.history.replaceState(null, '', window.location.pathname + window.location.search)

    return session
  } catch {
    return null
  }
}

// ─── Session Management ──────────────────────────────────────────────────────

/**
 * Get the current auth session from localStorage.
 * Returns null if not logged in or session expired.
 */
export function getSession(): AuthSession | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!stored) return null

    const session: AuthSession = JSON.parse(stored)

    // Check if expired (with 60s buffer)
    if (session.expires_at < Math.floor(Date.now() / 1000) + 60) {
      // Try to refresh
      refreshSession(session.refresh_token).catch(() => {})
      // Return current session while refresh is in flight
      // If truly expired, next call will get the refreshed session
      if (session.expires_at < Math.floor(Date.now() / 1000)) {
        return null
      }
    }

    return session
  } catch {
    return null
  }
}

/**
 * Get the access token for API calls.
 * Returns null if not authenticated.
 */
export function getAccessToken(): string | null {
  const session = getSession()
  return session?.access_token ?? null
}

/**
 * Get the authenticated user's email.
 */
export function getUserEmail(): string | null {
  const session = getSession()
  return session?.user.email ?? null
}

/**
 * Check if user is authenticated (H5 mode).
 */
export function isH5Authenticated(): boolean {
  return getSession() !== null
}

/**
 * Refresh the session using the refresh token.
 */
async function refreshSession(refreshToken: string): Promise<AuthSession | null> {
  try {
    const resp = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!resp.ok) return null

    const data = await resp.json()
    const payload = JSON.parse(atob(data.access_token.split('.')[1]))

    const session: AuthSession = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
      user: {
        id: payload.sub,
        email: payload.email,
      },
    }

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
    return session
  } catch {
    return null
  }
}

/**
 * Log out — clear stored session.
 */
export function logoutH5(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

// ─── Authenticated Fetch ─────────────────────────────────────────────────────

/**
 * Make an authenticated fetch to a Supabase Edge Function.
 * Automatically includes the user's JWT in the Authorization header.
 * Falls back to anon key if not authenticated (for public endpoints).
 */
export async function authFetch(
  functionName: string,
  body: Record<string, unknown>,
): Promise<Response> {
  const token = getAccessToken() || SUPABASE_ANON_KEY

  return fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
}
