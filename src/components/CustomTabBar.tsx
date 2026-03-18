/**
 * 自定义 TabBar 组件
 * 解决 Taro H5 模式下原生 tabBar switchTab 页面不渲染的问题
 * 使用 Taro.reLaunch 代替 switchTab
 */
import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import './CustomTabBar.scss'

interface TabItem {
  pagePath: string
  text: string
  icon: string
  activeIcon: string
}

const TABS: TabItem[] = [
  {
    pagePath: '/pages/index/index',
    text: '首页',
    icon: '🏠',
    activeIcon: '🏠'
  },
  {
    pagePath: '/pages/dashboard/index',
    text: '仪表板',
    icon: '📊',
    activeIcon: '📊'
  },
  {
    pagePath: '/pages/pricing/index',
    text: '订阅',
    icon: '💎',
    activeIcon: '💎'
  }
]

export default function CustomTabBar() {
  const router = useRouter()
  const currentPath = '/' + (router.path || 'pages/index/index')

  const handleTabClick = (pagePath: string) => {
    if (pagePath === currentPath) return

    // H5 模式: 直接修改 hash 并强制刷新页面
    // Taro H5 router 的 reLaunch/switchTab 有已知的页面不渲染 bug
    if (typeof window !== 'undefined') {
      window.location.hash = '#' + pagePath
      window.location.reload()
    } else {
      Taro.reLaunch({ url: pagePath })
    }
  }

  return (
    <View className='custom-tabbar'>
      {TABS.map(tab => {
        const isActive = currentPath.includes(tab.pagePath.replace('/pages/', 'pages/'))
          || currentPath === tab.pagePath
        return (
          <View
            key={tab.pagePath}
            className={`tabbar-item ${isActive ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.pagePath)}
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
