# Changelog

All notable changes to this project will be documented in this file.

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
