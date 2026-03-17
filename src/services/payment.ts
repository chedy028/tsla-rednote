/**
 * 支付服务 - 微信支付集成
 * 重要: 订阅验证通过服务端进行，不依赖 localStorage 判断权限
 */
import Taro from '@tarojs/taro'
import { getOpenid, getSessionToken } from './auth'
import { createPaymentOrder, verifyPayment, verifySubscription } from './supabase'

// ==================== 类型定义 ====================

export interface SubscriptionInfo {
  isActive: boolean
  expiresAt: string | null
  status: 'free' | 'active' | 'expired' | 'cancelled'
}

// 本地缓存 (仅用于减少网络请求，不作为权限判断依据)
const SUBSCRIPTION_CACHE_KEY = 'subscription_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

interface SubscriptionCache {
  info: SubscriptionInfo
  timestamp: number
}

// ==================== 订阅检查 ====================

/**
 * 检查用户订阅状态
 * 重要: 以服务端验证结果为准
 */
export async function checkSubscription(): Promise<SubscriptionInfo> {
  const openid = getOpenid()

  if (!openid) {
    return { isActive: false, expiresAt: null, status: 'free' }
  }

  // 检查本地缓存 (仅减少请求频率)
  const cached = getSubscriptionCache()
  if (cached) {
    return cached
  }

  // 服务端验证
  try {
    const token = getSessionToken()
    const result = await verifySubscription(openid, token || undefined)

    const status: SubscriptionInfo['status'] = result.isActive
      ? 'active'
      : result.expiresAt ? 'expired' : 'free'

    const info: SubscriptionInfo = {
      isActive: result.isActive,
      expiresAt: result.expiresAt,
      status
    }

    setSubscriptionCache(info)
    return info
  } catch (err) {
    console.error('订阅状态检查失败:', err)
    return { isActive: false, expiresAt: null, status: 'free' }
  }
}

/**
 * 强制刷新订阅状态 (清除缓存后重新验证)
 */
export async function refreshSubscription(): Promise<SubscriptionInfo> {
  clearSubscriptionCache()
  return checkSubscription()
}

// ==================== 微信支付 ====================

/**
 * 发起微信支付订阅
 * 流程:
 * 1. 调用服务端创建预支付订单
 * 2. 调用 Taro.requestPayment() 拉起微信支付
 * 3. 支付成功后，调用服务端验证支付结果
 * 4. 刷新订阅状态
 */
export async function subscribe(plan: 'basic' | 'pro' = 'basic', billingPeriod: 'monthly' | 'annual' = 'annual'): Promise<{
  success: boolean
  message: string
}> {
  const openid = getOpenid()
  const token = getSessionToken()

  if (!openid) {
    return { success: false, message: '请先登录' }
  }

  try {
    // 第一步: 服务端创建预支付订单
    const orderRes = await createPaymentOrder(openid, token || undefined, plan, billingPeriod)
    if (orderRes.error || !orderRes.data) {
      return { success: false, message: orderRes.error?.message || '创建订单失败' }
    }

    const { prepay_id, nonce_str, timestamp, sign, package_str } = orderRes.data

    // 第二步: 拉起微信支付
    await Taro.requestPayment({
      timeStamp: timestamp,
      nonceStr: nonce_str,
      package: package_str || `prepay_id=${prepay_id}`,
      signType: 'RSA' as any,
      paySign: sign
    })

    // 第三步: 支付成功，服务端验证
    const verifyRes = await verifyPayment(prepay_id, openid, token || undefined)
    if (verifyRes.error || !verifyRes.data?.success) {
      return {
        success: false,
        message: '支付已完成，但订阅激活失败。请稍后重试或联系客服。'
      }
    }

    // 第四步: 清除缓存，刷新状态
    clearSubscriptionCache()

    return { success: true, message: '订阅成功！' }
  } catch (err: any) {
    // 用户取消支付
    if (err?.errMsg?.includes('cancel')) {
      return { success: false, message: '支付已取消' }
    }

    console.error('支付失败:', err)
    return { success: false, message: '支付失败，请稍后重试' }
  }
}

// ==================== 本地缓存管理 ====================

function getSubscriptionCache(): SubscriptionInfo | null {
  try {
    const cached = Taro.getStorageSync(SUBSCRIPTION_CACHE_KEY) as string
    if (!cached) return null

    const entry: SubscriptionCache = JSON.parse(cached)
    if (Date.now() - entry.timestamp < CACHE_DURATION) {
      return entry.info
    }
    return null
  } catch {
    return null
  }
}

function setSubscriptionCache(info: SubscriptionInfo): void {
  try {
    const entry: SubscriptionCache = { info, timestamp: Date.now() }
    Taro.setStorageSync(SUBSCRIPTION_CACHE_KEY, JSON.stringify(entry))
  } catch {
    // 缓存写入失败不影响主流程
  }
}

function clearSubscriptionCache(): void {
  try {
    Taro.removeStorageSync(SUBSCRIPTION_CACHE_KEY)
  } catch {
    // 忽略
  }
}
