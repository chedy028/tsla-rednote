import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

export default function Index() {
  const handleStart = () => {
    Taro.switchTab({ url: '/pages/dashboard/index' })
  }

  return (
    <View className='index'>
      {/* Hero */}
      <View className='hero'>
        <Text className='logo'>📈</Text>
        <Text className='title'>特斯拉估值助手</Text>
        <Text className='subtitle'>TSLA Valuation Tracker</Text>
        <Text className='tagline'>用 P/S 比率，抓住 TSLA 最佳买点</Text>
      </View>

      {/* Features */}
      <View className='features'>
        <View className='feature'>
          <Text className='feature-icon'>⚡</Text>
          <Text className='feature-title'>实时价格</Text>
          <Text className='feature-desc'>15分钟更新一次</Text>
        </View>

        <View className='feature'>
          <Text className='feature-icon'>📊</Text>
          <Text className='feature-title'>估值分析</Text>
          <Text className='feature-desc'>P/S 比率判断</Text>
        </View>

        <View className='feature'>
          <Text className='feature-icon'>🎯</Text>
          <Text className='feature-title'>买卖信号</Text>
          <Text className='feature-desc'>智能提示时机</Text>
        </View>
      </View>

      {/* CTA */}
      <View className='cta'>
        <Text className='price-tag'>仅需 ¥0.99/月</Text>
        <Button className='start-button' onClick={handleStart}>
          立即开始
        </Button>
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
    </View>
  )
}
