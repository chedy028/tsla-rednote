/**
 * AI 分析服务 - TSLA 智能估值分析
 * AI Analysis Service - Tesla intelligent valuation analysis
 *
 * 提供两种分析模式:
 * 1. getQuickAnalysis - 本地模板分析，即时响应 (免费/Pro)
 * 2. getDeepAnalysis - AI 深度分析，调用 Supabase Edge Function (仅 Pro)
 */
import Taro from '@tarojs/taro'
import type { TSLAStockData } from './stockApi'
import type { ValuationTier } from './valuation'
import {
  getHistoricalPercentile,
  HISTORICAL_PS_DATA,
  analyzeValuation
} from './valuation'
import { getSessionToken } from './auth'

// ==================== 类型定义 ====================

export interface AIAnalysisResult {
  content: string        // 分析正文 (中文)
  summary: string        // 一句话摘要
  confidence: 'high' | 'medium' | 'low'  // 分析置信度
  timestamp: number      // 生成时间戳
  source: 'ai' | 'template'  // 来源: AI 或模板
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

// ==================== 缓存配置 ====================

const AI_CACHE_KEY = 'ai_analysis_cache'
const AI_CACHE_DURATION = 30 * 60 * 1000  // 30分钟缓存

interface AICacheEntry {
  result: AIAnalysisResult
  cacheKey: string
  timestamp: number
}

// Supabase 配置
const SUPABASE_URL = process.env.TARO_APP_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.TARO_APP_SUPABASE_ANON_KEY || ''

// ==================== 缓存管理 ====================

function getCacheKey(stockData: TSLAStockData): string {
  // 根据价格和P/S比率生成缓存 key，价格变动超过1%视为不同数据
  const priceKey = Math.round(stockData.price * 10)
  const psKey = Math.round(stockData.psRatio * 100)
  return `ai_${priceKey}_${psKey}`
}

function getCachedAnalysis(cacheKey: string): AIAnalysisResult | null {
  try {
    const cached = Taro.getStorageSync(AI_CACHE_KEY) as string
    if (!cached) return null

    const entry: AICacheEntry = JSON.parse(cached)
    const now = Date.now()

    if (entry.cacheKey === cacheKey && now - entry.timestamp < AI_CACHE_DURATION) {
      return entry.result
    }

    return null
  } catch {
    return null
  }
}

function setCachedAnalysis(cacheKey: string, result: AIAnalysisResult): void {
  try {
    const entry: AICacheEntry = {
      result,
      cacheKey,
      timestamp: Date.now()
    }
    Taro.setStorageSync(AI_CACHE_KEY, JSON.stringify(entry))
  } catch {
    // 缓存写入失败不影响主流程
  }
}

// ==================== 模板分析 (本地) ====================

/**
 * 快速本地分析 - 基于模板生成中文分析文本
 * 无需网络请求，根据 P/S 比率和估值等级即时生成
 */
export function getQuickAnalysis(psRatio: number, valuationTier: ValuationTier): AIAnalysisResult {
  const percentile = getHistoricalPercentile(psRatio)
  const historicalAvg = HISTORICAL_PS_DATA.reduce((sum, d) => sum + d.psRatio, 0) / HISTORICAL_PS_DATA.length
  const avgRounded = Math.round(historicalAvg * 100) / 100
  const diffFromAvg = ((psRatio - historicalAvg) / historicalAvg * 100).toFixed(1)
  const isAboveAvg = psRatio > historicalAvg

  // 根据估值等级生成不同的分析文本
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
        summary: `TSLA 当前 P/S ${psText}x，处于极度低估区间，历史罕见的买入机会。`,
        content:
          `当前 TSLA 市销率为 ${psText}x，处于历史 ${percentileText} 分位，` +
          `远低于历史均值 ${historicalAvg}x（偏离 ${diffFromAvg}%）。\n\n` +
          `这一估值水平极为罕见，通常出现在市场极度恐慌或公司遭遇短期利空时。` +
          `从历史数据来看，在如此低的 P/S 比率买入，中长期获得正收益的概率很高。\n\n` +
          `建议策略：\n` +
          `- 可以考虑分批建仓，利用低估值优势\n` +
          `- 关注公司基本面是否出现实质性恶化\n` +
          `- 如果基本面未变，这可能是难得的价值投资机会\n` +
          `- 注意仓位管理，不要 ALL IN\n\n` +
          `风险提示：低估值不代表不会更低，需结合行业趋势和公司经营状况综合判断。`
      }

