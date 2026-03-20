import { View, Text, Button } from '@tarojs/components'
import { useEffect, useState, useCallback } from 'react'
import { isTikTokMinis, onTikTokShare, shareTikTok } from '../../services/tiktokMinis'
import { navigateToView, getCurrentView, onViewChange, type AppView } from '../../services/navigation'
import { fetchTSLAData, getUpdateTimeText, type TSLAStockData } from '../../services/stockApi'
import { t, getCurrentLang, setLang, onLangChange, ALL_LANGS, LANG_NAMES, type Lang } from '../../services/i18n'
import { openStripeCheckout, handlePaymentRedirect, getCachedSubscription, checkSubscriptionByEmail, type SubscriptionStatus } from '../../services/stripe'
import CustomTabBar from '../../components/CustomTabBar'
import './index.scss'

// ==================== SPA Router via Custom Events ====================
// Taro H5 has a known bug: ANY hash change triggers Taro's router.
// See services/navigation.ts for the workaround.
//
// CRITICAL: All views are INLINED in this file. Importing from separate
// component files crashes Taro's bootstrap (even from components/ directory).
// Inline JSX is the only reliable approach in Taro H5.

// ==================== Language Switcher (inline) ====================

function LangSwitcher() {
  const [lang, setCurrentLang] = useState<Lang>(getCurrentLang)

  useEffect(() => {
    return onLangChange(setCurrentLang)
  }, [])

  return (
    <View style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '12px 0' }}>
      {ALL_LANGS.map(l => (
        <View
          key={l}
          role='button'
          tabIndex={0}
          onClick={() => setLang(l)}
          style={{
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '22px',
            fontWeight: lang === l ? 'bold' : 'normal',
            background: lang === l ? '#00d4aa' : 'rgba(255,255,255,0.2)',
            color: lang === l ? 'white' : 'inherit',
            cursor: 'pointer',
          }}
        >
          <Text>{LANG_NAMES[l]}</Text>
        </View>
      ))}
    </View>
  )
}

// ==================== Dashboard View (inline) ====================

