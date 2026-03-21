/**
 * Supabase Edge Function: generate-daily-digest
 * Cron job that runs daily at 6:00 AM UTC via pg_cron.
 * Fetches TSLA data, computes zone, generates AI explanations,
 * and stores the digest in the database.
 *
 * ARCHITECTURE:
 *   pg_cron → HTTP POST → this function
 *     ↓
 *   1. Fetch TSLA data from Yahoo Finance (server-side, no CORS)
 *   2. Compute P/S ratio and zone via getValuationTier()
 *   3. Compare zone vs yesterday → set zone_changed flag
 *   4. Generate AI explanations in 5 languages (parallel)
 *   5. Store in digests table (idempotent: date UNIQUE)
 *
 * FALLBACKS:
 *   - Yahoo down → use yesterday's data, set is_stale_data = true
 *   - AI timeout → use template fallback for that language
 *   - Duplicate run → idempotent (ON CONFLICT DO NOTHING)
 */

import {
  SYSTEM_PROMPTS,
  formatStockContext,
  getDisclaimer,
  callAI,
  type StockData,
} from "../_shared/ai.ts";

// ─── Valuation Tiers (pure logic, no framework deps) ────────────────────────
// Mirrors src/services/valuation.ts getValuationTier()

type Zone = "BARGAIN" | "CHEAP" | "FAIR" | "EXPENSIVE" | "OVERPRICED";

function getZone(psRatio: number): Zone {
  if (psRatio < 5) return "BARGAIN";
  if (psRatio < 8) return "CHEAP";
  if (psRatio < 12) return "FAIR";
  if (psRatio < 20) return "EXPENSIVE";
  return "OVERPRICED";
}

const ZONE_LABELS: Record<string, Record<Zone, string>> = {
  zh: { BARGAIN: "超值", CHEAP: "便宜", FAIR: "合理", EXPENSIVE: "偏贵", OVERPRICED: "高估" },
  en: { BARGAIN: "BARGAIN", CHEAP: "CHEAP", FAIR: "FAIR VALUE", EXPENSIVE: "EXPENSIVE", OVERPRICED: "OVERPRICED" },
  es: { BARGAIN: "GANGA", CHEAP: "BARATO", FAIR: "VALOR JUSTO", EXPENSIVE: "CARO", OVERPRICED: "SOBREVALORADO" },
  ja: { BARGAIN: "超割安", CHEAP: "割安", FAIR: "適正", EXPENSIVE: "割高", OVERPRICED: "過大評価" },
  ko: { BARGAIN: "초저평가", CHEAP: "저평가", FAIR: "적정", EXPENSIVE: "고평가", OVERPRICED: "과대평가" },
};

// ─── Fetch TSLA Data (server-side, no CORS proxy needed) ────────────────────

async function fetchTSLAData(): Promise<StockData & { marketCap: number; revenueTTM: number }> {
  const url = "https://query1.finance.yahoo.com/v8/finance/chart/TSLA?interval=1d&range=1d";
  const resp = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  if (!resp.ok) throw new Error(`Yahoo Finance error: ${resp.status}`);

  const data = await resp.json();
  const meta = data.chart?.result?.[0]?.meta;
  if (!meta) throw new Error("Invalid Yahoo Finance response");

  const price = meta.regularMarketPrice ?? 0;
  const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
  const change = price - prevClose;
  const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

  // Market cap from Yahoo
  const marketCap = meta.marketCap ?? price * (meta.sharesOutstanding ?? 3_200_000_000);

  // TTM Revenue: try financials endpoint, fall back to hardcoded
  let revenueTTM = 100_000_000_000; // $100B fallback
  try {
    const finResp = await fetch(
      "https://query1.finance.yahoo.com/v10/finance/quoteSummary/TSLA?modules=financialData",
      { headers: { "User-Agent": "Mozilla/5.0" } },
    );
    if (finResp.ok) {
      const finData = await finResp.json();
      const rev = finData.quoteSummary?.result?.[0]?.financialData?.totalRevenue?.raw;
      if (rev && rev > 0) revenueTTM = rev;
    }
  } catch {
    // Use fallback
  }

  const psRatio = revenueTTM > 0 ? marketCap / revenueTTM : Infinity;

  return {
    price,
    change,
    changePercent,
    marketCap,
    revenueTTM,
    psRatio,
    volume: meta.regularMarketVolume ?? 0,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? 0,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? 0,
  };
}

// ─── Generate AI digest content per language ────────────────────────────────

const LANGUAGES = ["zh", "en", "es", "ja", "ko"];

function getDigestPrompt(zone: Zone, lang: string): string {
  const label = ZONE_LABELS[lang]?.[zone] ?? zone;
  const prompts: Record<string, string> = {
    zh: `TSLA 当前处于"${label}"估值区间。请用 3-4 个要点解释当前估值水平的含义，以及投资者应关注的关键因素。简洁、客观、数据驱动。`,
    en: `TSLA is currently in the "${label}" valuation zone. Explain in 3-4 bullet points what this means and key factors investors should watch. Be concise, objective, and data-driven.`,
    es: `TSLA está en la zona de valoración "${label}". Explica en 3-4 puntos qué significa y factores clave. Sé conciso y objetivo.`,
    ja: `TSLAは現在「${label}」バリュエーションゾーンにあります。3-4つのポイントで意味と注目点を説明してください。`,
    ko: `TSLA는 현재 "${label}" 밸류에이션 존에 있습니다. 3-4개 포인트로 의미와 핵심 요인을 설명하세요.`,
  };
  return prompts[lang] || prompts.en;
}

