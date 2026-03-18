/**
 * TikTok Minis SDK 服务层
 * 封装 TikTok Minis JavaScript API
 * 用于 H5 模式下嵌入 TikTok 国际版
 *
 * SDK 文档: https://developers.tiktok.com/doc/minis-sdk-get-started
 */

// ==================== 类型定义 ====================

declare global {
  interface Window {
    __TIKTOK_MINIS_READY__: boolean
    __TIKTOK_CLIENT_KEY__: string
    __IS_TIKTOK_BROWSER__: boolean
    TTMinis: TTMinisSDK
  }
}

interface TTMinisSDK {
  init: (params: { clientKey: string }) => void
  login: (cb: (response: TTLoginResponse) => void, opts?: TTLoginOpts) => void
  getLoginStatus: (cb: (response: TTLoginStatusResponse) => void, opts?: Record<string, unknown>) => void
  share: (cb: (result: TTShareResult) => void, opts: TTShareOpts) => void
  on: (event: string, handler: () => void) => void
  checkBalance: (cb: (result: TTBalanceResult) => void, opts: Record<string, unknown>) => void
  recharge: (cb: (result: TTRechargeResult) => void, opts: { tier_id: string }) => void
  pay: (cb: (result: TTPayResult) => void, opts: { trade_order_id: string }) => void
  navigateToBalance: (cb: (result: { is_success: boolean }) => void, opts?: Record<string, unknown>) => void
}

interface TTLoginOpts {
  scope?: string
  returnScopes?: boolean
}

interface TTLoginResponse {
  authResponse?: {
    code: string
    grantedScopes?: string[]
  }
  status?: string
}

interface TTLoginStatusResponse {
  status: 'connected' | 'not_authorized' | 'unknown'
  authResponse?: {
    code: string
  }
}

interface TTShareResult {
  is_success: boolean
  error?: { code: number; message: string }
}

interface TTShareOpts {
  title: string
  desc?: string
  imageUrl?: string
  query?: Record<string, unknown>
}

interface TTBalanceResult {
  is_sufficient: boolean
  error?: { code: number; message: string }
}

interface TTRechargeResult {
  is_success: boolean
  trade_order_id?: string
  error?: { code: number; message: string }
}

interface TTPayResult {
  is_success: boolean
  error?: { code: number; message: string }
}

// ==================== 环境检测 ====================

/**
 * 检测当前是否在 TikTok Minis 环境中运行
 */
export function isTikTokMinis(): boolean {
  return typeof window !== 'undefined' && window.__TIKTOK_MINIS_READY__ === true
}

/**
 * 检测 TikTok Minis SDK 是否可用（即使未初始化）
 */
export function isTikTokSDKAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.TTMinis !== 'undefined'
}

/**
 * 检测是否在 TikTok 内置浏览器中（即使 SDK 未初始化）
 * 用于 UI 适配，如隐藏某些非 TikTok 相关的元素
 */
export function isTikTokBrowser(): boolean {
  if (typeof window !== 'undefined' && window.__IS_TIKTOK_BROWSER__) return true
  if (typeof navigator !== 'undefined') {
    return /TikTok|musical_ly|BytedanceWebview/i.test(navigator.userAgent)
  }
  return false
}

/**
 * 初始化 TikTok Minis SDK
 * 通常在 index.html 中已完成，此方法用于动态初始化
 */
export function initTikTokMinis(clientKey: string): boolean {
  if (!isTikTokSDKAvailable()) {
    console.warn('TikTok Minis SDK 不可用')
    return false
  }

  try {
    window.TTMinis.init({ clientKey })
    window.__TIKTOK_MINIS_READY__ = true
    console.log('TikTok Minis SDK 初始化成功')
    return true
  } catch (err) {
    console.error('TikTok Minis SDK 初始化失败:', err)
    return false
  }
}

// ==================== 登录 ====================

/**
 * TikTok 登录
 * 弹出 TikTok 授权对话框，获取 authorization code
 * 必须在用户交互（点击事件）中调用
 */
