/**
 * 认证服务 - 微信小程序登录流程
 * WeChat Mini Program Authentication Service
 */
import Taro from '@tarojs/taro'
import { upsertProfile, getProfile, type UserProfile } from './supabase'

// ==================== 类型定义 ====================

export interface AuthUser {
  openid: string
  nickname: string
  avatarUrl: string
  sessionToken: string | null
}

// 本地存储 keys
const STORAGE_KEYS = {
  OPENID: 'auth_openid',
  SESSION: 'auth_session',
  USER_INFO: 'auth_user_info'
} as const

// ==================== 登录流程 ====================

/**
 * 微信小程序登录
 * 1. 调用 Taro.login() 获取 code
 * 2. 将 code 发送到服务端换取 openid
 * 3. 在 Supabase 创建/更新用户 Profile
 * 4. 将登录信息存储到本地
 */
export async function login(): Promise<AuthUser> {
  try {
    // 第一步: 获取微信 login code
    const loginRes = await Taro.login()
    if (!loginRes.code) {
      throw new Error('微信登录失败: 未获取到 code')
    }

    // 第二步: 发送 code 到服务端获取 openid
    // 正式环境通过 Supabase Edge Function 处理
    const authRes = await Taro.request<{
      openid: string
      session_key: string
      token: string
    }>({
      url: `${process.env.TARO_APP_SUPABASE_URL || ''}/functions/v1/wechat-login`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'apikey': process.env.TARO_APP_SUPABASE_ANON_KEY || ''
      },
      data: { code: loginRes.code }
    })

    if (authRes.statusCode !== 200 || !authRes.data?.openid) {
      throw new Error('服务端登录验证失败')
    }

    const { openid, token } = authRes.data

    // 第三步: 在 Supabase 创建/更新 Profile
    await upsertProfile({
      wechat_openid: openid,
      updated_at: new Date().toISOString()
    }, token)

    // 第四步: 存储登录信息
    const user: AuthUser = {
      openid,
      nickname: '',
      avatarUrl: '',
      sessionToken: token
    }

    Taro.setStorageSync(STORAGE_KEYS.OPENID, openid)
    Taro.setStorageSync(STORAGE_KEYS.SESSION, token)
    Taro.setStorageSync(STORAGE_KEYS.USER_INFO, JSON.stringify(user))

    return user
  } catch (err) {
    console.error('登录失败:', err)
    throw new Error(`登录失败: ${(err as Error).message}`)
  }
}

/**
 * 获取并更新用户信息 (昵称、头像)
 * 需要用户主动触发 (小程序规定)
 */
export async function updateUserInfo(userInfo: {
  nickName: string
  avatarUrl: string
}): Promise<AuthUser> {
  const openid = getOpenid()
  const token = getSessionToken()

  if (!openid) {
    throw new Error('用户未登录')
  }

  // 更新 Supabase Profile
  await upsertProfile({
    wechat_openid: openid,
    nickname: userInfo.nickName,
    avatar_url: userInfo.avatarUrl,
    updated_at: new Date().toISOString()
  }, token || undefined)

  // 更新本地存储
  const user: AuthUser = {
    openid,
    nickname: userInfo.nickName,
    avatarUrl: userInfo.avatarUrl,
    sessionToken: token
  }
  Taro.setStorageSync(STORAGE_KEYS.USER_INFO, JSON.stringify(user))

  return user
}

/**
 * 退出登录
 */
export function logout(): void {
  try {
    Taro.removeStorageSync(STORAGE_KEYS.OPENID)
    Taro.removeStorageSync(STORAGE_KEYS.SESSION)
    Taro.removeStorageSync(STORAGE_KEYS.USER_INFO)
  } catch {
    // 清除失败不影响退出流程
  }
}

// ==================== 状态查询 ====================

/**
 * 获取当前登录用户信息 (从本地存储读取)
 */
export function getUser(): AuthUser | null {
  try {
    const userJson = Taro.getStorageSync(STORAGE_KEYS.USER_INFO) as string
    if (!userJson) return null
    return JSON.parse(userJson) as AuthUser
  } catch {
    return null
  }
}

/**
 * 获取当前 openid
 */
export function getOpenid(): string | null {
  try {
    return (Taro.getStorageSync(STORAGE_KEYS.OPENID) as string) || null
  } catch {
    return null
  }
}

/**
 * 获取当前 session token
 */
export function getSessionToken(): string | null {
  try {
    return (Taro.getStorageSync(STORAGE_KEYS.SESSION) as string) || null
  } catch {
    return null
  }
}

/**
 * 检查是否已登录
 */
export function isAuthenticated(): boolean {
  return !!getOpenid()
}

/**
 * 获取用户完整 Profile (包含订阅状态，需网络请求)
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const openid = getOpenid()
  const token = getSessionToken()
  if (!openid) return null

  const result = await getProfile(openid, token || undefined)
  if (result.data && result.data.length > 0) {
    return result.data[0]
  }
  return null
}

/**
 * 静默登录 - 应用启动时自动尝试
 * 如果本地有已保存的用户信息则直接返回，否则尝试 login
 */
export async function silentLogin(): Promise<AuthUser | null> {
  const existingUser = getUser()
  if (existingUser) {
    return existingUser
  }

  try {
    return await login()
  } catch {
    // 静默登录失败不抛异常
    return null
  }
}
