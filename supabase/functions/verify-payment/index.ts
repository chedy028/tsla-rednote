import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Types ───────────────────────────────────────────────────────────────────

interface VerifyPaymentRequest {
  order_id: string;
}

interface VerifyPaymentResponse {
  success: boolean;
  subscription_expires_at: string;
}

interface ErrorResponse {
  error: string;
  detail?: string;
}

interface OrderRecord {
  id: string;
  user_id: string;
  wechat_openid: string;
  plan: string;
  billing_period: string;
  amount_cents: number;
  wechat_prepay_id: string;
  out_trade_no: string;
  status: string;
}

// ─── CORS Headers ────────────────────────────────────────────────────────────

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-client-info, apikey",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Import RSA private key (PKCS#8 PEM) for WeChat Pay V3 signing. */
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemContents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");
  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  return await crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

function generateNonceStr(length = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const values = new Uint8Array(length);
  crypto.getRandomValues(values);
  for (let i = 0; i < length; i++) {
    result += chars[values[i] % chars.length];
  }
  return result;
}

/** Build WeChat Pay V3 authorization header. */
async function buildWechatPayAuthHeader(
  method: string,
  url: string,
  body: string,
  mchId: string,
  serialNo: string,
  privateKeyPem: string
): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = generateNonceStr();

  const message = `${method}\n${url}\n${timestamp}\n${nonceStr}\n${body}\n`;

  const key = await importPrivateKey(privateKeyPem);
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    encoder.encode(message)
  );
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

  return `WECHATPAY2-SHA256-RSA2048 mchid="${mchId}",nonce_str="${nonceStr}",signature="${signatureB64}",timestamp="${timestamp}",serial_no="${serialNo}"`;
}

/** Calculate subscription expiration based on billing period. */
function calculateExpiresAt(billingPeriod: string): string {
  const now = new Date();
  if (billingPeriod === "annual") {
    now.setFullYear(now.getFullYear() + 1);
  } else {
    now.setMonth(now.getMonth() + 1);
  }
  return now.toISOString();
}

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

    const body: VerifyPaymentRequest = await req.json();
    const { order_id } = body;

    // ── Validate inputs ──────────────────────────────────────────────────

    if (!order_id || typeof order_id !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'order_id'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Fetch order from database ────────────────────────────────────────

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .eq("wechat_openid", openid)
      .maybeSingle();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orderRecord = order as OrderRecord;

    // Already paid — return idempotent success
    if (orderRecord.status === "paid") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_expires_at")
        .eq("wechat_openid", openid)
        .single();

      return new Response(
        JSON.stringify({
          success: true,
          subscription_expires_at: profile?.subscription_expires_at ?? "",
        } satisfies VerifyPaymentResponse),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Query WeChat Pay to verify payment status ────────────────────────

    const mchId = Deno.env.get("WECHAT_PAY_MCH_ID")!;
    const serialNo = Deno.env.get("WECHAT_PAY_SERIAL_NO")!;
    const privateKeyPem = Deno.env.get("WECHAT_PAY_PRIVATE_KEY")!;

    // Query by merchant out_trade_no — the correct endpoint for verifying payment status
    const queryPath = `/v3/pay/transactions/out-trade-no/${orderRecord.out_trade_no}?mchid=${mchId}`;

    const authorization = await buildWechatPayAuthHeader(
      "GET",
      queryPath,
      "",
      mchId,
      serialNo,
      privateKeyPem
    );

    const wxQueryResp = await fetch(
      `https://api.mch.weixin.qq.com${queryPath}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: authorization,
        },
      }
    );

    const wxQueryData = await wxQueryResp.json();

    if (!wxQueryResp.ok) {
      console.error("WeChat Pay query error:", wxQueryData);
      return new Response(
        JSON.stringify({
          error: "Failed to verify payment with WeChat Pay",
          detail: wxQueryData.message ?? JSON.stringify(wxQueryData),
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Check trade_state ────────────────────────────────────────────────

    const tradeState: string = wxQueryData.trade_state;

    if (tradeState !== "SUCCESS") {
      // Update order to failed if terminal state
      if (["CLOSED", "REVOKED", "PAYERROR"].includes(tradeState)) {
        await supabase
          .from("orders")
          .update({ status: "failed" })
          .eq("id", order_id);
      }

      return new Response(
        JSON.stringify({
          error: "Payment not successful",
          detail: `Trade state: ${tradeState}`,
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Payment verified — update order and profile ──────────────────────

    const paidAt = new Date().toISOString();

    const { error: updateOrderError } = await supabase
      .from("orders")
      .update({ status: "paid", paid_at: paidAt })
      .eq("id", order_id);

    if (updateOrderError) {
      console.error("Failed to update order:", updateOrderError);
    }

    const expiresAt = calculateExpiresAt(orderRecord.billing_period);

    const { error: updateProfileError } = await supabase
      .from("profiles")
      .update({
        subscription_status: "active",
        subscription_expires_at: expiresAt,
        updated_at: paidAt,
      })
      .eq("wechat_openid", openid);

    if (updateProfileError) {
      console.error("Failed to update profile:", updateProfileError);
      return new Response(
        JSON.stringify({
          error: "Payment verified but failed to activate subscription",
          detail: updateProfileError.message,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Return success ───────────────────────────────────────────────────

    const response: VerifyPaymentResponse = {
      success: true,
      subscription_expires_at: expiresAt,
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