export function tiktokLogin(scope = 'user.info.basic'): Promise<{ code: string; grantedScopes?: string[] }> {
  return new Promise((resolve, reject) => {
    if (!isTikTokMinis()) {
      reject(new Error('TikTok Minis SDK 未初始化'))
      return
    }

    window.TTMinis.login(
      (response) => {
        if (response.authResponse?.code) {
          resolve({
            code: response.authResponse.code,
            grantedScopes: response.authResponse.grantedScopes
          })
        } else {
          reject(new Error('TikTok 登录失败: 未获取到 code'))
        }
      },
      { scope, returnScopes: true }
    )
  })
}

/**
 * 检查 TikTok 登录状态
 */
export function getTikTokLoginStatus(): Promise<TTLoginStatusResponse> {
  return new Promise((resolve, reject) => {
    if (!isTikTokMinis()) {
      reject(new Error('TikTok Minis SDK 未初始化'))
      return
    }

    window.TTMinis.getLoginStatus((response) => {
      resolve(response)
    })
  })
}

// ==================== 分享 ====================

/**
 * 分享当前页面到 TikTok
 */
export function shareTikTok(opts: TTShareOpts): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (!isTikTokMinis()) {
      reject(new Error('TikTok Minis SDK 未初始化'))
      return
    }

    window.TTMinis.share(
      (result) => {
        if (result.is_success) {
          resolve(true)
        } else {
          reject(new Error(result.error?.message || '分享失败'))
        }
      },
      opts
    )
  })
}

/**
 * 注册 TikTok 分享事件监听
 * 当用户在 TikTok 中点击分享时触发
 */
export function onTikTokShare(handler: () => void): void {
  if (!isTikTokMinis()) return
  window.TTMinis.on('minis.share', handler)
}

// ==================== 支付 ====================

/**
 * 检查用户余额是否充足
 */
export function checkTikTokBalance(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (!isTikTokMinis()) {
      reject(new Error('TikTok Minis SDK 未初始化'))
      return
    }

    window.TTMinis.checkBalance(
      (result) => {
        resolve(result.is_sufficient)
      },
      {}
    )
  })
}

/**
 * TikTok 充值
 * @param tierId 充值档位 ID
 */
export function rechargeTikTok(tierId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isTikTokMinis()) {
      reject(new Error('TikTok Minis SDK 未初始化'))
      return
    }

    window.TTMinis.recharge(
      (result) => {
        if (result.is_success && result.trade_order_id) {
          resolve(result.trade_order_id)
        } else {
          reject(new Error(result.error?.message || '充值失败'))
        }
      },
      { tier_id: tierId }
    )
  })
}

/**
 * TikTok 支付
 * @param tradeOrderId 交易订单号（从 recharge 获取）
 */
export function payTikTok(tradeOrderId: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (!isTikTokMinis()) {
      reject(new Error('TikTok Minis SDK 未初始化'))
      return
    }

    window.TTMinis.pay(
      (result) => {
        if (result.is_success) {
          resolve(true)
        } else {
          reject(new Error(result.error?.message || '支付失败'))
        }
      },
      { trade_order_id: tradeOrderId }
    )
  })
}

// ==================== 便捷方法 ====================

/**
 * 获取用于分享的页面信息
 * 根据当前股票数据生成分享内容
 */
export function getShareContent(
  price: number,
  psRatio: number,
  valuationText: string
): TTShareOpts {
  return {
    title: `TSLA $${price.toFixed(2)} | P/S ${psRatio.toFixed(2)}x - ${valuationText}`,
    desc: `特斯拉估值助手 - AI 驱动的 P/S 比率分析，帮你找到最佳买点！当前 TSLA 估值：${valuationText}`,
    imageUrl: 'https://chedy028.github.io/tsla-rednote/static/share-cover.png',
    query: { page: 'dashboard', ps: String(psRatio.toFixed(2)) }
  }
}

export default {
  isTikTokMinis,
  isTikTokSDKAvailable,
  isTikTokBrowser,
  initTikTokMinis,
  tiktokLogin,
  getTikTokLoginStatus,
  shareTikTok,
  onTikTokShare,
  checkTikTokBalance,
  rechargeTikTok,
  payTikTok,
  getShareContent
}
