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
    'dash.ps.undervalued': '🟢 低估区间 — 当前 P/S 低于历史平均',
    'dash.ps.fair': '🟡 合理区间 — P/S 处于正常范围',
    'dash.ps.overvalued': '🔴 高估区间 — P/S 高于历史平均',
    'dash.ps.subscribed': '✅ Pro 已激活',
    'dash.payment.success': '🎉 支付成功！Pro 功能已解锁',
    'dash.stat.mcap': '市值',
    'dash.stat.rev': '营收 (TTM)',
    'dash.stat.vol': '成交量',
    'dash.stat.range': '52周区间',
    'dash.upgrade': '$5/月 — 每日 AI 分析 + 估值解读',
    'dash.upgrade.sub': '每日晨间估值报告直达邮箱',
    'dash.signal.zone': '估值信号',
    'dash.signal.ai.locked': '🔒 订阅解锁 AI 估值解读',
    'dash.signal.ai.title': 'AI 估值解读',
    'dash.ps.what': '什么是 P/S 比率？',
    'dash.ps.explain': 'P/S (市销率) = 市值 ÷ 营收，是衡量公司估值的核心指标。订阅后可查看详细估值区间分析。',
    'dash.disclaimer': '⚠️ 本工具仅供学习参考，不构成投资建议',
    'dash.restore': '已经订阅了？恢复购买',
    'dash.restore.placeholder': '输入订阅邮箱',
    'dash.restore.verify': '验证',
    'dash.restore.checking': '验证中...',
    'dash.restore.notfound': '未找到此邮箱的订阅记录',

    // Pro Features
    'pro.report.title': '🤖 AI 估值报告',
    'pro.report.generate': '生成报告',
    'pro.report.loading': '正在分析...',
    'pro.report.refresh': '刷新报告',
    'pro.report.powered': 'AI 驱动分析',
    'pro.qa.title': '💬 AI 问答助手',
    'pro.qa.placeholder': '问任何关于 TSLA 的问题...',
    'pro.qa.ask': '发送',
    'pro.qa.asking': '思考中...',
    'pro.qa.suggestions': '快捷问题：',
    'pro.qa.s1': '现在适合买入吗？',
    'pro.qa.s2': '风险分析',
    'pro.qa.s3': '目标价',
    'pro.alerts.title': '🔔 价格预警',
    'pro.alerts.add': '+ 添加预警',
    'pro.alerts.empty': '暂无预警',
    'pro.alerts.price.above': '价格高于',
    'pro.alerts.price.below': '价格低于',
    'pro.alerts.ps.above': 'P/S 高于',
    'pro.alerts.ps.below': 'P/S 低于',
    'pro.alerts.create': '创建',
    'pro.alerts.creating': '创建中...',
    'pro.alerts.delete': '删除',
    'pro.alerts.type': '预警类型',
    'pro.alerts.value': '目标值',
    'pro.email.title': '输入 Pro 邮箱使用 AI 功能',
    'pro.email.save': '保存',

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
    'dash.ps.undervalued': '🟢 Undervalued — P/S below historical average',
    'dash.ps.fair': '🟡 Fair Value — P/S in normal range',
    'dash.ps.overvalued': '🔴 Overvalued — P/S above historical average',
    'dash.ps.subscribed': '✅ Pro Activated',
    'dash.payment.success': '🎉 Payment successful! Pro features unlocked',
    'dash.stat.mcap': 'Market Cap',
    'dash.stat.rev': 'Revenue (TTM)',
    'dash.stat.vol': 'Volume',
    'dash.stat.range': '52-Week Range',
    'dash.upgrade': '$5/mo — Daily AI Analysis + Valuation Insights',
    'dash.upgrade.sub': 'Daily valuation report delivered to your inbox',
    'dash.signal.zone': 'Valuation Signal',
    'dash.signal.ai.locked': '🔒 Subscribe to unlock AI valuation insights',
    'dash.signal.ai.title': 'AI Valuation Insights',
    'dash.ps.what': 'What is P/S Ratio?',
    'dash.ps.explain': 'P/S (Price-to-Sales) = Market Cap ÷ Revenue. A key metric for valuation analysis. Subscribe to see detailed valuation zone analysis.',
    'dash.disclaimer': '⚠️ For educational purposes only. Not investment advice.',
    'dash.restore': 'Already subscribed? Restore purchase',
    'dash.restore.placeholder': 'Enter your email',
    'dash.restore.verify': 'Verify',
    'dash.restore.checking': 'Checking...',
    'dash.restore.notfound': 'No active subscription found for this email',

    // Pro Features
    'pro.report.title': '🤖 AI Valuation Report',
    'pro.report.generate': 'Generate Report',
    'pro.report.loading': 'Analyzing...',
    'pro.report.refresh': 'Refresh Report',
    'pro.report.powered': 'AI-Powered Analysis',
    'pro.qa.title': '💬 AI Q&A Assistant',
    'pro.qa.placeholder': 'Ask anything about TSLA...',
    'pro.qa.ask': 'Send',
    'pro.qa.asking': 'Thinking...',
    'pro.qa.suggestions': 'Quick questions:',
    'pro.qa.s1': 'Good time to buy?',
    'pro.qa.s2': 'Risk analysis',
    'pro.qa.s3': 'Target price',
    'pro.alerts.title': '🔔 Price Alerts',
    'pro.alerts.add': '+ Add Alert',
    'pro.alerts.empty': 'No alerts set',
    'pro.alerts.price.above': 'Price above',
    'pro.alerts.price.below': 'Price below',
    'pro.alerts.ps.above': 'P/S above',
    'pro.alerts.ps.below': 'P/S below',
    'pro.alerts.create': 'Create',
    'pro.alerts.creating': 'Creating...',
    'pro.alerts.delete': 'Delete',
    'pro.alerts.type': 'Alert type',
    'pro.alerts.value': 'Target value',
    'pro.email.title': 'Enter Pro email to use AI features',
    'pro.email.save': 'Save',

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
    'dash.ps.undervalued': '🟢 Infravalorado — P/V por debajo del promedio',
    'dash.ps.fair': '🟡 Valor justo — P/V en rango normal',
    'dash.ps.overvalued': '🔴 Sobrevalorado — P/V por encima del promedio',
    'dash.ps.subscribed': '✅ Pro Activado',
    'dash.payment.success': '🎉 Pago exitoso! Funciones Pro desbloqueadas',
    'dash.stat.mcap': 'Cap. Mercado',
    'dash.stat.rev': 'Ingresos (TTM)',
    'dash.stat.vol': 'Volumen',
    'dash.stat.range': 'Rango 52 sem',
    'dash.upgrade': '$5/mes — Análisis IA diario + valoración',
    'dash.upgrade.sub': 'Informe diario de valoración en tu correo',
    'dash.signal.zone': 'Señal de valoración',
    'dash.signal.ai.locked': '🔒 Suscríbete para análisis IA de valoración',
    'dash.signal.ai.title': 'Análisis IA de valoración',
    'dash.ps.what': '¿Qué es el ratio P/V?',
    'dash.ps.explain': 'P/V (Precio/Ventas) = Cap. de Mercado ÷ Ingresos. Una métrica clave para el análisis de valoración. Suscríbete para ver análisis detallado.',
    'dash.disclaimer': '⚠️ Solo con fines educativos. No es consejo de inversión.',
    'dash.restore': '¿Ya estás suscrito? Restaurar compra',
    'dash.restore.placeholder': 'Ingresa tu email',
    'dash.restore.verify': 'Verificar',
    'dash.restore.checking': 'Verificando...',
    'dash.restore.notfound': 'No se encontró suscripción activa para este email',

    // Pro Features
    'pro.report.title': '🤖 Informe IA de Valoración',
    'pro.report.generate': 'Generar Informe',
    'pro.report.loading': 'Analizando...',
    'pro.report.refresh': 'Actualizar Informe',
    'pro.report.powered': 'Análisis impulsado por IA',
    'pro.qa.title': '💬 Asistente IA',
    'pro.qa.placeholder': 'Pregunta sobre TSLA...',
    'pro.qa.ask': 'Enviar',
    'pro.qa.asking': 'Pensando...',
    'pro.qa.suggestions': 'Preguntas rápidas:',
    'pro.qa.s1': '¿Buen momento para comprar?',
    'pro.qa.s2': 'Análisis de riesgo',
    'pro.qa.s3': 'Precio objetivo',
    'pro.alerts.title': '🔔 Alertas de Precio',
    'pro.alerts.add': '+ Añadir Alerta',
    'pro.alerts.empty': 'Sin alertas configuradas',
    'pro.alerts.price.above': 'Precio por encima de',
    'pro.alerts.price.below': 'Precio por debajo de',
    'pro.alerts.ps.above': 'P/V por encima de',
    'pro.alerts.ps.below': 'P/V por debajo de',
    'pro.alerts.create': 'Crear',
    'pro.alerts.creating': 'Creando...',
    'pro.alerts.delete': 'Eliminar',
    'pro.alerts.type': 'Tipo de alerta',
    'pro.alerts.value': 'Valor objetivo',
    'pro.email.title': 'Ingresa email Pro para funciones IA',
    'pro.email.save': 'Guardar',

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
    'dash.ps.undervalued': '🟢 割安 — P/Sが過去平均を下回る',
    'dash.ps.fair': '🟡 適正価格 — P/Sが通常範囲内',
    'dash.ps.overvalued': '🔴 割高 — P/Sが過去平均を上回る',
    'dash.ps.subscribed': '✅ Pro 有効',
    'dash.payment.success': '🎉 支払い成功！Pro機能がアンロックされました',
    'dash.stat.mcap': '時価総額',
    'dash.stat.rev': '売上高 (TTM)',
    'dash.stat.vol': '出来高',
    'dash.stat.range': '52週レンジ',
    'dash.upgrade': '月額$5 — 毎日のAI分析 + バリュエーション',
    'dash.upgrade.sub': '毎朝バリュエーションレポートをお届け',
    'dash.signal.zone': 'バリュエーションシグナル',
    'dash.signal.ai.locked': '🔒 サブスクでAIバリュエーション分析をアンロック',
    'dash.signal.ai.title': 'AIバリュエーション分析',
    'dash.ps.what': 'P/Sレシオとは？',
    'dash.ps.explain': 'P/S（株価売上高倍率）= 時価総額 ÷ 売上高。バリュエーション分析の重要な指標です。サブスクで詳細な分析をご覧ください。',
    'dash.disclaimer': '⚠️ 教育目的のみ。投資アドバイスではありません。',
    'dash.restore': '既にサブスク済み？購入を復元',
    'dash.restore.placeholder': 'メールアドレスを入力',
    'dash.restore.verify': '確認',
    'dash.restore.checking': '確認中...',
    'dash.restore.notfound': 'このメールアドレスのサブスクが見つかりません',

    // Pro Features
    'pro.report.title': '🤖 AI バリュエーションレポート',
    'pro.report.generate': 'レポート生成',
    'pro.report.loading': '分析中...',
    'pro.report.refresh': 'レポート更新',
    'pro.report.powered': 'AI駆動分析',
    'pro.qa.title': '💬 AI Q&Aアシスタント',
    'pro.qa.placeholder': 'TSLAについて何でも聞いてください...',
    'pro.qa.ask': '送信',
    'pro.qa.asking': '考え中...',
    'pro.qa.suggestions': 'クイック質問：',
    'pro.qa.s1': '今が買い時？',
    'pro.qa.s2': 'リスク分析',
    'pro.qa.s3': '目標価格',
    'pro.alerts.title': '🔔 価格アラート',
    'pro.alerts.add': '+ アラート追加',
    'pro.alerts.empty': 'アラートなし',
    'pro.alerts.price.above': '価格が上回る',
    'pro.alerts.price.below': '価格が下回る',
    'pro.alerts.ps.above': 'P/Sが上回る',
    'pro.alerts.ps.below': 'P/Sが下回る',
    'pro.alerts.create': '作成',
    'pro.alerts.creating': '作成中...',
    'pro.alerts.delete': '削除',
    'pro.alerts.type': 'アラートタイプ',
    'pro.alerts.value': '目標値',
    'pro.email.title': 'AI機能を使うにはProメールを入力',
    'pro.email.save': '保存',

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
    'dash.ps.undervalued': '🟢 저평가 — P/S가 과거 평균 이하',
    'dash.ps.fair': '🟡 적정 가치 — P/S가 정상 범위',
    'dash.ps.overvalued': '🔴 고평가 — P/S가 과거 평균 이상',
    'dash.ps.subscribed': '✅ Pro 활성화',
    'dash.payment.success': '🎉 결제 성공! Pro 기능이 잠금 해제되었습니다',
    'dash.stat.mcap': '시가총액',
    'dash.stat.rev': '매출 (TTM)',
    'dash.stat.vol': '거래량',
    'dash.stat.range': '52주 범위',
    'dash.upgrade': '월 $5 — 매일 AI 분석 + 밸류에이션',
    'dash.upgrade.sub': '매일 아침 밸류에이션 리포트를 받아보세요',
    'dash.signal.zone': '밸류에이션 시그널',
    'dash.signal.ai.locked': '🔒 구독하여 AI 밸류에이션 분석 잠금 해제',
    'dash.signal.ai.title': 'AI 밸류에이션 분석',
    'dash.ps.what': 'P/S 비율이란?',
    'dash.ps.explain': 'P/S (주가매출비율) = 시가총액 ÷ 매출. 밸류에이션 분석의 핵심 지표입니다. 구독하면 상세 분석을 볼 수 있습니다.',
    'dash.disclaimer': '⚠️ 교육 목적으로만 사용. 투자 조언이 아닙니다.',
    'dash.restore': '이미 구독하셨나요? 구매 복원',
    'dash.restore.placeholder': '이메일을 입력하세요',
    'dash.restore.verify': '확인',
    'dash.restore.checking': '확인 중...',
    'dash.restore.notfound': '이 이메일로 활성 구독을 찾을 수 없습니다',

    // Pro Features
    'pro.report.title': '🤖 AI 밸류에이션 리포트',
    'pro.report.generate': '리포트 생성',
    'pro.report.loading': '분석 중...',
    'pro.report.refresh': '리포트 갱신',
    'pro.report.powered': 'AI 기반 분석',
    'pro.qa.title': '💬 AI Q&A 어시스턴트',
    'pro.qa.placeholder': 'TSLA에 대해 무엇이든 물어보세요...',
    'pro.qa.ask': '보내기',
    'pro.qa.asking': '생각 중...',
    'pro.qa.suggestions': '빠른 질문:',
    'pro.qa.s1': '지금 매수 적기?',
    'pro.qa.s2': '리스크 분석',
    'pro.qa.s3': '목표 가격',
    'pro.alerts.title': '🔔 가격 알림',
    'pro.alerts.add': '+ 알림 추가',
    'pro.alerts.empty': '설정된 알림 없음',
    'pro.alerts.price.above': '가격 초과',
    'pro.alerts.price.below': '가격 미만',
    'pro.alerts.ps.above': 'P/S 초과',
    'pro.alerts.ps.below': 'P/S 미만',
    'pro.alerts.create': '생성',
    'pro.alerts.creating': '생성 중...',
    'pro.alerts.delete': '삭제',
    'pro.alerts.type': '알림 유형',
    'pro.alerts.value': '목표값',
    'pro.email.title': 'AI 기능 사용을 위해 Pro 이메일 입력',
    'pro.email.save': '저장',

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
