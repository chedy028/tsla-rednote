import { View, Text } from '@tarojs/components'
import { navigateToView } from '../services/navigation'
import CustomTabBar from './CustomTabBar'

export default function PricingView() {
  return (
    <View style={{ minHeight: '100vh', background: '#f0f9ff', padding: '24px' }}>
      <Text style={{ fontSize: '40px', fontWeight: 'bold', display: 'block', textAlign: 'center', marginBottom: '32px' }}>订阅方案</Text>

      {/* Basic Plan */}
      <View style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '16px', border: '2px solid #00d4aa' }}>
        <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block' }}>基础版</Text>
        <Text style={{ fontSize: '48px', fontWeight: 'bold', color: '#00d4aa', display: 'block', marginTop: '16px' }}>¥4.08/月</Text>
        <Text style={{ fontSize: '22px', color: '#666', display: 'block' }}>按年付 ¥49/年 · 每天只要1毛3</Text>
        <View style={{ marginTop: '16px' }}>
          <Text style={{ fontSize: '22px', display: 'block', marginBottom: '8px' }}>✅ 实时 P/S 估值</Text>
          <Text style={{ fontSize: '22px', display: 'block', marginBottom: '8px' }}>✅ 买卖信号分析</Text>
          <Text style={{ fontSize: '22px', display: 'block', marginBottom: '8px' }}>✅ 90天历史走势图</Text>
        </View>
      </View>

      {/* Pro Plan */}
      <View style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
        <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block' }}>Pro 版</Text>
        <Text style={{ fontSize: '48px', fontWeight: 'bold', color: '#6c5ce7', display: 'block', marginTop: '16px' }}>¥8.25/月</Text>
        <Text style={{ fontSize: '22px', color: '#666', display: 'block' }}>按年付 ¥99/年 · 每天只要2毛7</Text>
        <View style={{ marginTop: '16px' }}>
          <Text style={{ fontSize: '22px', display: 'block', marginBottom: '8px' }}>✅ 全部基础版功能</Text>
          <Text style={{ fontSize: '22px', display: 'block', marginBottom: '8px' }}>✅ AI 智能分析助手</Text>
          <Text style={{ fontSize: '22px', display: 'block', marginBottom: '8px' }}>✅ 价格预警通知</Text>
          <Text style={{ fontSize: '22px', display: 'block', marginBottom: '8px' }}>✅ 多股票分析</Text>
        </View>
      </View>

      <View onClick={() => navigateToView('dashboard')} style={{ textAlign: 'center', padding: '16px', marginBottom: '120px' }}>
        <Text style={{ fontSize: '24px', color: '#00d4aa' }}>← 返回仪表板</Text>
      </View>

      <CustomTabBar />
    </View>
  )
}
