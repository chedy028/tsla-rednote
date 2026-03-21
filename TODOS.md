# TODOS

## P1 — High Priority

### Add basic observability
- **What:** Add error reporting for client-side failures + structured logging for Edge Functions
- **Why:** Zero observability currently. Payment failures, API errors, and auth issues are invisible in production.
- **Context:** Edge Functions (verify-payment, ai-analyze-h5) handle money and user data but have no logging beyond console. Client-side errors (stock API failures, Stripe popup blocked) are only logged to browser console.
- **Effort:** S (human: 2 days / CC: 20 min)
- **Depends on:** Ship-Ready Sprint (C2/C3 fixes)

## P2 — Medium Priority

### Handle Gemini content refusal gracefully
- **What:** Catch Gemini safety filter refusals and show user-friendly message instead of generic error
- **Why:** Generic error confuses users. Specific message ("此问题超出 AI 分析范围") sets expectations.
- **Context:** Gemini returns a specific `SAFETY` finish reason when content is blocked. Catch this in `ai.ts` and return a friendly message.
- **Effort:** S (CC: 10 min)

### Dark mode toggle
- **What:** Add user-togglable dark mode to the app
- **Why:** Chinese social media users heavily favor dark mode. The SaaS web version (TSLA_tracker) already has a full dark theme with all tokens defined.
- **Effort:** M (CC: 30 min)

## P3 — Low Priority

### Consolidate dashboard info display
- **What:** P/S ratio and valuation tier appear 3 times on dashboard (gauge, stats grid, signal card). Reduce to gauge + stats grid.
- **Why:** Information repetition makes the dashboard feel padded rather than information-dense.
- **Context:** Do this after the dashboard consolidation in Ship-Ready Sprint.
- **Effort:** S (CC: 15 min)
- **Depends on:** Dashboard consolidation

### Animated gauge fill on load
- **What:** Add fill animation to the gauge circle when data loads
- **Why:** Pure delight — makes the app feel more polished
- **Effort:** S (CC: 10 min)

### Onboarding tooltip for P/S ratio
- **What:** First-visit tooltip explaining what P/S ratio means
- **Why:** Most users won't know what P/S ratio is. Brief education improves retention.
- **Effort:** S (CC: 15 min)

### Localized number formatting
- **What:** Format numbers for Chinese locale (市值 in 亿, not B)
- **Why:** Chinese investors think in 亿 (hundred million), not billions
- **Effort:** S (CC: 15 min)

### Haptic feedback on actions
- **What:** Add haptic feedback on share/subscribe button taps
- **Why:** Standard mobile UX polish. Taro supports this on mini programs.
- **Effort:** S (CC: 5 min)
