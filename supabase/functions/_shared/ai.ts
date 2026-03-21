/**
 * Shared AI Utilities
 * Used by both ai-analyze-h5 (interactive) and generate-daily-digest (cron).
 * Supports OpenAI and Anthropic APIs.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StockData {
  price?: number;
  change?: number;
  changePercent?: number;
  marketCap?: number;
  volume?: number;
  psRatio?: number;
  revenueTTM?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  [key: string]: unknown;
}

// ─── System Prompts by Language ──────────────────────────────────────────────

export const SYSTEM_PROMPTS: Record<string, string> = {
  zh: `你是一位专业的特斯拉（TSLA）股票估值分析师。你精通以下领域：

• 特斯拉的财务报表分析（收入、利润、现金流）
• 电动车行业趋势和竞争格局
• 特斯拉的核心业务：汽车交付量、能源业务、自动驾驶（FSD）、机器人出租车（Robotaxi）
• 估值方法：DCF（折现现金流）、P/E、P/S、EV/EBITDA等
• 宏观经济因素对股价的影响

请注意：
1. 所有回答必须使用中文
2. 分析要客观、专业，同时给出看多和看空两方面的观点
3. 给出明确的估值区间和投资建议
4. 提醒用户投资有风险，分析仅供参考
5. 使用数据支撑你的分析观点
6. 回答要简洁精练，适合在手机上阅读（控制在 500 字以内）`,

  en: `You are a professional Tesla (TSLA) stock valuation analyst. Your expertise includes:

• Tesla's financial statements (revenue, profit, cash flow)
• EV industry trends and competitive landscape
• Tesla's core businesses: vehicle deliveries, energy, FSD, Robotaxi
• Valuation methods: DCF, P/E, P/S, EV/EBITDA
• Macro factors affecting stock price

Guidelines:
1. Respond in English
2. Be objective, present both bull and bear cases
3. Provide clear valuation ranges and investment outlook
4. Remind users that investing involves risk, analysis is for reference only
5. Support analysis with data
6. Keep responses concise for mobile reading (under 300 words)`,

  es: `Eres un analista profesional de valoración de acciones de Tesla (TSLA). Responde siempre en español. Sé conciso (máximo 300 palabras). Incluye análisis alcista y bajista. Recuerda al usuario que invertir conlleva riesgos.`,

  ja: `あなたはテスラ（TSLA）株のプロの評価アナリストです。常に日本語で回答してください。簡潔に（300文字以内）。強気と弱気の両方の見方を含めてください。投資にはリスクが伴うことを注意喚起してください。`,

  ko: `당신은 테슬라(TSLA) 주식 전문 밸류에이션 애널리스트입니다. 항상 한국어로 응답하세요. 간결하게 (300자 이내). 상승 및 하락 전망을 모두 포함하세요. 투자에는 위험이 따른다는 점을 알려주세요.`,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function formatStockContext(data: StockData, lang: string): string {
  const isZh = lang === "zh";
  const lines: string[] = [isZh ? "当前TSLA数据：" : "Current TSLA data:"];

  if (data.price != null) lines.push(`• ${isZh ? "股价" : "Price"}: $${data.price}`);
  if (data.change != null && data.changePercent != null) {
    lines.push(`• ${isZh ? "涨跌" : "Change"}: ${data.change >= 0 ? "+" : ""}$${data.change} (${data.changePercent >= 0 ? "+" : ""}${data.changePercent.toFixed(2)}%)`);
  }
  if (data.marketCap != null) lines.push(`• ${isZh ? "市值" : "Market Cap"}: $${(data.marketCap / 1e9).toFixed(0)}B`);
  if (data.revenueTTM != null) lines.push(`• ${isZh ? "营收(TTM)" : "Revenue(TTM)"}: $${(data.revenueTTM / 1e9).toFixed(0)}B`);
  if (data.psRatio != null) lines.push(`• P/S ${isZh ? "比率" : "Ratio"}: ${data.psRatio.toFixed(2)}x`);
  if (data.volume != null) lines.push(`• ${isZh ? "成交量" : "Volume"}: ${(data.volume / 1e6).toFixed(1)}M`);
  if (data.fiftyTwoWeekHigh != null) lines.push(`• 52W High: $${data.fiftyTwoWeekHigh}`);
  if (data.fiftyTwoWeekLow != null) lines.push(`• 52W Low: $${data.fiftyTwoWeekLow}`);

  return lines.join("\n");
}

export function getReportPrompt(lang: string): string {
  const prompts: Record<string, string> = {
    zh: "请根据以上数据，生成一份TSLA估值分析报告。包括：\n1. 当前估值水平评估\n2. 关键驱动因素\n3. 风险提示\n4. 目标价区间\n5. 投资建议",
    en: "Based on the data above, generate a TSLA valuation analysis report. Include:\n1. Current valuation assessment\n2. Key drivers\n3. Risk factors\n4. Target price range\n5. Investment outlook",
    es: "Genera un informe de valoración de TSLA con: evaluación actual, factores clave, riesgos, rango de precio objetivo y perspectiva de inversión.",
    ja: "TSLAバリュエーション分析レポートを作成してください：現在の評価、主要ドライバー、リスク、目標価格帯、投資見通し。",
    ko: "TSLA 밸류에이션 분석 리포트를 작성하세요: 현재 평가, 핵심 요인, 리스크, 목표가 범위, 투자 전망.",
  };
  return prompts[lang] || prompts.en;
}

// ─── Investment Disclaimer ──────────────────────────────────────────────────

const DISCLAIMERS: Record<string, string> = {
  zh: "\n\n⚠️ 以上分析仅供学习参考，不构成投资建议。投资有风险，入市需谨慎。",
  en: "\n\n⚠️ This analysis is for educational purposes only and does not constitute investment advice. Investing involves risk.",
  es: "\n\n⚠️ Este análisis es solo con fines educativos y no constituye asesoramiento de inversión.",
  ja: "\n\n⚠️ この分析は教育目的のみであり、投資助言を構成するものではありません。",
  ko: "\n\n⚠️ 이 분석은 교육 목적으로만 제공되며 투자 조언을 구성하지 않습니다.",
};

export function getDisclaimer(lang: string): string {
  return DISCLAIMERS[lang] || DISCLAIMERS.en;
}

// ─── AI API Call ─────────────────────────────────────────────────────────────

export async function callAI(systemPrompt: string, userContent: string): Promise<string> {
  // Try OpenAI first, then Anthropic
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

  if (openaiKey) {
    const baseUrl = Deno.env.get("OPENAI_BASE_URL") ?? "https://api.openai.com/v1";
    const model = Deno.env.get("AI_MODEL") ?? "gpt-4o-mini";

    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const data = await resp.json();
    if (!resp.ok || data.error) {
      throw new Error(data.error?.message ?? `OpenAI error: ${resp.status}`);
    }
    return data.choices?.[0]?.message?.content ?? "";
  }

  if (anthropicKey) {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-latest",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    const data = await resp.json();
    if (!resp.ok || data.error) {
      throw new Error(data.error?.message ?? `Anthropic error: ${resp.status}`);
    }
    return data.content?.[0]?.text ?? "";
  }

  throw new Error("No AI API key configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.");
}
