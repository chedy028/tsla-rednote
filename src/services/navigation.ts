/**
 * SPA Navigation Service
 *
 * Taro H5 has a known bug: ANY hash change triggers Taro's internal router,
 * which creates empty page divs and hides the current page content.
 *
 * This module provides a custom event-based navigation that completely bypasses
 * Taro's H5 router. The URL never changes — only React state switches views.
 *
 * Usage:
 *   import { navigateToView, useCurrentView } from '../services/navigation'
 *   navigateToView('dashboard')
 */
import Taro from '@tarojs/taro'

export type AppView = 'home' | 'dashboard' | 'pricing'

// Extend Window type
declare global {
  interface Window {
    __APP_VIEW__?: AppView
  }
}

const VIEW_CHANGE_EVENT = 'app-view-change'

/**
 * Get the current view
 */
export function getCurrentView(): AppView {
  if (typeof window === 'undefined') return 'home'
  return window.__APP_VIEW__ || 'home'
}

/**
 * Navigate to a view
 * H5: sets global state and dispatches custom event (no URL change!)
 * Mini program: uses Taro navigation
 */
export function navigateToView(view: AppView) {
  if (typeof window !== 'undefined') {
    window.__APP_VIEW__ = view
    window.dispatchEvent(new CustomEvent(VIEW_CHANGE_EVENT, { detail: view }))
    window.scrollTo(0, 0)
  } else {
    const urlMap: Record<AppView, string> = {
      home: '/pages/index/index',
      dashboard: '/pages/dashboard/index',
      pricing: '/pages/pricing/index',
    }
    Taro.switchTab({ url: urlMap[view] })
  }
}

/**
 * Subscribe to view changes
 * Returns an unsubscribe function
 */
export function onViewChange(callback: (view: AppView) => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const handler = (e: Event) => {
    const detail = (e as CustomEvent).detail as AppView
    callback(detail || getCurrentView())
  }

  window.addEventListener(VIEW_CHANGE_EVENT, handler)
  return () => window.removeEventListener(VIEW_CHANGE_EVENT, handler)
}
