import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

interface TSLAData {
  price: number
  change: number
  changePercent: number
  marketCap: number
  revenue: number
  psRatio: number
  valuationTier: string
  valuationColor: string
  valuationText: string
}

export default function Dashboard() {
  const [tslaData, setTslaData] = useState<TSLAData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPro, setIsPro] = useState(false)

  useEffect(() => {
    fetchTSLAData()
    checkSubscription()
  }, [])

  const fetchTSLAData = async () => {
    try {
      // Mock data for now - will connect to real API later
      const mockData: TSLAData = {
        price: 245.32,
        change: 12.45,
        changePercent: 5.35,
        marketCap: 780000000000,
        revenue: 95000000000,
        psRatio: 8.21,
        valuationTier: 'FAIR',
        valuationColor: '#ffa500',
        valuationText: '合理估值'
      }

      setTslaData(mockData)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch TSLA data:', error)
      setLoading(false)
    }
  }

  const checkSubscription = () => {
    // Check if user has paid ¥0.99 subscription
    // This will connect to WeChat Pay later
    const subscribed = Taro.getStorageSync('isPro')
    setIsPro(subscribed === 'true')
  }

  const getValuationInfo = (psRatio: number) => {
    if (psRatio > 20) {
      return { tier: 'OVERPRICED', color: '#ff4444', text: '高估', emoji: '🔴' }
    } else if (psRatio >= 13) {
      return { tier: 'EXPENSIVE', color: '#ff8800', text: '偏贵', emoji: '🟠' }
    } else if (psRatio >= 8) {
      return { tier: 'FAIR', color: '#ffa500', text: '合理', emoji: '🟡' }
    } else if (psRatio >= 5) {
      return { tier: 'CHEAP', color: '#88dd44', text: '便宜', emoji: '🟢' }
    } else {
      return { tier: 'BARGAIN', color: '#00dd88', text: '超值', emoji: '💚' }
    }
  }

  const handleUpgrade = () => {
    Taro.navigateTo({ url: '/pages/pricing/index' })
  }

  if (loading) {
    return (
      <View className='dashboard loading'>
        <Text>加载中...</Text>
      </View>
    )
  }

  if (!tslaData) {
    return (
      <View className='dashboard error'>
        <Text>数据加载失败，请稍后重试</Text>
      </View>
    )
  }

  const valuation = getValuationInfo(tslaData.psRatio)

  return (
    <View className='dashboard'>
      {/* Header */}
      <View className='header'>
        <Text className='title'>特斯拉 (TSLA)</Text>
        <Text className='subtitle'>Tesla, Inc.</Text>
      </View>

      {/* Price Card */}
      <View className='price-card'>
        <View className='price-main'>
          <Text className='price'>${tslaData.price.toFixed(2)}</Text>
          <View className={`change ${tslaData.change > 0 ? 'positive' : 'negative'}`}>
            <Text className='change-value'>
              {tslaData.change > 0 ? '+' : ''}{tslaData.change.toFixed(2)}
            </Text>
            <Text className='change-percent'>
              ({tslaData.change > 0 ? '+' : ''}{tslaData.changePercent.toFixed(2)}%)
            </Text>
          </View>
        </View>
        <Text className='update-time'>更新于 2 分钟前</Text>
      </View>

      {/* Valuation Gauge */}
      <View className='valuation-card'>
        <View className='valuation-header'>
          <Text className='valuation-title'>估值分析</Text>
          {!isPro && (
            <View className='pro-badge' onClick={handleUpgrade}>
              <Text className='pro-text'>升级专业版</Text>
            </View>
          )}
        </View>

        <View className='gauge' style={{ filter: !isPro ? 'blur(8px)' : 'none' }}>
          <View className='gauge-circle' style={{ borderColor: valuation.color }}>
            <Text className='gauge-emoji'>{valuation.emoji}</Text>
            <Text className='gauge-value'>{tslaData.psRatio.toFixed(2)}x</Text>
            <Text className='gauge-label'>P/S 比率</Text>
          </View>
        </View>

        <View className='valuation-status' style={{ backgroundColor: valuation.color + '20', borderColor: valuation.color }}>
          <Text className='valuation-tier'>{valuation.text}</Text>
        </View>

        {!isPro && (
          <View className='paywall'>
            <Text className='paywall-text'>解锁完整估值分析</Text>
            <Text className='paywall-price'>仅需 ¥0.99/月</Text>
            <View className='paywall-button' onClick={handleUpgrade}>
              <Text className='button-text'>立即订阅</Text>
            </View>
          </View>
        )}
      </View>

      {/* Stats */}
      {isPro && (
        <View className='stats-grid'>
          <View className='stat-item'>
            <Text className='stat-label'>市值</Text>
            <Text className='stat-value'>
              ${(tslaData.marketCap / 1000000000).toFixed(0)}B
            </Text>
          </View>
          <View className='stat-item'>
            <Text className='stat-label'>营收 (TTM)</Text>
            <Text className='stat-value'>
              ${(tslaData.revenue / 1000000000).toFixed(0)}B
            </Text>
          </View>
          <View className='stat-item'>
            <Text className='stat-label'>P/S 比率</Text>
            <Text className='stat-value'>{tslaData.psRatio.toFixed(2)}x</Text>
          </View>
          <View className='stat-item'>
            <Text className='stat-label'>估值状态</Text>
            <Text className='stat-value' style={{ color: valuation.color }}>
              {valuation.text}
            </Text>
          </View>
        </View>
      )}

      {/* Info Section */}
      <View className='info-section'>
        <Text className='info-title'>什么是 P/S 比率？</Text>
        <Text className='info-text'>
          P/S (市销率) = 市值 ÷ 营收，反映市场愿意为每1美元营收支付多少。
        </Text>
        <Text className='info-text'>
          • 🔴 高估 (>20x): 市场过度乐观
        </Text>
        <Text className='info-text'>
          • 🟡 合理 (8-12x): 估值合理
        </Text>
        <Text className='info-text'>
          • 💚 超值 (<5x): 价值投资机会
        </Text>
      </View>

      {/* Disclaimer */}
      <View className='disclaimer'>
        <Text className='disclaimer-text'>
          ⚠️ 本工具仅供学习参考，不构成投资建议。投资有风险，决策需谨慎。
        </Text>
      </View>
    </View>
  )
}
