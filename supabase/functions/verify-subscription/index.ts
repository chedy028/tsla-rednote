import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Types ───────────────────────────────────────────────────────────────────

interface VerifySubscriptionResponse {
  is_active: boolean;
  expires_at: string | null;
}

interface ErrorResponse {
  error: string;
  detail?: string;
}

interface ProfileRecord {
  id: string;
  wechat_openid: string;
  subscription_status: string;
  subscription_expires_at: string | null;
}

// ─── CORS Headers ────────────────────────────────────────────────────────────

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-client-info, apikey",
};

// ─── Auth Helper ─────────────────────────────────────────────────────────────

function base64UrlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

/**
 * Verify JWT signature (HS256) and return the authenticated openid.
 */
async function verifyJwtAndGetOpenid(
  req: Request,
): Promise<{ openid: string } | { error: string; status: number }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Missing or invalid Authorization header", status: 401 };
  }

  const token = authHeader.slice(7);
  const parts = token.split(".");
  if (parts.length !== 3) {
    return { error: "Malformed JWT", status: 401 };
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  const jwtSecret =
    Deno.env.get("JWT_SECRET") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(jwtSecret),
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

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(payloadB64)),
    );
  } catch {
    return { error: "Malformed JWT payload", status: 401 };
  }

  if (
    typeof payload.exp === "number" &&
    payload.exp < Math.floor(Date.now() / 1000)
  ) {
    return { error: "JWT has expired", status: 401 };
  }

  const openid = payload.sub;
  if (!openid || typeof openid !== "string") {
    return { error: "JWT missing 'sub' claim", status: 401 };
  }

  return { openid };
}

// ─── Main Handler ────────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" } satisfies ErrorResponse),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // ── Verify JWT and extract authenticated user identity ───────────────
    const authResult = await verifyJwtAndGetOpenid(req);
    if ("error" in authResult) {
      return new Response(
        JSON.stringify({ error: authResult.error }),
        { status: authResult.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const openid = authResult.openid;

    // ── Query profile ────────────────────────────────────────────────────

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, wechat_openid, subscription_status, subscription_expires_at")
      .eq("wechat_openid", openid)
      .maybeSingle();

    if (profileError) {
      console.error("Supabase query error:", profileError);
      return new Response(
        JSON.stringify({ error: "Database error", detail: profileError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!profile) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const profileRecord = profile as ProfileRecord;

    // ── Check subscription validity ──────────────────────────────────────

    let isActive = false;
    let expiresAt: string | null = profileRecord.subscription_expires_at;

    if (
      profileRecord.subscription_status === "active" &&
      profileRecord.subscription_expires_at
    ) {
      const expirationDate = new Date(profileRecord.subscription_expires_at);
      const now = new Date();

      if (expirationDate > now) {
        // Subscription is still active
        isActive = true;
      } else {
        // Subscription has expired — update the status
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            subscription_status: "expired",
            updated_at: new Date().toISOString(),
          })
          .eq("wechat_openid", openid);

        if (updateError) {
          console.error("Failed to update expired subscription:", updateError);
        }

        isActive = false;
      }
    }

    // ── Return response ──────────────────────────────────────────────────

    const response: VerifySubscriptionResponse = {
      is_active: isActive,
      expires_at: expiresAt,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
