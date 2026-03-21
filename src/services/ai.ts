/**
 * AI Analysis Service for H5/Web
 * Provides AI valuation reports, Q&A, and price alerts for Pro users.
 * Uses email-based auth via Supabase Edge Functions.
 */
import type { TSLAStockData } from './stockApi'
import type { ValuationTier } from './valuation'
import {
  getHistoricalPercentile,
  HISTORICAL_PS_DATA,
  analyzeValuation
} from './valuation'
import { getCurrentLang } from './i18n'

// ==================== Types ====================

export interface AIAnalysisResult {
  content: string
  summary: string
  confidence: 'high' | 'medium' | 'low'
  timestamp: number
  source: 'ai' | 'template'
  error?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export type AlertType = 'price_above' | 'price_below' | 'ps_above' | 'ps_below'

export interface PriceAlert {
  id: string
  email: string
  alert_type: AlertType
  target_value: number
  is_active: boolean
  created_at: string
  triggered_at: string | null
}

export interface TriggeredAlert {
  id: string
  type: string
  target: number
  current: number
}

// ==================== Config ====================

import { authFetch } from './supabaseAuth'

const AI_REPORT_CACHE_KEY = 'tsla_ai_report'
const AI_CACHE_DURATION = 30 * 60 * 1000 // 30 min

// ==================== Pro Email Management ====================

/**
 * Get the Pro user's email from localStorage.
 */
export function getProEmail(): string | null {
  try {
    // Check dedicated email storage first
    const email = localStorage.getItem('tsla_pro_email')
    if (email) return email

    // Fall back to subscription cache
    const cached = localStorage.getItem('tsla_subscription')
    if (cached) {
      const parsed = JSON.parse(cached)
      if (parsed.email) return parsed.email
    }
  } catch {}
  return null
}

/**
 * Save the Pro user's email.
 */
export function setProEmail(email: string): void {
  try {
    localStorage.setItem('tsla_pro_email', email)
  } catch {}
}

// ==================== AI Analysis (H5) ====================

/**
 * Convert TSLAStockData to edge function payload.
 */
function toStockPayload(data: TSLAStockData) {
  return {
    price: data.price,
    change: data.change,
    changePercent: data.changePercent,
    marketCap: data.marketCap,
    volume: data.volume,
    psRatio: data.psRatio,
    revenueTTM: data.revenueTTM,
    fiftyTwoWeekHigh: data.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: data.fiftyTwoWeekLow,
  }
}

/**
 * Get AI valuation report from edge function (Pro only).
 * Falls back to local template if AI is unavailable.
 */
export async function getDeepAnalysis(stockData: TSLAStockData, email?: string): Promise<AIAnalysisResult> {
  // Check cache first
  const cached = getCachedReport()
  if (cached) return cached

  const userEmail = email || getProEmail()
  if (!userEmail) {
    return getFallbackAnalysis(stockData)
  }

  try {
    const resp = await authFetch('ai-analyze-h5', {
      email: userEmail,
      stockData: toStockPayload(stockData),
      lang: getCurrentLang(),
    })

    const data = await resp.json()

    if (!resp.ok || !data.analysis) {
      console.warn('AI report failed:', data.error)
      return getFallbackAnalysis(stockData)
    }

    const result: AIAnalysisResult = {
      content: data.analysis,
      summary: data.analysis.slice(0, 100) + (data.analysis.length > 100 ? '...' : ''),
      confidence: 'high',
      timestamp: data.timestamp || Date.now(),
      source: 'ai',
    }

    // Cache
    try {
      localStorage.setItem(AI_REPORT_CACHE_KEY, JSON.stringify({
        ...result,
        cachedAt: Date.now(),
      }))
    } catch {}

    return result
  } catch (err) {
    console.warn('AI report error:', (err as Error).message)
    return getFallbackAnalysis(stockData)
  }
}

/**
 * Get cached AI report (30 min TTL).
 */
function getCachedReport(): AIAnalysisResult | null {
  try {
    const cached = localStorage.getItem(AI_REPORT_CACHE_KEY)
    if (!cached) return null
    const parsed = JSON.parse(cached)
    if (Date.now() - parsed.cachedAt > AI_CACHE_DURATION) return null
    return {
      content: parsed.content,
      summary: parsed.summary,
      confidence: parsed.confidence,
      timestamp: parsed.timestamp,
      source: parsed.source,
    }
  } catch {
    return null
  }
}

/**
 * Ask AI a question about TSLA (Q&A, Pro only).
 */
export async function askAI(question: string, stockData: TSLAStockData, email?: string): Promise<string> {
  const userEmail = email || getProEmail()

  // Try local quick answer first for short questions
  if (question.length < 20) {
    const quick = getQuickAnswer(question, stockData)
    if (quick) return quick
  }

  if (!userEmail) {
    return getQuickAnswer(question, stockData) || '请先登录 Pro 账户使用 AI 助手功能。'
  }

  try {
    const resp = await authFetch('ai-analyze-h5', {
      email: userEmail,
      question,
      stockData: toStockPayload(stockData),
      lang: getCurrentLang(),
    })

    const data = await resp.json()

    if (!resp.ok || !data.analysis) {
      return getQuickAnswer(question, stockData) || data.error || 'AI analysis unavailable.'
    }

    return data.analysis
  } catch {
    return getQuickAnswer(question, stockData) || 'Network error. Please try again.'
  }
}

// ==================== Price Alerts ====================

/**
 * List active alerts for a user.
 */
export async function listAlerts(email: string): Promise<PriceAlert[]> {
  try {
    const resp = await authFetch('price-alerts', { action: 'list', email })
    const data = await resp.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

/**
 * Create a new price alert.
 */
export async function createAlert(email: string, type: AlertType, targetValue: number): Promise<PriceAlert | null> {
  try {
    const resp = await authFetch('price-alerts', {
      action: 'create',
      email,
      alert: { type, target_value: targetValue },
    })
    const data = await resp.json()
    return Array.isArray(data) ? data[0] : null
  } catch {
    return null
  }
}

/**
 * Delete (deactivate) an alert.
 */
export async function deleteAlert(email: string, alertId: string): Promise<void> {
  try {
    await authFetch('price-alerts', { action: 'delete', email, alert_id: alertId })
  } catch {}
}

/**
 * Check if any alerts have been triggered.
 */
export async function checkAlerts(
  email: string,
  currentPrice: number,
  currentPs: number
): Promise<{ triggered: TriggeredAlert[]; total_active: number }> {
  try {
    const resp = await authFetch('price-alerts', {
      action: 'check',
      email,
      current_price: currentPrice,
      current_ps: currentPs,
    })
    return await resp.json()
  } catch {
    return { triggered: [], total_active: 0 }
  }
}

// ==================== Local Template Analysis ====================

/**
 * Quick local analysis — template-based, no network needed.
 */
export function getQuickAnalysis(psRatio: number, valuationTier: ValuationTier): AIAnalysisResult {
  const percentile = getHistoricalPercentile(psRatio)
  const historicalAvg = HISTORICAL_PS_DATA.reduce((sum, d) => sum + d.psRatio, 0) / HISTORICAL_PS_DATA.length
  const avgRounded = Math.round(historicalAvg * 100) / 100
  const diffFromAvg = ((psRatio - historicalAvg) / historicalAvg * 100).toFixed(1)
  const isAboveAvg = psRatio > historicalAvg

  const tierAnalysis = getTierAnalysis(valuationTier.tier, psRatio, percentile, avgRounded, diffFromAvg, isAboveAvg)

  return {
    content: tierAnalysis.content,
    summary: tierAnalysis.summary,
    confidence: 'medium',
    timestamp: Date.now(),
    source: 'template'
  }
}

function getTierAnalysis(
  tier: string,
  psRatio: number,
  percentile: number,
  historicalAvg: number,
  diffFromAvg: string,
  isAboveAvg: boolean
): { content: string; summary: string } {
  const psText = psRatio.toFixed(2)
  const percentileText = `${percentile}%`

  switch (tier) {
    case 'BARGAIN':
      return {
        summary: `TSLA P/S ${psText}x — extremely undervalued, rare buying opportunity.`,
        content:
          `TSLA P/S ratio: ${psText}x (${percentileText} percentile)\n` +
          `Well below historical avg of ${historicalAvg}x (${diffFromAvg}% deviation).\n\n` +
          `This valuation is extremely rare, typically seen during severe market panic.\n\n` +
          `Strategy: Consider building positions gradually. Monitor fundamentals for any deterioration.\n\n` +
          `Risk: Low valuations can go lower. Always manage position sizes.`
      }
    case 'CHEAP':
      return {
        summary: `TSLA P/S ${psText}x — undervalued, consider accumulating.`,
        content:
          `TSLA P/S ratio: ${psText}x (${percentileText} percentile)\n` +
          `Below historical avg of ${historicalAvg}x (${diffFromAvg}% deviation).\n\n` +
          `Market is pricing Tesla conservatively. Growth potential may not be fully reflected.\n\n` +
          `Strategy: Start building positions. Watch quarterly deliveries and margins.\n\n` +
          `Risk: EV competition intensifying. Monitor market share trends.`
      }
    case 'FAIR':
      return {
        summary: `TSLA P/S ${psText}x — fair value zone, hold and watch.`,
        content:
          `TSLA P/S ratio: ${psText}x (${percentileText} percentile)\n` +
          `${isAboveAvg ? 'Slightly above' : 'Near'} historical avg of ${historicalAvg}x (${diffFromAvg}%).\n\n` +
          `Valuation reflects current performance and near-term growth expectations.\n\n` +
          `Strategy: Hold existing positions. New entries should wait for pullbacks.\n\n` +
          `Risk: Fair value can shift. Watch revenue growth acceleration.`
      }
    case 'EXPENSIVE':
      return {
        summary: `TSLA P/S ${psText}x — elevated, caution on new entries.`,
        content:
          `TSLA P/S ratio: ${psText}x (${percentileText} percentile)\n` +
          `Above historical avg of ${historicalAvg}x (+${Math.abs(Number(diffFromAvg))}% deviation).\n\n` +
          `Optimistic expectations well priced in. Often driven by FSD/Robotaxi catalysts.\n\n` +
          `Strategy: Avoid large new positions. Consider partial profit-taking.\n\n` +
          `Risk: Any miss on expectations could trigger significant pullback.`
      }
    case 'OVERPRICED':
      return {
        summary: `TSLA P/S ${psText}x — overheated, high risk zone.`,
        content:
          `TSLA P/S ratio: ${psText}x (${percentileText} percentile)\n` +
          `Far above historical avg of ${historicalAvg}x (+${Math.abs(Number(diffFromAvg))}% deviation).\n\n` +
          `Valuation disconnected from fundamentals. Market euphoria detected.\n\n` +
          `Strategy: Not recommended for new positions. Consider reducing exposure.\n\n` +
          `Risk: FOMO is dangerous. Historically, these levels precede major corrections.`
      }
    default:
      return {
        summary: `TSLA P/S ${psText}x — evaluate with full market context.`,
        content: `TSLA P/S ratio: ${psText}x (${percentileText} percentile), historical avg: ${historicalAvg}x.`
      }
  }
}

/**
 * Quick answer for common questions (no network needed).
 */
export function getQuickAnswer(question: string, stockData: TSLAStockData): string {
  const { psRatio, valuationTier, price, marketCap, revenueTTM } = stockData
  const percentile = getHistoricalPercentile(psRatio)
  const historicalAvg = HISTORICAL_PS_DATA.reduce((sum, d) => sum + d.psRatio, 0) / HISTORICAL_PS_DATA.length
  const analysis = analyzeValuation(marketCap, revenueTTM)

  const q = question.toLowerCase()

  if (q.includes('buy') || q.includes('买') || q.includes('适合买入')) {
    return generateValuationAssessment(psRatio, valuationTier, price, percentile)
  }
  if (q.includes('p/s') || q.includes('ratio') || q.includes('市销率')) {
    return generatePSExplanation(psRatio, valuationTier, historicalAvg)
  }
  if (q.includes('history') || q.includes('历史') || q.includes('比较')) {
    return generateHistoricalComparison(psRatio, percentile, historicalAvg, analysis)
  }
  if (q.includes('risk') || q.includes('风险')) {
    return generateRiskAnalysis(psRatio, valuationTier, percentile)
  }
  if (q.includes('target') || q.includes('目标价')) {
    return generateTargetPrice(psRatio, revenueTTM, historicalAvg)
  }

  return getQuickAnalysis(psRatio, valuationTier).content
}

function generateValuationAssessment(psRatio: number, tier: ValuationTier, price: number, percentile: number): string {
  const psText = psRatio.toFixed(2)
  const assessment = tier.tier === 'BARGAIN' || tier.tier === 'CHEAP' ? 'below historical norms' :
                     tier.tier === 'FAIR' ? 'within historical range' : 'above historical norms'

  return (
    `Valuation assessment: ${assessment}\n\n` +
    `Price: $${price.toFixed(2)} | P/S: ${psText}x | Percentile: ${percentile}%\n\n` +
    `${assessment === 'below historical norms' ? 'Current P/S ratio is lower than most historical periods, suggesting the market is pricing in less growth optimism.' :
      assessment === 'within historical range' ? 'Current P/S ratio is consistent with historical averages, reflecting balanced market expectations.' :
      'Current P/S ratio exceeds most historical periods, indicating elevated market expectations for growth.'}\n\n` +
    `⚠️ 以上分析仅供参考，不构成任何投资建议。请结合自身情况独立判断。`
  )
}

function generatePSExplanation(psRatio: number, tier: ValuationTier, historicalAvg: number): string {
  return (
    `P/S (Price-to-Sales) Ratio Explained\n\n` +
    `P/S = Market Cap ÷ Annual Revenue\n\n` +
    `Current TSLA P/S: ${psRatio.toFixed(2)}x\n` +
    `Historical Average: ${historicalAvg.toFixed(2)}x\n` +
    `Status: ${tier.textEn}\n\n` +
    `Why P/S over P/E for Tesla?\n` +
    `• Tesla's profits fluctuate — P/E can be misleading\n` +
    `• Revenue is more stable and reflects scale/growth\n` +
    `• P/S is standard for growth stocks`
  )
}

function generateHistoricalComparison(psRatio: number, percentile: number, historicalAvg: number, analysis: { isAboveAvg: boolean }): string {
  const recentData = HISTORICAL_PS_DATA.slice(-4)
  const quarterText = recentData.map(d => `${d.date}: P/S ${d.psRatio}x ($${d.price})`).join('\n')
  const maxPS = Math.max(...HISTORICAL_PS_DATA.map(d => d.psRatio))
  const minPS = Math.min(...HISTORICAL_PS_DATA.map(d => d.psRatio))

  return (
    `TSLA Historical P/S Comparison\n\n` +
    `Current: ${psRatio.toFixed(2)}x | Avg: ${historicalAvg.toFixed(2)}x | Percentile: ${percentile}%\n` +
    `${analysis.isAboveAvg ? 'Above' : 'Below'} historical average\n\n` +
    `Range: ${minPS}x — ${maxPS}x\n\n` +
    `Recent quarters:\n${quarterText}`
  )
}

function generateRiskAnalysis(psRatio: number, tier: ValuationTier, percentile: number): string {
  const riskLevel = percentile > 80 ? 'HIGH' : percentile > 50 ? 'MEDIUM' : 'LOW'
  return (
    `Risk Assessment: ${riskLevel}\n\n` +
    `P/S: ${psRatio.toFixed(2)}x | Percentile: ${percentile}%\n\n` +
    `Key risks:\n` +
    `• Valuation: ${percentile > 70 ? 'Elevated, pullback likely' : percentile > 40 ? 'Fair, manageable' : 'Low, limited downside'}\n` +
    `• Competition: Global EV market increasingly crowded\n` +
    `• Policy: Subsidy changes, tariffs, trade tensions\n` +
    `• Tech: FSD timeline uncertainty\n\n` +
    `Catalysts:\n` +
    `• AI/FSD technology leadership\n` +
    `• Energy business growth\n` +
    `• Robotaxi & Optimus long-term potential\n\n` +
    `⚠️ For reference only. Not investment advice.`
  )
}

function generateTargetPrice(psRatio: number, revenueTTM: number, historicalAvg: number): string {
  const shares = 3_210_000_000
  const fairPrice = (historicalAvg * revenueTTM / shares).toFixed(0)
  const cheapPrice = (7 * revenueTTM / shares).toFixed(0)
  const expensivePrice = (15 * revenueTTM / shares).toFixed(0)

  return (
    `TSLA Reference Price Zones (based on current TTM revenue)\n\n` +
    `• Undervalued (P/S 7x): ~$${cheapPrice}\n` +
    `• Fair value (P/S ${historicalAvg.toFixed(1)}x): ~$${fairPrice}\n` +
    `• Overvalued (P/S 15x): ~$${expensivePrice}\n\n` +
    `Current P/S: ${psRatio.toFixed(2)}x\n\n` +
    `Note: Based on current revenue. Future growth will shift these zones upward.\n` +
    `⚠️ Not investment advice.`
  )
}

/**
 * Fallback analysis when AI is unavailable.
 */
function getFallbackAnalysis(stockData: TSLAStockData): AIAnalysisResult {
  const result = getQuickAnalysis(stockData.psRatio, stockData.valuationTier)

  const extra =
    `\n\nData snapshot:\n` +
    `• Price: $${stockData.price.toFixed(2)} (${stockData.change > 0 ? '+' : ''}${stockData.changePercent.toFixed(2)}%)\n` +
    `• 52W Range: $${stockData.fiftyTwoWeekLow.toFixed(0)} - $${stockData.fiftyTwoWeekHigh.toFixed(0)}\n` +
    `• Market Cap: $${(stockData.marketCap / 1e9).toFixed(0)}B\n` +
    `• Volume: ${(stockData.volume / 1e6).toFixed(1)}M`

  return {
    ...result,
    content: result.content + extra,
    source: 'template'
  }
}

// ==================== Utilities ====================

export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
}

export function clearAICache(): void {
  try {
    localStorage.removeItem(AI_REPORT_CACHE_KEY)
  } catch {}
}
