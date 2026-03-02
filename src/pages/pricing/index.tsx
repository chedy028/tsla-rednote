import { View, Text, Button } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

export default function Pricing() {
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    setLoading(true)

    try {
      // TODO: Integrate with WeChat Pay
      // For now, simulate payment
      await Taro.showModal({
        title: '订阅确认',
        content: '确认订阅专业版？每月仅需 ¥0.99',
        confirmText: '确认支付',
        cancelText: '取消'
      }).then(res => {
        if (res.confirm) {
          // Simulate successful payment
          Taro.setStorageSync('isPro', 'true')
          Taro.showToast({
            title: '订阅成功！',
            icon: 'success'
          })
          setTimeout(() => {
            Taro.switchTab({ url: '/pages/dashboard/index' })
          }, 1500)
        }
      })
    } catch (error) {
      console.error('Payment failed:', error)
      Taro.showToast({
        title: '支付失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='pricing'>
      {/* Hero Section */}
      <View className='hero'>
        <Text className='hero-title'>解锁完整功能</Text>
        <Text className='hero-subtitle'>不到一瓶水的价格，掌握 TSLA 买卖时机</Text>
      </View>

      {/* Pricing Card */}
      <View className='pricing-card'>
        <View className='badge'>
          <Text className='badge-text'>超值优惠</Text>
        </View>

        <View className='price-display'>
          <Text className='currency'>¥</Text>
          <Text className='price'>0.99</Text>
          <Text className='period'>/月</Text>
        </View>

        <Text className='price-description'>每天只要 3 分钱</Text>

        <View className='features-list'>
          <View className='feature-item'>
            <Text className='feature-icon'>✅</Text>
            <Text className='feature-text'>实时 TSLA 价格追踪</Text>
          </View>
          <View className='feature-item'>
            <Text className='feature-icon'>✅</Text>
            <Text className='feature-text'>P/S 比率估值分析</Text>
          </View>
          <View className='feature-item'>
            <Text className='feature-icon'>✅</Text>
            <Text className='feature-text'>智能买卖信号提示</Text>
          </View>
          <View className='feature-item'>
            <Text className='feature-icon'>✅</Text>
            <Text className='feature-text'>90 天历史价格图表</Text>
          </View>
          <View className='feature-item'>
            <Text className='feature-icon'>✅</Text>
            <Text className='feature-text'>价格预警通知</Text>
          </View>
          <View className='feature-item'>
            <Text className='feature-icon'>✅</Text>
            <Text className='feature-text'>AI 智能分析助手</Text>
          </View>
        </View>

        <Button
          className='subscribe-button'
          loading={loading}
          onClick={handleSubscribe}
        >
          立即订阅 - ¥0.99/月
        </Button>

        <Text className='terms'>随时可取消 · 无隐藏费用</Text>
      </View>

      {/* Social Proof */}
      <View className='social-proof'>
        <Text className='proof-title'>🔥 已有 10,000+ 投资者订阅</Text>
        <View className='testimonials'>
          <View className='testimonial'>
            <Text className='testimonial-text'>
              "用了一个月，终于在 TSLA 回调时买入了！"
            </Text>
            <Text className='testimonial-author'>- 小红书用户 @投资小白</Text>
          </View>
          <View className='testimonial'>
            <Text className='testimonial-text'>
              "P/S 比率这个指标真的很有用，比看新闻靠谱多了"
            </Text>
            <Text className='testimonial-author'>- 小红书用户 @价值投资者</Text>
          </View>
        </View>
      </View>

      {/* Value Proposition */}
      <View className='value-section'>
        <Text className='value-title'>为什么选择我们？</Text>

        <View className='value-item'>
          <Text className='value-icon'>📊</Text>
          <View className='value-content'>
            <Text className='value-heading'>专业估值方法</Text>
            <Text className='value-text'>
              采用 P/S 比率，巴菲特都在用的估值指标
            </Text>
          </View>
        </View>

        <View className='value-item'>
          <Text className='value-icon'>⚡</Text>
          <View className='value-content'>
            <Text className='value-heading'>实时数据更新</Text>
            <Text className='value-text'>
              15 分钟刷新一次，不错过任何投资机会
            </Text>
          </View>
        </View>

        <View className='value-item'>
          <Text className='value-icon'>🎓</Text>
          <View className='value-content'>
            <Text className='value-heading'>学习投资知识</Text>
            <Text className='value-text'>
              不只是工具，更教你如何理性投资
            </Text>
          </View>
        </View>

        <View className='value-item'>
          <Text className='value-icon'>💰</Text>
          <View className='value-content'>
            <Text className='value-heading'>超低价格</Text>
            <Text className='value-text'>
              仅需 ¥0.99/月，比一瓶水还便宜
            </Text>
          </View>
        </View>
      </View>

      {/* FAQ */}
      <View className='faq-section'>
        <Text className='faq-title'>常见问题</Text>

        <View className='faq-item'>
          <Text className='faq-question'>Q: 可以随时取消订阅吗？</Text>
          <Text className='faq-answer'>
            A: 可以！随时在微信支付管理中取消，无任何手续费。
          </Text>
        </View>

        <View className='faq-item'>
          <Text className='faq-question'>Q: 数据准确吗？</Text>
          <Text className='faq-answer'>
            A: 我们从 Yahoo Finance 获取官方数据，保证准确性。
          </Text>
        </View>

        <View className='faq-item'>
          <Text className='faq-question'>Q: 支持哪些支付方式？</Text>
          <Text className='faq-answer'>
            A: 支持微信支付和支付宝，安全便捷。
          </Text>
        </View>

        <View className='faq-item'>
          <Text className='faq-question'>Q: 这算投资建议吗？</Text>
          <Text className='faq-answer'>
            A: 不是。本工具仅供学习参考，投资决策需要您自己判断。
          </Text>
        </View>
      </View>

      {/* Disclaimer */}
      <View className='disclaimer'>
        <Text className='disclaimer-text'>
          ⚠️ 投资有风险，入市需谨慎。本工具仅供教育和学习使用，不构成任何投资建议。
        </Text>
      </View>
    </View>
  )
}
