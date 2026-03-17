/**
 * Supabase 客户端服务
 * 用于用户认证、订阅管理和数据存储
 */
import Taro from '@tarojs/taro'

// Supabase 配置 - 从环境变量读取
const SUPABASE_URL = process.env.TARO_APP_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.TARO_APP_SUPABASE_ANON_KEY || ''

// 用户 Profile 类型
export interface UserProfile {
  id: string
  wechat_openid: string
  nickname: string
  avatar_url: string
  subscription_status: 'free' | 'active' | 'expired' | 'cancelled'
  subscription_expires_at: string | null
  created_at: string
  updated_at: string
}

// Supabase 通用响应
interface SupabaseResponse<T> {
  data: T | null
  error: { message: string; code: string } | null
}

/**
 * Supabase REST API 请求封装
 * 使用 Taro.request 适配小程序环境
 */
async function supabaseRequest<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
    body?: Record<string, unknown>
    headers?: Record<string, string>
    token?: string
  } = {}
): Promise<SupabaseResponse<T>> {
  const { method = 'GET', body, headers = {}, token } = options

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { data: null, error: { message: 'Supabase 未配置', code: 'CONFIG_ERROR' } }
  }

  try {
    const res = await Taro.request({
      url: `${SUPABASE_URL}/rest/v1/${path}`,
      method,
      header: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`,
        ...(method === 'POST' ? { 'Prefer': 'return=representation' } : {}),
        ...headers
      },
      data: body
    })

    if (res.statusCode >= 200 && res.statusCode < 300) {
      return { data: res.data as T, error: null }
    }

    return {
      data: null,
      error: { message: res.data?.message || '请求失败', code: String(res.statusCode) }
    }
  } catch (err) {
    return {
      data: null,
      error: { message: (err as Error).message || '网络错误', code: 'NETWORK_ERROR' }
    }
  }
}

/**
 * 调用 Supabase Edge Function
 */
async function invokeFunction<T>(
  functionName: string,
  body: Record<string, unknown>,
  token?: string
): Promise<SupabaseResponse<T>> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { data: null, error: { message: 'Supabase 未配置', code: 'CONFIG_ERROR' } }
  }

  try {
    const res = await Taro.request({
      url: `${SUPABASE_URL}/functions/v1/${functionName}`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`
      },
      data: body
    })

    if (res.statusCode >= 200 && res.statusCode < 300) {
      return { data: res.data as T, error: null }
    }

    return {
      data: null,
      error: { message: res.data?.message || '函数调用失败', code: String(res.statusCode) }
    }
  } catch (err) {
    return {
      data: null,
      error: { message: (err as Error).message || '网络错误', code: 'NETWORK_ERROR' }
    }
  }
}

// ==================== Profile 操作 ====================

/**
 * 获取用户 Profile
 */
export async function getProfile(openid: string, token?: string): Promise<SupabaseResponse<UserProfile[]>> {
  return supabaseRequest<UserProfile[]>(
    `profiles?wechat_openid=eq.${openid}&select=*`,
    { token }
  )
}

/**
 * 创建或更新用户 Profile
 */
export async function upsertProfile(
  profile: Partial<UserProfile> & { wechat_openid: string },
  token?: string
): Promise<SupabaseResponse<UserProfile>> {
  return supabaseRequest<UserProfile>('profiles', {
    method: 'POST',
    body: profile as unknown as Record<string, unknown>,
    headers: {
      'Prefer': 'resolution=merge-duplicates,return=representation'
    },
    token
  })
}

/**
 * 更新订阅状态
 */
export async function updateSubscription(
  openid: string,
  status: UserProfile['subscription_status'],
  expiresAt: string | null,
  token?: string
): Promise<SupabaseResponse<UserProfile>> {
  return supabaseRequest<UserProfile>(
    `profiles?wechat_openid=eq.${openid}`,
    {
      method: 'PATCH',
      body: {
        subscription_status: status,
        subscription_expires_at: expiresAt,
        updated_at: new Date().toISOString()
      },
      token
    }
  )
}

/**
 * 检查订阅是否有效 (服务端验证)
 */
export async function verifySubscription(openid: string, token?: string): Promise<{
  isActive: boolean
  expiresAt: string | null
}> {
  const result = await invokeFunction<{
    is_active: boolean
    expires_at: string | null
  }>('verify-subscription', { openid }, token)

  if (result.error || !result.data) {
    // SECURITY NOTE: 服务端 Edge Function 验证失败时，回退到直接查询 profiles 表。
    // 这依赖 RLS 策略保证数据完整性。如需更严格安全性，应在此返回 { isActive: false }。
    const profile = await getProfile(openid, token)
    if (profile.data && profile.data.length > 0) {
      const p = profile.data[0]
      const isActive = p.subscription_status === 'active' &&
        (!p.subscription_expires_at || new Date(p.subscription_expires_at) > new Date())
      return { isActive, expiresAt: p.subscription_expires_at }
    }
    return { isActive: false, expiresAt: null }
  }

  return {
    isActive: result.data.is_active,
    expiresAt: result.data.expires_at
  }
}

// ==================== Edge Function 调用 ====================

/**
 * 创建支付订单 (通过 Edge Function)
 */
export async function createPaymentOrder(
  openid: string,
  token?: string,
  plan: 'basic' | 'pro' = 'basic',
  billingPeriod: 'monthly' | 'annual' = 'annual'
): Promise<SupabaseResponse<{
  prepay_id: string
  nonce_str: string
  timestamp: string
  sign: string
  package_str: string
}>> {
  return invokeFunction('create-payment', { openid, plan, billingPeriod }, token)
}

/**
 * 验证支付结果 (通过 Edge Function)
 */
export async function verifyPayment(
  orderId: string,
  openid: string,
  token?: string
): Promise<SupabaseResponse<{ success: boolean; subscription_expires_at: string }>> {
  return invokeFunction('verify-payment', { order_id: orderId, openid }, token)
}

export default {
  getProfile,
  upsertProfile,
  updateSubscription,
  verifySubscription,
  createPaymentOrder,
  verifyPayment
}
