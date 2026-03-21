# Changelog

All notable changes to this project will be documented in this file.

## [1.1.1.0] - 2026-03-21

### Added
- Supabase Auth magic link service for H5 users
- Shared JWT auth utility for Edge Functions
- Digest system: daily AI-generated valuation reports with email delivery
- User preferences database schema for digest and notification settings
- Shared AI module for reusable Gemini API integration
- CLAUDE.md project guide for AI-assisted development sessions
- Geist font typography system with CJK fallback chain
- Full dark mode color palette in DESIGN.md
- Motion specs: number counters, gauge fill, card entrance animations

### Changed
- Signal-first UX: valuation zone badge as hero, AI explanation gated behind tap
- Simplified to single-tier pricing with digest onboarding flow
- Design system: Industrial/Utilitarian aesthetic direction, Geist typography
- Webpack config: vendors-react shared chunk for reliable page chunk loading

### Fixed
- Dashboard crash: jsxs runtime not available in Taro page chunks (critical)
- JWT auth added to 4 previously unprotected Edge Functions
- Revenue fallback status properly propagated to isFallback flag
- Buy/sell language reframed as educational valuation analysis
- Pricing page feature lists and FAQ corrected
- Dashboard consolidated: removed redundant P/S ratio displays

### Removed
- Unused ai-analyze Edge Function
- Dead code: DashboardView.tsx, PricingView.tsx

## [1.1.0.0] - 2026-03-21

### Added
- Pro subscription with Stripe Checkout integration (Basic ¥4.99/mo, Pro ¥9.99/mo)
- AI analysis assistant with Gemini-powered Q&A and deep analysis reports
- Price alert management (create, list, delete alerts)
- Multi-language support: Chinese, English, Spanish, Japanese, Korean
- SPA navigation system for Taro H5 (workaround for router bug)
- Terms of Service and Privacy Policy pages
- TikTok Minis SDK integration for sharing
- Restore purchase by email flow
- Skeleton loading states for dashboard
- Pull-to-refresh support (planned)
- Vitest test framework with 18 valuation tests

### Changed
- Landing page features: vertical stack layout (mobile-optimized, was 3-column grid)
- Color contrast: all teal colors darkened to meet WCAG AA (4.5:1 ratio)
- Pro accent color standardized (`#6c5ce7` solid, `#667eea→#764ba2` gradient)
- Tab bar active color updated for accessibility (#008a70)
- Error states: icon + message + retry button (was plain text)
- Loading states: skeleton cards in DashboardInline (was plain text)
- DESIGN.md: comprehensive rewrite with contrast guidelines, interaction states, accessibility

### Fixed
- SPA navigation routing bugs in Taro H5 mode
- Dead code removal (unused imports, variables)
- O(n²) maxPS computation in history chart render loop
- TypeScript compilation errors across codebase

### Removed
- Dead code files flagged for removal (DashboardView.tsx, PricingView.tsx — pending)
