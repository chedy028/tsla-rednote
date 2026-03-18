/**
 * TSLA 股票数据 API 服务
 * 从 Yahoo Finance 获取实时特斯拉股票数据
 */
import Taro from '@tarojs/taro'
import { calculatePSRatio, getValuationTier, type ValuationTier } from './valuation'

// ==================== 类型定义 ====================

export interface TSLAStockData {
  price: number           // 当前价格
  change: number          // 价格变动
  changePercent: number   // 变动百分比
  marketCap: number       // 市值
  volume: number          // 成交量
  previousClose: number   // 前收盘价
  dayHigh: number         // 日最高
  dayLow: number          // 日最低
  fiftyTwoWeekHigh: number  // 52周最高
  fiftyTwoWeekLow: number   // 52周最低
  psRatio: number         // P/S 比率
  revenueTTM: number      // TTM 营收
  valuationTier: ValuationTier  // 估值等级
  timestamp: number       // 数据时间戳
}

// Yahoo Finance API 响应类型 (精简)
interface YahooChartResponse {
  chart: {
    result: Array<{
      meta: {
        regularMarketPrice: number
        previousClose: number
        marketCap?: number
        fiftyTwoWeekHigh: number
        fiftyTwoWeekLow: number
        regularMarketVolume: number
        regularMarketDayHigh: number
        regularMarketDayLow: number
      }
    }>
    error: { code: string; description: string } | null
  }
}

// ==================== 缓存配置 ====================

const CACHE_KEY = 'tsla_stock_cache'
const CACHE_DURATION = 15 * 60 * 1000 // 15分钟缓存

interface CacheEntry {
  data: TSLAStockData
  timestamp: number
}

// TSLA TTM 营收 (每季度更新) - 2025年估算值
// 实际应用中应从财务API获取，这里使用近似值
const TSLA_TTM_REVENUE = 100_000_000_000 // ~$100B TTM revenue

// ==================== 缓存管理 ====================

function getCachedData(): TSLAStockData | null {
  try {
    const cached = Taro.getStorageSync(CACHE_KEY) as string
    if (!cached) return null

    const entry: CacheEntry = JSON.parse(cached)
    const now = Date.now()

    if (now - entry.timestamp < CACHE_DURATION) {
      return entry.data
    }

    // 缓存过期
    return null
  } catch {
    return null
  }
}

function setCachedData(data: TSLAStockData): void {
  try {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now()
    }
    Taro.setStorageSync(CACHE_KEY, JSON.stringify(entry))
  } catch {
    // 缓存写入失败不影响主流程
  }
}

// ==================== DEMO 数据 ====================

/**
 * 硬编码的 DEMO 数据，在 API 请求失败时作为降级方案
 * 基于真实的 TSLA 市场数据范围
 */
function getDemoData(): TSLAStockData {
  const price = 287.45
  const previousClose = 282.30
  const change = price - previousClose
  const changePercent = (change / previousClose) * 100
  const marketCap = price * 3_210_000_000 // ~3.21B shares outstanding
  const psRatio = calculatePSRatio(marketCap, TSLA_TTM_REVENUE)
  const valuationTier = getValuationTier(psRatio)

  return {
    price,
    change,
    changePercent,
    marketCap,
    volume: 78_543_200,
    previousClose,
    dayHigh: 291.80,
    dayLow: 280.15,
    fiftyTwoWeekHigh: 488.54,
    fiftyTwoWeekLow: 138.80,
    psRatio,
    revenueTTM: TSLA_TTM_REVENUE,
    valuationTier,
    timestamp: Date.now()
  }
}

// ==================== 环境检测 ====================

const IS_H5 = typeof window !== 'undefined' && !window.__wxjs_environment

// ==================== CORS 代理配置 ====================

const CORS_PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
]

const YAHOO_BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart/TSLA'

// ==================== API 请求 ====================

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 带超时的 Promise 包装
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`请求超时 (${ms}ms)`)), ms)
    )
  ])
}

/**
 * 从 Yahoo Finance 获取 TSLA 实时数据
 * H5 模式：快速尝试 CORS 代理，3s 内无响应立即降级到 DEMO 数据
 * 小程序模式：正常重试逻辑
 */
