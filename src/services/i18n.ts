/**
 * i18n — Internationalization service
 * Supports: zh (Chinese), en (English), es (Spanish), ja (Japanese), ko (Korean)
 * Default: auto-detect from browser, fallback to zh
 */

export type Lang = 'zh' | 'en' | 'es' | 'ja' | 'ko'

const LANG_KEY = '__APP_LANG__'
const LANG_CHANGE_EVENT = 'app-lang-change'

// ==================== Translation strings ====================

const translations: Record<Lang, Record<string, string>> = {
  zh: {
    // App
    'app.title': '特斯拉估值助手',
    'app.subtitle': 'TSLA Valuation Tracker',
    'app.tagline': 'AI 驱动的估值分析，用 P/S 比率抓住最佳买点',

    // Home
    'home.teaser.label': '今日 TSLA 估值速览',
    'home.teaser.emoji': '🟡',
    'home.teaser.tier': '合理估值区间',
    'home.teaser.hint': '进入查看详细 P/S 比率分析 →',
    'home.feature.price': '实时价格',
    'home.feature.price.desc': '15分钟更新一次',
    'home.feature.ai': 'AI 分析师',
    'home.feature.ai.desc': '智能估值解读',
    'home.feature.signal': '估值状态',
    'home.feature.signal.desc': '历史分位参考',
    'home.cta': '免费查看今日估值',
    'home.pricing.tag': '低至 $5/月 解锁完整功能',
    'home.pricing.sub': '每天只要17¢ · 按年付省17%',
    'home.disclaimer': '📚 教育工具 · 不构成投资建议',
    'home.stats.s1.icon': '📊',
    'home.stats.s1.label': 'P/S 估值模型',
    'home.stats.s2.icon': '⏱️',
    'home.stats.s2.label': '15分钟数据更新',
    'home.stats.s3.icon': '🚀',
    'home.stats.s3.label': '加入早期用户',

    // Dashboard
    'dash.name': '特斯拉 (TSLA)',
    'dash.company': 'Tesla, Inc.',
    'dash.loading': '加载估值数据...',
    'dash.error': '数据加载失败，请稍后重试',
    'dash.ps.title': 'P/S 估值指标',
    'dash.ps.label': '市销率 (Price-to-Sales)',
    'dash.ps.locked': '🔒 订阅解锁详细估值解读',
    'dash.stat.mcap': '市值',
    'dash.stat.rev': '营收 (TTM)',
    'dash.stat.vol': '成交量',
    'dash.stat.range': '52周区间',
    'dash.upgrade': '低至 $5/月 解锁完整功能',
    'dash.upgrade.sub': 'AI 分析 · 历史走势 · 价格预警',
    'dash.ps.what': '什么是 P/S 比率？',
    'dash.ps.explain': 'P/S (市销率) = 市值 ÷ 营收，是衡量公司估值的核心指标。订阅后可查看详细估值区间分析。',
    'dash.disclaimer': '⚠️ 本工具仅供学习参考，不构成投资建议',

    // Pricing
    'pricing.title': '订阅方案',
    'pricing.basic': '基础版',
    'pricing.basic.price': '$5/月',
    'pricing.basic.annual': '按年付 $50/年 · 每天只要14¢',
    'pricing.basic.f1': '✅ 实时 P/S 估值',
    'pricing.basic.f2': '✅ 估值状态分析',
    'pricing.basic.f3': '✅ 90天历史走势图',
    'pricing.pro': 'Pro 版',
    'pricing.pro.price': '$10/月',
    'pricing.pro.annual': '按年付 $100/年 · 每天只要27¢',
    'pricing.pro.f1': '✅ 全部基础版功能',
    'pricing.pro.f2': '✅ AI 深度估值报告',
    'pricing.pro.f3': '✅ AI 智能问答助手',
    'pricing.pro.f4': '✅ 价格预警通知',
    'pricing.pro.f5': '✅ 无广告纯净体验',
    'pricing.subscribe': '立即订阅',
    'pricing.subscribe.loading': '正在跳转...',
    'pricing.or.annual': '或选择年付方案',
    'pricing.back': '← 返回仪表板',

    // Tab bar
    'tab.home': '首页',
    'tab.dashboard': '仪表板',
    'tab.subscribe': '订阅',
  },

  en: {
    // App
    'app.title': 'TSLA Valuation',
    'app.subtitle': 'TSLA Valuation Tracker',
    'app.tagline': 'AI-powered valuation analysis using P/S ratio to find the best entry points',

    // Home
    'home.teaser.label': "Today's TSLA Valuation",
    'home.teaser.emoji': '🟡',
    'home.teaser.tier': 'Fair Value Zone',
    'home.teaser.hint': 'See detailed P/S ratio analysis →',
    'home.feature.price': 'Live Price',
    'home.feature.price.desc': 'Updates every 15 min',
    'home.feature.ai': 'AI Analyst',
    'home.feature.ai.desc': 'Smart valuation insights',
    'home.feature.signal': 'Valuation Status',
    'home.feature.signal.desc': 'Historical percentile',
    'home.cta': "View Today's Free Valuation",
    'home.pricing.tag': 'From $5/mo — unlock full features',
    'home.pricing.sub': 'Just 17¢/day · save 17% with annual plan',
    'home.disclaimer': '📚 Educational tool · Not investment advice',
    'home.stats.s1.icon': '📊',
    'home.stats.s1.label': 'P/S Valuation Model',
    'home.stats.s2.icon': '⏱️',
    'home.stats.s2.label': '15-min Data Updates',
    'home.stats.s3.icon': '🚀',
    'home.stats.s3.label': 'Join Early Users',

    // Dashboard
    'dash.name': 'Tesla (TSLA)',
    'dash.company': 'Tesla, Inc.',
    'dash.loading': 'Loading valuation data...',
    'dash.error': 'Failed to load data. Please try again.',
    'dash.ps.title': 'P/S Valuation',
    'dash.ps.label': 'Price-to-Sales Ratio',
    'dash.ps.locked': '🔒 Subscribe to unlock detailed valuation insights',
    'dash.stat.mcap': 'Market Cap',
    'dash.stat.rev': 'Revenue (TTM)',
    'dash.stat.vol': 'Volume',
    'dash.stat.range': '52-Week Range',
    'dash.upgrade': 'From $5/mo — unlock full features',
    'dash.upgrade.sub': 'AI analysis · price history · alerts',
    'dash.ps.what': 'What is P/S Ratio?',
    'dash.ps.explain': 'P/S (Price-to-Sales) = Market Cap ÷ Revenue. A key metric for valuation analysis. Subscribe to see detailed valuation zone analysis.',
    'dash.disclaimer': '⚠️ For educational purposes only. Not investment advice.',

    // Pricing
    'pricing.title': 'Subscription Plans',
    'pricing.basic': 'Basic',
    'pricing.basic.price': '$5/mo',
    'pricing.basic.annual': '$50/year · just 14¢ per day',
    'pricing.basic.f1': '✅ Real-time P/S valuation',
    'pricing.basic.f2': '✅ Valuation status analysis',
    'pricing.basic.f3': '✅ 90-day history chart',
    'pricing.pro': 'Pro',
    'pricing.pro.price': '$10/mo',
    'pricing.pro.annual': '$100/year · just 27¢ per day',
    'pricing.pro.f1': '✅ All Basic features',
    'pricing.pro.f2': '✅ AI deep valuation report',
    'pricing.pro.f3': '✅ AI smart Q&A assistant',
    'pricing.pro.f4': '✅ Price alerts',
    'pricing.pro.f5': '✅ Ad-free experience',
    'pricing.subscribe': 'Subscribe Now',
    'pricing.subscribe.loading': 'Redirecting...',
    'pricing.or.annual': 'or choose annual plan',
    'pricing.back': '← Back to Dashboard',

    // Tab bar
    'tab.home': 'Home',
    'tab.dashboard': 'Dashboard',
    'tab.subscribe': 'Plans',
  },

  es: {
    // App
    'app.title': 'TSLA Valoración',
    'app.subtitle': 'TSLA Valuation Tracker',
    'app.tagline': 'Análisis de valoración con IA usando ratio P/V para encontrar los mejores puntos de entrada',

    // Home
    'home.teaser.label': 'Valoración TSLA de hoy',
    'home.teaser.emoji': '🟡',
    'home.teaser.tier': 'Zona de valor justo',
    'home.teaser.hint': 'Ver análisis detallado del ratio P/V →',
    'home.feature.price': 'Precio en vivo',
    'home.feature.price.desc': 'Actualiza cada 15 min',
    'home.feature.ai': 'Analista IA',
    'home.feature.ai.desc': 'Análisis inteligente',
    'home.feature.signal': 'Estado de valoración',
    'home.feature.signal.desc': 'Percentil histórico',
    'home.cta': 'Ver valoración gratis de hoy',
    'home.pricing.tag': 'Desde $5/mes — desbloquea todo',
    'home.pricing.sub': 'Solo 17¢/día · ahorra 17% con plan anual',
    'home.disclaimer': '📚 Herramienta educativa · No es consejo de inversión',
    'home.stats.s1.icon': '📊',
    'home.stats.s1.label': 'Modelo P/V',
    'home.stats.s2.icon': '⏱️',
    'home.stats.s2.label': 'Datos cada 15 min',
    'home.stats.s3.icon': '🚀',
    'home.stats.s3.label': 'Únete a usuarios',

    // Dashboard
    'dash.name': 'Tesla (TSLA)',
    'dash.company': 'Tesla, Inc.',
    'dash.loading': 'Cargando datos de valoración...',
    'dash.error': 'Error al cargar datos. Inténtalo de nuevo.',
    'dash.ps.title': 'Valoración P/V',
    'dash.ps.label': 'Ratio Precio-Ventas',
    'dash.ps.locked': '🔒 Suscríbete para ver análisis detallado',
    'dash.stat.mcap': 'Cap. Mercado',
    'dash.stat.rev': 'Ingresos (TTM)',
    'dash.stat.vol': 'Volumen',
    'dash.stat.range': 'Rango 52 sem',
    'dash.upgrade': 'Desde $5/mes — desbloquea todo',
    'dash.upgrade.sub': 'Análisis IA · historial · alertas',
    'dash.ps.what': '¿Qué es el ratio P/V?',
    'dash.ps.explain': 'P/V (Precio/Ventas) = Cap. de Mercado ÷ Ingresos. Una métrica clave para el análisis de valoración. Suscríbete para ver análisis detallado.',
    'dash.disclaimer': '⚠️ Solo con fines educativos. No es consejo de inversión.',

    // Pricing
    'pricing.title': 'Planes de suscripción',
    'pricing.basic': 'Básico',
    'pricing.basic.price': '$5/mes',
    'pricing.basic.annual': '$50/año · solo 14¢ por día',
    'pricing.basic.f1': '✅ Valoración P/V en tiempo real',
    'pricing.basic.f2': '✅ Análisis de estado de valoración',
    'pricing.basic.f3': '✅ Historial de 90 días',
    'pricing.pro': 'Pro',
    'pricing.pro.price': '$10/mes',
    'pricing.pro.annual': '$100/año · solo 27¢ por día',
    'pricing.pro.f1': '✅ Todo lo del plan Básico',
    'pricing.pro.f2': '✅ Informe IA de valoración',
    'pricing.pro.f3': '✅ Asistente IA de preguntas',
    'pricing.pro.f4': '✅ Alertas de precio',
    'pricing.pro.f5': '✅ Sin anuncios',
    'pricing.subscribe': 'Suscribirse ahora',
    'pricing.subscribe.loading': 'Redirigiendo...',
    'pricing.or.annual': 'o elige plan anual',
    'pricing.back': '← Volver al panel',

    // Tab bar
    'tab.home': 'Inicio',
    'tab.dashboard': 'Panel',
    'tab.subscribe': 'Planes',
  },

  ja: {
    // App
    'app.title': 'テスラ バリュエーション',
    'app.subtitle': 'TSLA Valuation Tracker',
    'app.tagline': 'AI駆動のバリュエーション分析、P/Sレシオで最適なエントリーポイントを発見',

    // Home
    'home.teaser.label': '本日のTSLAバリュエーション',
    'home.teaser.emoji': '🟡',
    'home.teaser.tier': '適正価格帯',
    'home.teaser.hint': '詳細なP/Sレシオ分析を見る →',
    'home.feature.price': 'リアルタイム価格',
    'home.feature.price.desc': '15分ごとに更新',
    'home.feature.ai': 'AIアナリスト',
    'home.feature.ai.desc': 'スマート分析',
    'home.feature.signal': 'バリュエーション状態',
    'home.feature.signal.desc': 'ヒストリカルパーセンタイル',
    'home.cta': '今日の無料バリュエーションを見る',
    'home.pricing.tag': '月額$5〜 全機能をアンロック',
    'home.pricing.sub': '1日わずか17¢ · 年払いで17%お得',
    'home.disclaimer': '📚 教育ツール · 投資アドバイスではありません',
    'home.stats.s1.icon': '📊',
    'home.stats.s1.label': 'P/Sバリュエーションモデル',
    'home.stats.s2.icon': '⏱️',
    'home.stats.s2.label': '15分データ更新',
    'home.stats.s3.icon': '🚀',
    'home.stats.s3.label': '早期ユーザーに参加',

    // Dashboard
    'dash.name': 'テスラ (TSLA)',
    'dash.company': 'Tesla, Inc.',
    'dash.loading': 'バリュエーションデータを読み込み中...',
    'dash.error': 'データの読み込みに失敗しました。再試行してください。',
    'dash.ps.title': 'P/S バリュエーション',
    'dash.ps.label': '株価売上高倍率 (Price-to-Sales)',
    'dash.ps.locked': '🔒 サブスクで詳細バリュエーション分析をアンロック',
    'dash.stat.mcap': '時価総額',
    'dash.stat.rev': '売上高 (TTM)',
    'dash.stat.vol': '出来高',
    'dash.stat.range': '52週レンジ',
    'dash.upgrade': '月額$5〜 全機能をアンロック',
    'dash.upgrade.sub': 'AI分析 · 価格履歴 · アラート',
    'dash.ps.what': 'P/Sレシオとは？',
    'dash.ps.explain': 'P/S（株価売上高倍率）= 時価総額 ÷ 売上高。バリュエーション分析の重要な指標です。サブスクで詳細な分析をご覧ください。',
    'dash.disclaimer': '⚠️ 教育目的のみ。投資アドバイスではありません。',

    // Pricing
    'pricing.title': 'サブスクリプションプラン',
    'pricing.basic': 'ベーシック',
    'pricing.basic.price': '$5/月',
    'pricing.basic.annual': '$50/年 · 1日わずか14¢',
    'pricing.basic.f1': '✅ リアルタイムP/Sバリュエーション',
    'pricing.basic.f2': '✅ バリュエーション状態分析',
    'pricing.basic.f3': '✅ 90日間ヒストリーチャート',
    'pricing.pro': 'Pro',
    'pricing.pro.price': '$10/月',
    'pricing.pro.annual': '$100/年 · 1日わずか27¢',
    'pricing.pro.f1': '✅ ベーシック全機能',
    'pricing.pro.f2': '✅ AI深層バリュエーションレポート',
    'pricing.pro.f3': '✅ AIスマートQ&Aアシスタント',
    'pricing.pro.f4': '✅ 価格アラート',
    'pricing.pro.f5': '✅ 広告なし体験',
    'pricing.subscribe': '今すぐ登録',
    'pricing.subscribe.loading': 'リダイレクト中...',
    'pricing.or.annual': 'または年間プランを選択',
    'pricing.back': '← ダッシュボードに戻る',

    // Tab bar
    'tab.home': 'ホーム',
    'tab.dashboard': 'ダッシュボード',
    'tab.subscribe': 'プラン',
  },

  ko: {
    // App
    'app.title': 'TSLA 밸류에이션',
    'app.subtitle': 'TSLA Valuation Tracker',
    'app.tagline': 'AI 기반 밸류에이션 분석, P/S 비율로 최적의 매수 시점 포착',

    // Home
    'home.teaser.label': '오늘의 TSLA 밸류에이션',
    'home.teaser.emoji': '🟡',
    'home.teaser.tier': '적정 가치 구간',
    'home.teaser.hint': '상세 P/S 비율 분석 보기 →',
    'home.feature.price': '실시간 가격',
    'home.feature.price.desc': '15분마다 업데이트',
    'home.feature.ai': 'AI 애널리스트',
    'home.feature.ai.desc': '스마트 밸류에이션 분석',
    'home.feature.signal': '밸류에이션 상태',
    'home.feature.signal.desc': '히스토리컬 백분위',
    'home.cta': '오늘의 무료 밸류에이션 보기',
    'home.pricing.tag': '월 $5부터 — 전체 기능 잠금 해제',
    'home.pricing.sub': '하루 17¢ · 연간 플랜 17% 할인',
    'home.disclaimer': '📚 교육 도구 · 투자 조언이 아닙니다',
    'home.stats.s1.icon': '📊',
    'home.stats.s1.label': 'P/S 밸류에이션 모델',
    'home.stats.s2.icon': '⏱️',
    'home.stats.s2.label': '15분 데이터 업데이트',
    'home.stats.s3.icon': '🚀',
    'home.stats.s3.label': '얼리 유저 참여',

    // Dashboard
    'dash.name': '테슬라 (TSLA)',
    'dash.company': 'Tesla, Inc.',
    'dash.loading': '밸류에이션 데이터 로딩 중...',
    'dash.error': '데이터 로드 실패. 다시 시도해 주세요.',
    'dash.ps.title': 'P/S 밸류에이션',
    'dash.ps.label': '주가매출비율 (Price-to-Sales)',
    'dash.ps.locked': '🔒 구독하여 상세 밸류에이션 분석 잠금 해제',
    'dash.stat.mcap': '시가총액',
    'dash.stat.rev': '매출 (TTM)',
    'dash.stat.vol': '거래량',
    'dash.stat.range': '52주 범위',
    'dash.upgrade': '월 $5부터 — 전체 기능 잠금 해제',
    'dash.upgrade.sub': 'AI 분석 · 가격 히스토리 · 알림',
    'dash.ps.what': 'P/S 비율이란?',
    'dash.ps.explain': 'P/S (주가매출비율) = 시가총액 ÷ 매출. 밸류에이션 분석의 핵심 지표입니다. 구독하면 상세 분석을 볼 수 있습니다.',
    'dash.disclaimer': '⚠️ 교육 목적으로만 사용. 투자 조언이 아닙니다.',

    // Pricing
    'pricing.title': '구독 플랜',
    'pricing.basic': '베이직',
    'pricing.basic.price': '$5/월',
    'pricing.basic.annual': '$50/년 · 하루 14¢',
    'pricing.basic.f1': '✅ 실시간 P/S 밸류에이션',
    'pricing.basic.f2': '✅ 밸류에이션 상태 분석',
    'pricing.basic.f3': '✅ 90일 히스토리 차트',
    'pricing.pro': 'Pro',
    'pricing.pro.price': '$10/월',
    'pricing.pro.annual': '$100/년 · 하루 27¢',
    'pricing.pro.f1': '✅ 베이직 전체 기능',
    'pricing.pro.f2': '✅ AI 심층 밸류에이션 리포트',
    'pricing.pro.f3': '✅ AI 스마트 Q&A 어시스턴트',
    'pricing.pro.f4': '✅ 가격 알림',
    'pricing.pro.f5': '✅ 광고 없는 경험',
    'pricing.subscribe': '지금 구독',
    'pricing.subscribe.loading': '리디렉션 중...',
    'pricing.or.annual': '또는 연간 플랜 선택',
    'pricing.back': '← 대시보드로 돌아가기',

    // Tab bar
    'tab.home': '홈',
    'tab.dashboard': '대시보드',
    'tab.subscribe': '플랜',
  }
}

