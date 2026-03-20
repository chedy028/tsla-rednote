# Comprehensive Review: tsla-rednote
**Date:** 2026-03-19
**Reviewer:** Claude Opus 4.6 via gstack
**Branch:** review/comprehensive-2026-03-19

---

## Executive Summary

tsla-rednote is a Taro 4.x React mini-program for Chinese TSLA investors on Red Note (小红书). The frontend is well-built — clean mobile UI, working SPA navigation, live Yahoo Finance data integration. However, the backend Edge Functions have **3 critical production-breaking bugs**, the product makes **claims about features that don't exist**, and there are **zero tests**.

**Overall Health Score: 78/100** (frontend) | **Backend: NOT PRODUCTION-READY**

---

## Findings by Severity

### CRITICAL (Must fix before any launch)

| # | Finding | Source | Location |
|---|---------|--------|----------|
| C1 | **AI analysis API contract mismatch** — Client sends flat fields, Edge Function expects `{ openid, stockData: {...} }`. Pro AI deep analysis is completely broken, silently degrades to free-tier templates. | Eng Review | `ai.ts:457-470` vs `ai-analyze/index.ts:5-9` |
| C2 | **Payment verification uses wrong WeChat API endpoint** — Queries by `prepay_id` but API expects `transaction_id`. Users get charged but subscription never activates. | Eng Review | `verify-payment/index.ts:189` |
| C3 | **JWT tokens never verified** — Edge Functions trust `openid` from request body without checking JWT signature. Any user can access/modify any other user's data. | Eng Review | `create-payment/index.ts:140-151` |
| C4 | **Pro tier sells non-existent features** — Pricing page promises NIO, BYD, Li Auto tracking and multi-stock comparison that don't exist in code. | CEO Review | `pricing/index.tsx:178-197` |

### HIGH (Should fix before launch)

| # | Finding | Source | Location |
|---|---------|--------|----------|
| H1 | **Hardcoded TTM revenue** ($100B) makes P/S ratio (core product metric) go stale quarterly | Code Review | `stockApi.ts:58` |
| H2 | **Demo data cached as real** — When API fails, hardcoded $287.45 shown for 15 min with no indicator | Code Review | `stockApi.ts:183-184` |
| H3 | **Fabricated social proof** — "10,000+ users", "4.9★ rating", fake testimonials | CEO Review | `index.tsx:273-285` |
| H4 | **Zero test coverage** across entire project | Eng Review | project-wide |
| H5 | **Investment advice without proper framing** — Explicit buy/sell/hold signals with action recommendations | CEO Review | `dashboard/index.tsx:22-82` |

### MEDIUM (Should fix)

| # | Finding | Source | Location |
|---|---------|--------|----------|
| M1 | **Inconsistent pricing copy** — "每天只要1毛6" (monthly rate) next to annual pricing | Code Review | `index.tsx:264` |
| M2 | **Third-party CORS proxies handle financial data** — `corsproxy.io` could serve fake prices | Code Review | `stockApi.ts:132-135` |
| M3 | **Price alert feature is placeholder** — UI exists but clicking does nothing | CEO Review | `dashboard/index.tsx:437-441` |
| M4 | **Console 404 errors on page load** | QA | browser console |
| M5 | **Free tier gives away 90% of value** — little incentive to upgrade | CEO Review | product-wide |

### LOW (Nice to fix)

| # | Finding | Source | Location |
|---|---------|--------|----------|
| L1 | Emoji logo renders as text box on some systems | QA | `index.tsx:220` |
| L2 | Dead code files (DashboardView.tsx, PricingView.tsx) | Code Review | `src/components/` |

---

## Auto-Fixed Issues (committed)

| Fix | Commit |
|-----|--------|
| AI assistant used `Taro.switchTab` causing H5 blank page — replaced with `navigateToView` | `e3e2657` |
| Dashboard used dynamic `require()` — replaced with static import | `e3e2657` |
| Unused variable `valuation` in DashboardInline | `e3e2657` |
| Unused imports (Taro, useCallback, Button) | `e3e2657` |
| Unused function parameter (changePercent) | `e3e2657` |
| O(n²) maxPS computation in history chart render loop | `e3e2657` |

---

## Recommended Priority Order

1. **Fix C3 (JWT verification)** — Security vulnerability, blocks all other backend work
2. **Fix C2 (payment endpoint)** — Users literally get charged with no subscription
3. **Fix C1 (AI API contract)** — Pro feature users paid for doesn't work
4. **Fix C4 (remove phantom features)** — Honest scope Pro tier to what works
5. **Fix H1+H2 (data integrity)** — Core product metric must be accurate
6. **Fix H3 (remove fake social proof)** — Trust is everything for a financial product
7. **Add tests (H4)** — At minimum: valuation.ts, stockApi.ts, navigation.ts
8. **Fix H5 (reframe as valuation status, not investment advice)** — Regulatory risk