// Template fallback when AI times out
function getTemplateFallback(zone: Zone, lang: string, psRatio: number): string {
  const label = ZONE_LABELS[lang]?.[zone] ?? zone;
  const templates: Record<string, string> = {
    zh: `TSLA 当前估值区间：${label}（P/S ${psRatio.toFixed(2)}x）。详细 AI 分析将在下期为您呈现。`,
    en: `TSLA valuation zone: ${label} (P/S ${psRatio.toFixed(2)}x). Full AI analysis in your next daily digest.`,
    es: `Zona de valoración TSLA: ${label} (P/S ${psRatio.toFixed(2)}x). Análisis completo en el próximo informe.`,
    ja: `TSLAバリュエーションゾーン：${label}（P/S ${psRatio.toFixed(2)}x）。詳細分析は次回お届けします。`,
    ko: `TSLA 밸류에이션 존: ${label} (P/S ${psRatio.toFixed(2)}x). 상세 분석은 다음 리포트에서 전달됩니다.`,
  };
  return templates[lang] || templates.en;
}

// ─── Main Handler ───────────────────────────────────────────────────────────

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
};

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const dbHeaders = {
    "Content-Type": "application/json",
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    Prefer: "return=representation",
  };

  try {
    // ── 1. Check idempotency (skip if today's digest exists) ──────────
    const existsResp = await fetch(
      `${supabaseUrl}/rest/v1/digests?date=eq.${today}&select=id`,
      { headers: dbHeaders },
    );
    const existing = await existsResp.json();
    if (Array.isArray(existing) && existing.length > 0) {
      return new Response(
        JSON.stringify({ status: "already_generated", date: today }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── 2. Fetch TSLA data ───────────────────────────────────────────
    let stockData: StockData & { marketCap: number; revenueTTM: number };
    let isStaleData = false;

    try {
      stockData = await fetchTSLAData();
    } catch (err) {
      console.error("Yahoo Finance fetch failed, using yesterday's data:", err);
      isStaleData = true;

      // Fall back to yesterday's digest data
      const yesterdayResp = await fetch(
        `${supabaseUrl}/rest/v1/digests?order=date.desc&limit=1&select=price,ps_ratio,market_cap,revenue_ttm`,
        { headers: dbHeaders },
      );
      const [yesterday] = await yesterdayResp.json();
      if (!yesterday) throw new Error("No historical data available for fallback");

      stockData = {
        price: Number(yesterday.price),
        psRatio: Number(yesterday.ps_ratio),
        marketCap: Number(yesterday.market_cap) || 0,
        revenueTTM: Number(yesterday.revenue_ttm) || 100_000_000_000,
        change: 0,
        changePercent: 0,
        volume: 0,
        fiftyTwoWeekHigh: 0,
        fiftyTwoWeekLow: 0,
      };
    }

    // ── 3. Compute zone and detect change ────────────────────────────
    const psRatio = stockData.psRatio ?? (stockData.marketCap / stockData.revenueTTM);
    const zone = getZone(psRatio);

    // Check yesterday's zone
    const prevResp = await fetch(
      `${supabaseUrl}/rest/v1/digests?order=date.desc&limit=1&select=zone`,
      { headers: dbHeaders },
    );
    const [prevDigest] = await prevResp.json();
    const zoneChanged = prevDigest ? prevDigest.zone !== zone : false;

    // ── 4. Generate AI content in 5 languages (parallel) ─────────────
    const stockContext = formatStockContext(stockData, "en");
    const contentResults = await Promise.allSettled(
      LANGUAGES.map(async (lang) => {
        const systemPrompt = SYSTEM_PROMPTS[lang] || SYSTEM_PROMPTS.en;
        const digestPrompt = getDigestPrompt(zone, lang);
        const userContent = `${stockContext}\n\n${digestPrompt}`;
        const content = await callAI(systemPrompt, userContent);
        return content + getDisclaimer(lang);
      }),
    );

    // Map results: use AI content or template fallback
    const contentByLang: Record<string, string> = {};
    LANGUAGES.forEach((lang, i) => {
      const result = contentResults[i];
      if (result.status === "fulfilled" && result.value) {
        contentByLang[lang] = result.value;
      } else {
        console.error(`AI failed for ${lang}:`, result.status === "rejected" ? result.reason : "empty");
        contentByLang[lang] = getTemplateFallback(zone, lang, psRatio);
      }
    });

    // ── 5. Store in digests table ────────────────────────────────────
    const insertResp = await fetch(`${supabaseUrl}/rest/v1/digests`, {
      method: "POST",
      headers: { ...dbHeaders, Prefer: "return=representation,resolution=ignore-duplicates" },
      body: JSON.stringify({
        date: today,
        zone,
        zone_changed: zoneChanged,
        ps_ratio: psRatio,
        price: stockData.price,
        market_cap: stockData.marketCap,
        revenue_ttm: stockData.revenueTTM,
        is_stale_data: isStaleData,
        content_zh: contentByLang.zh,
        content_en: contentByLang.en,
        content_es: contentByLang.es,
        content_ja: contentByLang.ja,
        content_ko: contentByLang.ko,
      }),
    });

    if (!insertResp.ok) {
      const err = await insertResp.text();
      throw new Error(`Failed to insert digest: ${err}`);
    }

    return new Response(
      JSON.stringify({
        status: "generated",
        date: today,
        zone,
        zone_changed: zoneChanged,
        is_stale_data: isStaleData,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("generate-daily-digest error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