// ==================== Language detection ====================

function detectLanguage(): Lang {
  if (typeof window === 'undefined') return 'zh'

  // Check stored preference
  const stored = (window as any)[LANG_KEY]
  if (stored && translations[stored as Lang]) return stored as Lang

  // Check localStorage
  try {
    const saved = localStorage.getItem('app-lang')
    if (saved && translations[saved as Lang]) return saved as Lang
  } catch {}

  // Auto-detect from browser
  const browserLang = navigator.language?.toLowerCase() || ''
  if (browserLang.startsWith('ja')) return 'ja'
  if (browserLang.startsWith('ko')) return 'ko'
  if (browserLang.startsWith('es')) return 'es'
  if (browserLang.startsWith('en')) return 'en'
  if (browserLang.startsWith('zh')) return 'zh'

  // Default for Chinese platforms (Douyin, TikTok China)
  return 'zh'
}

// ==================== Public API ====================

export function getCurrentLang(): Lang {
  if (typeof window !== 'undefined' && (window as any)[LANG_KEY]) {
    return (window as any)[LANG_KEY] as Lang
  }
  return detectLanguage()
}

export function setLang(lang: Lang) {
  if (typeof window !== 'undefined') {
    (window as any)[LANG_KEY] = lang
    try { localStorage.setItem('app-lang', lang) } catch {}
    window.dispatchEvent(new CustomEvent(LANG_CHANGE_EVENT, { detail: lang }))
  }
}

export function onLangChange(callback: (lang: Lang) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = (e: Event) => {
    callback((e as CustomEvent).detail as Lang)
  }
  window.addEventListener(LANG_CHANGE_EVENT, handler)
  return () => window.removeEventListener(LANG_CHANGE_EVENT, handler)
}

export function t(key: string): string {
  const lang = getCurrentLang()
  return translations[lang]?.[key] || translations.zh[key] || key
}

// Language display names
export const LANG_NAMES: Record<Lang, string> = {
  zh: '中文',
  en: 'English',
  es: 'Español',
  ja: '日本語',
  ko: '한국어'
}

export const ALL_LANGS: Lang[] = ['zh', 'en', 'es', 'ja', 'ko']
