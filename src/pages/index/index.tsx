import { View, Text, Button } from '@tarojs/components'
import { useEffect, useState, useCallback } from 'react'
import { isTikTokMinis, onTikTokShare, shareTikTok } from '../../services/tiktokMinis'
import { navigateToView, getCurrentView, onViewChange, type AppView } from '../../services/navigation'
import { fetchTSLAData, getUpdateTimeText, type TSLAStockData } from '../../services/stockApi'
import CustomTabBar from '../../components/CustomTabBar'
import './index.scss'

// ==================== SPA Router via Custom Events ====================
// Taro H5 has a known bug: ANY hash change triggers Taro's router.
// See services/navigation.ts for the workaround.
//
// CRITICAL: All views are INLINED in this file. Importing from separate
// component files crashes Taro's bootstrap (even from components/ directory).
// Inline JSX is the only reliable approach in Taro H5.

// ==================== Dashboard View (inline) ====================

function DashboardInline() {
  const [tslaData, setTslaData] = useState<TSLAStockData | null>(null)
  const [loading, setLoading] = useState(true)

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
        <Text style={{ fontSize: '32px', color: '#999' }}>加载估值数据...</Text>
        <CustomTabBar />
      </View>
    )
  }

  if (!tslaData) {
    return (
      <View style={{ minHeight: '100vh', background: '#f8f9fa', padding: '32px' }}>
        <Text style={{ fontSize: '28px', color: '#c62828' }}>数据加载失败，请稍后重试</Text>
        <CustomTabBar />
      </View>
    )
  }

  return (
    <View style={{ minHeight: '100vh', background: '#f8f9fa', padding: '24px' }}>
      {/* Header */}
      <View style={{ marginBottom: '24px' }}>
        <Text style={{ fontSize: '40px', fontWeight: 'bold', display: 'block' }}>特斯拉 (TSLA)</Text>
        <Text style={{ fontSize: '24px', color: '#666', display: 'block' }}>Tesla, Inc.</Text>
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

      {/* Valuation - show P/S number only, no thresholds */}
      <View style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
        <Text style={{ fontSize: '24px', fontWeight: 'bold', display: 'block', marginBottom: '16px' }}>P/S 估值指标</Text>
        <Text style={{ fontSize: '56px', fontWeight: 'bold', display: 'block', color: '#333' }}>{tslaData.psRatio.toFixed(2)}x</Text>
        <Text style={{ fontSize: '24px', color: '#666', display: 'block', marginTop: '8px' }}>市销率 (Price-to-Sales)</Text>
        <View style={{ background: '#f0f0f0', borderRadius: '12px', padding: '12px 24px', marginTop: '16px' }}>
          <Text style={{ fontSize: '22px', color: '#999' }}>🔒 订阅解锁详细估值解读</Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <View style={{ flex: 1, minWidth: '40%', background: 'white', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <Text style={{ fontSize: '20px', color: '#666', display: 'block' }}>市值</Text>
          <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block' }}>${(tslaData.marketCap / 1e9).toFixed(0)}B</Text>
        </View>
        <View style={{ flex: 1, minWidth: '40%', background: 'white', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <Text style={{ fontSize: '20px', color: '#666', display: 'block' }}>营收 (TTM)</Text>
          <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block' }}>${(tslaData.revenueTTM / 1e9).toFixed(0)}B</Text>
        </View>
        <View style={{ flex: 1, minWidth: '40%', background: 'white', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <Text style={{ fontSize: '20px', color: '#666', display: 'block' }}>成交量</Text>
          <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block' }}>{(tslaData.volume / 1e6).toFixed(1)}M</Text>
        </View>
        <View style={{ flex: 1, minWidth: '40%', background: 'white', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <Text style={{ fontSize: '20px', color: '#666', display: 'block' }}>52周区间</Text>
          <Text style={{ fontSize: '24px', fontWeight: 'bold', display: 'block' }}>${tslaData.fiftyTwoWeekLow.toFixed(0)}-${tslaData.fiftyTwoWeekHigh.toFixed(0)}</Text>
        </View>
      </View>

      {/* Upgrade CTA */}
      <View onClick={() => navigateToView('pricing')} style={{ background: 'linear-gradient(135deg, #00d4aa, #00b894)', borderRadius: '16px', padding: '24px', textAlign: 'center', marginBottom: '16px' }}>
        <Text style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', display: 'block' }}>低至 ¥4.08/月 解锁完整功能</Text>
        <Text style={{ fontSize: '22px', color: 'rgba(255,255,255,0.8)', display: 'block', marginTop: '8px' }}>AI 分析 · 历史走势 · 价格预警</Text>
      </View>

      {/* Info - no thresholds revealed */}
      <View style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '16px' }}>
        <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block', marginBottom: '12px' }}>什么是 P/S 比率？</Text>
        <Text style={{ fontSize: '22px', color: '#666', display: 'block', lineHeight: 1.6 }}>
          P/S (市销率) = 市值 ÷ 营收，是衡量公司估值的核心指标。订阅后可查看详细估值区间分析。
        </Text>
      </View>

      <View style={{ padding: '16px', textAlign: 'center', marginBottom: '120px' }}>
        <Text style={{ fontSize: '20px', color: '#999' }}>⚠️ 本工具仅供学习参考，不构成投资建议</Text>
      </View>

      <CustomTabBar />
    </View>
  )
}

// ==================== Pricing View (inline) ====================

function PricingInline() {
  return (
    <View style={{ minHeight: '100vh', background: '#f0f9ff', padding: '24px' }}>
      <Text style={{ fontSize: '40px', fontWeight: 'bold', display: 'block', textAlign: 'center', marginBottom: '32px' }}>订阅方案</Text>

      {/* Basic Plan */}
      <View style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '16px', border: '2px solid #00d4aa' }}>
        <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block' }}>基础版</Text>
        <Text style={{ fontSize: '48px', fontWeight: 'bold', color: '#00d4aa', display: 'block', marginTop: '16px' }}>¥4.08/月</Text>
        <Text style={{ fontSize: '22px', color: '#666', display: 'block' }}>按年付 ¥49/年 · 每天只要1毛3</Text>
        <View style={{ marginTop: '16px' }}>
          <Text style={{ fontSize: '22px', display: 'block', marginBottom: '8px' }}>✅ 实时 P/S 估值</Text>
          <Text style={{ fontSize: '22px', display: 'block', marginBottom: '8px' }}>✅ 估值状态分析</Text>
          <Text style={{ fontSize: '22px', display: 'block', marginBottom: '8px' }}>✅ 90天历史走势图</Text>
        </View>
      </View>

      {/* Pro Plan */}
      <View style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
        <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block' }}>Pro 版</Text>
        <Text style={{ fontSize: '48px', fontWeight: 'bold', color: '#6c5ce7', display: 'block', marginTop: '16px' }}>¥8.25/月</Text>
        <Text style={{ fontSize: '22px', color: '#666', display: 'block' }}>按年付 ¥99/年 · 每天只要2毛7</Text>
        <View style={{ marginTop: '16px' }}>
          <Text style={{ fontSize: '22px', display: 'block', marginBottom: '8px' }}>✅ 全部基础版功能</Text>
          <Text style={{ fontSize: '22px', display: 'block', marginBottom: '8px' }}>✅ AI 深度估值报告</Text>
          <Text style={{ fontSize: '22px', display: 'block', marginBottom: '8px' }}>✅ AI 智能问答助手</Text>
          <Text style={{ fontSize: '22px', display: 'block', marginBottom: '8px' }}>✅ 价格预警通知</Text>
          <Text style={{ fontSize: '22px', display: 'block', marginBottom: '8px' }}>✅ 无广告纯净体验</Text>
        </View>
      </View>

      <View onClick={() => navigateToView('dashboard')} style={{ textAlign: 'center', padding: '16px', marginBottom: '120px' }}>
        <Text style={{ fontSize: '24px', color: '#00d4aa' }}>← 返回仪表板</Text>
      </View>

      <CustomTabBar />
    </View>
  )
}

// ==================== Main Page Component ====================

export default function Index() {
  const [currentView, setCurrentView] = useState<AppView>(getCurrentView)

  // Listen for view change events
  useEffect(() => {
    return onViewChange(setCurrentView)
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
          {/* Hero */}
          <View className='hero'>
            <Text className='logo'>📈</Text>
            <Text className='title'>特斯拉估值助手</Text>
            <Text className='subtitle'>TSLA Valuation Tracker</Text>
            <Text className='tagline'>AI 驱动的估值分析，用 P/S 比率抓住最佳买点</Text>
          </View>

          {/* Free Value Teaser */}
          <View className='valuation-teaser'>
            <Text className='teaser-label'>今日 TSLA 估值速览</Text>
            <View className='teaser-gauge'>
              <Text className='teaser-emoji'>🟡</Text>
              <Text className='teaser-tier'>合理估值区间</Text>
            </View>
            <Text className='teaser-hint'>进入查看详细 P/S 比率分析 →</Text>
          </View>

          {/* Features */}
          <View className='features'>
            <View className='feature'>
              <Text className='feature-icon'>⚡</Text>
              <Text className='feature-title'>实时价格</Text>
              <Text className='feature-desc'>15分钟更新一次</Text>
            </View>

            <View className='feature'>
              <Text className='feature-icon'>🤖</Text>
              <Text className='feature-title'>AI 分析师</Text>
              <Text className='feature-desc'>智能估值解读</Text>
            </View>

            <View className='feature'>
              <Text className='feature-icon'>🎯</Text>
              <Text className='feature-title'>估值状态</Text>
              <Text className='feature-desc'>历史分位参考</Text>
            </View>
          </View>

          {/* CTA */}
          <View className='cta'>
            <Button className='start-button' onClick={handleStart}>
              免费查看今日估值
            </Button>
            <View className='pricing-link' onClick={handlePricing}>
              <Text className='price-tag'>低至 ¥4.08/月 解锁完整功能</Text>
              <Text className='price-sub'>每天只要1毛3 · 按年付省17%</Text>
            </View>
            <Text className='disclaimer'>
              📚 教育工具 · 不构成投资建议
            </Text>
          </View>

          {/* Why use this tool */}
          <View className='stats'>
            <View className='stat'>
              <Text className='stat-number'>📊</Text>
              <Text className='stat-label'>P/S 估值模型</Text>
            </View>
            <View className='stat'>
              <Text className='stat-number'>⏱️</Text>
              <Text className='stat-label'>15分钟数据更新</Text>
            </View>
            <View className='stat'>
              <Text className='stat-number'>🚀</Text>
              <Text className='stat-label'>加入早期用户</Text>
            </View>
          </View>

          <CustomTabBar />
        </View>
      )}
    </View>
  )
}