    case 'CHEAP':
      return {
        summary: `TSLA 当前 P/S ${psText}x，估值偏低，可考虑逢低布局。`,
        content:
          `当前 TSLA 市销率为 ${psText}x，处于历史 ${percentileText} 分位，` +
          `低于历史均值 ${historicalAvg}x（偏离 ${diffFromAvg}%）。\n\n` +
          `这一估值水平表明市场对特斯拉的定价相对保守。在汽车行业转型和 AI 赋能的大背景下，` +
          `当前价格可能未充分反映公司的成长潜力。\n\n` +
          `建议策略：\n` +
          `- 适合开始建仓或加仓，分批买入降低择时风险\n` +
          `- 关注季度交付量数据和毛利率变化\n` +
          `- 留意 FSD（全自动驾驶）进展和 Robotaxi 落地时间表\n` +
          `- 设定好止损位，控制下行风险\n\n` +
          `风险提示：汽车行业竞争加剧，需关注市场份额变化和利润率走势。`
      }

    case 'FAIR':
      return {
        summary: `TSLA 当前 P/S ${psText}x，估值合理，适合持有观望。`,
        content:
          `当前 TSLA 市销率为 ${psText}x，处于历史 ${percentileText} 分位，` +
          `${isAboveAvg ? '略高于' : '接近'}历史均值 ${historicalAvg}x（偏离 ${diffFromAvg}%）。\n\n` +
          `当前估值处于合理区间，市场对特斯拉的定价基本反映了其当前业绩和近期增长预期。` +
          `这个阶段不宜大举追涨，也不必急于离场。\n\n` +
          `建议策略：\n` +
          `- 已持有者可继续持有，等待更明确的方向信号\n` +
          `- 新建仓者建议小仓位试探，等待回调加仓\n` +
          `- 重点关注营收增速能否维持或加速\n` +
          `- 关注能源业务和 AI 业务的边际变化\n\n` +
          `风险提示：估值合理区间上沿接近偏贵，注意设置止盈计划。`
      }

    case 'EXPENSIVE':
      return {
        summary: `TSLA 当前 P/S ${psText}x，估值偏高，追涨需谨慎。`,
        content:
          `当前 TSLA 市销率为 ${psText}x，处于历史 ${percentileText} 分位，` +
          `显著高于历史均值 ${historicalAvg}x（偏离 +${Math.abs(Number(diffFromAvg))}%）。\n\n` +
          `市场对特斯拉的乐观预期已较充分地反映在股价中。这通常由重大利好催化，` +
          `比如 FSD 突破、Robotaxi 落地预期或政策利好等。\n\n` +
          `建议策略：\n` +
          `- 不建议在此价位大幅加仓，追高风险较大\n` +
          `- 已持仓者可适当减仓锁定部分利润\n` +
          `- 等待回调至合理区间再考虑加仓\n` +
          `- 密切关注催化因素是否兑现\n\n` +
          `风险提示：高估值状态下，任何低于预期的数据都可能引发较大回调。`
      }

    case 'OVERPRICED':
      return {
        summary: `TSLA 当前 P/S ${psText}x，市场过热，需高度警惕风险。`,
        content:
          `当前 TSLA 市销率为 ${psText}x，处于历史 ${percentileText} 分位，` +
          `远高于历史均值 ${historicalAvg}x（偏离 +${Math.abs(Number(diffFromAvg))}%）。\n\n` +
          `当前估值已经明显偏离基本面支撑，市场情绪极度乐观。历史上类似的高估值水平，` +
          `往往伴随后续较大幅度的回调。这并不意味着股价不能继续上涨，但风险收益比已经不利。\n\n` +
          `建议策略：\n` +
          `- 不建议新建仓位，风险收益比不佳\n` +
          `- 已持仓者建议分批减仓，落袋为安\n` +
          `- 可关注看跌期权作为对冲工具\n` +
          `- 耐心等待估值回归合理区间\n\n` +
          `风险提示：FOMO 是投资大忌，高估值追涨往往是亏损的主要原因。请理性决策。`
      }

