/**
 * 自定义 TabBar 组件
 * H5 模式: 使用 custom event 切换视图 (完全绕过 Taro 路由)
 * 小程序模式: 使用 Taro.reLaunch
 */
import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { navigateToView, getCurrentView, onViewChange, type AppView } from '../services/navigation'
import './CustomTabBar.scss'

interface TabItem {
  viewName: AppView
  pagePath: string
  text: string
  icon: string
  activeIcon: string
}

const TABS: TabItem[] = [
  {
    viewName: 'home',
    pagePath: '/pages/index/index',
    text: '首页',
    icon: '🏠',
    activeIcon: '🏠'
  },
  {
    viewName: 'dashboard',
    pagePath: '/pages/dashboard/index',
    text: '仪表板',
    icon: '📊',
    activeIcon: '📊'
  },
  {
    viewName: 'pricing',
    pagePath: '/pages/pricing/index',
    text: '订阅',
    icon: '💎',
    activeIcon: '💎'
  }
]

export default function CustomTabBar() {
  const router = useRouter()
  const [activeView, setActiveView] = useState<AppView>(() => {
    if (typeof window !== 'undefined') {
      return getCurrentView()
    }
    const path = router.path || 'pages/index/index'
    if (path.includes('dashboard')) return 'dashboard'
    if (path.includes('pricing')) return 'pricing'
    return 'home'
  })

  // Listen for view change events
  useEffect(() => {
    return onViewChange(setActiveView)
  }, [])

  const handleTabClick = (tab: TabItem) => {
    if (tab.viewName === activeView) return

    if (typeof window !== 'undefined') {
      navigateToView(tab.viewName)
    } else {
      Taro.reLaunch({ url: tab.pagePath })
    }
  }

  return (
    <View className='custom-tabbar'>
      {TABS.map(tab => {
        const isActive = activeView === tab.viewName
        return (
          <View
            key={tab.viewName}
            className={`tabbar-item ${isActive ? 'active' : ''}`}
            onClick={() => handleTabClick(tab)}
          >
            <Text className='tabbar-icon'>
              {isActive ? tab.activeIcon : tab.icon}
            </Text>
            <Text className='tabbar-text'>{tab.text}</Text>
          </View>
        )
      })}
    </View>
  )
}
