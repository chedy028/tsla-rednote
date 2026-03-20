/**
 * i18n — Internationalization service
 * Supports: zh (Chinese), en (English), es (Spanish)
 * Default: auto-detect from browser, fallback to zh
 */

export type Lang = 'zh' | 'en' | 'es'

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
    'home.teaser.action': '点击查看 P/S 指标',
    'home.teaser.hint': '进入查看实时估值数据 →',
    'home.feature.price': '实时价格',
    'home.feature.price.desc': '15分钟更新一次',
    'home.feature.ai': 'AI 分析师',
    'home.feature.ai.desc': '智能估值解读',
    'home.feature.signal': '买卖信号',
    'home.feature.signal.desc': '智能提示时机',
    'home.cta': '免费查看今日估值',
    'home.pricing.tag': '低至 ¥4.08/月 解锁完整功能',
    'home.pricing.sub': '每天只要1毛6 · 按年付省17%',
    'home.disclaimer': '📚 教育工具 · 不构成投资建议',
    'home.stats.users': '活跃用户',
    'home.stats.accuracy': '数据准确度',
    'home.stats.rating': '用户评分',

    // Dashboard
    'dash.name': '特斯拉 (TSLA)',
    'dash.company': 'Tesla, Inc.',
    'dash.loading': '加载估值数据...',
    'dash.error': '数据加载失败，请稍后重试',
    'dash.ps.title': 'P/S 估值指标',
    'dash.ps.label': '市销率 (Price-to-Sales)',
    'dash.ps.locked': '🔒 订阅解锁估值解读与买卖信号',
    'dash.stat.mcap': '市值',
    'dash.stat.rev': '营收 (TTM)',
    'dash.stat.vol': '成交量',
    'dash.stat.range': '52周区间',
    'dash.upgrade': '低至 ¥4.08/月 解锁完整功能',
    'dash.upgrade.sub': 'AI 分析 · 历史走势 · 价格预警',
    'dash.ps.what': '什么是 P/S 比率？',
    'dash.ps.explain': 'P/S (市销率) = 市值 ÷ 营收，是衡量公司估值的核心指标。订阅后可查看详细估值区间分析与买卖建议。',
    'dash.disclaimer': '⚠️ 本工具仅供学习参考，不构成投资建议',

    // Pricing
    'pricing.title': '订阅方案',
    'pricing.basic': '基础版',
    'pricing.basic.price': '¥4.08/月',
    'pricing.basic.annual': '按年付 ¥49/年 · 每天只要1毛3',
    'pricing.basic.f1': '✅ 实时 P/S 估值',
    'pricing.basic.f2': '✅ 买卖信号分析',
    'pricing.basic.f3': '✅ 90天历史走势图',
    'pricing.basic.btn': '订阅基础版',
    'pricing.pro': 'Pro 版',
    'pricing.pro.price': '¥8.25/月',
    'pricing.pro.annual': '按年付 ¥99/年 · 每天只要2毛7',
    'pricing.pro.f1': '✅ 全部基础版功能',
    'pricing.pro.f2': '✅ AI 智能分析助手',
    'pricing.pro.f3': '✅ 价格预警通知',
    'pricing.pro.f4': '✅ 多股票分析',
    'pricing.pro.btn': '订阅 Pro 版',
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
    'home.teaser.action': 'View P/S Indicator',
    'home.teaser.hint': 'See real-time valuation data →',
    'home.feature.price': 'Live Price',
    'home.feature.price.desc': 'Updates every 15 min',
    'home.feature.ai': 'AI Analyst',
    'home.feature.ai.desc': 'Smart valuation insights',
    'home.feature.signal': 'Trade Signals',
    'home.feature.signal.desc': 'Timing alerts',
    'home.cta': "View Today's Free Valuation",
    'home.pricing.tag': 'From $0.56/mo — unlock full features',
    'home.pricing.sub': 'Just 2¢/day · save 17% with annual plan',
    'home.disclaimer': '📚 Educational tool · Not investment advice',
    'home.stats.users': 'Active Users',
    'home.stats.accuracy': 'Data Accuracy',
    'home.stats.rating': 'User Rating',

    // Dashboard
    'dash.name': 'Tesla (TSLA)',
    'dash.company': 'Tesla, Inc.',
    'dash.loading': 'Loading valuation data...',
    'dash.error': 'Failed to load data. Please try again.',
    'dash.ps.title': 'P/S Valuation',
    'dash.ps.label': 'Price-to-Sales Ratio',
    'dash.ps.locked': '🔒 Subscribe to unlock valuation insights & trade signals',
    'dash.stat.mcap': 'Market Cap',
    'dash.stat.rev': 'Revenue (TTM)',
    'dash.stat.vol': 'Volume',
    'dash.stat.range': '52-Week Range',
    'dash.upgrade': 'From $0.56/mo — unlock full features',
    'dash.upgrade.sub': 'AI analysis · price history · alerts',
    'dash.ps.what': 'What is P/S Ratio?',
    'dash.ps.explain': 'P/S (Price-to-Sales) = Market Cap ÷ Revenue. A key metric for valuation analysis. Subscribe to see detailed valuation zones and trade recommendations.',
    'dash.disclaimer': '⚠️ For educational purposes only. Not investment advice.',

    // Pricing
    'pricing.title': 'Subscription Plans',
    'pricing.basic': 'Basic',
    'pricing.basic.price': '$0.56/mo',
    'pricing.basic.annual': '$6.70/year · just 2¢ per day',
    'pricing.basic.f1': '✅ Real-time P/S valuation',
    'pricing.basic.f2': '✅ Buy/sell signal analysis',
    'pricing.basic.f3': '✅ 90-day history chart',
    'pricing.basic.btn': 'Subscribe Basic',
    'pricing.pro': 'Pro',
    'pricing.pro.price': '$1.13/mo',
    'pricing.pro.annual': '$13.50/year · just 4¢ per day',
    'pricing.pro.f1': '✅ All Basic features',
    'pricing.pro.f2': '✅ AI smart analyst',
    'pricing.pro.f3': '✅ Price alerts',
    'pricing.pro.f4': '✅ Multi-stock analysis',
    'pricing.pro.btn': 'Subscribe Pro',
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
    'home.teaser.action': 'Ver indicador P/V',
    'home.teaser.hint': 'Ver datos de valoración en tiempo real →',
    'home.feature.price': 'Precio en vivo',
    'home.feature.price.desc': 'Actualiza cada 15 min',
    'home.feature.ai': 'Analista IA',
    'home.feature.ai.desc': 'Análisis inteligente',
    'home.feature.signal': 'Señales',
    'home.feature.signal.desc': 'Alertas de compra/venta',
    'home.cta': 'Ver valoración gratis de hoy',
    'home.pricing.tag': 'Desde $0.56/mes — desbloquea todo',
    'home.pricing.sub': 'Solo 2¢/día · ahorra 17% con plan anual',
    'home.disclaimer': '📚 Herramienta educativa · No es consejo de inversión',
    'home.stats.users': 'Usuarios activos',
    'home.stats.accuracy': 'Precisión',
    'home.stats.rating': 'Valoración',

    // Dashboard
    'dash.name': 'Tesla (TSLA)',
    'dash.company': 'Tesla, Inc.',
    'dash.loading': 'Cargando datos de valoración...',
    'dash.error': 'Error al cargar datos. Inténtalo de nuevo.',
    'dash.ps.title': 'Valoración P/V',
    'dash.ps.label': 'Ratio Precio-Ventas',
    'dash.ps.locked': '🔒 Suscríbete para ver análisis y señales',
    'dash.stat.mcap': 'Cap. Mercado',
    'dash.stat.rev': 'Ingresos (TTM)',
    'dash.stat.vol': 'Volumen',
    'dash.stat.range': 'Rango 52 sem',
    'dash.upgrade': 'Desde $0.56/mes — desbloquea todo',
    'dash.upgrade.sub': 'Análisis IA · historial · alertas',
    'dash.ps.what': '¿Qué es el ratio P/V?',
    'dash.ps.explain': 'P/V (Precio/Ventas) = Cap. de Mercado ÷ Ingresos. Una métrica clave para el análisis de valoración. Suscríbete para ver zonas de valoración y recomendaciones.',
    'dash.disclaimer': '⚠️ Solo con fines educativos. No es consejo de inversión.',

    // Pricing
    'pricing.title': 'Planes de suscripción',
    'pricing.basic': 'Básico',
    'pricing.basic.price': '$0.56/mes',
    'pricing.basic.annual': '$6.70/año · solo 2¢ por día',
    'pricing.basic.f1': '✅ Valoración P/V en tiempo real',
    'pricing.basic.f2': '✅ Análisis de señales',
    'pricing.basic.f3': '✅ Historial de 90 días',
    'pricing.basic.btn': 'Suscribir Básico',
    'pricing.pro': 'Pro',
    'pricing.pro.price': '$1.13/mes',
    'pricing.pro.annual': '$13.50/año · solo 4¢ por día',
    'pricing.pro.f1': '✅ Todo lo del plan Básico',
    'pricing.pro.f2': '✅ Analista IA inteligente',
    'pricing.pro.f3': '✅ Alertas de precio',
    'pricing.pro.f4': '✅ Análisis multi-acciones',
    'pricing.pro.btn': 'Suscribir Pro',
    'pricing.back': '← Volver al panel',

    // Tab bar
    'tab.home': 'Inicio',
    'tab.dashboard': 'Panel',
    'tab.subscribe': 'Planes',
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
  es: 'Español'
}

export const ALL_LANGS: Lang[] = ['zh', 'en', 'es']
