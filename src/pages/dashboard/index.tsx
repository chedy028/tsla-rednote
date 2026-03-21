import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect, useCallback } from 'react'
import Taro from '@tarojs/taro'
import { fetchTSLAData, getUpdateTimeText, type TSLAStockData } from '../../services/stockApi'
import { checkSubscription } from '../../services/payment'
import { HISTORICAL_PS_DATA, getHistoricalPercentile } from '../../services/valuation'
import { isTikTokMinis, onTikTokShare, shareTikTok, getShareContent } from '../../services/tiktokMinis'
import { navigateToView } from '../../services/navigation'
import CustomTabBar from '../../components/CustomTabBar'
import './index.scss'

// ==================== 估值状态分析 ====================

interface ValuationStatus {
  status: 'undervalued' | 'fairvalue' | 'overvalued'
  emoji: string
  label: string
  color: string
  reasons: string[]
}

function getValuationStatus(psRatio: number): ValuationStatus {
  const percentile = getHistoricalPercentile(psRatio)
  const historicalAvg = HISTORICAL_PS_DATA.reduce((sum, d) => sum + d.psRatio, 0) / HISTORICAL_PS_DATA.length

  if (psRatio < 8) {
    return {
      status: 'undervalued',
      emoji: '\uD83D\uDFE2',
      label: '估值偏低',
      color: '#2e7d32',
      reasons: [
        `P/S 比率 ${psRatio.toFixed(2)}x，低于历史均值 ${historicalAvg.toFixed(1)}x`,
        `当前估值处于历史 ${percentile}% 分位`,
        '相对历史水平，当前市销率处于较低区间'
      ]
    }
  }

  if (psRatio < 13) {
    return {
      status: 'fairvalue',
      emoji: '\uD83D\uDFE1',
      label: '估值合理',
      color: '#f57f17',
      reasons: [
        `P/S 比率 ${psRatio.toFixed(2)}x，接近历史均值 ${historicalAvg.toFixed(1)}x`,
        `历史分位 ${percentile}%，处于中间水平`,
        '当前市销率处于历史合理区间'
      ]
    }
  }

  return {
    status: 'overvalued',
    emoji: '\uD83D\uDD34',
    label: '估值偏高',
    color: '#c62828',
    reasons: [
      `P/S 比率 ${psRatio.toFixed(2)}x，高于历史均值 ${historicalAvg.toFixed(1)}x`,
      `历史分位 ${percentile}%，处于较高水平`,
      '当前市销率高于历史多数时期'
    ]
  }
}

// ==================== 组件 ====================

