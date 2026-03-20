import { View, Text, Button } from '@tarojs/components'
import { useEffect, useState, useCallback } from 'react'
import { isTikTokMinis, onTikTokShare, shareTikTok } from '../../services/tiktokMinis'
import { navigateToView, getCurrentView, onViewChange, type AppView } from '../../services/navigation'
import { fetchTSLAData, getUpdateTimeText, type TSLAStockData } from '../../services/stockApi'
import { t, getCurrentLang, setLang, onLangChange, ALL_LANGS, LANG_NAMES, type Lang } from '../../services/i18n'
import { openStripeCheckout, handlePaymentRedirect, getCachedSubscription, checkSubscriptionByEmail, type SubscriptionStatus } from '../../services/stripe'
import { getDeepAnalysis, askAI, getProEmail, setProEmail, listAlerts, createAlert, deleteAlert, type AIAnalysisResult, type ChatMessage, type PriceAlert, type AlertType, generateMessageId } from '../../services/ai'
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

  // Pro features state
  const [proEmail, setProEmailState] = useState<string | null>(null)
  const [showEmailInput, setShowEmailInput] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  // AI Report
  const [aiReport, setAiReport] = useState<AIAnalysisResult | null>(null)
  const [reportLoading, setReportLoading] = useState(false)
  // Q&A Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  // Price Alerts
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [showAddAlert, setShowAddAlert] = useState(false)
  const [alertType, setAlertType] = useState<AlertType>('price_above')
  const [alertValue, setAlertValue] = useState('')
  const [alertCreating, setAlertCreating] = useState(false)

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

    // Load Pro email
    const email = getProEmail()
    if (email) setProEmailState(email)

    // Then check if returning from Stripe checkout
    handlePaymentRedirect().then(result => {
      if (result?.isActive) {
        setIsPro(true)
        setPaymentMessage(t('dash.payment.success'))
        setTimeout(() => setPaymentMessage(null), 5000)
      }
    })
  }, [])

  // Load alerts when Pro + email available
  useEffect(() => {
    if (isPro && proEmail) {
      listAlerts(proEmail).then(setAlerts).catch(() => {})
    }
  }, [isPro, proEmail])

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

      {/* ==================== PRO FEATURES ==================== */}
      {isPro && (
        <View>
          {/* Email prompt for AI features */}
          {!proEmail && !showEmailInput && (
            <View role='button' tabIndex={0} onClick={() => setShowEmailInput(true)} style={{ background: '#fff3e0', borderRadius: '12px', padding: '16px', marginBottom: '16px', textAlign: 'center', cursor: 'pointer' }}>
              <Text style={{ fontSize: '22px', color: '#e65100' }}>{t('pro.email.title')}</Text>
            </View>
          )}
          {!proEmail && showEmailInput && (
            <View style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type='email'
                placeholder='email@example.com'
                value={emailInput}
                onChange={(e) => setEmailInput((e.target as HTMLInputElement).value)}
                style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '2px solid #e0e0e0', fontSize: '16px', outline: 'none' }}
              />
              <View role='button' tabIndex={0} onClick={() => {
                if (emailInput) {
                  setProEmail(emailInput)
                  setProEmailState(emailInput)
                  setShowEmailInput(false)
                }
              }} style={{ background: '#6c5ce7', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}>
                <Text style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>{t('pro.email.save')}</Text>
              </View>
            </View>
          )}

          {/* AI Valuation Report */}
          <View style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block', marginBottom: '16px' }}>{t('pro.report.title')}</Text>
            {aiReport ? (
              <View>
                <Text style={{ fontSize: '20px', color: '#333', display: 'block', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{aiReport.content}</Text>
                <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                  <Text style={{ fontSize: '18px', color: '#999' }}>
                    {aiReport.source === 'ai' ? t('pro.report.powered') : ''} · {new Date(aiReport.timestamp).toLocaleTimeString()}
                  </Text>
                  <View role='button' tabIndex={0} onClick={async () => {
                    if (!tslaData || reportLoading) return
                    setReportLoading(true)
                    try {
                      localStorage.removeItem('tsla_ai_report')
                      const result = await getDeepAnalysis(tslaData, proEmail || undefined)
                      setAiReport(result)
                    } catch {}
                    setReportLoading(false)
                  }} style={{ color: '#6c5ce7', cursor: 'pointer', padding: '4px 12px' }}>
                    <Text style={{ fontSize: '20px', color: '#6c5ce7' }}>{reportLoading ? t('pro.report.loading') : t('pro.report.refresh')}</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View role='button' tabIndex={0} onClick={async () => {
                if (!tslaData || reportLoading) return
                setReportLoading(true)
                try {
                  const result = await getDeepAnalysis(tslaData, proEmail || undefined)
                  setAiReport(result)
                } catch {}
                setReportLoading(false)
              }} style={{ background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)', borderRadius: '12px', padding: '16px', textAlign: 'center', cursor: 'pointer' }}>
                <Text style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
                  {reportLoading ? t('pro.report.loading') : t('pro.report.generate')}
                </Text>
              </View>
            )}
          </View>

          {/* AI Q&A Chat */}
          <View style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block', marginBottom: '16px' }}>{t('pro.qa.title')}</Text>

            {/* Quick suggestion buttons */}
            <View style={{ marginBottom: '12px' }}>
              <Text style={{ fontSize: '18px', color: '#999', display: 'block', marginBottom: '8px' }}>{t('pro.qa.suggestions')}</Text>
              <View style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['pro.qa.s1', 'pro.qa.s2', 'pro.qa.s3'].map(key => (
                  <View key={key} role='button' tabIndex={0} onClick={() => {
                    const q = t(key)
                    setChatInput(q)
                  }} style={{ background: '#f0f0f0', borderRadius: '20px', padding: '8px 16px', cursor: 'pointer' }}>
                    <Text style={{ fontSize: '18px', color: '#666' }}>{t(key)}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Chat messages */}
            {chatMessages.length > 0 && (
              <View style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '12px' }}>
                {chatMessages.map(msg => (
                  <View key={msg.id} style={{
                    background: msg.role === 'user' ? '#6c5ce7' : '#f5f5f5',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    marginBottom: '8px',
                    marginLeft: msg.role === 'user' ? '20%' : '0',
                    marginRight: msg.role === 'assistant' ? '20%' : '0',
                  }}>
                    <Text style={{
                      fontSize: '20px',
                      color: msg.role === 'user' ? 'white' : '#333',
                      display: 'block',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.5,
                    }}>{msg.content}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Chat input */}
            <View style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type='text'
                placeholder={t('pro.qa.placeholder')}
                value={chatInput}
                onChange={(e) => setChatInput((e.target as HTMLInputElement).value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && chatInput && !chatLoading && tslaData) {
                    const userMsg: ChatMessage = { id: generateMessageId(), role: 'user', content: chatInput, timestamp: Date.now() }
                    setChatMessages(prev => [...prev, userMsg])
                    const question = chatInput
                    setChatInput('')
                    setChatLoading(true)
                    askAI(question, tslaData, proEmail || undefined).then(answer => {
                      const assistantMsg: ChatMessage = { id: generateMessageId(), role: 'assistant', content: answer, timestamp: Date.now() }
                      setChatMessages(prev => [...prev, assistantMsg])
                      setChatLoading(false)
                    })
                  }
                }}
                style={{ flex: 1, padding: '12px 16px', borderRadius: '24px', border: '2px solid #e0e0e0', fontSize: '16px', outline: 'none' }}
              />
              <View role='button' tabIndex={0} onClick={async () => {
                if (!chatInput || chatLoading || !tslaData) return
                const userMsg: ChatMessage = { id: generateMessageId(), role: 'user', content: chatInput, timestamp: Date.now() }
                setChatMessages(prev => [...prev, userMsg])
                const question = chatInput
                setChatInput('')
                setChatLoading(true)
                const answer = await askAI(question, tslaData, proEmail || undefined)
                const assistantMsg: ChatMessage = { id: generateMessageId(), role: 'assistant', content: answer, timestamp: Date.now() }
                setChatMessages(prev => [...prev, assistantMsg])
                setChatLoading(false)
              }} style={{ background: '#6c5ce7', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <Text style={{ fontSize: '20px', color: 'white' }}>{chatLoading ? '...' : '→'}</Text>
              </View>
            </View>
          </View>

          {/* Price Alerts */}
          <View style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <Text style={{ fontSize: '28px', fontWeight: 'bold' }}>{t('pro.alerts.title')}</Text>
              <View role='button' tabIndex={0} onClick={() => setShowAddAlert(!showAddAlert)} style={{ background: '#f0f0f0', borderRadius: '20px', padding: '8px 16px', cursor: 'pointer' }}>
                <Text style={{ fontSize: '20px', color: '#6c5ce7' }}>{t('pro.alerts.add')}</Text>
              </View>
            </View>

            {/* Add alert form */}
            {showAddAlert && (
              <View style={{ background: '#f8f9fa', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                <View style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {(['price_above', 'price_below', 'ps_above', 'ps_below'] as AlertType[]).map(type => (
                    <View key={type} role='button' tabIndex={0} onClick={() => setAlertType(type)} style={{
                      background: alertType === type ? '#6c5ce7' : 'white',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      border: '1px solid #e0e0e0',
                    }}>
                      <Text style={{ fontSize: '18px', color: alertType === type ? 'white' : '#666' }}>
                        {t(`pro.alerts.${type.replace('_', '.')}`)}
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type='number'
                    placeholder={t('pro.alerts.value')}
                    value={alertValue}
                    onChange={(e) => setAlertValue((e.target as HTMLInputElement).value)}
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '2px solid #e0e0e0', fontSize: '16px', outline: 'none' }}
                  />
                  <View role='button' tabIndex={0} onClick={async () => {
                    if (!alertValue || alertCreating || !proEmail) return
                    setAlertCreating(true)
                    const result = await createAlert(proEmail, alertType, parseFloat(alertValue))
                    if (result) {
                      setAlerts(prev => [result, ...prev])
                      setAlertValue('')
                      setShowAddAlert(false)
                    }
                    setAlertCreating(false)
                  }} style={{ background: '#6c5ce7', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}>
                    <Text style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
                      {alertCreating ? t('pro.alerts.creating') : t('pro.alerts.create')}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Active alerts list */}
            {alerts.length === 0 ? (
              <Text style={{ fontSize: '20px', color: '#999', textAlign: 'center', display: 'block', padding: '16px' }}>{t('pro.alerts.empty')}</Text>
            ) : (
              <View>
                {alerts.map(alert => (
                  <View key={alert.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <View>
                      <Text style={{ fontSize: '20px', display: 'block', color: '#333' }}>
                        {t(`pro.alerts.${alert.alert_type.replace('_', '.')}`)}
                      </Text>
                      <Text style={{ fontSize: '24px', fontWeight: 'bold', display: 'block', color: '#6c5ce7' }}>
                        {alert.alert_type.startsWith('price') ? `$${alert.target_value}` : `${alert.target_value}x`}
                      </Text>
                    </View>
                    <View role='button' tabIndex={0} onClick={async () => {
                      if (proEmail) {
                        await deleteAlert(proEmail, alert.id)
                        setAlerts(prev => prev.filter(a => a.id !== alert.id))
                      }
                    }} style={{ color: '#c62828', cursor: 'pointer', padding: '8px' }}>
                      <Text style={{ fontSize: '18px', color: '#c62828' }}>{t('pro.alerts.delete')}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      )}

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
                        setProEmail(restoreEmail)
                        setProEmailState(restoreEmail)
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
