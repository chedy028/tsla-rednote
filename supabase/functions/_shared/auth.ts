/**
 * Shared JWT Authentication Utility
 * Handles both:
 *   1. Supabase Auth JWTs (H5 web users — magic link login)
 *   2. Custom HMAC-SHA256 JWTs (WeChat mini program users)
 *
 * AUTH FLOW:
 *   H5 Web:     Magic link → Supabase Auth → JWT with sub=user_id
 *   WeChat:     wx.login → wechat-login Edge Fn → JWT with sub=openid
 *
 *   Edge Function:
 *     Authorization: Bearer <token>
 *       ↓
 *     verifyAuth(req) → { userId, authType } or { error, status }
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuthResult {
  userId: string;
  authType: "supabase" | "wechat";
}

export interface AuthError {
  error: string;
  status: number;
}

// ─── CORS Headers (shared) ───────────────────────────────────────────────────

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-client-info, apikey",
};

// ─── Base64 URL Decode ───────────────────────────────────────────────────────

function base64UrlDecode(str: string): Uint8Array {
  // Pad to multiple of 4
  let padded = str;
  const remainder = padded.length % 4;
  if (remainder) padded += "=".repeat(4 - remainder);
  padded = padded.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[1])));
  } catch {
    return null;
  }
}

// ─── Verify Custom HMAC-SHA256 JWT (WeChat) ──────────────────────────────────

async function verifyHmacJwt(
  token: string,
  secret: string,
): Promise<AuthResult | AuthError> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return { error: "Malformed JWT", status: 401 };
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const data = encoder.encode(`${headerB64}.${payloadB64}`);
  const signature = base64UrlDecode(signatureB64);

  const valid = await crypto.subtle.verify("HMAC", key, signature, data);
  if (!valid) {
    return { error: "Invalid JWT signature", status: 401 };
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    return { error: "Malformed JWT payload", status: 401 };
  }

  if (
    typeof payload.exp === "number" &&
    payload.exp < Math.floor(Date.now() / 1000)
  ) {
    return { error: "JWT has expired", status: 401 };
  }

  const sub = payload.sub;
  if (!sub || typeof sub !== "string") {
    return { error: "JWT missing 'sub' claim", status: 401 };
  }

  return { userId: sub, authType: "wechat" };
}

// ─── Verify Supabase Auth JWT ────────────────────────────────────────────────

async function verifySupabaseJwt(
  token: string,
  jwtSecret: string,
): Promise<AuthResult | AuthError> {
  // Supabase Auth JWTs are also HMAC-SHA256 signed with the JWT secret
  const result = await verifyHmacJwt(token, jwtSecret);
  if ("error" in result) return result;

  // Supabase Auth tokens have iss=supabase, role=authenticated
  const payload = decodeJwtPayload(token);
  if (payload?.role === "authenticated" || payload?.iss === "supabase") {
    return { userId: result.userId, authType: "supabase" };
  }

  // If not a Supabase Auth token, treat as WeChat token
  return { userId: result.userId, authType: "wechat" };
}

// ─── Main Auth Verifier ──────────────────────────────────────────────────────

/**
 * Verify the Authorization header and return the authenticated user.
 * Supports both Supabase Auth JWTs (H5 users) and custom HMAC JWTs (WeChat).
 *
 * Usage:
 *   const auth = await verifyAuth(req);
 *   if ("error" in auth) {
 *     return new Response(JSON.stringify({ error: auth.error }), { status: auth.status });
 *   }
 *   // auth.userId is the authenticated user ID
 *   // auth.authType is "supabase" or "wechat"
 */
export async function verifyAuth(
  req: Request,
): Promise<AuthResult | AuthError> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Missing or invalid Authorization header", status: 401 };
  }

  const token = authHeader.slice(7);

  // Skip verification for the Supabase anon key (public access)
  // This allows unauthenticated access for certain endpoints
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (token === anonKey) {
    return { error: "Authentication required. Please log in.", status: 401 };
  }

  // Try to verify as a JWT
  const jwtSecret =
    Deno.env.get("JWT_SECRET") ?? Deno.env.get("SUPABASE_JWT_SECRET") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  return verifySupabaseJwt(token, jwtSecret);
}

/**
 * Helper to create a JSON error response with CORS headers.
 */
export function errorResponse(
  error: string,
  status: number,
): Response {
  return new Response(
    JSON.stringify({ error }),
    {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

/**
 * Helper to create a JSON success response with CORS headers.
 */
export function jsonResponse(
  data: unknown,
  status = 200,
): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}
