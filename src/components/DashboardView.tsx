import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import { fetchTSLAData, getUpdateTimeText, type TSLAStockData } from '../services/stockApi'
import { navigateToView } from '../services/navigation'
import CustomTabBar from './CustomTabBar'

export default function DashboardView() {
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

  const valuation = tslaData.valuationTier

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

      {/* Valuation */}
      <View style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
        <Text style={{ fontSize: '24px', fontWeight: 'bold', display: 'block', marginBottom: '16px' }}>估值分析</Text>
        <Text style={{ fontSize: '64px', display: 'block' }}>{valuation.emoji}</Text>
        <Text style={{ fontSize: '40px', fontWeight: 'bold', display: 'block', marginTop: '8px' }}>{tslaData.psRatio.toFixed(2)}x</Text>
        <Text style={{ fontSize: '24px', color: '#666', display: 'block' }}>P/S 比率</Text>
        <View style={{ background: valuation.color + '20', border: '2px solid ' + valuation.color, borderRadius: '12px', padding: '12px 24px', marginTop: '16px', display: 'inline-block' }}>
          <Text style={{ fontSize: '28px', fontWeight: 'bold', color: valuation.color }}>{valuation.textCn}</Text>
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

      {/* Info */}
      <View style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '16px' }}>
        <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block', marginBottom: '12px' }}>什么是 P/S 比率？</Text>
        <Text style={{ fontSize: '22px', color: '#666', display: 'block', lineHeight: 1.6 }}>
          P/S (市销率) = 市值 ÷ 营收。🔴 高估 ({'>'} 20x) · 🟡 合理 (8-12x) · 💚 超值 ({'<'} 5x)
        </Text>
      </View>

      <View style={{ padding: '16px', textAlign: 'center', marginBottom: '120px' }}>
        <Text style={{ fontSize: '20px', color: '#999' }}>⚠️ 本工具仅供学习参考，不构成投资建议</Text>
      </View>

      <CustomTabBar />
    </View>
  )
}
