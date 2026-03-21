# TSLA 估值助手 — Design System

## Product Context

- **What this is:** Tesla stock valuation tracker with AI-powered P/S ratio analysis
- **Who it's for:** Chinese investors on 小红书/抖音 interested in US stock investing
- **Space/industry:** Retail fintech, stock analysis tools
- **Project type:** Mobile-first web app (TikTok Minis, Douyin Mini Program, H5 Web)
- **Tone:** Professional yet accessible, data-driven, trustworthy

## Aesthetic Direction

- **Direction:** Industrial/Utilitarian — data-first, clean surfaces, information density done right
- **Decoration level:** Intentional — subtle depth through shadows and surface hierarchy
- **Mood:** Bloomberg Terminal meets Xiaomi MIUI — functional beauty. The gauge visualization is the one bold visual element; everything else stays quiet and serves the data.
- **Reference:** [TSLA Tracker SaaS](https://tsla-tracker.vercel.app) (sibling product, dark/gaming aesthetic — dark mode draws from this)

## Typography

- **Display/Hero:** Geist (by Vercel) — modern geometric sans, tech-native, clean at large sizes
- **Body:** Geist 400/500 — one family for consistency, excellent legibility
- **UI/Labels:** Geist 500/600 — slightly heavier for buttons and navigation
- **Data/Tables:** Geist with `font-variant-numeric: tabular-nums` — numbers align in columns
- **Code/Ratios:** Geist Mono — for P/S ratios, price changes, and technical data display
- **CJK fallback:** `'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif`
- **Loading:** Google Fonts CDN for H5: `https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap`
- **Mini program:** System font stack (Geist not available — falls through to CJK system fonts)

### Type Scale

All sizes in Taro px (2x CSS px on standard devices).

| Element | Size | Weight | Font | Color |
|---------|------|--------|------|-------|
| Page title | 40-48px | 700 | Geist | text-primary |
| Price display | 56-64px | 700 | Geist | text-primary |
| Section heading | 28-36px | 700 | Geist | text-primary |
| P/S ratio | 56-64px | 500 | Geist Mono | text-primary |
| Body text | 22-28px | 400 | Geist | text-secondary |
| Small/muted | 20-22px | 400 | Geist | text-muted |
| Button text | 28-36px | 600 | Geist | white / brand |
| Tab bar text | 20px | 400 / 600 | Geist | text-muted / brand-primary-text |
| Data labels | 20-24px | 500 | Geist Mono | text-muted |

## Color

### Approach: Restrained — teal accent + neutrals, color is rare and meaningful

### Light Mode

| Token | Hex | Usage |
|-------|-----|-------|
| `brand-primary` | `#009d80` | Hero backgrounds, primary gradients |
| `brand-primary-text` | `#008a70` | Teal text on white (WCAG AA compliant) |
| `brand-primary-button` | `#007a62` | Button text on white (high contrast) |
| `brand-accent` | `#00d4aa` | Decorative only — never for text (fails WCAG AA) |
| `brand-secondary` | `#6c5ce7` | Pro tier solid accent color |
| `bg` | `#f8f9fa` | Page background |
| `surface` | `#ffffff` | Cards, content areas |
| `surface-elevated` | `#ffffff` | Elevated cards (differentiated by shadow) |
| `surface-alt` | `#f0f0f0` | Locked/disabled areas, backgrounds |
| `text-primary` | `#1a1a1a` | Headings, key numbers |
| `text-secondary` | `#666666` | Body text, labels |
| `text-muted` | `#999999` | Timestamps, disclaimers |
| `border` | `#e5e5e5` | Card borders, dividers |

### Dark Mode

| Token | Hex | Usage |
|-------|-----|-------|
| `brand-primary` | `#00d4aa` | Accent color — neon teal pops on dark |
| `brand-primary-text` | `#00d4aa` | Teal text on dark surfaces |
| `brand-primary-button` | `#00d4aa` | Button backgrounds (dark text on teal) |
| `brand-secondary` | `#8b7cf7` | Pro tier (lightened for dark bg) |
| `bg` | `#0a0a0b` | Page background |
| `surface` | `#141416` | Cards, content areas |
| `surface-elevated` | `#1c1c1f` | Elevated cards, modals |
| `surface-alt` | `#232326` | Locked/disabled areas |
| `text-primary` | `#e4e4e7` | Headings, key numbers |
| `text-secondary` | `#a1a1aa` | Body text, labels |
| `text-muted` | `#71717a` | Timestamps, disclaimers |
| `border` | `#2a2a2d` | Card borders, dividers |

### Semantic Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `success` | `#2e7d32` | `#4caf50` | Positive price change, undervalued |
| `danger` | `#c62828` | `#ef5350` | Negative price change, overvalued |
| `warning` | `#f57f17` | `#ffb74d` | Fair value, caution/alerts |
| `info` | `#1565c0` | `#42a5f5` | Informational messages |

### Gradients

| Name | Light | Dark | Usage |
|------|-------|------|-------|
| Hero | `linear-gradient(180deg, #009d80, #008a70)` | `linear-gradient(180deg, #0d2924, #0a1f1b)` | Landing/signal card background |
| CTA | `linear-gradient(135deg, #009d80, #008a70)` | solid `#00d4aa` with dark text | Primary action banners |
| Pro | `linear-gradient(135deg, #667eea, #764ba2)` | `linear-gradient(135deg, #7b6cf0, #9b6dd7)` | Pro tier badges, buttons |

### Contrast Guidelines

- White text on teal: Use `#009d80` or darker (4.5:1 ratio minimum)
- Teal text on white: Use `#008a70` or darker (4.5:1 ratio minimum)
- Dark mode: `#00d4aa` on `#0a0a0b` = 9.2:1 ratio (excellent)
- Dark mode: `#00d4aa` on `#141416` = 8.1:1 ratio (excellent)
- Never use `#00d4aa` as text on light backgrounds — it fails WCAG AA on white

### Dark Mode Strategy

- Toggle via user preference, persisted in local storage
- CSS custom properties switch all tokens
- Transition: 300ms ease on `background-color` and `color`
- Semantic colors desaturated ~10% and lightened for dark surfaces
- Shadows use higher opacity (`rgba(0,0,0,0.3)` vs `0.06`)
- Hero card gradient shifts from solid teal to dark-teal with subtle border

## Spacing

- **Base unit:** 4px
- **Density:** Comfortable

| Token | Value | Usage |
|-------|-------|-------|
| `2xs` | 2px | Hairline gaps |
| `xs` | 4px | Tight internal padding |
| `sm` | 8px | Icon-to-text gap, grid gap |
| `md` | 16px | Card padding, section margins |
| `lg` | 24px | Card padding, between sections |
| `xl` | 32px | Page padding, hero spacing |
| `2xl` | 48px | Hero margins, section breaks |
| `3xl` | 64px | Major section breaks |

## Layout

- **Approach:** Grid-disciplined — strict vertical card stack on mobile
- **Grid:** Single column on mobile (100% width)
- **Max content width:** None (full mobile width)
- **Page padding:** 24-32px horizontal
- **Bottom safe area:** 120px (tab bar clearance)
- **Cards:** Stack vertically with 16-32px gap
- **Border radius:** sm: 8px, md: 12px, lg: 16px, xl: 20-24px, full: 9999px

## Motion

- **Approach:** Intentional — subtle animations that make the app feel alive and real-time

### Timing

| Category | Duration | Easing | Usage |
|----------|----------|--------|-------|
| Micro | 50-100ms | ease-out | Number counter ticks (price changes) |
| Short | 150-250ms | ease-out | Card entrance (fade-up), button press |
| Medium | 250-400ms | ease-in-out | Dark/light mode transition, pull-to-refresh |
| Long | 400-700ms | ease-in-out | Gauge fill on load, skeleton shimmer cycle |

### Animations

- **Button press:** `scale(0.98)` on `:active` (50ms)
- **Card entrance:** `opacity: 0 → 1, translateY(8px → 0)` (200ms ease-out)
- **Number counter:** Price values tick up/down digit-by-digit (100ms per tick)
- **Gauge fill:** Arc fills from 0 to target value on page load (600ms ease-out)
- **Skeleton shimmer:** `background-position` slide (1.5s infinite)
- **Dot bounce:** AI thinking indicator (1.4s infinite)
- **Dark mode:** All tokens transition via CSS custom properties (300ms ease)
- **Pull-to-refresh:** Spring animation on overscroll (350ms ease-out)
- **All animations** respect `prefers-reduced-motion: reduce` — reduce to instant or disable

## Components

### Cards
- Background: `surface`
- Border radius: 16px (standard), 20-24px (featured/hero cards)
- Padding: 24px (compact), 36-40px (featured)
- Shadow (light): `0 2px 8px rgba(0,0,0,0.06)` standard, `0 4px 20px rgba(0,0,0,0.08)` elevated
- Shadow (dark): `0 2px 8px rgba(0,0,0,0.3)` standard, `0 4px 20px rgba(0,0,0,0.5)` elevated
- Dark mode: add `border: 1px solid var(--border)` for subtle definition

### Buttons
- Primary: brand bg, white text (light) / dark text (dark), 12px radius
- Secondary: transparent bg, brand-text color, 1.5px border
- Ghost: transparent bg, text-secondary color
- Danger: danger bg, white text
- Pro: Pro gradient bg, white text
- Press: `transform: scale(0.98)` (50ms)
- Focus: `outline: 3px solid var(--brand); outline-offset: 2px`

### Tab Bar
- Fixed bottom, `surface` background
- 3 tabs: 首页 (🏠), 仪表板 (📊), 订阅 (💎)
- Active: brand-primary-text color
- Emoji icons (cross-platform compatible)
- Height: 100px + safe-area-inset-bottom
- Dark mode: `surface` bg with `border-top: 1px solid var(--border)`

### Alerts
- Background: semantic color at 12% opacity
- Text: semantic color at full strength
- Border radius: 10px
- Padding: 12px 16px
- Emoji prefix for accessibility (not color-only)

### Locked/Premium Badge
- Background: surface-alt
- Border radius: 12px
- 🔒 icon prefix
- Text color: text-muted

### Skeleton Loading
- Card shape matches target content
- Fill (light): `#e8e8e8` primary, `#f0f0f0` secondary
- Fill (dark): `#232326` primary, `#2a2a2d` secondary
- Animation: shimmer pulse (1.5s infinite)

### Error States
- Icon: ⚠️ (64px)
- Title: bold, text-primary
- Description: text-secondary
- Action: retry button with brand style

## Interaction States

| State | Pattern | Where |
|-------|---------|-------|
| Loading | Skeleton cards | Dashboard, DashboardInline |
| Loading (AI) | Pulse animation + dot bounce | AI Assistant |
| Error | Icon + message + retry button | All pages |
| Empty (chat) | Welcome message | AI Assistant |
| Empty (alerts) | Centered muted text | Price Alerts |
| Disabled | `opacity: 0.5; pointer-events: none` | Buttons, chips |
| Press | `scale(0.98)` (50ms) | Buttons |
| Focus | `outline: 3px solid var(--brand)` | All interactive elements |
| Hover | `opacity: 0.9` | Buttons, links (desktop only) |

## Accessibility

- All clickable `<View>` elements must have `role="button" tabIndex={0}`
- Focus visible: `3px solid var(--brand)` outline
- Color contrast: minimum 4.5:1 for text (WCAG AA)
- Reduced motion: all animations disabled via `prefers-reduced-motion: reduce`
- No reliance on color alone for status — always include emoji/text labels
- Dark mode maintains all contrast ratios (teal on dark surfaces exceeds 8:1)

## Naming Conventions

- AI Assistant: BEM (`.ai-assistant__header-title`, `.ai-assistant__chip--disabled`)
- Dashboard: Flat nested SCSS (`.dashboard .price-card .price`)
- Index SPA: Inline styles (Taro H5 constraint)
- CSS custom properties: `--brand`, `--surface`, `--text-primary` (match token names)

## Platform Notes

- H5: Hash-routed SPA with separate page files, Geist loaded via Google Fonts CDN
- Mini program: Standard Taro tab navigation, system font stack (no custom fonts)
- Dark mode: CSS custom properties with `[data-theme="dark"]` selector
- AI Assistant: Separate page (`/pages/ai-assistant/index`), not in tab bar

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-19 | Initial design system | Created during Ship-Ready Sprint |
| 2026-03-21 | Added Geist typography | Modern tech-native font, coheres with TSLA Tracker brand |
| 2026-03-21 | Added dark mode palette | Inspired by TSLA Tracker SaaS, Chinese users favor dark mode |
| 2026-03-21 | Upgraded motion specs | Intentional animations (number counters, gauge fill, card entrance) make app feel alive |
| 2026-03-21 | Named aesthetic direction | Industrial/Utilitarian — data-first, functional beauty |