    default:
      return {
        summary: `TSLA 当前 P/S ${psText}x，请结合市场环境综合判断。`,
        content:
          `当前 TSLA 市销率为 ${psText}x，处于历史 ${percentileText} 分位，` +
          `历史均值为 ${historicalAvg}x。请结合宏观经济环境、行业趋势和公司基本面综合分析。`
      }
  }
}

// ==================== 预设问题本地回答 ====================

/**
 * 针对预设快速问题生成本地回答
 * 不需要调用 AI API，基于当前数据直接生成
 */
export function getQuickAnswer(question: string, stockData: TSLAStockData): string {
  const { psRatio, valuationTier, price, marketCap, revenueTTM } = stockData
  const percentile = getHistoricalPercentile(psRatio)
  const historicalAvg = HISTORICAL_PS_DATA.reduce((sum, d) => sum + d.psRatio, 0) / HISTORICAL_PS_DATA.length
  const analysis = analyzeValuation(marketCap, revenueTTM)

  if (question.includes('适合买入') || question.includes('现在买')) {
    return generateBuyAdvice(psRatio, valuationTier, price, percentile)
  }

  if (question.includes('P/S') || question.includes('市销率') || question.includes('比率')) {
    return generatePSExplanation(psRatio, valuationTier, historicalAvg)
  }

  if (question.includes('历史') || question.includes('比较') || question.includes('对比')) {
    return generateHistoricalComparison(psRatio, percentile, historicalAvg, analysis)
  }

  if (question.includes('风险') || question.includes('危险')) {
    return generateRiskAnalysis(psRatio, valuationTier, percentile)
  }

  if (question.includes('目标价') || question.includes('目标')) {
    return generateTargetPrice(psRatio, revenueTTM, historicalAvg)
  }

  // 默认返回综合分析
  return getQuickAnalysis(psRatio, valuationTier).content
}

function generateBuyAdvice(
  psRatio: number,
  tier: ValuationTier,
  price: number,
  percentile: number
): string {
  const psText = psRatio.toFixed(2)

  switch (tier.tier) {
    case 'BARGAIN':
      return (
        `基于当前估值分析，TSLA 目前处于极度低估区间。\n\n` +
        `当前价格 $${price.toFixed(2)}，P/S 比率 ${psText}x，` +
        `处于历史 ${percentile}% 分位，是近年来非常罕见的低估值水平。\n\n` +
        `从估值角度看，当前是较好的买入时机。建议分 3-4 批建仓，` +
        `避免一次性投入全部资金。同时关注是否有基本面恶化的迹象。\n\n` +
        `注意：这不构成投资建议，请根据自身风险承受能力决策。`
      )
    case 'CHEAP':
      return (
        `当前 TSLA 估值偏低，具有一定的买入价值。\n\n` +
        `价格 $${price.toFixed(2)}，P/S ${psText}x，历史分位 ${percentile}%。` +
        `估值低于历史平均水平，从价值角度看有吸引力。\n\n` +
        `建议可以开始小仓位建仓，如果继续回调则逐步加仓。` +
        `关注近期财报数据和交付量作为买入确认信号。\n\n` +
        `注意：这不构成投资建议，请根据自身风险承受能力决策。`
      )
    case 'FAIR':
      return (
        `当前 TSLA 估值处于合理区间，无明显的买入或卖出信号。\n\n` +
        `价格 $${price.toFixed(2)}，P/S ${psText}x，历史分位 ${percentile}%。` +
        `市场定价基本反映了公司当前状况。\n\n` +
        `建议观望为主，等待估值回到偏低区间再考虑加仓。` +
        `如果坚持买入，建议控制仓位在总投资组合的 5-10%。\n\n` +
        `注意：这不构成投资建议，请根据自身风险承受能力决策。`
      )
    case 'EXPENSIVE':
      return (
        `当前 TSLA 估值偏高，不建议此时追涨买入。\n\n` +
        `价格 $${price.toFixed(2)}，P/S ${psText}x，历史分位 ${percentile}%。` +
        `市场已经充分反映了乐观预期，追高风险较大。\n\n` +
        `建议耐心等待回调，至少等 P/S 回落到 12x 以下再考虑。` +
        `如果已持有仓位，可以考虑部分止盈。\n\n` +
        `注意：这不构成投资建议，请根据自身风险承受能力决策。`
      )
    case 'OVERPRICED':
      return (
        `当前 TSLA 估值已经严重偏高，强烈不建议此时买入。\n\n` +
        `价格 $${price.toFixed(2)}，P/S ${psText}x，历史分位 ${percentile}%。` +
        `市场情绪过热，估值远超基本面支撑。\n\n` +
        `从历史数据看，在高估值区间买入大概率会经历较大回撤。` +
        `建议耐心等待，好的投资机会需要好的价格。\n\n` +
        `注意：这不构成投资建议，请根据自身风险承受能力决策。`
      )
    default:
      return `当前 P/S 比率 ${psText}x，请结合自身情况和市场环境综合判断。`
  }
}

