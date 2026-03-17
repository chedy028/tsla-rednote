/**
 * 服务层统一导出
 * Services barrel export
 */

// 股票数据 API
export { fetchTSLAData, refreshTSLAData, getUpdateTimeText } from './stockApi'
export type { TSLAStockData } from './stockApi'

// 估值分析
export {
  calculatePSRatio,
  getValuationTier,
  getHistoricalPercentile,
  analyzeValuation,
  HISTORICAL_PS_DATA
} from './valuation'
export type { ValuationTier, ValuationAnalysis, HistoricalPSData } from './valuation'

// 认证
export { login, logout, getUser, getOpenid, isAuthenticated, silentLogin, updateUserInfo, getUserProfile } from './auth'
export type { AuthUser } from './auth'

// 支付与订阅
export { checkSubscription, refreshSubscription, subscribe } from './payment'
export type { SubscriptionInfo } from './payment'

// Supabase 客户端
export { getProfile, upsertProfile, updateSubscription, verifySubscription } from './supabase'
export type { UserProfile } from './supabase'

// AI 分析
export {
  getQuickAnalysis,
  getQuickAnswer,
  getDeepAnalysis,
  askAI,
  generateMessageId,
  clearAICache
} from './ai'
export type { AIAnalysisResult, ChatMessage } from './ai'
