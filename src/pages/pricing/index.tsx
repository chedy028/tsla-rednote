import { View, Text, Button } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import PricingToggle from '../../components/PricingToggle'
import { subscribe } from '../../services/payment'
import CustomTabBar from '../../components/CustomTabBar'
import './index.scss'

type PlanType = 'basic' | 'pro'

const PLANS = {
  basic: {
    monthly: { price: '4.99', period: '/月', daily: '每天只要1毛6' },
    annual: { price: '4.08', period: '/月', daily: '每天只要1毛3', totalLabel: '¥49/年' },
  },
  pro: {
    monthly: { price: '9.99', period: '/月', daily: '每天只要3毛3' },
    annual: { price: '8.25', period: '/月', daily: '每天只要2毛7', totalLabel: '¥99/年' },
  },
}

export default function Pricing() {
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('basic')
  const [isAnnual, setIsAnnual] = useState(true)

  const handleSubscribe = async (plan: PlanType) => {
    setLoading(true)

    const priceText = plan === 'pro'
      ? (isAnnual ? '¥99/年（Pro版）' : '¥9.99/月（Pro版）')
      : (isAnnual ? '¥49/年（基础版）' : '¥4.99/月（基础版）')

    try {
      const modalRes = await Taro.showModal({
        title: '订阅确认',
        content: `确认订阅${plan === 'pro' ? 'Pro版' : '基础版'}？${priceText}`,
        confirmText: '确认支付',
        cancelText: '取消'
      })

      if (modalRes.confirm) {
        const result = await subscribe(plan, isAnnual ? 'annual' : 'monthly')
        if (result.success) {
          Taro.showToast({ title: result.message, icon: 'success' })
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              const { navigateToView } = require('../../services/navigation')
              navigateToView('dashboard')
            } else {
              Taro.reLaunch({ url: '/pages/dashboard/index' })
            }
          }, 1500)
        } else {
          Taro.showToast({ title: result.message, icon: 'none' })
        }
      }
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

  const basicPricing = isAnnual ? PLANS.basic.annual : PLANS.basic.monthly
  const proPricing = isAnnual ? PLANS.pro.annual : PLANS.pro.monthly

  return (
    <View className='pricing'>
      {/* Hero Section */}
      <View className='hero'>
        <Text className='hero-title'>解锁完整功能</Text>
        <Text className='hero-subtitle'>用数据驱动投资决策，让 AI 成为你的分析师</Text>
      </View>

      {/* Toggle */}
      <PricingToggle onToggle={setIsAnnual} defaultAnnual />

      {/* Pricing Cards */}
      <View className='pricing-cards'>
        {/* Basic Plan */}
        <View
          className={`pricing-card ${selectedPlan === 'basic' ? 'selected' : ''}`}
          onClick={() => setSelectedPlan('basic')}
        >
          <View className='card-header'>
            <Text className='plan-name'>基础版</Text>
            <Text className='plan-scope'>TSLA 专属</Text>
          </View>

          <View className='price-display'>
            <Text className='currency'>¥</Text>
            <Text className='price'>{basicPricing.price}</Text>
            <Text className='period'>{basicPricing.period}</Text>
          </View>

          {isAnnual && (
            <View className='annual-total'>
              <Text className='annual-total-text'>{PLANS.basic.annual.totalLabel}，省17%</Text>
            </View>
          )}

          <Text className='price-daily'>{basicPricing.daily}</Text>

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
              <Text className='feature-text'>估值状态分析</Text>
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
            loading={loading && selectedPlan === 'basic'}
            onClick={() => handleSubscribe('basic')}
          >
            立即订阅基础版
          </Button>
        </View>

        {/* Pro Plan */}
        <View
          className={`pricing-card recommended ${selectedPlan === 'pro' ? 'selected' : ''}`}
          onClick={() => setSelectedPlan('pro')}
        >
          <View className='badge'>
            <Text className='badge-text'>最受欢迎</Text>
          </View>

          <View className='card-header'>
            <Text className='plan-name'>Pro 版</Text>
            <Text className='plan-scope'>TSLA 深度版</Text>
          </View>

          <View className='price-display'>
            <Text className='currency'>¥</Text>
            <Text className='price'>{proPricing.price}</Text>
            <Text className='period'>{proPricing.period}</Text>
          </View>

          {isAnnual && (
            <View className='annual-total'>
              <Text className='annual-total-text'>{PLANS.pro.annual.totalLabel}，省17%</Text>
            </View>
          )}

          <Text className='price-daily'>{proPricing.daily}</Text>

          <View className='features-list'>
            <View className='feature-item'>
              <Text className='feature-icon'>✅</Text>
              <Text className='feature-text'>基础版全部功能</Text>
            </View>
            <View className='feature-item highlight'>
              <Text className='feature-icon'>⭐</Text>
              <Text className='feature-text'>AI 深度估值报告</Text>
            </View>
            <View className='feature-item highlight'>
              <Text className='feature-icon'>⭐</Text>
              <Text className='feature-text'>AI 智能问答助手</Text>
            </View>
            <View className='feature-item highlight'>
              <Text className='feature-icon'>⭐</Text>
              <Text className='feature-text'>价格预警通知</Text>
            </View>
            <View className='feature-item highlight'>
              <Text className='feature-icon'>⭐</Text>
              <Text className='feature-text'>无广告纯净体验</Text>
            </View>
          </View>

          <Button
            className='subscribe-button pro'
            loading={loading && selectedPlan === 'pro'}
            onClick={() => handleSubscribe('pro')}
          >
            立即订阅 Pro 版
          </Button>
        </View>
      </View>

      {/* Annual Highlight */}
      {isAnnual && (
        <View className='annual-highlight'>
          <Text className='annual-highlight-text'>
            按年付费，每天只要1毛6，一杯奶茶喝一整年
          </Text>
        </View>
      )}

      {/* Feature Highlights */}
      <View className='social-proof'>
        <Text className='proof-title'>核心功能亮点</Text>
        <View className='testimonials'>
          <View className='testimonial'>
            <Text className='testimonial-text'>
              📊 基于市销率 (P/S) 的量化估值模型，数据透明可追溯
            </Text>
          </View>
          <View className='testimonial'>
            <Text className='testimonial-text'>
              🤖 AI 辅助分析，帮助理解估值指标背后的含义
            </Text>
          </View>
          <View className='testimonial'>
            <Text className='testimonial-text'>
              ⏱️ 数据定时更新，随时掌握最新估值水平
            </Text>
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
          <Text className='value-icon'>🤖</Text>
          <View className='value-content'>
            <Text className='value-heading'>AI 智能分析</Text>
            <Text className='value-text'>
              专属 AI 助手，随时解答你的投资疑问
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
      </View>

      {/* FAQ */}
      <View className='faq-section'>
        <Text className='faq-title'>常见问题</Text>

        <View className='faq-item'>
          <Text className='faq-question'>Q: 基础版和 Pro 版有什么区别？</Text>
          <Text className='faq-answer'>
            A: 基础版提供 TSLA 核心估值数据与历史走势。Pro 版额外解锁 AI 深度分析报告、智能问答助手、价格预警通知和无广告体验。
          </Text>
        </View>

        <View className='faq-item'>
          <Text className='faq-question'>Q: 可以随时取消订阅吗？</Text>
          <Text className='faq-answer'>
            A: 可以！随时在微信支付管理中取消，无任何手续费。
          </Text>
        </View>

        <View className='faq-item'>
          <Text className='faq-question'>Q: 按年付费更划算吗？</Text>
          <Text className='faq-answer'>
            A: 是的！按年付费可节省 17%，基础版每天只要 1 毛 6，Pro 版每天只要 2 毛 7。
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

      <CustomTabBar />
    </View>
  )
}