function generatePSExplanation(
  psRatio: number,
  tier: ValuationTier,
  historicalAvg: number
): string {
  return (
    `P/S 比率（市销率）是什么？\n\n` +
    `P/S = 市值 / 年营收，它反映市场愿意为公司每 1 美元营收支付多少。\n\n` +
    `TSLA 当前 P/S 比率：${psRatio.toFixed(2)}x\n` +
    `历史平均 P/S：${historicalAvg.toFixed(2)}x\n` +
    `当前估值等级：${tier.textCn}\n\n` +
    `为什么用 P/S 而不是 P/E？\n` +
    `- 特斯拉的利润波动较大，P/E（市盈率）容易失真\n` +
    `- 营收更稳定，能更好反映公司规模和成长性\n` +
    `- P/S 是成长股估值的常用指标\n\n` +
    `TSLA 的 P/S 估值区间参考：\n` +
    `- 低于 5x：极度低估（超值区间）\n` +
    `- 5-8x：偏低（价值区间）\n` +
    `- 8-12x：合理（中性区间）\n` +
    `- 12-20x：偏高（谨慎区间）\n` +
    `- 20x 以上：高估（风险区间）`
  )
}

function generateHistoricalComparison(
  psRatio: number,
  percentile: number,
  historicalAvg: number,
  analysis: { isAboveAvg: boolean }
): string {
  const recentData = HISTORICAL_PS_DATA.slice(-4)
  const quarterText = recentData
    .map(d => `${d.date}: P/S ${d.psRatio}x (股价 $${d.price})`)
    .join('\n')

  const maxPS = Math.max(...HISTORICAL_PS_DATA.map(d => d.psRatio))
  const minPS = Math.min(...HISTORICAL_PS_DATA.map(d => d.psRatio))
  const maxEntry = HISTORICAL_PS_DATA.find(d => d.psRatio === maxPS)
  const minEntry = HISTORICAL_PS_DATA.find(d => d.psRatio === minPS)

  return (
    `TSLA 历史 P/S 比率对比分析\n\n` +
    `当前 P/S：${psRatio.toFixed(2)}x\n` +
    `历史均值：${historicalAvg.toFixed(2)}x\n` +
    `历史分位：${percentile}%（即 ${percentile}% 的历史数据低于当前值）\n` +
    `当前 ${analysis.isAboveAvg ? '高于' : '低于'}历史均值\n\n` +
    `历史极值：\n` +
    `- 最高 P/S：${maxPS}x（${maxEntry?.date}，股价 $${maxEntry?.price}）\n` +
    `- 最低 P/S：${minPS}x（${minEntry?.date}，股价 $${minEntry?.price}）\n\n` +
    `近 4 个季度数据：\n${quarterText}\n\n` +
    `总结：当前估值在历史参照中处于 ${percentile < 30 ? '较低' : percentile < 70 ? '中等' : '较高'}位置，` +
    `${percentile < 30 ? '有较好的安全边际' : percentile < 70 ? '估值基本合理' : '需要注意回调风险'}。`
  )
}