export default function Dashboard() {
  const [tslaData, setTslaData] = useState<TSLAStockData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPro, setIsPro] = useState(false)
  const [updateTimeText, setUpdateTimeText] = useState('加载中...')
  const [refreshing, setRefreshing] = useState(false)

  const loadTSLAData = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchTSLAData()
      setTslaData(data)
      setUpdateTimeText(getUpdateTimeText(data.timestamp))
    } catch (error) {
      console.error('获取 TSLA 数据失败:', error)
      Taro.showToast({ title: '数据加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }, [])

  const loadSubscription = useCallback(async () => {
    try {
      const sub = await checkSubscription()
      setIsPro(sub.isActive)
    } catch (error) {
      console.error('订阅状态检查失败:', error)
    }
  }, [])

  useEffect(() => {
    loadTSLAData()
    loadSubscription()
  }, [loadTSLAData, loadSubscription])

  // 定时更新显示时间
  useEffect(() => {
    if (!tslaData) return
    const timer = setInterval(() => {
      setUpdateTimeText(getUpdateTimeText(tslaData.timestamp))
    }, 30000) // 每30秒更新显示
    return () => clearInterval(timer)
  }, [tslaData])

  const handleRefresh = useCallback(async () => {
    if (refreshing) return
    setRefreshing(true)
    try {
      const data = await fetchTSLAData()
      setTslaData(data)
      setUpdateTimeText(getUpdateTimeText(data.timestamp))
    } catch (error) {
      console.error('刷新失败:', error)
      Taro.showToast({ title: '刷新失败', icon: 'none' })
    } finally {
      setRefreshing(false)
    }
  }, [refreshing])

  const handleUpgrade = () => {
    navigateToView('pricing')
  }

  const handleOpenAI = () => {
    Taro.navigateTo({ url: '/pages/ai-assistant/index' })
  }

  // TikTok Minis: 分享功能
  const handleShare = useCallback(() => {
    if (!tslaData) return

    if (isTikTokMinis()) {
      // TikTok 环境: 使用 TikTok Minis SDK 分享
      const shareOpts = getShareContent(
        tslaData.price,
        tslaData.psRatio,
        tslaData.valuationTier.textCn
      )
      shareTikTok(shareOpts)
        .then(() => Taro.showToast({ title: '分享成功!', icon: 'success' }))
        .catch(() => Taro.showToast({ title: '分享失败', icon: 'none' }))
    } else if (typeof navigator !== 'undefined' && navigator.share) {
      // Web Share API (移动浏览器)
      navigator.share({
        title: `TSLA $${tslaData.price.toFixed(2)} | P/S ${tslaData.psRatio.toFixed(2)}x`,
        text: `特斯拉估值助手 - 当前估值: ${tslaData.valuationTier.textCn}`,
        url: window.location.href
      }).catch(() => {})
    } else {
      // 复制链接
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href)
        Taro.showToast({ title: '链接已复制', icon: 'success' })
      }
    }
  }, [tslaData])

  // TikTok Minis: 注册原生分享事件
  useEffect(() => {
    if (isTikTokMinis() && tslaData) {
      onTikTokShare(() => {
        const shareOpts = getShareContent(
          tslaData.price,
          tslaData.psRatio,
          tslaData.valuationTier.textCn
        )
        shareTikTok(shareOpts).catch(() => {})
      })
    }
  }, [tslaData])

  if (loading) {
    return (
      <View className='dashboard loading'>
        <View className='skeleton-card'>
          <View className='skeleton-line skeleton-wide' />
          <View className='skeleton-line skeleton-narrow' />
        </View>
        <View className='skeleton-card'>
          <View className='skeleton-line skeleton-wide' />
          <View className='skeleton-circle' />
          <View className='skeleton-line skeleton-narrow' />
        </View>
      </View>
    )
  }

  if (!tslaData) {
    return (
      <View className='dashboard error'>
        <Text style={{ fontSize: '64px', display: 'block', marginBottom: '24px' }}>⚠️</Text>
        <Text style={{ fontSize: '32px', fontWeight: 'bold', display: 'block', marginBottom: '12px' }}>数据加载失败</Text>
        <Text style={{ fontSize: '24px', color: '#999', display: 'block', marginBottom: '32px' }}>请检查网络连接后重试</Text>
        <View
          role='button'
          tabIndex={0}
          onClick={loadTSLAData}
          style={{ background: '#009d80', borderRadius: '12px', padding: '16px 48px', cursor: 'pointer' }}
        >
          <Text style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>重新加载</Text>
        </View>
      </View>
    )
  }

  const valuation = tslaData.valuationTier

  return (
    <ScrollView
      className='dashboard'
      scrollY
      refresherEnabled
      refresherTriggered={refreshing}
      onRefresherRefresh={handleRefresh}
      enhanced
      showScrollbar={false}
    >
      {/* Header */}
      <View className='header'>
        <View className='header-top'>
          <View className='header-left'>
            <Text className='title'>特斯拉 (TSLA)</Text>
            <Text className='subtitle'>Tesla, Inc.</Text>
          </View>
          <View className='share-button' role='button' tabIndex={0} onClick={handleShare}>
            <Text className='share-icon'>📤</Text>
            <Text className='share-text'>分享</Text>
          </View>
        </View>
      </View>

      {/* Fallback data warning banner */}
      {tslaData.isFallback && (
        <View className='fallback-banner'>
          <Text className='fallback-banner-icon'>&#9888;&#65039;</Text>
          <View className='fallback-banner-content'>
            <Text className='fallback-banner-title'>数据可能不准确</Text>
            <Text className='fallback-banner-desc'>
              无法连接实时数据源，当前显示为演示数据，仅供参考。
              {tslaData.revenueLastUpdated ? ` 营收数据来源: ${tslaData.revenueLastUpdated}` : ''}
            </Text>
          </View>
        </View>
      )}

      {/* Price Card - FREE for all users */}
      <View className='price-card'>
        <View className='price-main'>
          <Text className='price'>${tslaData.price.toFixed(2)}</Text>
          <View className={`change ${tslaData.change > 0 ? 'positive' : tslaData.change < 0 ? 'negative' : ''}`}>
            <Text className='change-value'>
              {tslaData.change > 0 ? '+' : ''}{tslaData.change.toFixed(2)}
            </Text>
            <Text className='change-percent'>
              ({tslaData.change > 0 ? '+' : ''}{tslaData.changePercent.toFixed(2)}%)
            </Text>
          </View>
        </View>
        <Text className='update-time'>
          {tslaData.isFallback ? '演示数据 - 非实时' : updateTimeText}
        </Text>
      </View>

      {/* Valuation Card - P/S ratio and tier are FREE for everyone */}
      <View className='valuation-card'>
        <View className='valuation-header'>
          <Text className='valuation-title'>估值分析</Text>
        </View>

        <View className='gauge'>
          <View className='gauge-circle' style={{ borderColor: valuation.color }}>
            <Text className='gauge-emoji'>{valuation.emoji}</Text>
            <Text className='gauge-value'>{tslaData.psRatio.toFixed(2)}x</Text>
            <Text className='gauge-label'>P/S 比率</Text>
          </View>
        </View>

        <View className='valuation-status' style={{ backgroundColor: valuation.color + '20', borderColor: valuation.color }}>
          <Text className='valuation-tier'>{valuation.textCn}</Text>
        </View>
      </View>

      {/* Stats - FREE for all users */}
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
            ${(tslaData.revenueTTM / 1000000000).toFixed(0)}B
          </Text>
        </View>
        <View className='stat-item'>
          <Text className='stat-label'>P/S 比率</Text>
          <Text className='stat-value'>{tslaData.psRatio.toFixed(2)}x</Text>
        </View>
        <View className='stat-item'>
          <Text className='stat-label'>估值状态</Text>
          <Text className='stat-value' style={{ color: valuation.color }}>
            {valuation.textCn}
          </Text>
        </View>
      </View>

      {/* Valuation Status - FREE for all users */}
      {(() => {
        const vstatus = getValuationStatus(tslaData.psRatio)
        return (
          <View className='signal-card'>
            <View className='signal-header'>
              <Text className='signal-title'>估值状态</Text>
            </View>
            <View className='signal-badge' style={{ backgroundColor: vstatus.color + '15', borderColor: vstatus.color }}>
              <Text className='signal-emoji'>{vstatus.emoji}</Text>
              <Text className='signal-label' style={{ color: vstatus.color }}>{vstatus.label}</Text>
            </View>
            <View className='signal-reasons'>
              {vstatus.reasons.map((reason, idx) => (
                <View className='signal-reason-item' key={`reason-${idx}`}>
                  <Text className='signal-reason-bullet'>•</Text>
                  <Text className='signal-reason-text'>{reason}</Text>
                </View>
              ))}
            </View>
            <View className='signal-disclaimer'>
              <Text className='signal-disclaimer-text'>
                以上分析基于 P/S 比率历史数据，仅反映估值水平，不构成任何投资建议
              </Text>
            </View>
          </View>
        )
      })()}

      {/* Pro-gated features with upgrade prompts */}
      {!isPro ? (
        <View className='upgrade-section'>
          <View className='upgrade-card'>
            <Text className='upgrade-icon'>📊</Text>
            <Text className='upgrade-title'>90天历史走势图</Text>
            <Text className='upgrade-desc'>查看 P/S 比率的历史变化趋势，发现最佳买入时机</Text>
            <View className='upgrade-button' role='button' tabIndex={0} onClick={handleUpgrade}>
              <Text className='upgrade-button-text'>升级查看完整分析</Text>
            </View>
          </View>

          <View className='upgrade-card'>
            <Text className='upgrade-icon'>🤖</Text>
            <Text className='upgrade-title'>AI 智能分析助手</Text>
            <Text className='upgrade-desc'>让 AI 帮你分析当前估值、解读市场信号</Text>
            <View className='upgrade-button' role='button' tabIndex={0} onClick={handleOpenAI}>
              <Text className='upgrade-button-text'>体验 AI 助手</Text>
            </View>
          </View>

          <View className='upgrade-cta' role='button' tabIndex={0} onClick={handleUpgrade}>
            <Text className='upgrade-cta-text'>低至 ¥4.08/月 解锁全部功能</Text>
            <Text className='upgrade-cta-sub'>按年付费省17% · 每天只要1毛3</Text>
          </View>
        </View>
      ) : (
        <View className='pro-content'>
          <View className='pro-section'>
            <Text className='pro-section-title'>📊 90天历史走势</Text>
            {/* 文字迷你图表：P/S 比率柱状可视化 */}
            <View className='history-chart'>
              <View className='history-chart-header'>
                <Text className='history-chart-label'>季度 P/S 比率趋势</Text>
                <Text className='history-chart-range'>
                  {HISTORICAL_PS_DATA[0].date} ~ {HISTORICAL_PS_DATA[HISTORICAL_PS_DATA.length - 1].date}
                </Text>
              </View>
              <View className='history-bar-chart'>
                {(() => { const maxPS = Math.max(...HISTORICAL_PS_DATA.map(d => d.psRatio)); return HISTORICAL_PS_DATA.map((item, idx) => {
                  const barWidth = Math.round((item.psRatio / maxPS) * 100)
                  const prevPS = idx > 0 ? HISTORICAL_PS_DATA[idx - 1].psRatio : item.psRatio
                  const trend = item.psRatio > prevPS ? '\u2191' : item.psRatio < prevPS ? '\u2193' : '\u2192'
                  const trendColor = item.psRatio > prevPS ? '#c62828' : item.psRatio < prevPS ? '#2e7d32' : '#666'
                  return (
                    <View className='history-bar-row' key={item.date}>
                      <Text className='history-bar-date'>{item.date}</Text>
                      <View className='history-bar-track'>
                        <View
                          className='history-bar-fill'
                          style={{
                            width: `${barWidth}%`,
                            backgroundColor: item.psRatio < 8 ? '#2e7d32' : item.psRatio < 13 ? '#f57f17' : '#c62828'
                          }}
                        />
                      </View>
                      <Text className='history-bar-value'>{item.psRatio.toFixed(1)}x</Text>
                      <Text className='history-bar-trend' style={{ color: trendColor }}>{trend}</Text>
                    </View>
                  )
                })})()}
              </View>
              {/* 当前值对比 */}
              <View className='history-current'>
                <Text className='history-current-label'>当前 P/S</Text>
                <Text className='history-current-value' style={{ color: valuation.color }}>
                  {tslaData.psRatio.toFixed(2)}x
                </Text>
                <Text className='history-current-vs'>
                  vs 均值 {(HISTORICAL_PS_DATA.reduce((s, d) => s + d.psRatio, 0) / HISTORICAL_PS_DATA.length).toFixed(1)}x
                </Text>
              </View>
            </View>
            {/* 季度数据表格 */}
            <View className='history-table'>
              <View className='history-table-header'>
                <Text className='history-table-th'>季度</Text>
                <Text className='history-table-th'>P/S</Text>
                <Text className='history-table-th'>股价</Text>
                <Text className='history-table-th'>趋势</Text>
              </View>
              {[...HISTORICAL_PS_DATA].reverse().map((item, idx) => {
                const originalIdx = HISTORICAL_PS_DATA.length - 1 - idx
                const prevPS = originalIdx > 0 ? HISTORICAL_PS_DATA[originalIdx - 1].psRatio : item.psRatio
                const trend = item.psRatio > prevPS ? '\u2191' : item.psRatio < prevPS ? '\u2193' : '\u2192'
                const trendColor = item.psRatio > prevPS ? '#c62828' : item.psRatio < prevPS ? '#2e7d32' : '#666'
                return (
                  <View className='history-table-row' key={item.date}>
                    <Text className='history-table-td'>{item.date}</Text>
                    <Text className='history-table-td'>{item.psRatio.toFixed(1)}x</Text>
                    <Text className='history-table-td'>${item.price.toFixed(0)}</Text>
                    <Text className='history-table-td' style={{ color: trendColor }}>{trend} {item.psRatio > prevPS ? '上升' : item.psRatio < prevPS ? '下降' : '持平'}</Text>
                  </View>
                )
              })}
            </View>
          </View>

          <View className='pro-section'>
            <Text className='pro-section-title'>🤖 AI 分析助手</Text>
            <View className='ai-placeholder' role='button' tabIndex={0} onClick={handleOpenAI}>
              <Text className='ai-placeholder-text'>
                基于当前 P/S 比率 {tslaData.psRatio.toFixed(2)}x，TSLA 处于{valuation.textCn}区间。
                点击进入 AI 助手获取深度分析 →
              </Text>
            </View>
          </View>

          <View className='stats-grid'>
            <View className='stat-item'>
              <Text className='stat-label'>成交量</Text>
              <Text className='stat-value'>
                {(tslaData.volume / 1000000).toFixed(1)}M
              </Text>
            </View>
            <View className='stat-item'>
              <Text className='stat-label'>52周区间</Text>
              <Text className='stat-value'>
                ${tslaData.fiftyTwoWeekLow.toFixed(0)}-${tslaData.fiftyTwoWeekHigh.toFixed(0)}
              </Text>
            </View>
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
          • 🔴 高估 ({'>'}20x): 市场过度乐观
        </Text>
        <Text className='info-text'>
          • 🟡 合理 (8-12x): 估值合理
        </Text>
        <Text className='info-text'>
          • 💚 超值 ({'<'}5x): 价值投资机会
        </Text>
      </View>

      {/* Disclaimer */}
      <View className='disclaimer'>
        <Text className='disclaimer-text'>
          ⚠️ 本工具仅供参考，不构成投资建议。投资有风险，入市需谨慎。
        </Text>
        <Text className='disclaimer-text' style={{ marginTop: '8px', fontSize: '20px' }}>
          本页面展示的估值状态基于历史市销率数据的统计分析，不代表对未来股价走势的预测，亦不构成买入、卖出或持有的建议。请结合自身情况独立判断。
        </Text>
      </View>

      <CustomTabBar />
    </ScrollView>
  )
}
