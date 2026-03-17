import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Types ───────────────────────────────────────────────────────────────────

type Plan = "basic" | "pro";
type BillingPeriod = "monthly" | "annual";

interface CreatePaymentRequest {
  openid: string;
  plan: Plan;
  billingPeriod: BillingPeriod;
}

interface WechatPayParams {
  appId: string;
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: string;
  paySign: string;
}

interface CreatePaymentResponse {
  order_id: string;
  payment_params: WechatPayParams;
}

interface ErrorResponse {
  error: string;
  detail?: string;
}

// ─── Pricing Table (amount in 分/cents) ──────────────────────────────────────

const PRICING: Record<Plan, Record<BillingPeriod, number>> = {
  basic: {
    monthly: 499,   // ¥4.99
    annual: 4900,   // ¥49
  },
  pro: {
    monthly: 999,   // ¥9.99
    annual: 9900,   // ¥99
  },
};

// ─── CORS Headers ────────────────────────────────────────────────────────────

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-client-info, apikey",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function generateOutTradeNo(): string {
  const now = new Date();
  const dateStr = now.toISOString().replace(/[-T:.Z]/g, "").slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `TSLA${dateStr}${rand}`;
}

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

/** Sign the payment parameters for Taro.requestPayment(). */
async function signPaymentParams(
  appId: string,
  timeStamp: string,
  nonceStr: string,
  prepayId: string,
  privateKeyPem: string
): Promise<string> {
  const message = `${appId}\n${timeStamp}\n${nonceStr}\nprepay_id=${prepayId}\n`;

  const key = await importPrivateKey(privateKeyPem);
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    encoder.encode(message)
  );
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

// ─── Auth Helper ─────────────────────────────────────────────────────────────

function getOpenidFromAuth(req: Request): string | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  // Simple JWT decode (payload only — signature verified elsewhere)
  const token = authHeader.slice(7);
  try {
    const payloadB64 = token.split(".")[1];
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
    return payload.sub ?? null;
  } catch {
    return null;
  }
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
    const body: CreatePaymentRequest = await req.json();
    const { openid, plan, billingPeriod } = body;

    // ── Validate inputs ──────────────────────────────────────────────────

    if (!openid || typeof openid !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'openid'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!plan || !["basic", "pro"].includes(plan)) {
      return new Response(
        JSON.stringify({ error: "Invalid plan. Must be 'basic' or 'pro'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!billingPeriod || !["monthly", "annual"].includes(billingPeriod)) {
      return new Response(
        JSON.stringify({ error: "Invalid billingPeriod. Must be 'monthly' or 'annual'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Resolve price ────────────────────────────────────────────────────

    const amountCents = PRICING[plan][billingPeriod];
    const outTradeNo = generateOutTradeNo();

    // ── Look up user profile ─────────────────────────────────────────────

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("wechat_openid", openid)
      .maybeSingle();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "User not found. Please log in first." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Call WeChat Pay V3 Unified Order API ─────────────────────────────

    const mchId = Deno.env.get("WECHAT_PAY_MCH_ID")!;
    const apiKey = Deno.env.get("WECHAT_PAY_API_KEY")!;
    const serialNo = Deno.env.get("WECHAT_PAY_SERIAL_NO")!;
    const privateKeyPem = Deno.env.get("WECHAT_PAY_PRIVATE_KEY")!;
    const appId = Deno.env.get("WECHAT_APP_ID")!;

    const notifyUrl = `${supabaseUrl}/functions/v1/verify-payment`;

    const planLabel = plan === "basic" ? "基础版" : "专业版";
    const periodLabel = billingPeriod === "monthly" ? "月付" : "年付";
    const description = `TSLA Red Note ${planLabel} (${periodLabel})`;

    const orderBody = {
      appid: appId,
      mchid: mchId,
      description,
      out_trade_no: outTradeNo,
      notify_url: notifyUrl,
      amount: {
        total: amountCents,
        currency: "CNY",
      },
      payer: {
        openid,
      },
    };

    const orderBodyStr = JSON.stringify(orderBody);
    const wxPayPath = "/v3/pay/transactions/jsapi";

    const authorization = await buildWechatPayAuthHeader(
      "POST",
      wxPayPath,
      orderBodyStr,
      mchId,
      serialNo,
      privateKeyPem
    );

    const wxPayResp = await fetch(`https://api.mch.weixin.qq.com${wxPayPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authorization,
      },
      body: orderBodyStr,
    });

    const wxPayData = await wxPayResp.json();

    if (!wxPayResp.ok || !wxPayData.prepay_id) {
      console.error("WeChat Pay error:", wxPayData);
      return new Response(
        JSON.stringify({
          error: "Failed to create WeChat Pay order",
          detail: wxPayData.message ?? JSON.stringify(wxPayData),
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prepayId: string = wxPayData.prepay_id;

    // ── Store order in database ──────────────────────────────────────────

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: profile.id,
        wechat_openid: openid,
        plan,
        billing_period: billingPeriod,
        amount_cents: amountCents,
        wechat_prepay_id: prepayId,
        status: "pending",
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("Failed to store order:", orderError);
      return new Response(
        JSON.stringify({ error: "Failed to store order", detail: orderError?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Build payment parameters for Taro.requestPayment() ───────────────

    const timeStamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = generateNonceStr();
    const paySign = await signPaymentParams(
      appId,
      timeStamp,
      nonceStr,
      prepayId,
      privateKeyPem
    );

    const paymentParams: WechatPayParams = {
      appId,
      timeStamp,
      nonceStr,
      package: `prepay_id=${prepayId}`,
      signType: "RSA",
      paySign,
    };

    const response: CreatePaymentResponse = {
      order_id: order.id,
      payment_params: paymentParams,
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
