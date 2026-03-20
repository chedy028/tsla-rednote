import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AiAnalyzeRequest {
  question?: string;
  stockData: StockData;
}

interface StockData {
  symbol?: string;
  currentPrice?: number;
  marketCap?: number;
  peRatio?: number;
  eps?: number;
  volume?: number;
  high52w?: number;
  low52w?: number;
  revenueGrowth?: number;
  deliveries?: number;
  [key: string]: unknown;
}

interface AiAnalyzeResponse {
  analysis: string;
  timestamp: number;
}

interface ErrorResponse {
  error: string;
  detail?: string;
}

interface OpenAiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAiChoice {
  message: {
    content: string;
  };
}

interface OpenAiResponse {
  choices: OpenAiChoice[];
  error?: {
    message: string;
  };
}

// ─── CORS Headers ────────────────────────────────────────────────────────────

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-client-info, apikey",
};

// ─── System Prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `你是一位专业的特斯拉（TSLA）股票估值分析师。你精通以下领域：

• 特斯拉的财务报表分析（收入、利润、现金流）
• 电动车行业趋势和竞争格局
• 特斯拉的核心业务：汽车交付量、能源业务、自动驾驶（FSD）、机器人出租车（Robotaxi）
• 估值方法：DCF（折现现金流）、P/E、P/S、EV/EBITDA等
• 宏观经济因素对股价的影响
• 技术分析（支撑位、阻力位、趋势线）

请注意：
1. 所有回答必须使用中文
2. 分析要客观、专业，同时给出看多和看空两方面的观点
3. 给出明确的估值区间和投资建议
4. 提醒用户投资有风险，分析仅供参考
5. 使用数据支撑你的分析观点
6. 回答要简洁精练，适合在手机小程序上阅读`;

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatStockDataContext(data: StockData): string {
  const lines: string[] = ["当前TSLA股票数据："];

  if (data.symbol) lines.push(`• 股票代码：${data.symbol}`);
  if (data.currentPrice != null) lines.push(`• 当前股价：$${data.currentPrice}`);
  if (data.marketCap != null)
    lines.push(`• 市值：$${(data.marketCap / 1e9).toFixed(2)}B`);
  if (data.peRatio != null) lines.push(`• 市盈率 (P/E)：${data.peRatio}`);
  if (data.eps != null) lines.push(`• 每股收益 (EPS)：$${data.eps}`);
  if (data.volume != null)
    lines.push(`• 成交量：${(data.volume / 1e6).toFixed(2)}M`);
  if (data.high52w != null) lines.push(`• 52周最高：$${data.high52w}`);
  if (data.low52w != null) lines.push(`• 52周最低：$${data.low52w}`);
  if (data.revenueGrowth != null)
    lines.push(`• 营收增长率：${(data.revenueGrowth * 100).toFixed(1)}%`);
  if (data.deliveries != null)
    lines.push(`• 最近季度交付量：${data.deliveries.toLocaleString()}`);

  // Include any extra fields
  const knownKeys = new Set([
    "symbol", "currentPrice", "marketCap", "peRatio", "eps",
    "volume", "high52w", "low52w", "revenueGrowth", "deliveries",
  ]);
  for (const [key, value] of Object.entries(data)) {
    if (!knownKeys.has(key) && value != null) {
      lines.push(`• ${key}：${value}`);
    }
  }

  return lines.join("\n");
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

    const body: AiAnalyzeRequest = await req.json();
    const { question, stockData } = body;

    // ── Validate inputs ──────────────────────────────────────────────────

    if (!stockData || typeof stockData !== "object") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'stockData'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Verify active subscription (Pro users only) ──────────────────────

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, subscription_status, subscription_expires_at")
      .eq("wechat_openid", openid)
      .maybeSingle();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "User not found. Please log in first." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check subscription is active and not expired
    const isActive =
      profile.subscription_status === "active" &&
      profile.subscription_expires_at &&
      new Date(profile.subscription_expires_at) > new Date();

    if (!isActive) {
      // Auto-expire if needed
      if (
        profile.subscription_status === "active" &&
        profile.subscription_expires_at &&
        new Date(profile.subscription_expires_at) <= new Date()
      ) {
        await supabase
          .from("profiles")
          .update({
            subscription_status: "expired",
            updated_at: new Date().toISOString(),
          })
          .eq("wechat_openid", openid);
      }

      return new Response(
        JSON.stringify({
          error: "Active subscription required",
          detail: "此功能仅限专业版用户使用，请先订阅。",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Build messages for OpenAI ────────────────────────────────────────

    const stockContext = formatStockDataContext(stockData);

    const userContent = question
      ? `${stockContext}\n\n用户提问：${question}`
      : `${stockContext}\n\n请根据以上数据，生成一份完整的TSLA估值分析报告。包括：\n1. 当前估值水平评估\n2. 关键驱动因素分析\n3. 风险提示\n4. 短期（1-3个月）和中长期（6-12个月）目标价区间\n5. 投资建议`;

    const messages: OpenAiMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ];

    // ── Call OpenAI API ──────────────────────────────────────────────────

    const apiKey = Deno.env.get("OPENAI_API_KEY") ?? Deno.env.get("AI_API_KEY");

    if (!apiKey) {
      console.error("Missing OPENAI_API_KEY or AI_API_KEY");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiBaseUrl =
      Deno.env.get("OPENAI_BASE_URL") ?? "https://api.openai.com/v1";
    const aiModel = Deno.env.get("AI_MODEL") ?? "gpt-4o-mini";

    const aiResp = await fetch(`${aiBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: aiModel,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const aiData: OpenAiResponse = await aiResp.json();

    if (!aiResp.ok || aiData.error) {
      console.error("OpenAI API error:", aiData);
      return new Response(
        JSON.stringify({
          error: "AI analysis failed",
          detail: aiData.error?.message ?? "Unknown AI error",
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const analysis = aiData.choices?.[0]?.message?.content ?? "";

    if (!analysis) {
      return new Response(
        JSON.stringify({ error: "AI returned empty response" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Return analysis ──────────────────────────────────────────────────

    const response: AiAnalyzeResponse = {
      analysis,
      timestamp: Date.now(),
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
