/**
 * AI 分析助手页面
 * Chat-like UI for TSLA valuation analysis
 * Pro 用户可使用完整 AI 深度分析，免费用户看到升级提示
 */
import { View, Text, ScrollView, Input } from '@tarojs/components'
import { useState, useEffect, useCallback } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import AIBubble, { AIBubbleLoading } from '../../components/AIBubble'
import { fetchTSLAData, type TSLAStockData } from '../../services/stockApi'
import { checkSubscription } from '../../services/payment'
import { navigateToView } from '../../services/navigation'
import {
  getQuickAnalysis,
  getQuickAnswer,
  getDeepAnalysis,
  askAI,
  generateMessageId,
  type ChatMessage,
  type AIAnalysisResult
} from '../../services/ai'
import './index.scss'

// 预设快速问题
const QUICK_QUESTIONS = [
  '现在适合买入吗?',
  'P/S比率怎么看?',
  '跟历史比较如何?',
  '当前风险有多大?',
  '目标价是多少?'
]

export default function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [isPro, setIsPro] = useState(false)
  const [stockData, setStockData] = useState<TSLAStockData | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [scrollToId, setScrollToId] = useState('scroll-bottom')

  // 页面初始化
  useDidShow(() => {
    initPage()
  })

  const initPage = useCallback(async () => {
    try {
      setInitialLoading(true)

      // 并行加载数据和订阅状态
      const [data, sub] = await Promise.all([
        fetchTSLAData(),
        checkSubscription()
      ])

      setStockData(data)
      setIsPro(sub.isActive)

      // 发送欢迎消息
      if (messages.length === 0) {
        const welcomeMsg: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: getWelcomeMessage(data, sub.isActive),
          timestamp: Date.now()
        }
        setMessages([welcomeMsg])
      }
    } catch (err) {
      console.error('AI 助手初始化失败:', err)
      Taro.showToast({ title: '数据加载失败', icon: 'none' })
    } finally {
      setInitialLoading(false)
    }
  }, [messages.length])

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    const newId = `msg-${Date.now()}`
    setScrollToId(newId)
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages.length, scrollToBottom])

  // 发送消息处理
  const handleSend = useCallback(async (text: string) => {
    if (!text.trim() || loading || !stockData) return

    const userMsg: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: text.trim(),
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, userMsg])
    setInputValue('')
    setLoading(true)

    try {
      let response: string

      if (isPro) {
        // Pro 用户：尝试 AI 分析，降级到本地
        response = await askAI(text, stockData)
      } else {
        // 免费用户：本地快速回答
        response = getQuickAnswer(text, stockData)
      }

      const aiMsg: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      }

      setMessages(prev => [...prev, aiMsg])
    } catch (err) {
      console.error('AI 回复生成失败:', err)
      const errorMsg: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: '抱歉，分析暂时出错了，请稍后重试。',
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }, [loading, stockData, isPro])

  // 快速问题点击
  const handleQuickQuestion = useCallback((question: string) => {
    handleSend(question)
  }, [handleSend])

  // 输入框确认
  const handleInputConfirm = useCallback(() => {
    if (inputValue.trim()) {
      handleSend(inputValue)
    }
  }, [inputValue, handleSend])

  // 深度分析按钮
  const handleDeepAnalysis = useCallback(async () => {
    if (!stockData || loading) return

    if (!isPro) {
      navigateToView('pricing')
      return
    }

    const userMsg: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: '请给我一份 TSLA 深度分析报告',
      timestamp: Date.now()
    }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const result: AIAnalysisResult = await getDeepAnalysis(stockData)

      const aiMsg: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: result.content,
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, aiMsg])
    } catch (err) {
      console.error('深度分析失败:', err)
      const errorMsg: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: '深度分析暂时不可用，请稍后重试。',
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }, [stockData, loading, isPro])

  // 升级提示
  const handleUpgrade = useCallback(() => {
    navigateToView('pricing')
  }, [])

  // 初始加载状态
  if (initialLoading) {
    return (
      <View className='ai-assistant ai-assistant--loading'>
        <View className='ai-assistant__loading-container'>
          <View className='ai-assistant__loading-icon'>
            <View className='ai-assistant__loading-pulse' />
          </View>
          <Text className='ai-assistant__loading-text'>AI 助手加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='ai-assistant'>
      {/* 顶部状态栏 */}
      <View className='ai-assistant__header'>
        <View className='ai-assistant__header-info'>
          <Text className='ai-assistant__header-title'>AI 估值助手</Text>
          {stockData && (
            <Text className='ai-assistant__header-price'>
              TSLA ${stockData.price.toFixed(2)}{' '}
              <Text className={stockData.change > 0 ? 'positive' : stockData.change < 0 ? 'negative' : ''}>
                {stockData.change > 0 ? '+' : ''}{stockData.changePercent.toFixed(2)}%
              </Text>
            </Text>
          )}
        </View>
        {isPro ? (
          <View className='ai-assistant__pro-badge'>
            <Text className='ai-assistant__pro-badge-text'>PRO</Text>
          </View>
        ) : (
          <View className='ai-assistant__upgrade-badge' onClick={handleUpgrade}>
            <Text className='ai-assistant__upgrade-badge-text'>升级 Pro</Text>
          </View>
        )}
      </View>

      {/* 免费用户提示条 */}
      {!isPro && (
        <View className='ai-assistant__free-banner' onClick={handleUpgrade}>
          <Text className='ai-assistant__free-banner-text'>
            当前为基础版 - 升级 Pro 解锁 AI 深度分析和无限对话
          </Text>
        </View>
      )}

      {/* 聊天消息区 */}
      <ScrollView
        className='ai-assistant__messages'
        scrollY
        scrollIntoView={scrollToId}
        scrollWithAnimation
        enhanced
        showScrollbar={false}
      >
        <View className='ai-assistant__messages-inner'>
          {messages.map((msg) => (
            <View key={msg.id} id={`msg-${msg.id}`}>
              <AIBubble message={msg} />
            </View>
          ))}

          {loading && <AIBubbleLoading />}

          {/* 底部锚点 */}
          <View id={scrollToId} className='ai-assistant__scroll-anchor' />
        </View>
      </ScrollView>

      {/* 底部操作区 */}
      <View className='ai-assistant__bottom'>
        {/* 快速问题 chips */}
        <ScrollView
          className='ai-assistant__quick-questions'
          scrollX
          showScrollbar={false}
          enhanced
        >
          <View className='ai-assistant__quick-questions-inner'>
            {QUICK_QUESTIONS.map((q) => (
              <View
                key={q}
                className={`ai-assistant__chip ${loading ? 'ai-assistant__chip--disabled' : ''}`}
                onClick={() => !loading && handleQuickQuestion(q)}
              >
                <Text className='ai-assistant__chip-text'>{q}</Text>
              </View>
            ))}

            {/* 深度分析按钮 */}
            <View
              className={`ai-assistant__chip ai-assistant__chip--deep ${loading ? 'ai-assistant__chip--disabled' : ''} ${!isPro ? 'ai-assistant__chip--locked' : ''}`}
              onClick={handleDeepAnalysis}
            >
              <Text className='ai-assistant__chip-text'>
                {isPro ? '深度分析报告' : '深度分析 (Pro)'}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* 输入框区域 */}
        <View className='ai-assistant__input-bar'>
          <View className='ai-assistant__input-wrapper'>
            <Input
              className='ai-assistant__input'
              type='text'
              placeholder='输入你的问题...'
              placeholderClass='ai-assistant__input-placeholder'
              value={inputValue}
              onInput={(e) => setInputValue(e.detail.value)}
              onConfirm={handleInputConfirm}
              confirmType='send'
              disabled={loading}
              maxlength={200}
            />
          </View>
          <View
            className={`ai-assistant__send-btn ${(!inputValue.trim() || loading) ? 'ai-assistant__send-btn--disabled' : ''}`}
            onClick={handleInputConfirm}
          >
            <Text className='ai-assistant__send-btn-text'>发送</Text>
          </View>
        </View>

        {/* 安全底部间距 */}
        <View className='ai-assistant__safe-bottom' />
      </View>
    </View>
  )
}

// ==================== 辅助函数 ====================

function getWelcomeMessage(data: TSLAStockData, isPro: boolean): string {
  const quickAnalysis = getQuickAnalysis(data.psRatio, data.valuationTier)

  if (isPro) {
    return (
      `你好！我是你的 TSLA AI 估值助手。\n\n` +
      `${quickAnalysis.summary}\n\n` +
      `你可以：\n` +
      `- 点击下方快速问题直接提问\n` +
      `- 输入任何关于 TSLA 估值的问题\n` +
      `- 点击「深度分析报告」获取完整 AI 分析\n\n` +
      `有什么想了解的？`
    )
  }

  return (
    `你好！我是 TSLA 估值助手。\n\n` +
    `${quickAnalysis.summary}\n\n` +
    `你可以点击下方的快速问题了解更多。\n` +
    `升级 Pro 可解锁 AI 深度分析和自由提问功能。`
  )
}
