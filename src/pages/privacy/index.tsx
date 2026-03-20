import { View, Text } from '@tarojs/components'

export default function Privacy() {
  return (
    <View style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <Text style={{ fontSize: '36px', fontWeight: 'bold', display: 'block', marginBottom: '24px' }}>Privacy Policy</Text>
      <Text style={{ fontSize: '20px', color: '#666', display: 'block', marginBottom: '24px' }}>Last updated: March 20, 2026</Text>

      <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block', marginTop: '24px', marginBottom: '12px' }}>1. Information We Collect</Text>
      <Text style={{ fontSize: '22px', color: '#333', display: 'block', lineHeight: 1.8, marginBottom: '16px' }}>
        TSLA Valuation Tracker ("the App") collects minimal data to provide our services. We may collect: language preference (stored locally on your device), subscription status (if you subscribe to a paid plan), and basic usage analytics to improve the App.
      </Text>

      <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block', marginTop: '24px', marginBottom: '12px' }}>2. How We Use Your Information</Text>
      <Text style={{ fontSize: '22px', color: '#333', display: 'block', lineHeight: 1.8, marginBottom: '16px' }}>
        We use the information we collect to: provide and maintain the App, process subscription payments, improve and personalize your experience, and communicate with you about updates or changes.
      </Text>

      <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block', marginTop: '24px', marginBottom: '12px' }}>3. Data Storage</Text>
      <Text style={{ fontSize: '22px', color: '#333', display: 'block', lineHeight: 1.8, marginBottom: '16px' }}>
        Your language preference is stored locally on your device using localStorage. Subscription data is securely stored on our servers using Supabase, which employs industry-standard encryption and security practices.
      </Text>

      <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block', marginTop: '24px', marginBottom: '12px' }}>4. Third-Party Services</Text>
      <Text style={{ fontSize: '22px', color: '#333', display: 'block', lineHeight: 1.8, marginBottom: '16px' }}>
        The App may use third-party services for: stock data (Yahoo Finance API), payment processing (Stripe), hosting and database (Supabase, GitHub Pages), and analytics. These third parties have their own privacy policies governing their use of your information.
      </Text>

      <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block', marginTop: '24px', marginBottom: '12px' }}>5. Cookies and Local Storage</Text>
      <Text style={{ fontSize: '22px', color: '#333', display: 'block', lineHeight: 1.8, marginBottom: '16px' }}>
        The App uses localStorage to save your language preference and app settings. We do not use tracking cookies. No personal information is stored in cookies or local storage.
      </Text>

      <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block', marginTop: '24px', marginBottom: '12px' }}>6. Data Sharing</Text>
      <Text style={{ fontSize: '22px', color: '#333', display: 'block', lineHeight: 1.8, marginBottom: '16px' }}>
        We do not sell, trade, or otherwise transfer your personal information to outside parties. We may share information only when required by law or to protect our rights.
      </Text>

      <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block', marginTop: '24px', marginBottom: '12px' }}>7. Children's Privacy</Text>
      <Text style={{ fontSize: '22px', color: '#333', display: 'block', lineHeight: 1.8, marginBottom: '16px' }}>
        The App is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
      </Text>

      <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block', marginTop: '24px', marginBottom: '12px' }}>8. Your Rights</Text>
      <Text style={{ fontSize: '22px', color: '#333', display: 'block', lineHeight: 1.8, marginBottom: '16px' }}>
        You have the right to: access the personal information we hold about you, request correction of inaccurate data, request deletion of your data, opt out of any marketing communications, and export your data in a portable format.
      </Text>

      <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block', marginTop: '24px', marginBottom: '12px' }}>9. Changes to This Policy</Text>
      <Text style={{ fontSize: '22px', color: '#333', display: 'block', lineHeight: 1.8, marginBottom: '16px' }}>
        We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
      </Text>

      <Text style={{ fontSize: '28px', fontWeight: 'bold', display: 'block', marginTop: '24px', marginBottom: '12px' }}>10. Contact Us</Text>
      <Text style={{ fontSize: '22px', color: '#333', display: 'block', lineHeight: 1.8, marginBottom: '16px' }}>
        If you have any questions about this Privacy Policy, please contact us at chedy028@gmail.com.
      </Text>
    </View>
  )
}
