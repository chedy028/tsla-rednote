/**
 * Global type definitions
 * Note: ValuationTier interface is defined in services/valuation.ts
 * Import from there for the full interface with color, emoji, text fields
 */

// Re-export from services for convenience
export type { ValuationTier, ValuationAnalysis, HistoricalPSData } from '../services/valuation'
export type { TSLAStockData } from '../services/stockApi'

export type SubscriptionStatus = 'free' | 'active' | 'expired' | 'cancelled'

export interface AlertSettings {
  enabled: boolean
  priceAbove?: number
  priceBelow?: number
  psRatioAbove?: number
  psRatioBelow?: number
}