function generateRiskAnalysis(
  psRatio: number,
  tier: ValuationTier,
  percentile: number
): string {
  const riskLevel = percentile > 80 ? '高' : percentile > 50 ? '中等' : '较低'

  return (
    `TSLA 当前风险评估\n\n` +
    `综合风险等级：${riskLevel}\n` +
    `P/S 比率：${psRatio.toFixed(2)}x（${tier.textCn}）\n` +
    `估值分位：${percentile}%\n\n` +
    `主要风险因素：\n` +
    `1. 估值风险：${percentile > 70 ? '当前估值偏高，有回调压力' : percentile > 40 ? '估值合理，风险可控' : '估值偏低，下行空间有限'}\n` +
    `2. 竞争风险：全球电动车市场竞争加剧，中国市场尤其激烈\n` +
    `3. 政策风险：补贴政策变化、关税和贸易摩擦\n` +
    `4. 技术风险：FSD 自动驾驶技术落地进度不确定\n` +
    `5. 宏观风险：利率环境和经济周期对成长股影响较大\n\n` +
    `利好因素：\n` +
    `1. AI 和自动驾驶领域的技术领先优势\n` +
    `2. 能源业务（储能、太阳能）快速增长\n` +
    `3. Robotaxi 和 Optimus 机器人的长期想象空间\n` +
    `4. 全球产能持续扩张\n\n` +
    `注意：投资有风险，以上分析仅供参考。`
  )
}

function generateTargetPrice(
  psRatio: number,
  revenueTTM: number,
  historicalAvg: number
): string {
  const sharesOutstanding = 3_210_000_000  // 约32.1亿股
  const fairPS = historicalAvg
  const cheapPS = 7
  const expensivePS = 15

  const fairPrice = (fairPS * revenueTTM / sharesOutstanding).toFixed(0)
  const cheapPrice = (cheapPS * revenueTTM / sharesOutstanding).toFixed(0)
  const expensivePrice = (expensivePS * revenueTTM / sharesOutstanding).toFixed(0)

  return (
    `TSLA 估值参考价格区间\n\n` +
    `基于当前 TTM 营收和 P/S 比率的参考价格：\n\n` +
    `- 低估价位（P/S 7x）：约 $${cheapPrice}\n` +
    `- 合理价位（P/S ${fairPS.toFixed(1)}x）：约 $${fairPrice}\n` +
    `- 偏高价位（P/S 15x）：约 $${expensivePrice}\n\n` +
    `当前 P/S：${psRatio.toFixed(2)}x\n\n` +
    `注意：\n` +
    `- 以上价格基于当前营收水平，未考虑未来增长\n` +
    `- 如果营收增速超预期，合理估值中枢会上移\n` +
    `- 这些是参考区间而非精确目标价\n` +
    `- 不构成任何投资建议，请综合多维度分析`
  )
}

// ==================== AI 深度分析 (Pro) ====================

/**
 * AI 深度分析 - 调用 Supabase Edge Function
 * 仅限 Pro 用户使用
 * 包含 30 分钟缓存和模板降级机制
 */