export async function fetchTSLAData(): Promise<TSLAStockData> {
  // 先检查缓存
  const cached = getCachedData()
  if (cached) {
    return cached
  }

  // H5 模式：快速尝试，快速降级
  if (IS_H5) {
    try {
      // 只尝试 CORS 代理，给 4 秒总超时
      const proxyUrls = CORS_PROXIES.map(proxy => proxy(YAHOO_BASE_URL))
      const data = await withTimeout(
        Promise.any(proxyUrls.map(url => requestWithFetch(url))),
        4000
      )
      setCachedData(data)
      return data
    } catch {
      console.warn('H5 模式: API 请求失败，使用 DEMO 数据')
      const demoData = getDemoData()
      setCachedData(demoData)
      return demoData
    }
  }

  // 小程序模式：正常重试
  const urlsToTry = [
    YAHOO_BASE_URL,
    ...CORS_PROXIES.map(proxy => proxy(YAHOO_BASE_URL))
  ]

  for (const url of urlsToTry) {
    try {
      const data = await requestYahooFinance(url)
      setCachedData(data)
      return data
    } catch (err) {
      console.warn(`TSLA 数据请求失败:`, (err as Error).message)
    }
  }

  // 最终降级：返回 DEMO 数据
  console.warn('所有数据源均失败，使用 DEMO 数据')
  const demoData = getDemoData()
  setCachedData(demoData)
  return demoData
}

/**
 * H5 模式使用原生 fetch 请求 (避免 Taro.request 的 CORS 问题)
 */
async function requestWithFetch(url: string): Promise<TSLAStockData> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const data = await res.json() as YahooChartResponse
  const chart = data?.chart
  if (chart?.error) throw new Error(chart.error.description)

  const result = chart?.result?.[0]
  if (!result) throw new Error('空数据')

  return parseYahooResult(result.meta)
}

/**
 * 解析 Yahoo Finance API meta 数据为 TSLAStockData
 */
function parseYahooResult(meta: YahooChartResponse['chart']['result'][0]['meta']): TSLAStockData {
  const price = meta.regularMarketPrice
  const previousClose = meta.previousClose
  const change = price - previousClose
  const changePercent = (change / previousClose) * 100
  const marketCap = meta.marketCap || (price * 3_210_000_000)
  const psRatio = calculatePSRatio(marketCap, TSLA_TTM_REVENUE)
  const valuationTier = getValuationTier(psRatio)

  return {
    price,
    change,
    changePercent,
    marketCap,
    volume: meta.regularMarketVolume,
    previousClose,
    dayHigh: meta.regularMarketDayHigh,
    dayLow: meta.regularMarketDayLow,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
    psRatio,
    revenueTTM: TSLA_TTM_REVENUE,
    valuationTier,
    timestamp: Date.now()
  }
}

/**
 * 发起 Yahoo Finance API 请求 (小程序模式, 使用 Taro.request)
 */
async function requestYahooFinance(url: string): Promise<TSLAStockData> {
  const res = await Taro.request<YahooChartResponse>({
    url,
    method: 'GET',
    header: {
      'User-Agent': 'Mozilla/5.0'
    },
    timeout: 6000
  })

  if (res.statusCode !== 200) {
    throw new Error(`Yahoo Finance 返回 HTTP ${res.statusCode}`)
  }

  const chart = res.data?.chart
  if (chart?.error) {
    throw new Error(`Yahoo Finance 错误: ${chart.error.description}`)
  }

  const result = chart?.result?.[0]
  if (!result) {
    throw new Error('Yahoo Finance 返回空数据')
  }

  return parseYahooResult(result.meta)
}

/**
 * 获取数据更新时间的友好显示
 * @param timestamp 数据时间戳
 * @returns 友好时间字符串，如 "刚刚" / "3 分钟前" / "1 小时前"
 */
export function getUpdateTimeText(timestamp: number): string {
  const now = Date.now()
  const diffMs = now - timestamp
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)

  if (diffMinutes < 1) return '刚刚更新'
  if (diffMinutes < 60) return `更新于 ${diffMinutes} 分钟前`
  if (diffHours < 24) return `更新于 ${diffHours} 小时前`
  return '数据可能已过期'
}

/**
 * 强制刷新数据 (清除缓存后重新获取)
 */
export async function refreshTSLAData(): Promise<TSLAStockData> {
  try {
    Taro.removeStorageSync(CACHE_KEY)
  } catch {
    // 清除缓存失败不影响请求
  }
  return fetchTSLAData()
}

/**
 * 获取 DEMO 数据 (供外部模块使用)
 */
export function getTSLADemoData(): TSLAStockData {
  return getDemoData()
}
