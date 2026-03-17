/**
 * 全局状态管理
 * 使用 React Context + useReducer 模式
 */
import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react'
import type { TSLAStockData } from '../services/stockApi'

// ==================== State 类型定义 ====================

export interface UserState {
  openid: string | null
  nickname: string
  avatarUrl: string
  isLoggedIn: boolean
}

export interface SubscriptionState {
  status: 'free' | 'active' | 'expired' | 'cancelled'
  expiresAt: string | null
  isVerified: boolean  // 是否已通过服务端验证
}

export interface AppState {
  user: UserState
  subscription: SubscriptionState
  tslaData: TSLAStockData | null
  loading: {
    auth: boolean
    stock: boolean
    subscription: boolean
    payment: boolean
  }
  error: string | null
}

// ==================== Action 类型 ====================

type Action =
  | { type: 'SET_USER'; payload: Partial<UserState> }
  | { type: 'CLEAR_USER' }
  | { type: 'SET_SUBSCRIPTION'; payload: Partial<SubscriptionState> }
  | { type: 'SET_TSLA_DATA'; payload: TSLAStockData }
  | { type: 'SET_LOADING'; payload: { key: keyof AppState['loading']; value: boolean } }
  | { type: 'SET_ERROR'; payload: string | null }

// ==================== 初始状态 ====================

const initialState: AppState = {
  user: {
    openid: null,
    nickname: '',
    avatarUrl: '',
    isLoggedIn: false
  },
  subscription: {
    status: 'free',
    expiresAt: null,
    isVerified: false
  },
  tslaData: null,
  loading: {
    auth: false,
    stock: false,
    subscription: false,
    payment: false
  },
  error: null
}

// ==================== Reducer ====================

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
        error: null
      }

    case 'CLEAR_USER':
      return {
        ...state,
        user: initialState.user,
        subscription: initialState.subscription
      }

    case 'SET_SUBSCRIPTION':
      return {
        ...state,
        subscription: { ...state.subscription, ...action.payload }
      }

    case 'SET_TSLA_DATA':
      return {
        ...state,
        tslaData: action.payload,
        error: null
      }

    case 'SET_LOADING':
      return {
        ...state,
        loading: { ...state.loading, [action.payload.key]: action.payload.value }
      }

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      }

    default:
      return state
  }
}

// ==================== Context ====================

interface StoreContextValue {
  state: AppState
  dispatch: Dispatch<Action>
}

const StoreContext = createContext<StoreContextValue | null>(null)

// ==================== Provider ====================

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  )
}

// ==================== Hook ====================

export function useStore(): StoreContextValue {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStore 必须在 StoreProvider 内使用')
  }
  return context
}

/**
 * 便捷 hooks - 获取特定状态片段
 */
export function useUser() {
  const { state } = useStore()
  return state.user
}

export function useSubscription() {
  const { state } = useStore()
  return state.subscription
}

export function useTSLAData() {
  const { state } = useStore()
  return state.tslaData
}

export function useLoading(key?: keyof AppState['loading']) {
  const { state } = useStore()
  if (key) return state.loading[key]
  return Object.values(state.loading).some(Boolean)
}

// ==================== Action Creators ====================

export const actions = {
  setUser: (payload: Partial<UserState>): Action => ({ type: 'SET_USER', payload }),
  clearUser: (): Action => ({ type: 'CLEAR_USER' }),
  setSubscription: (payload: Partial<SubscriptionState>): Action => ({ type: 'SET_SUBSCRIPTION', payload }),
  setTSLAData: (payload: TSLAStockData): Action => ({ type: 'SET_TSLA_DATA', payload }),
  setLoading: (key: keyof AppState['loading'], value: boolean): Action => ({ type: 'SET_LOADING', payload: { key, value } }),
  setError: (payload: string | null): Action => ({ type: 'SET_ERROR', payload })
}
