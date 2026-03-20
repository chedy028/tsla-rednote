import { View, Text } from '@tarojs/components'

export default function Terms() {
  return (
    <View style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <Text style={{ fontSize: '36px', fontWeight: 'bold', display: 'block', marginBottom: '24px' }}>Terms of Service</Text>
      <Text style={{ fontSize: '20px', color: '#666', display: 'block', marginBottom: '24px' }}>Last updated: March 20, 2026</Text>

      <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block', marginTop: '24px', marginBottom: '12px' }}>1. Acceptance of Terms</Text>
      <Text style={{ fontSize: '22px', color: '#333', display: 'block', lineHeight: 1.8, marginBottom: '16px' }}>
        By accessing and using TSLA Valuation Tracker ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.
      </Text>

      <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block', marginTop: '24px', marginBottom: '12px' }}>2. Description of Service</Text>
      <Text style={{ fontSize: '22px', color: '#333', display: 'block', lineHeight: 1.8, marginBottom: '16px' }}>
        TSLA Valuation Tracker is an educational tool that provides Tesla (TSLA) stock valuation data using the Price-to-Sales (P/S) ratio. The App is designed for informational and educational purposes only.
      </Text>

      <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block', marginTop: '24px', marginBottom: '12px' }}>3. Not Investment Advice</Text>
      <Text style={{ fontSize: '22px', color: '#333', display: 'block', lineHeight: 1.8, marginBottom: '16px' }}>
        The information provided by the App does not constitute investment advice, financial advice, trading advice, or any other sort of advice. You should not treat any of the App's content as such. The App does not recommend that any securities should be bought, sold, or held by you. Nothing in the App should be construed as an offer to buy or sell securities.
      </Text>

      <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block', marginTop: '24px', marginBottom: '12px' }}>4. Subscription Services</Text>
      <Text style={{ fontSize: '22px', color: '#333', display: 'block', lineHeight: 1.8, marginBottom: '16px' }}>
        The App offers optional paid subscription plans. Subscriptions are billed on a recurring basis (monthly or annually). You may cancel your subscription at any time. Refunds are handled in accordance with the applicable app store or payment provider policies.
      </Text>

      <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block', marginTop: '24px', marginBottom: '12px' }}>5. Data Accuracy</Text>
      <Text style={{ fontSize: '22px', color: '#333', display: 'block', lineHeight: 1.8, marginBottom: '16px' }}>
        While we strive to provide accurate and up-to-date information, we make no warranties or representations regarding the accuracy, completeness, or timeliness of the data displayed. Stock data may be delayed by up to 15 minutes. Users should verify all information independently before making any decisions.
      </Text>

      <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block', marginTop: '24px', marginBottom: '12px' }}>6. Limitation of Liability</Text>
      <Text style={{ fontSize: '22px', color: '#333', display: 'block', lineHeight: 1.8, marginBottom: '16px' }}>
        In no event shall TSLA Valuation Tracker, its operators, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, or other intangible losses, resulting from your use of the App.
      </Text>

      <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block', marginTop: '24px', marginBottom: '12px' }}>7. User Conduct</Text>
      <Text style={{ fontSize: '22px', color: '#333', display: 'block', lineHeight: 1.8, marginBottom: '16px' }}>
        You agree not to misuse the App, including but not limited to: reverse engineering, scraping data, distributing content without permission, or using the App for any unlawful purpose.
      </Text>

      <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block', marginTop: '24px', marginBottom: '12px' }}>8. Changes to Terms</Text>
      <Text style={{ fontSize: '22px', color: '#333', display: 'block', lineHeight: 1.8, marginBottom: '16px' }}>
        We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of the App after changes constitutes acceptance of the new terms.
      </Text>

      <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block', marginTop: '24px', marginBottom: '12px' }}>9. Contact</Text>
      <Text style={{ fontSize: '22px', color: '#333', display: 'block', lineHeight: 1.8, marginBottom: '16px' }}>
        For questions about these Terms of Service, please contact us at chedy028@gmail.com.
      </Text>
    </View>
  )
}
