# TSLA Red Note — Project Guide

## Build Commands
- `npm run build:h5` — build H5 (web) version
- `npm run build:tt` — build TikTok Mini Program
- `npm run dev:h5` — dev server for H5
- `npm test` — run Vitest test suite

## Architecture
- **Framework:** Taro 4 + React 18
- **Router:** Hash-based SPA (`#/pages/index/index`)
- **Pages:** index, dashboard, pricing, ai-assistant, terms, privacy
- **Backend:** Supabase (auth, DB) + Edge Functions (AI, payments)
- **Payments:** Stripe Checkout ($5/mo)

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

## Testing
- Framework: Vitest
- Run: `npm test`
- Test files: `test/*.test.ts`

## H5 Build Notes
- `publicPath: '/tsla-rednote/'` for GitHub Pages deployment
- Webpack splitChunks configured with `vendors-react` shared chunk
- Geist font loaded via Google Fonts CDN in `index.html`
