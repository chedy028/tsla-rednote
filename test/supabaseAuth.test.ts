import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// ─── JWT helpers for tests ──────────────────────────────────────────────────

function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Build a fake unsigned JWT with the given payload (signature is junk). */
function fakeJwt(payload: Record<string, unknown>): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = base64UrlEncode(JSON.stringify(payload))
  return `${header}.${body}.fake_signature`
}

// ─── Mock localStorage ──────────────────────────────────────────────────────

const store: Record<string, string> = {}
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value }),
  removeItem: vi.fn((key: string) => { delete store[key] }),
  clear: vi.fn(() => { for (const k of Object.keys(store)) delete store[k] }),
  get length() { return Object.keys(store).length },
  key: vi.fn((_i: number) => null),
}

// ─── Mock window + fetch ────────────────────────────────────────────────────

const windowMock = {
  location: {
    hash: '',
    pathname: '/',
    search: '',
    href: 'http://localhost/',
  },
  history: {
    replaceState: vi.fn(),
  },
}

// Set up globals before importing the module
vi.stubGlobal('window', windowMock)
vi.stubGlobal('localStorage', localStorageMock)
vi.stubGlobal('fetch', vi.fn())

// Now import the module under test
import {
  handleAuthCallback,
  getSession,
  getAccessToken,
  getUserEmail,
  isH5Authenticated,
  logoutH5,
  authFetch,
  type AuthSession,
} from '../src/services/supabaseAuth'

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('supabaseAuth', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    windowMock.location.hash = ''
    windowMock.location.pathname = '/'
    windowMock.location.search = ''
  })

  // ── handleAuthCallback ──────────────────────────────────────────────────

  describe('handleAuthCallback', () => {
    it('returns null when no hash', () => {
      windowMock.location.hash = ''
      expect(handleAuthCallback()).toBeNull()
    })

    it('returns null when hash has no access_token', () => {
      windowMock.location.hash = '#foo=bar'
      expect(handleAuthCallback()).toBeNull()
    })

    it('returns null when type is not magiclink', () => {
      const token = fakeJwt({ sub: 'user-1', email: 'a@b.com' })
      windowMock.location.hash = `#access_token=${token}&refresh_token=rt&expires_in=3600&type=signup`
      expect(handleAuthCallback()).toBeNull()
    })

    it('parses a valid magiclink callback and stores session', () => {
      const token = fakeJwt({ sub: 'user-1', email: 'a@b.com' })
      windowMock.location.hash =
        `#access_token=${token}&refresh_token=rt_123&expires_in=3600&type=magiclink`

      const session = handleAuthCallback()
      expect(session).not.toBeNull()
      expect(session!.access_token).toBe(token)
      expect(session!.refresh_token).toBe('rt_123')
      expect(session!.user.id).toBe('user-1')
      expect(session!.user.email).toBe('a@b.com')
      expect(session!.expires_at).toBeGreaterThan(Math.floor(Date.now() / 1000))

      // Should store in localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'supabase_auth_session',
        expect.any(String),
      )

      // Should clean URL hash
      expect(windowMock.history.replaceState).toHaveBeenCalled()
    })

    it('returns null for malformed JWT payload', () => {
      // Not valid base64 in the payload position
      windowMock.location.hash =
        '#access_token=bad.!!!.jwt&refresh_token=rt&expires_in=3600&type=magiclink'
      expect(handleAuthCallback()).toBeNull()
    })
  })

  // ── getSession ──────────────────────────────────────────────────────────

  describe('getSession', () => {
    it('returns null when nothing stored', () => {
      expect(getSession()).toBeNull()
    })

    it('returns session when valid and not expired', () => {
      const session: AuthSession = {
        access_token: 'tok',
        refresh_token: 'rt',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: { id: 'u1', email: 'a@b.com' },
      }
      store['supabase_auth_session'] = JSON.stringify(session)

      const result = getSession()
      expect(result).not.toBeNull()
      expect(result!.user.email).toBe('a@b.com')
    })

    it('returns null when session is expired', () => {
      const session: AuthSession = {
        access_token: 'tok',
        refresh_token: 'rt',
        expires_at: Math.floor(Date.now() / 1000) - 100, // expired
        user: { id: 'u1', email: 'a@b.com' },
      }
      store['supabase_auth_session'] = JSON.stringify(session)

      expect(getSession()).toBeNull()
    })

    it('returns null for corrupted localStorage data', () => {
      store['supabase_auth_session'] = 'not json'
      expect(getSession()).toBeNull()
    })
  })

  // ── getAccessToken ──────────────────────────────────────────────────────

  describe('getAccessToken', () => {
    it('returns null when not authenticated', () => {
      expect(getAccessToken()).toBeNull()
    })

    it('returns token when session exists', () => {
      const session: AuthSession = {
        access_token: 'my-token',
        refresh_token: 'rt',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: { id: 'u1', email: 'a@b.com' },
      }
      store['supabase_auth_session'] = JSON.stringify(session)

      expect(getAccessToken()).toBe('my-token')
    })
  })

  // ── getUserEmail ────────────────────────────────────────────────────────

  describe('getUserEmail', () => {
    it('returns null when not authenticated', () => {
      expect(getUserEmail()).toBeNull()
    })

    it('returns email when session exists', () => {
      const session: AuthSession = {
        access_token: 'tok',
        refresh_token: 'rt',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: { id: 'u1', email: 'test@example.com' },
      }
      store['supabase_auth_session'] = JSON.stringify(session)

      expect(getUserEmail()).toBe('test@example.com')
    })
  })

  // ── isH5Authenticated ──────────────────────────────────────────────────

  describe('isH5Authenticated', () => {
    it('returns false when not authenticated', () => {
      expect(isH5Authenticated()).toBe(false)
    })

    it('returns true when session exists', () => {
      const session: AuthSession = {
        access_token: 'tok',
        refresh_token: 'rt',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: { id: 'u1', email: 'a@b.com' },
      }
      store['supabase_auth_session'] = JSON.stringify(session)

      expect(isH5Authenticated()).toBe(true)
    })
  })

  // ── logoutH5 ────────────────────────────────────────────────────────────

  describe('logoutH5', () => {
    it('removes session from localStorage', () => {
      store['supabase_auth_session'] = '{"some":"data"}'
      logoutH5()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('supabase_auth_session')
    })
  })

  // ── authFetch ───────────────────────────────────────────────────────────

  describe('authFetch', () => {
    it('sends POST with anon key when not authenticated', async () => {
      const mockResponse = new Response('{}', { status: 200 })
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse)

      await authFetch('my-function', { foo: 'bar' })

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/my-function'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ foo: 'bar' }),
        }),
      )

      // Should use anon key as both apikey and Authorization (no session)
      const callArgs = vi.mocked(fetch).mock.calls[0]
      const headers = (callArgs[1] as RequestInit).headers as Record<string, string>
      expect(headers['Authorization']).toMatch(/^Bearer /)
    })

    it('sends POST with user token when authenticated', async () => {
      const session: AuthSession = {
        access_token: 'user-jwt-token',
        refresh_token: 'rt',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: { id: 'u1', email: 'a@b.com' },
      }
      store['supabase_auth_session'] = JSON.stringify(session)

      const mockResponse = new Response('{}', { status: 200 })
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse)

      await authFetch('check-subscription', { email: 'a@b.com' })

      const callArgs = vi.mocked(fetch).mock.calls[0]
      const headers = (callArgs[1] as RequestInit).headers as Record<string, string>
      expect(headers['Authorization']).toBe('Bearer user-jwt-token')
    })
  })
})
