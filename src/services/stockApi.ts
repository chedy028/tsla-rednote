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

// ==================== API 请求 ====================

const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 初始重试延迟 1秒

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 从 Yahoo Finance 获取 TSLA 实时数据
 * 包含重试逻辑和缓存
 */
export async function fetchTSLAData(): Promise<TSLAStockData> {
  // 先检查缓存
  const cached = getCachedData()
  if (cached) {
    return cached
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const data = await requestYahooFinance()
      setCachedData(data)
      return data
    } catch (err) {
      lastError = err as Error
      console.warn(`TSLA 数据请求失败 (第${attempt + 1}次):`, lastError.message)

      if (attempt < MAX_RETRIES - 1) {
        // 指数退避重试
        await delay(RETRY_DELAY * Math.pow(2, attempt))
      }
    }
  }

  // 所有重试都失败，尝试返回过期缓存
  try {
    const staleCache = Taro.getStorageSync(CACHE_KEY) as string
    if (staleCache) {
      const entry: CacheEntry = JSON.parse(staleCache)
      console.warn('使用过期缓存数据')
      return entry.data
    }
  } catch {
    // 无可用缓存
  }

  throw new Error(`获取 TSLA 数据失败: ${lastError?.message || '未知错误'}`)
}

/**
 * 发起 Yahoo Finance API 请求
 */
async function requestYahooFinance(): Promise<TSLAStockData> {
  const url = 'https://query1.finance.yahoo.com/v8/finance/chart/TSLA'

  const res = await Taro.request<YahooChartResponse>({
    url,
    method: 'GET',
    header: {
      'User-Agent': 'Mozilla/5.0'
    },
    timeout: 10000
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

  const meta = result.meta
  const price = meta.regularMarketPrice
  const previousClose = meta.previousClose
  const change = price - previousClose
  const changePercent = (change / previousClose) * 100

  // 市值: 优先使用 API 返回值，否则用 估算值
  const marketCap = meta.marketCap || (price * 3_210_000_000) // ~3.21B shares outstanding

  // 计算 P/S 比率和估值
  const psRatio = calculatePSRatio(marketCap, TSLA_TTM_REVENUE)
  const valuationTier = getValuationTier(psRatio)

  const stockData: TSLAStockData = {
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

  return stockData
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
