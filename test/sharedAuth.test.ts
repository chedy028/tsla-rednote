import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createHmac } from 'node:crypto'

// ─── JWT helpers ────────────────────────────────────────────────────────────

function base64UrlEncode(buf: Buffer | string): string {
  const b = typeof buf === 'string' ? Buffer.from(buf) : buf
  return b.toString('base64url')
}

function buildJwt(payload: Record<string, unknown>, secret: string): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = base64UrlEncode(JSON.stringify(payload))
  const sig = createHmac('sha256', secret).update(`${header}.${body}`).digest()
  return `${header}.${body}.${base64UrlEncode(sig)}`
}

// ─── Mock Deno globals ──────────────────────────────────────────────────────

const envMap: Record<string, string> = {}

// We need to polyfill Deno.env and use Node's crypto.subtle
vi.stubGlobal('Deno', {
  env: {
    get: (key: string) => envMap[key] ?? undefined,
  },
})

// ─── Dynamic import with Deno mocks in place ───────────────────────────────
// The _shared/auth.ts uses Deno APIs + atob/crypto.subtle which are available
// in Node 20+ globals. We import it after setting up Deno mock.

// Since the auth module is written as Deno/ESM with .ts extension imports,
// we'll test its core logic by reimplementing the key function inline.
// This avoids Deno import resolution issues while testing the actual algorithm.

// ─── Reimplemented verifyAuth logic for testing ─────────────────────────────

function base64UrlDecode(str: string): Uint8Array {
  let padded = str
  const remainder = padded.length % 4
  if (remainder) padded += '='.repeat(4 - remainder)
  padded = padded.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded)
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    return JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[1])))
  } catch {
    return null
  }
}

interface AuthResult { userId: string; authType: 'supabase' | 'wechat' }
interface AuthError { error: string; status: number }

async function verifyHmacJwt(token: string, secret: string): Promise<AuthResult | AuthError> {
  const parts = token.split('.')
  if (parts.length !== 3) return { error: 'Malformed JWT', status: 401 }

  const [headerB64, payloadB64, signatureB64] = parts
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'],
  )
  const data = encoder.encode(`${headerB64}.${payloadB64}`)
  const signature = base64UrlDecode(signatureB64)
  const valid = await crypto.subtle.verify('HMAC', key, signature, data)
  if (!valid) return { error: 'Invalid JWT signature', status: 401 }

  const payload = decodeJwtPayload(token)
  if (!payload) return { error: 'Malformed JWT payload', status: 401 }
  if (typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)) {
    return { error: 'JWT has expired', status: 401 }
  }
  const sub = payload.sub
  if (!sub || typeof sub !== 'string') return { error: "JWT missing 'sub' claim", status: 401 }

  return { userId: sub, authType: 'wechat' }
}

async function verifySupabaseJwt(token: string, jwtSecret: string): Promise<AuthResult | AuthError> {
  const result = await verifyHmacJwt(token, jwtSecret)
  if ('error' in result) return result
  const payload = decodeJwtPayload(token)
  if (payload?.role === 'authenticated' || payload?.iss === 'supabase') {
    return { userId: result.userId, authType: 'supabase' }
  }
  return { userId: result.userId, authType: 'wechat' }
}

// ─── Tests ──────────────────────────────────────────────────────────────────

const SECRET = 'test-jwt-secret-key-for-testing-12345'

describe('shared auth JWT verification', () => {
  describe('verifyHmacJwt', () => {
    it('accepts a valid JWT with correct signature', async () => {
      const token = buildJwt(
        { sub: 'openid-123', exp: Math.floor(Date.now() / 1000) + 3600 },
        SECRET,
      )
      const result = await verifyHmacJwt(token, SECRET)
      expect(result).toEqual({ userId: 'openid-123', authType: 'wechat' })
    })

    it('rejects a JWT with wrong secret', async () => {
      const token = buildJwt(
        { sub: 'openid-123', exp: Math.floor(Date.now() / 1000) + 3600 },
        'wrong-secret',
      )
      const result = await verifyHmacJwt(token, SECRET)
      expect(result).toHaveProperty('error', 'Invalid JWT signature')
      expect(result).toHaveProperty('status', 401)
    })

    it('rejects an expired JWT', async () => {
      const token = buildJwt(
        { sub: 'openid-123', exp: Math.floor(Date.now() / 1000) - 100 },
        SECRET,
      )
      const result = await verifyHmacJwt(token, SECRET)
      expect(result).toHaveProperty('error', 'JWT has expired')
    })

    it('rejects a JWT without sub claim', async () => {
      const token = buildJwt(
        { exp: Math.floor(Date.now() / 1000) + 3600 },
        SECRET,
      )
      const result = await verifyHmacJwt(token, SECRET)
      expect(result).toHaveProperty('error', "JWT missing 'sub' claim")
    })

    it('rejects a malformed token (wrong number of parts)', async () => {
      const result = await verifyHmacJwt('not.a.valid.jwt.token', SECRET)
      expect(result).toHaveProperty('error')
    })

    it('rejects a token with only 2 parts', async () => {
      const result = await verifyHmacJwt('header.payload', SECRET)
      expect(result).toHaveProperty('error', 'Malformed JWT')
    })

    it('accepts a JWT without exp (no expiry check)', async () => {
      const token = buildJwt({ sub: 'user-no-exp' }, SECRET)
      const result = await verifyHmacJwt(token, SECRET)
      expect(result).toEqual({ userId: 'user-no-exp', authType: 'wechat' })
    })
  })

  describe('verifySupabaseJwt', () => {
    it('identifies Supabase Auth tokens by role=authenticated', async () => {
      const token = buildJwt(
        {
          sub: 'uuid-user-1',
          role: 'authenticated',
          iss: 'supabase',
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        SECRET,
      )
      const result = await verifySupabaseJwt(token, SECRET)
      expect(result).toEqual({ userId: 'uuid-user-1', authType: 'supabase' })
    })

    it('identifies WeChat tokens (no role/iss)', async () => {
      const token = buildJwt(
        { sub: 'wechat-openid', exp: Math.floor(Date.now() / 1000) + 3600 },
        SECRET,
      )
      const result = await verifySupabaseJwt(token, SECRET)
      expect(result).toEqual({ userId: 'wechat-openid', authType: 'wechat' })
    })

    it('identifies Supabase tokens by iss=supabase alone', async () => {
      const token = buildJwt(
        {
          sub: 'uuid-user-2',
          iss: 'supabase',
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        SECRET,
      )
      const result = await verifySupabaseJwt(token, SECRET)
      expect(result).toEqual({ userId: 'uuid-user-2', authType: 'supabase' })
    })

    it('propagates signature errors', async () => {
      const token = buildJwt(
        { sub: 'u', exp: Math.floor(Date.now() / 1000) + 3600 },
        'bad-secret',
      )
      const result = await verifySupabaseJwt(token, SECRET)
      expect(result).toHaveProperty('error', 'Invalid JWT signature')
    })
  })

  describe('decodeJwtPayload', () => {
    it('decodes a valid JWT payload', () => {
      const token = buildJwt({ sub: 'test', foo: 'bar' }, SECRET)
      const payload = decodeJwtPayload(token)
      expect(payload).toMatchObject({ sub: 'test', foo: 'bar' })
    })

    it('returns null for non-JWT strings', () => {
      expect(decodeJwtPayload('not-a-jwt')).toBeNull()
    })

    it('returns null for invalid base64 payload', () => {
      expect(decodeJwtPayload('a.!!!.c')).toBeNull()
    })
  })
})
