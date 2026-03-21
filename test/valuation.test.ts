import { describe, it, expect } from 'vitest'
import {
  calculatePSRatio,
  getValuationTier,
  getHistoricalPercentile,
  analyzeValuation,
} from '../src/services/valuation'

describe('calculatePSRatio', () => {
  it('calculates P/S ratio correctly', () => {
    expect(calculatePSRatio(1_000_000_000_000, 100_000_000_000)).toBe(10)
  })

  it('returns Infinity for zero revenue', () => {
    expect(calculatePSRatio(1_000_000_000_000, 0)).toBe(Infinity)
  })

  it('returns Infinity for negative revenue', () => {
    expect(calculatePSRatio(1_000_000_000_000, -1)).toBe(Infinity)
  })

  it('handles small values', () => {
    expect(calculatePSRatio(100, 50)).toBe(2)
  })
})

describe('getValuationTier', () => {
  it('returns BARGAIN for P/S < 5', () => {
    expect(getValuationTier(4.99).tier).toBe('BARGAIN')
    expect(getValuationTier(0).tier).toBe('BARGAIN')
    expect(getValuationTier(2.5).tier).toBe('BARGAIN')
  })

  it('returns CHEAP for P/S 5-7.99', () => {
    expect(getValuationTier(5).tier).toBe('CHEAP')
    expect(getValuationTier(5.01).tier).toBe('CHEAP')
    expect(getValuationTier(7.99).tier).toBe('CHEAP')
  })

  it('returns FAIR for P/S 8-11.99', () => {
    expect(getValuationTier(8).tier).toBe('FAIR')
    expect(getValuationTier(8.01).tier).toBe('FAIR')
    expect(getValuationTier(11.99).tier).toBe('FAIR')
  })

  it('returns EXPENSIVE for P/S 12-19.99', () => {
    expect(getValuationTier(12).tier).toBe('EXPENSIVE')
    expect(getValuationTier(12.01).tier).toBe('EXPENSIVE')
    expect(getValuationTier(19.99).tier).toBe('EXPENSIVE')
  })

  it('returns OVERPRICED for P/S >= 20', () => {
    expect(getValuationTier(20).tier).toBe('OVERPRICED')
    expect(getValuationTier(25).tier).toBe('OVERPRICED')
    expect(getValuationTier(100).tier).toBe('OVERPRICED')
  })

  it('returns correct colors for each tier', () => {
    expect(getValuationTier(3).color).toBe('#00dd88')
    expect(getValuationTier(6).color).toBe('#88dd44')
    expect(getValuationTier(10).color).toBe('#ffa500')
    expect(getValuationTier(15).color).toBe('#ff8800')
    expect(getValuationTier(25).color).toBe('#ff4444')
  })

  it('returns correct Chinese labels', () => {
    expect(getValuationTier(3).textCn).toBe('超值')
    expect(getValuationTier(6).textCn).toBe('便宜')
    expect(getValuationTier(10).textCn).toBe('合理')
    expect(getValuationTier(15).textCn).toBe('偏贵')
    expect(getValuationTier(25).textCn).toBe('高估')
  })

  it('handles boundary values precisely', () => {
    // At exact boundary, should go to next tier
    expect(getValuationTier(4.99).tier).toBe('BARGAIN')
    expect(getValuationTier(5.00).tier).toBe('CHEAP')
    expect(getValuationTier(7.99).tier).toBe('CHEAP')
    expect(getValuationTier(8.00).tier).toBe('FAIR')
    expect(getValuationTier(11.99).tier).toBe('FAIR')
    expect(getValuationTier(12.00).tier).toBe('EXPENSIVE')
    expect(getValuationTier(19.99).tier).toBe('EXPENSIVE')
    expect(getValuationTier(20.00).tier).toBe('OVERPRICED')
  })

  it('handles Infinity P/S ratio', () => {
    expect(getValuationTier(Infinity).tier).toBe('OVERPRICED')
  })
})

describe('getHistoricalPercentile', () => {
  it('returns 0 for lowest value', () => {
    expect(getHistoricalPercentile(0)).toBe(0)
  })

  it('returns 100 for extremely high value', () => {
    expect(getHistoricalPercentile(100)).toBe(100)
  })

  it('returns a value between 0 and 100', () => {
    const percentile = getHistoricalPercentile(10)
    expect(percentile).toBeGreaterThanOrEqual(0)
    expect(percentile).toBeLessThanOrEqual(100)
  })
})

describe('analyzeValuation', () => {
  it('returns complete analysis for normal inputs', () => {
    const result = analyzeValuation(1_000_000_000_000, 100_000_000_000)
    expect(result.psRatio).toBe(10)
    expect(result.tier.tier).toBe('FAIR')
    expect(result.percentile).toBeGreaterThanOrEqual(0)
    expect(result.historicalAvg).toBeGreaterThan(0)
    expect(typeof result.isAboveAvg).toBe('boolean')
  })

  it('handles zero revenue', () => {
    const result = analyzeValuation(1_000_000_000_000, 0)
    expect(result.psRatio).toBe(Infinity)
    expect(result.tier.tier).toBe('OVERPRICED')
  })
})
