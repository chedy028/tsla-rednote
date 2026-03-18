import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import CustomTabBar from '../../components/CustomTabBar'
import './index.scss'

export default function Index() {
  const handleStart = () => {
    if (typeof window !== 'undefined') {
      window.location.hash = '#/pages/dashboard/index'
      window.location.reload()
    } else {
      Taro.switchTab({ url: '/pages/dashboard/index' })
    }
  }

  const handlePricing = () => {
    if (typeof window !== 'undefined') {
      window.location.hash = '#/pages/pricing/index'
      window.location.reload()
    } else {
      Taro.switchTab({ url: '/pages/pricing/index' })
    }
  }

  return (
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
          <Text className='feature-title'>买卖信号</Text>
          <Text className='feature-desc'>智能提示时机</Text>
        </View>
      </View>

      {/* CTA */}
      <View className='cta'>
        <Button className='start-button' onClick={handleStart}>
          免费查看今日估值
        </Button>
        <View className='pricing-link' onClick={handlePricing}>
          <Text className='price-tag'>低至 ¥4.08/月 解锁完整功能</Text>
          <Text className='price-sub'>每天只要1毛6 · 按年付省17%</Text>
        </View>
        <Text className='disclaimer'>
          📚 教育工具 · 不构成投资建议
        </Text>
      </View>

      {/* Stats */}
      <View className='stats'>
        <View className='stat'>
          <Text className='stat-number'>10,000+</Text>
          <Text className='stat-label'>活跃用户</Text>
        </View>
        <View className='stat'>
          <Text className='stat-number'>99.9%</Text>
          <Text className='stat-label'>数据准确度</Text>
        </View>
        <View className='stat'>
          <Text className='stat-number'>4.9★</Text>
          <Text className='stat-label'>用户评分</Text>
        </View>
      </View>

      <CustomTabBar />
    </View>
  )
}