export async function getDeepAnalysis(stockData: TSLAStockData): Promise<AIAnalysisResult> {
  const cacheKey = getCacheKey(stockData)

  // 检查缓存
  const cached = getCachedAnalysis(cacheKey)
  if (cached) {
    return cached
  }

  // 调用 AI 分析 Edge Function
  try {
    const token = getSessionToken()
    const analysis = analyzeValuation(stockData.marketCap, stockData.revenueTTM)

    const res = await Taro.request<{
      content: string
      summary: string
      confidence: 'high' | 'medium' | 'low'
    }>({
      url: `${SUPABASE_URL}/functions/v1/ai-analyze`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`
      },
      data: {
        price: stockData.price,
        psRatio: stockData.psRatio,
        marketCap: stockData.marketCap,
        revenueTTM: stockData.revenueTTM,
        change: stockData.change,
        changePercent: stockData.changePercent,
        volume: stockData.volume,
        fiftyTwoWeekHigh: stockData.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: stockData.fiftyTwoWeekLow,
        valuationTier: stockData.valuationTier.tier,
        percentile: analysis.percentile,
        historicalAvg: analysis.historicalAvg,
        historicalData: HISTORICAL_PS_DATA
      },
      timeout: 30000  // AI 分析允许较长超时
    })

    if (res.statusCode >= 200 && res.statusCode < 300 && res.data?.content) {
      const result: AIAnalysisResult = {
        content: res.data.content,
        summary: res.data.summary || '深度分析完成',
        confidence: res.data.confidence || 'high',
        timestamp: Date.now(),
        source: 'ai'
      }

      setCachedAnalysis(cacheKey, result)
      return result
    }

    // API 返回错误，降级到模板分析
    console.warn('AI 分析 API 返回异常，降级到模板分析')
    return getFallbackAnalysis(stockData)
  } catch (err) {
    console.warn('AI 分析请求失败，降级到模板分析:', (err as Error).message)
    return getFallbackAnalysis(stockData)
  }
}

/**
 * AI 对话分析 - 用户自定义问题
 * 调用 AI Edge Function 处理自由问题
 */
export async function askAI(
  question: string,
  stockData: TSLAStockData
): Promise<string> {
  // 先尝试匹配预设问题（无需网络请求）
  const quickAnswer = getQuickAnswer(question, stockData)
  if (quickAnswer && question.length < 20) {
    return quickAnswer
  }

  // 调用 AI Edge Function
  try {
    const token = getSessionToken()
    const analysis = analyzeValuation(stockData.marketCap, stockData.revenueTTM)

    const res = await Taro.request<{ answer: string }>({
      url: `${SUPABASE_URL}/functions/v1/ai-analyze`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`
      },
      data: {
        mode: 'chat',
        question,
        price: stockData.price,
        psRatio: stockData.psRatio,
        valuationTier: stockData.valuationTier.tier,
        percentile: analysis.percentile,
        historicalAvg: analysis.historicalAvg
      },
      timeout: 30000
    })

    if (res.statusCode >= 200 && res.statusCode < 300 && res.data?.answer) {
      return res.data.answer
    }

    // 降级到本地回答
    return quickAnswer
  } catch {
    return quickAnswer
  }
}

/**
 * 降级分析 - AI 不可用时使用增强版模板
 */
function getFallbackAnalysis(stockData: TSLAStockData): AIAnalysisResult {
  const result = getQuickAnalysis(stockData.psRatio, stockData.valuationTier)

  // 增强模板内容，加入更多数据点
  const extra =
    `\n\n补充数据：\n` +
    `- 当前股价：$${stockData.price.toFixed(2)}\n` +
    `- 日涨跌：${stockData.change > 0 ? '+' : ''}${stockData.change.toFixed(2)}（${stockData.change > 0 ? '+' : ''}${stockData.changePercent.toFixed(2)}%）\n` +
    `- 52周区间：$${stockData.fiftyTwoWeekLow.toFixed(0)} - $${stockData.fiftyTwoWeekHigh.toFixed(0)}\n` +
    `- 市值：$${(stockData.marketCap / 1e9).toFixed(0)}B\n` +
    `- 成交量：${(stockData.volume / 1e6).toFixed(1)}M`

  return {
    ...result,
    content: result.content + extra,
    source: 'template'
  }
}

// ==================== 工具函数 ====================

/**
 * 生成唯一消息 ID
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
}

/**
 * 清除 AI 分析缓存
 */
export function clearAICache(): void {
  try {
    Taro.removeStorageSync(AI_CACHE_KEY)
  } catch {
    // 忽略
  }
}
