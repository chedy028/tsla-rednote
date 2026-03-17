export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/dashboard/index',
    'pages/pricing/index',
    'pages/ai-assistant/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#00d4aa',
    navigationBarTitleText: '特斯拉估值助手',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#666',
    selectedColor: '#00d4aa',
    backgroundColor: '#fff',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: './assets/home.png',
        selectedIconPath: './assets/home-active.png'
      },
      {
        pagePath: 'pages/dashboard/index',
        text: '仪表板',
        iconPath: './assets/dashboard.png',
        selectedIconPath: './assets/dashboard-active.png'
      },
      {
        pagePath: 'pages/pricing/index',
        text: '订阅',
        iconPath: './assets/pricing.png',
        selectedIconPath: './assets/pricing-active.png'
      }
    ]
  }
})
