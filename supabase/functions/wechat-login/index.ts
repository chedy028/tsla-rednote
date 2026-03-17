import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.208.0/encoding/base64.ts";

// ─── Types ───────────────────────────────────────────────────────────────────

interface WechatLoginRequest {
  code: string;
}

interface WechatSessionResponse {
  openid?: string;
  session_key?: string;
  errcode?: number;
  errmsg?: string;
}

interface LoginResponse {
  openid: string;
  session_key: string;
  token: string;
}

interface ErrorResponse {
  error: string;
  detail?: string;
}

// ─── CORS Headers ────────────────────────────────────────────────────────────

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-client-info, apikey",
};

// ─── JWT Helper ──────────────────────────────────────────────────────────────

async function createJwt(
  payload: Record<string, unknown>,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();

  const header = { alg: "HS256", typ: "JWT" };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));

  const data = encoder.encode(`${headerB64}.${payloadB64}`);
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, data);
  const signatureB64 = base64UrlEncode(
    String.fromCharCode(...new Uint8Array(signature))
  );

  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

function base64UrlEncode(str: string): string {
  const b64 = btoa(str);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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
    const body: WechatLoginRequest = await req.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'code' parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Exchange code for session via WeChat API ──────────────────────────

    const appId = Deno.env.get("WECHAT_APP_ID");
    const appSecret = Deno.env.get("WECHAT_APP_SECRET");

    if (!appId || !appSecret) {
      console.error("Missing WECHAT_APP_ID or WECHAT_APP_SECRET");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const wxUrl = new URL("https://api.weixin.qq.com/sns/jscode2session");
    wxUrl.searchParams.set("appid", appId);
    wxUrl.searchParams.set("secret", appSecret);
    wxUrl.searchParams.set("js_code", code);
    wxUrl.searchParams.set("grant_type", "authorization_code");

    const wxResp = await fetch(wxUrl.toString());
    const wxData: WechatSessionResponse = await wxResp.json();

    if (wxData.errcode || !wxData.openid || !wxData.session_key) {
      console.error("WeChat API error:", wxData);
      return new Response(
        JSON.stringify({
          error: "WeChat login failed",
          detail: wxData.errmsg ?? "Unknown error",
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { openid, session_key } = wxData;

    // ── Upsert user profile in Supabase ──────────────────────────────────

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: existingProfile, error: selectError } = await supabase
      .from("profiles")
      .select("id, wechat_openid")
      .eq("wechat_openid", openid)
      .maybeSingle();

    if (selectError) {
      console.error("Supabase select error:", selectError);
      return new Response(
        JSON.stringify({ error: "Database error", detail: selectError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (existingProfile) {
      // Update last login timestamp
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ updated_at: new Date().toISOString() })
        .eq("wechat_openid", openid);

      if (updateError) {
        console.error("Supabase update error:", updateError);
      }
    } else {
      // Create new profile
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({ wechat_openid: openid });

      if (insertError) {
        console.error("Supabase insert error:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to create user profile", detail: insertError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ── Generate JWT token ───────────────────────────────────────────────

    const jwtSecret = Deno.env.get("JWT_SECRET") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const now = Math.floor(Date.now() / 1000);

    const token = await createJwt(
      {
        sub: openid,
        iat: now,
        exp: now + 7 * 24 * 60 * 60, // 7 days
      },
      jwtSecret
    );

    // ── Return response ──────────────────────────────────────────────────

    const response: LoginResponse = { openid, session_key, token };

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
