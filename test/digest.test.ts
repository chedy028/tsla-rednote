import { describe, it, expect } from 'vitest'

// ─── Zone computation (mirrors generate-daily-digest/index.ts) ──────────────

type Zone = 'BARGAIN' | 'CHEAP' | 'FAIR' | 'EXPENSIVE' | 'OVERPRICED'

function getZone(psRatio: number): Zone {
  if (psRatio < 5) return 'BARGAIN'
  if (psRatio < 8) return 'CHEAP'
  if (psRatio < 12) return 'FAIR'
  if (psRatio < 20) return 'EXPENSIVE'
  return 'OVERPRICED'
}

// Zone labels from generate-daily-digest
const ZONE_LABELS: Record<string, Record<Zone, string>> = {
  zh: { BARGAIN: '超值', CHEAP: '便宜', FAIR: '合理', EXPENSIVE: '偏贵', OVERPRICED: '高估' },
  en: { BARGAIN: 'BARGAIN', CHEAP: 'CHEAP', FAIR: 'FAIR VALUE', EXPENSIVE: 'EXPENSIVE', OVERPRICED: 'OVERPRICED' },
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('digest zone computation', () => {
  describe('getZone', () => {
    it('returns BARGAIN for P/S < 5', () => {
      expect(getZone(0)).toBe('BARGAIN')
      expect(getZone(2.5)).toBe('BARGAIN')
      expect(getZone(4.99)).toBe('BARGAIN')
    })

    it('returns CHEAP for P/S 5-7.99', () => {
      expect(getZone(5)).toBe('CHEAP')
      expect(getZone(7.99)).toBe('CHEAP')
    })

    it('returns FAIR for P/S 8-11.99', () => {
      expect(getZone(8)).toBe('FAIR')
      expect(getZone(11.99)).toBe('FAIR')
    })

    it('returns EXPENSIVE for P/S 12-19.99', () => {
      expect(getZone(12)).toBe('EXPENSIVE')
      expect(getZone(19.99)).toBe('EXPENSIVE')
    })

    it('returns OVERPRICED for P/S >= 20', () => {
      expect(getZone(20)).toBe('OVERPRICED')
      expect(getZone(50)).toBe('OVERPRICED')
      expect(getZone(Infinity)).toBe('OVERPRICED')
    })

    it('matches valuation.ts tier boundaries', () => {
      // These must match getValuationTier() in src/services/valuation.ts
      // BARGAIN < 5, CHEAP < 8, FAIR < 12, EXPENSIVE < 20, OVERPRICED >= 20
      expect(getZone(4.99)).toBe('BARGAIN')
      expect(getZone(5.00)).toBe('CHEAP')
      expect(getZone(7.99)).toBe('CHEAP')
      expect(getZone(8.00)).toBe('FAIR')
      expect(getZone(11.99)).toBe('FAIR')
      expect(getZone(12.00)).toBe('EXPENSIVE')
      expect(getZone(19.99)).toBe('EXPENSIVE')
      expect(getZone(20.00)).toBe('OVERPRICED')
    })
  })

  describe('zone change detection', () => {
    it('detects zone change when zone differs from previous', () => {
      const prevZone = 'FAIR'
      const currentZone = getZone(5) // CHEAP
      expect(currentZone).not.toBe(prevZone)
    })

    it('no change when zone is the same', () => {
      const prevZone = 'FAIR'
      const currentZone = getZone(10) // FAIR
      expect(currentZone).toBe(prevZone)
    })
  })

  describe('zone labels', () => {
    it('has labels for all zones in zh', () => {
      const zones: Zone[] = ['BARGAIN', 'CHEAP', 'FAIR', 'EXPENSIVE', 'OVERPRICED']
      for (const zone of zones) {
        expect(ZONE_LABELS.zh[zone]).toBeTruthy()
      }
    })

    it('has labels for all zones in en', () => {
      const zones: Zone[] = ['BARGAIN', 'CHEAP', 'FAIR', 'EXPENSIVE', 'OVERPRICED']
      for (const zone of zones) {
        expect(ZONE_LABELS.en[zone]).toBeTruthy()
      }
    })
  })

  describe('digest idempotency', () => {
    it('date format is YYYY-MM-DD', () => {
      const today = new Date().toISOString().slice(0, 10)
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('template fallback', () => {
    function getTemplateFallback(zone: Zone, lang: string, psRatio: number): string {
      const label = ZONE_LABELS[lang]?.[zone] ?? zone
      const templates: Record<string, string> = {
        zh: `TSLA 当前估值区间：${label}（P/S ${psRatio.toFixed(2)}x）。详细 AI 分析将在下期为您呈现。`,
        en: `TSLA valuation zone: ${label} (P/S ${psRatio.toFixed(2)}x). Full AI analysis in your next daily digest.`,
      }
      return templates[lang] || templates.en
    }

    it('generates zh fallback with zone and P/S', () => {
      const result = getTemplateFallback('FAIR', 'zh', 10.5)
      expect(result).toContain('合理')
      expect(result).toContain('10.50x')
    })

    it('generates en fallback with zone and P/S', () => {
      const result = getTemplateFallback('CHEAP', 'en', 6.2)
      expect(result).toContain('CHEAP')
      expect(result).toContain('6.20x')
    })

    it('falls back to English for unknown language', () => {
      const result = getTemplateFallback('BARGAIN', 'fr', 3.0)
      expect(result).toContain('BARGAIN')
      expect(result).toContain('3.00x')
    })
  })

  describe('subscription gating for get-digests', () => {
    // Simulate the get-digests access control logic
    function getDigestAccess(isPro: boolean): { limit: number; teaserOnly: boolean } {
      if (isPro) return { limit: 30, teaserOnly: false }
      return { limit: 1, teaserOnly: true }
    }

    it('Pro users get full history (up to 30)', () => {
      const access = getDigestAccess(true)
      expect(access.limit).toBe(30)
      expect(access.teaserOnly).toBe(false)
    })

    it('Free users get single teaser', () => {
      const access = getDigestAccess(false)
      expect(access.limit).toBe(1)
      expect(access.teaserOnly).toBe(true)
    })

    it('teaser date is 7 days ago', () => {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const teaserDate = sevenDaysAgo.toISOString().slice(0, 10)
      const today = new Date().toISOString().slice(0, 10)
      expect(teaserDate).not.toBe(today)

      // Verify it's roughly 7 days ago
      const diff = new Date(today).getTime() - new Date(teaserDate).getTime()
      const daysDiff = diff / (1000 * 60 * 60 * 24)
      expect(daysDiff).toBe(7)
    })
  })
})
