/**
 * 估值服务 - TSLA P/S 比率估值分析
 * Valuation Service - Tesla P/S ratio valuation analysis
 */

// 估值等级定义
export interface ValuationTier {
  tier: string        // 英文等级标识
  color: string       // 显示颜色
  emoji: string       // 等级图标
  textCn: string      // 中文估值文字
  textEn: string      // 英文估值文字
  description: string // 中文详细描述
}

// 估值等级阈值配置
const VALUATION_TIERS: { maxPs: number; tier: ValuationTier }[] = [
  {
    maxPs: 5,
    tier: {
      tier: 'BARGAIN',
      color: '#00dd88',
      emoji: '💚',
      textCn: '超值',
      textEn: 'BARGAIN',
      description: '估值处于历史低位区间'
    }
  },
  {
    maxPs: 8,
    tier: {
      tier: 'CHEAP',
      color: '#88dd44',
      emoji: '🟢',
      textCn: '便宜',
      textEn: 'CHEAP',
      description: '估值低于历史均值水平'
    }
  },
  {
    maxPs: 12,
    tier: {
      tier: 'FAIR',
      color: '#ffa500',
      emoji: '🟡',
      textCn: '合理',
      textEn: 'FAIR',
      description: '估值处于历史合理区间'
    }
  },
  {
    maxPs: 20,
    tier: {
      tier: 'EXPENSIVE',
      color: '#ff8800',
      emoji: '🟠',
      textCn: '偏贵',
      textEn: 'EXPENSIVE',
      description: '估值高于历史多数时期'
    }
  },
  {
    maxPs: Infinity,
    tier: {
      tier: 'OVERPRICED',
      color: '#ff4444',
      emoji: '🔴',
      textCn: '高估',
      textEn: 'OVERPRICED',
      description: '估值显著高于历史水平'
    }
  }
]

/**
 * 计算 P/S 比率
 * @param marketCap 市值 (美元)
 * @param revenueTTM 过去12个月营收 (美元)
 * @returns P/S 比率
 */
export function calculatePSRatio(marketCap: number, revenueTTM: number): number {
  if (revenueTTM <= 0) return Infinity
  return marketCap / revenueTTM
}

/**
 * 根据 P/S 比率获取估值等级
 * @param psRatio P/S 比率
 * @returns 估值等级信息
 */
export function getValuationTier(psRatio: number): ValuationTier {
  for (const { maxPs, tier } of VALUATION_TIERS) {
    if (psRatio < maxPs) {
      return tier
    }
  }
  // 默认返回最高等级 (高估)
  return VALUATION_TIERS[VALUATION_TIERS.length - 1].tier
}

// 历史 P/S 比率参考数据 (季度数据)
export interface HistoricalPSData {
  date: string    // YYYY-Q# 格式
  psRatio: number
  price: number
}

// TSLA 近年 P/S 比率历史参考
export const HISTORICAL_PS_DATA: HistoricalPSData[] = [
  { date: '2023-Q1', psRatio: 8.2, price: 207.46 },
  { date: '2023-Q2', psRatio: 10.5, price: 261.77 },
  { date: '2023-Q3', psRatio: 9.8, price: 250.22 },
  { date: '2023-Q4', psRatio: 8.0, price: 248.48 },
  { date: '2024-Q1', psRatio: 5.6, price: 175.79 },
  { date: '2024-Q2', psRatio: 7.8, price: 197.88 },
  { date: '2024-Q3', psRatio: 8.5, price: 249.02 },
  { date: '2024-Q4', psRatio: 15.2, price: 421.06 },
  { date: '2025-Q1', psRatio: 12.8, price: 352.56 },
]

/**
 * 获取 P/S 比率的历史百分位排名
 * @param currentPS 当前 P/S 比率
 * @returns 百分位排名 (0-100)
 */
export function getHistoricalPercentile(currentPS: number): number {
  const sorted = HISTORICAL_PS_DATA.map(d => d.psRatio).sort((a, b) => a - b)
  const below = sorted.filter(ps => ps < currentPS).length
  return Math.round((below / sorted.length) * 100)
}

/**
 * 获取完整估值分析结果
 */
export interface ValuationAnalysis {
  psRatio: number
  tier: ValuationTier
  percentile: number
  historicalAvg: number
  isAboveAvg: boolean
}

export function analyzeValuation(marketCap: number, revenueTTM: number): ValuationAnalysis {
  const psRatio = calculatePSRatio(marketCap, revenueTTM)
  const tier = getValuationTier(psRatio)
  const percentile = getHistoricalPercentile(psRatio)
  const historicalAvg = HISTORICAL_PS_DATA.reduce((sum, d) => sum + d.psRatio, 0) / HISTORICAL_PS_DATA.length

  return {
    psRatio,
    tier,
    percentile,
    historicalAvg: Math.round(historicalAvg * 100) / 100,
    isAboveAvg: psRatio > historicalAvg
  }
}