function DashboardInline() {
  const [tslaData, setTslaData] = useState<TSLAStockData | null>(null)
  const [loading, setLoading] = useState(true)
  const [, setLangTick] = useState(0)
  const [isPro, setIsPro] = useState(false)
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null)
  const [showRestore, setShowRestore] = useState(false)
  const [restoreEmail, setRestoreEmail] = useState('')
  const [restoreLoading, setRestoreLoading] = useState(false)
  const [restoreError, setRestoreError] = useState<string | null>(null)

  // Re-render on language change
  useEffect(() => {
    return onLangChange(() => setLangTick(n => n + 1))
  }, [])

  // Check subscription status
  useEffect(() => {
    // First check cached subscription
    const cached = getCachedSubscription()
    if (cached?.isActive) {
      setIsPro(true)
    }

    // Then check if returning from Stripe checkout
    handlePaymentRedirect().then(result => {
      if (result?.isActive) {
        setIsPro(true)
        setPaymentMessage(t('dash.payment.success'))
        setTimeout(() => setPaymentMessage(null), 5000)
      }
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await fetchTSLAData()
        if (!cancelled) {
          setTslaData(data)
          setLoading(false)
        }
      } catch (err) {
        console.error('Failed to load data:', err)
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <View style={{ minHeight: '100vh', background: '#f8f9fa', padding: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: '32px', color: '#999' }}>{t('dash.loading')}</Text>
        <CustomTabBar />
      </View>
    )
  }

  if (!tslaData) {
    return (
      <View style={{ minHeight: '100vh', background: '#f8f9fa', padding: '32px' }}>
        <Text style={{ fontSize: '28px', color: '#c62828' }}>{t('dash.error')}</Text>
        <CustomTabBar />
      </View>
    )
  }

  return (
    <View style={{ minHeight: '100vh', background: '#f8f9fa', padding: '24px' }}>
      {/* Language Switcher */}
      <LangSwitcher />

      {/* Header */}
      <View style={{ marginBottom: '24px' }}>
        <Text style={{ fontSize: '40px', fontWeight: 'bold', display: 'block' }}>{t('dash.name')}</Text>
        <Text style={{ fontSize: '24px', color: '#666', display: 'block' }}>{t('dash.company')}</Text>
      </View>

      {/* Price */}
      <View style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Text style={{ fontSize: '56px', fontWeight: 'bold', display: 'block' }}>${tslaData.price.toFixed(2)}</Text>
        <Text style={{ fontSize: '24px', color: tslaData.change >= 0 ? '#2e7d32' : '#c62828', display: 'block', marginTop: '8px' }}>
          {tslaData.change >= 0 ? '+' : ''}{tslaData.change.toFixed(2)} ({tslaData.change >= 0 ? '+' : ''}{tslaData.changePercent.toFixed(2)}%)
        </Text>
        <Text style={{ fontSize: '20px', color: '#999', display: 'block', marginTop: '8px' }}>
          {getUpdateTimeText(tslaData.timestamp)}
        </Text>
      </View>

      {/* Payment success message */}
      {paymentMessage && (
        <View style={{ background: '#e8f5e9', borderRadius: '12px', padding: '16px', marginBottom: '16px', textAlign: 'center' }}>
          <Text style={{ fontSize: '24px', color: '#2e7d32', fontWeight: 'bold' }}>{paymentMessage}</Text>
        </View>
      )}

      {/* Valuation - Pro users see full analysis, free users see locked */}
      <View style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
        <Text style={{ fontSize: '24px', fontWeight: 'bold', display: 'block', marginBottom: '16px' }}>{t('dash.ps.title')}</Text>
        <Text style={{ fontSize: '56px', fontWeight: 'bold', display: 'block', color: isPro ? (tslaData.psRatio < 10 ? '#2e7d32' : tslaData.psRatio < 15 ? '#f9a825' : '#c62828') : '#333' }}>{tslaData.psRatio.toFixed(2)}x</Text>
        <Text style={{ fontSize: '24px', color: '#666', display: 'block', marginTop: '8px' }}>{t('dash.ps.label')}</Text>
        {isPro ? (
          <View style={{ marginTop: '16px' }}>
            <View style={{ background: tslaData.psRatio < 10 ? '#e8f5e9' : tslaData.psRatio < 15 ? '#fff8e1' : '#fce4ec', borderRadius: '12px', padding: '12px 24px' }}>
              <Text style={{ fontSize: '22px', fontWeight: 'bold', color: tslaData.psRatio < 10 ? '#2e7d32' : tslaData.psRatio < 15 ? '#f9a825' : '#c62828' }}>
                {tslaData.psRatio < 10 ? t('dash.ps.undervalued') : tslaData.psRatio < 15 ? t('dash.ps.fair') : t('dash.ps.overvalued')}
              </Text>
            </View>
            <View style={{ background: '#f0faf7', borderRadius: '8px', padding: '8px 16px', marginTop: '8px' }}>
              <Text style={{ fontSize: '20px', color: '#00a884' }}>{t('dash.ps.subscribed')}</Text>
            </View>
          </View>
        ) : (
          <View style={{ background: '#f0f0f0', borderRadius: '12px', padding: '12px 24px', marginTop: '16px' }}>
            <Text style={{ fontSize: '22px', color: '#999' }}>{t('dash.ps.locked')}</Text>
          </View>
        )}
      </View>

      {/* Stats Grid */}
      <View style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <View style={{ flex: 1, minWidth: '40%', background: 'white', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <Text style={{ fontSize: '20px', color: '#666', display: 'block' }}>{t('dash.stat.mcap')}</Text>
          <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block' }}>${(tslaData.marketCap / 1e9).toFixed(0)}B</Text>
        </View>
        <View style={{ flex: 1, minWidth: '40%', background: 'white', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <Text style={{ fontSize: '20px', color: '#666', display: 'block' }}>{t('dash.stat.rev')}</Text>
          <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block' }}>${(tslaData.revenueTTM / 1e9).toFixed(0)}B</Text>
        </View>
        <View style={{ flex: 1, minWidth: '40%', background: 'white', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <Text style={{ fontSize: '20px', color: '#666', display: 'block' }}>{t('dash.stat.vol')}</Text>
          <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block' }}>{(tslaData.volume / 1e6).toFixed(1)}M</Text>
        </View>
        <View style={{ flex: 1, minWidth: '40%', background: 'white', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <Text style={{ fontSize: '20px', color: '#666', display: 'block' }}>{t('dash.stat.range')}</Text>
          <Text style={{ fontSize: '24px', fontWeight: 'bold', display: 'block' }}>${tslaData.fiftyTwoWeekLow.toFixed(0)}-${tslaData.fiftyTwoWeekHigh.toFixed(0)}</Text>
        </View>
      </View>

      {/* Upgrade CTA - only show for free users */}
      {!isPro && (
        <View role='button' tabIndex={0} onClick={() => navigateToView('pricing')} style={{ background: 'linear-gradient(135deg, #00d4aa, #00b894)', borderRadius: '16px', padding: '24px', textAlign: 'center', marginBottom: '16px', cursor: 'pointer' }}>
          <Text style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', display: 'block' }}>{t('dash.upgrade')}</Text>
          <Text style={{ fontSize: '22px', color: 'rgba(255,255,255,0.8)', display: 'block', marginTop: '8px' }}>{t('dash.upgrade.sub')}</Text>
        </View>
      )}

      {/* Restore Purchase - only show for free users */}
      {!isPro && (
        <View style={{ textAlign: 'center', marginBottom: '16px' }}>
          {!showRestore ? (
            <View role='button' tabIndex={0} onClick={() => setShowRestore(true)} style={{ cursor: 'pointer', padding: '8px' }}>
              <Text style={{ fontSize: '22px', color: '#00d4aa', textDecoration: 'underline' }}>{t('dash.restore')}</Text>
            </View>
          ) : (
            <View style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <View style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type='email'
                  placeholder={t('dash.restore.placeholder')}
                  value={restoreEmail}
                  onChange={(e) => { setRestoreEmail((e.target as HTMLInputElement).value); setRestoreError(null) }}
                  style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '2px solid #e0e0e0', fontSize: '16px', outline: 'none' }}
                />
                <View
                  role='button' tabIndex={0}
                  onClick={async () => {
                    if (!restoreEmail || restoreLoading) return
                    setRestoreLoading(true)
                    setRestoreError(null)
                    try {
                      const result = await checkSubscriptionByEmail(restoreEmail)
                      if (result.isActive) {
                        setIsPro(true)
                        setPaymentMessage(t('dash.payment.success'))
                        setShowRestore(false)
                        setTimeout(() => setPaymentMessage(null), 5000)
                      } else {
                        setRestoreError(t('dash.restore.notfound'))
                      }
                    } catch {
                      setRestoreError(t('dash.restore.notfound'))
                    }
                    setRestoreLoading(false)
                  }}
                  style={{ background: '#00d4aa', borderRadius: '8px', padding: '12px 20px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  <Text style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
                    {restoreLoading ? t('dash.restore.checking') : t('dash.restore.verify')}
                  </Text>
                </View>
              </View>
              {restoreError && (
                <Text style={{ fontSize: '20px', color: '#c62828', display: 'block', marginTop: '8px' }}>{restoreError}</Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* Info - no thresholds revealed */}
      <View style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '16px' }}>
        <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block', marginBottom: '12px' }}>{t('dash.ps.what')}</Text>
        <Text style={{ fontSize: '22px', color: '#666', display: 'block', lineHeight: 1.6 }}>
          {t('dash.ps.explain')}
        </Text>
      </View>

      <View style={{ padding: '16px', textAlign: 'center', marginBottom: '120px' }}>
        <Text style={{ fontSize: '20px', color: '#999' }}>{t('dash.disclaimer')}</Text>
      </View>

      <CustomTabBar />
    </View>
  )
}

// ==================== Pricing View (inline) ====================

function PricingInline() {
  const [, setLangTick] = useState(0)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  useEffect(() => {
    return onLangChange(() => setLangTick(n => n + 1))
  }, [])

  const handleSubscribe = useCallback(async (plan: 'basic' | 'pro', billing: 'monthly' | 'annual') => {
    const key = `${plan}-${billing}`
    setLoadingPlan(key)
    try {
      await openStripeCheckout(plan, billing)
    } catch (err) {
      console.error('Checkout error:', err)
      setLoadingPlan(null)
    }
  }, [])

  return (
    <View style={{ minHeight: '100vh', background: '#f0f9ff', padding: '24px' }}>
      {/* Language Switcher */}
      <LangSwitcher />

      <Text style={{ fontSize: '40px', fontWeight: 'bold', display: 'block', textAlign: 'center', marginBottom: '32px' }}>{t('pricing.title')}</Text>

      {/* Basic Plan */}
      <View style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '16px', border: '2px solid #00d4aa' }}>
        <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block' }}>{t('pricing.basic')}</Text>
        <Text style={{ fontSize: '48px', fontWeight: 'bold', color: '#00d4aa', display: 'block', marginTop: '16px' }}>{t('pricing.basic.price')}</Text>
        <Text style={{ fontSize: '22px', color: '#666', display: 'block' }}>{t('pricing.basic.annual')}</Text>
        <View style={{ marginTop: '16px' }}>
          <Text style={{ fontSize: '22px', display: 'block', marginBottom: '8px' }}>{t('pricing.basic.f1')}</Text>
          <Text style={{ fontSize: '22px', display: 'block', marginBottom: '8px' }}>{t('pricing.basic.f2')}</Text>
          <Text style={{ fontSize: '22px', display: 'block', marginBottom: '8px' }}>{t('pricing.basic.f3')}</Text>
        </View>
        {/* Subscribe buttons */}
        <View
          role='button' tabIndex={0}
          onClick={() => handleSubscribe('basic', 'monthly')}
          style={{ background: '#00d4aa', borderRadius: '12px', padding: '14px', textAlign: 'center', marginTop: '16px', cursor: 'pointer' }}
        >
          <Text style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
            {loadingPlan === 'basic-monthly' ? t('pricing.subscribe.loading') : t('pricing.subscribe')}
          </Text>
        </View>
        <View
          role='button' tabIndex={0}
          onClick={() => handleSubscribe('basic', 'annual')}
          style={{ border: '2px solid #00d4aa', borderRadius: '12px', padding: '12px', textAlign: 'center', marginTop: '8px', cursor: 'pointer' }}
        >
          <Text style={{ fontSize: '22px', color: '#00d4aa' }}>
            {loadingPlan === 'basic-annual' ? t('pricing.subscribe.loading') : t('pricing.or.annual')}
          </Text>
        </View>
      </View>

      {/* Pro Plan */}
      <View style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
        <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block' }}>{t('pricing.pro')}</Text>
        <Text style={{ fontSize: '48px', fontWeight: 'bold', color: '#6c5ce7', display: 'block', marginTop: '16px' }}>{t('pricing.pro.price')}</Text>
        <Text style={{ fontSize: '22px', color: '#666', display: 'block' }}>{t('pricing.pro.annual')}</Text>
        <View style={{ marginTop: '16px' }}>
          <Text style={{ fontSize: '22px', display: 'block', marginBottom: '8px' }}>{t('pricing.pro.f1')}</Text>
          <Text style={{ fontSize: '22px', display: 'block', marginBottom: '8px' }}>{t('pricing.pro.f2')}</Text>
          <Text style={{ fontSize: '22px', display: 'block', marginBottom: '8px' }}>{t('pricing.pro.f3')}</Text>
          <Text style={{ fontSize: '22px', display: 'block', marginBottom: '8px' }}>{t('pricing.pro.f4')}</Text>
          <Text style={{ fontSize: '22px', display: 'block', marginBottom: '8px' }}>{t('pricing.pro.f5')}</Text>
        </View>
        {/* Subscribe buttons */}
        <View
          role='button' tabIndex={0}
          onClick={() => handleSubscribe('pro', 'monthly')}
          style={{ background: '#6c5ce7', borderRadius: '12px', padding: '14px', textAlign: 'center', marginTop: '16px', cursor: 'pointer' }}
        >
          <Text style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
            {loadingPlan === 'pro-monthly' ? t('pricing.subscribe.loading') : t('pricing.subscribe')}
          </Text>
        </View>
        <View
          role='button' tabIndex={0}
          onClick={() => handleSubscribe('pro', 'annual')}
          style={{ border: '2px solid #6c5ce7', borderRadius: '12px', padding: '12px', textAlign: 'center', marginTop: '8px', cursor: 'pointer' }}
        >
          <Text style={{ fontSize: '22px', color: '#6c5ce7' }}>
            {loadingPlan === 'pro-annual' ? t('pricing.subscribe.loading') : t('pricing.or.annual')}
          </Text>
        </View>
      </View>

      <View role='button' tabIndex={0} onClick={() => navigateToView('dashboard')} style={{ textAlign: 'center', padding: '16px', marginBottom: '120px', cursor: 'pointer' }}>
        <Text style={{ fontSize: '24px', color: '#00d4aa' }}>{t('pricing.back')}</Text>
      </View>

      <CustomTabBar />
    </View>
  )
}

// ==================== Main Page Component ====================

export default function Index() {
  const [currentView, setCurrentView] = useState<AppView>(getCurrentView)
  const [, setLangTick] = useState(0)

  // Listen for view change events
  useEffect(() => {
    return onViewChange(setCurrentView)
  }, [])

  // Re-render on language change
  useEffect(() => {
    return onLangChange(() => setLangTick(n => n + 1))
  }, [])

  // TikTok Minis: register share events
  useEffect(() => {
    if (isTikTokMinis()) {
      onTikTokShare(() => {
        shareTikTok({
          title: 'TSLA 估值助手 - AI 驱动的特斯拉股票分析',
          desc: '用 P/S 比率分析 TSLA 估值水平，免费查看今日估值状态！',
        }).catch(() => {})
      })
    }
  }, [])

  const handleStart = useCallback(() => {
    navigateToView('dashboard')
  }, [])

  const handlePricing = useCallback(() => {
    navigateToView('pricing')
  }, [])

  // ==================== SPA View Rendering ====================
  // Use conditional rendering within a single return.
  // IMPORTANT: Never use early returns — Taro interprets that as page unmount.

  const showHome = currentView === 'home'
  const showDashboard = currentView === 'dashboard'
  const showPricing = currentView === 'pricing'

  return (
    <View>
      {showDashboard && <DashboardInline />}
      {showPricing && <PricingInline />}
      {showHome && (
        <View className='index'>
          {/* Language Switcher */}
          <LangSwitcher />

          {/* Hero */}
          <View className='hero'>
            <Text className='logo'>📈</Text>
            <Text className='title'>{t('app.title')}</Text>
            <Text className='subtitle'>{t('app.subtitle')}</Text>
            <Text className='tagline'>{t('app.tagline')}</Text>
          </View>

          {/* Free Value Teaser */}
          <View className='valuation-teaser'>
            <Text className='teaser-label'>{t('home.teaser.label')}</Text>
            <View className='teaser-gauge'>
              <Text className='teaser-emoji'>{t('home.teaser.emoji')}</Text>
              <Text className='teaser-tier'>{t('home.teaser.tier')}</Text>
            </View>
            <Text className='teaser-hint'>{t('home.teaser.hint')}</Text>
          </View>

          {/* Features */}
          <View className='features'>
            <View className='feature'>
              <Text className='feature-icon'>⚡</Text>
              <Text className='feature-title'>{t('home.feature.price')}</Text>
              <Text className='feature-desc'>{t('home.feature.price.desc')}</Text>
            </View>

            <View className='feature'>
              <Text className='feature-icon'>🤖</Text>
              <Text className='feature-title'>{t('home.feature.ai')}</Text>
              <Text className='feature-desc'>{t('home.feature.ai.desc')}</Text>
            </View>

            <View className='feature'>
              <Text className='feature-icon'>🎯</Text>
              <Text className='feature-title'>{t('home.feature.signal')}</Text>
              <Text className='feature-desc'>{t('home.feature.signal.desc')}</Text>
            </View>
          </View>

          {/* CTA */}
          <View className='cta'>
            <Button className='start-button' role='button' onClick={handleStart}>
              {t('home.cta')}
            </Button>
            <View className='pricing-link' role='button' tabIndex={0} onClick={handlePricing}>
              <Text className='price-tag'>{t('home.pricing.tag')}</Text>
              <Text className='price-sub'>{t('home.pricing.sub')}</Text>
            </View>
            <Text className='disclaimer'>
              {t('home.disclaimer')}
            </Text>
          </View>

          {/* Why use this tool */}
          <View className='stats'>
            <View className='stat'>
              <Text className='stat-number'>{t('home.stats.s1.icon')}</Text>
              <Text className='stat-label'>{t('home.stats.s1.label')}</Text>
            </View>
            <View className='stat'>
              <Text className='stat-number'>{t('home.stats.s2.icon')}</Text>
              <Text className='stat-label'>{t('home.stats.s2.label')}</Text>
            </View>
            <View className='stat'>
              <Text className='stat-number'>{t('home.stats.s3.icon')}</Text>
              <Text className='stat-label'>{t('home.stats.s3.label')}</Text>
            </View>
          </View>

          <CustomTabBar />
        </View>
      )}
    </View>
  )
}
