/**
 * Supabase Edge Function: ai-analyze-h5
 * AI-powered TSLA valuation analysis for H5/web users.
 * Auth: Supabase Auth JWT (H5 magic link) or WeChat JWT.
 * Supports both OpenAI and Anthropic APIs.
 */
import { verifyAuth, errorResponse } from "../_shared/auth.ts";
import {
  type StockData,
  SYSTEM_PROMPTS,
  formatStockContext,
  getReportPrompt,
  getDisclaimer,
  callAI,
} from "../_shared/ai.ts";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AnalyzeRequest {
  email: string;
  question?: string;
  stockData: StockData;
  lang?: string; // 'zh' | 'en' | 'es' | 'ja' | 'ko'
}

// ─── CORS Headers ────────────────────────────────────────────────────────────

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-client-info, apikey",
};

// ─── Subscription Check ──────────────────────────────────────────────────────

async function checkSubscription(email: string): Promise<boolean> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const resp = await fetch(
    `${supabaseUrl}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=subscription_status,subscription_end_date`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    }
  );

  const profiles = await resp.json();
  if (!profiles || profiles.length === 0) return false;

  const profile = profiles[0];
  return (
    profile.subscription_status === "active" &&
    (!profile.subscription_end_date || new Date(profile.subscription_end_date) > new Date())
  );
}

// ─── Main Handler ────────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // ── Auth ────────────────────────────────────────────────────────────
    const auth = await verifyAuth(req);
    if ("error" in auth) {
      return errorResponse(auth.error, auth.status);
    }

    const body: AnalyzeRequest = await req.json();
    const { email, question, stockData, lang = "en" } = body;

    // Validate
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!stockData || typeof stockData !== "object") {
      return new Response(
        JSON.stringify({ error: "Stock data is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check subscription
    const isActive = await checkSubscription(email);
    if (!isActive) {
      return new Response(
        JSON.stringify({ error: "Active Pro subscription required", code: "SUB_REQUIRED" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build prompts
    const systemPrompt = SYSTEM_PROMPTS[lang] || SYSTEM_PROMPTS.en;
    const stockContext = formatStockContext(stockData, lang);

    const userContent = question
      ? `${stockContext}\n\n${lang === "zh" ? "用户提问：" : "User question: "}${question}`
      : `${stockContext}\n\n${getReportPrompt(lang)}`;

    // Call AI
    const analysis = await callAI(systemPrompt, userContent);

    if (!analysis) {
      return new Response(
        JSON.stringify({ error: "AI returned empty response" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Append legal disclaimer
    const fullAnalysis = analysis + getDisclaimer(lang);

    return new Response(
      JSON.stringify({ analysis: fullAnalysis, timestamp: Date.now() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
