# TSLA Red Note Mini Program
# 特斯拉估值助手 - 小红书小程序

> A Tesla (TSLA) stock valuation tracker mini program for Chinese investors on Red Note platform.

## 📱 Features

### Free Features
- ✅ Real-time TSLA price display
- ✅ P/S ratio valuation analysis
- ✅ Color-coded valuation tiers
- ✅ Educational content about P/S ratio

### Premium Features (¥0.99/month)
- ⭐ Detailed valuation breakdown
- ⭐ 90-day historical price charts
- ⭐ Price alert notifications
- ⭐ AI-powered analysis assistant
- ⭐ Daily market digest
- ⭐ Remove blur/paywall

## 🎯 Valuation Tiers

| P/S Ratio | Status | Color | Description |
|-----------|--------|-------|-------------|
| > 20x | OVERPRICED 高估 | 🔴 Red | Market too optimistic |
| 13-20x | EXPENSIVE 偏贵 | 🟠 Orange | Above fair value |
| 8-12x | FAIR PRICED 合理 | 🟡 Yellow | Fair valuation |
| 5-7x | CHEAP 便宜 | 🟢 Green | Below fair value |
| < 5x | BARGAIN 超值 | 💚 Bright Green | Value opportunity |

## 🚀 Tech Stack

- **Framework:** Taro 4.x (Multi-platform mini program framework)
- **Language:** TypeScript + React
- **UI:** Custom components optimized for Chinese users
- **Backend:** Supabase (from existing TSLA tracker)
- **Payment:** WeChat Pay / Alipay
- **Platforms:** Red Note, WeChat, Alipay Mini Programs

## 📦 Installation

```bash
# Install dependencies
npm install

# Add dev dependencies
npm install -D @tarojs/cli typescript @babel/core

# Dev mode (WeChat for testing)
npm run dev:weapp

# Build for production
npm run build:weapp
```

## 🛠️ Development

### Project Structure

```
tsla-rednote/
├── src/
│   ├── pages/
│   │   ├── index/          # Landing page
│   │   ├── dashboard/      # Main TSLA tracker
│   │   └── pricing/        # Subscription page
│   ├── components/         # Reusable components (TODO)
│   ├── services/           # API calls (TODO)
│   ├── utils/              # Helper functions (TODO)
│   ├── app.ts              # App entry
│   ├── app.scss            # Global styles
│   └── app.config.ts       # App configuration
├── config/                 # Taro config
└── package.json
```

### Next Steps

1. **Complete Core Features**
   - [ ] Connect to real TSLA API (Yahoo Finance)
   - [ ] Implement WeChat Pay integration
   - [ ] Add price chart component
   - [ ] Build AI assistant with Tongyi Qianwen

2. **Red Note Specific**
   - [ ] Register Red Note developer account
      - [ ] Apply for mini program license
   - [ ] Design icon and screenshots
   - [ ] Submit for review

3. **Backend Integration**
   - [ ] Connect to Supabase
   - [ ] Set up user authentication (WeChat OpenID)
   - [ ] Create subscription management
   - [ ] Implement price alerts

4. **Content & Marketing**
   - [ ] Create 10 Red Note posts
   - [ ] Design visual assets
   - [ ] Plan launch campaign
   - [ ] Partner with KOLs (财经博主)

## 💰 Pricing Strategy

- **Price:** ¥0.99/month
- **Strategy:** High volume, low barrier
- **Target:** 100,000+ users for sustainability
- **Revenue Model:** ¥0.99 × 100,000 = ¥99,000/month (~$13,600 USD)

## 📱 Platforms

### Primary: Red Note (小红书)
- Target Chinese TSLA investors
- Content-driven approach
- Educational focus

### Secondary: WeChat Mini Program
- Broader reach
- Alternative platform
- Same codebase

## ⚖️ Compliance

**Disclaimer (免责声明):**
```
本工具仅供学习和参考使用，不构成任何投资建议。
投资有风险，决策需谨慎。
This tool is for educational purposes only and does not constitute investment advice.
```

- Frame as educational tool, not investment advice
- Clear disclaimers on every page
- No promises of guaranteed returns
- User makes their own decisions

## 🔧 Configuration

Create `.env` file:

```env
# Supabase (from existing project)
TARO_APP_SUPABASE_URL=https://aiqpmtroekgrzyjcqkbl.supabase.co
TARO_APP_SUPABASE_ANON_KEY=your-anon-key

# WeChat Pay
TARO_APP_WECHAT_PAY_MERCHANT_ID=your-merchant-id
TARO_APP_WECHAT_PAY_API_KEY=your-api-key

# Stock API
TARO_APP_STOCK_API_URL=https://query1.finance.yahoo.com/v8/finance/chart/TSLA
```

## 📊 Metrics to Track

- User signups
- Conversion rate (free → paid)
- Churn rate
- Average session duration
- Daily/Weekly/Monthly active users
- Red Note content engagement

## 🎨 Design Guidelines

- Use Simplified Chinese as primary language
- Follow Chinese UI/UX conventions
- Emphasize social proof and testimonials
- Price in CNY (¥)
- Use WeChat/Alipay payment icons

## 📝 TODO

- [ ] Add TypeScript interfaces
- [ ] Create reusable components
- [ ] Implement state management (Zustand/Redux)
- [ ] Add unit tests
- [ ] Set up CI/CD
- [ ] Performance optimization
- [ ] Error tracking (Sentry)
- [ ] Analytics (Umami/Google Analytics)

## 📄 License

MIT License - See LICENSE file for details

## 👨‍💻 Author

**chedy028**
- GitHub: [@chedy028](https://github.com/chedy028)
- Project: https://github.com/chedy028/TSLA_tracker

---

*Built with ❤️ for Chinese TSLA investors*
*用心打造，专为中国特斯拉投资者*
