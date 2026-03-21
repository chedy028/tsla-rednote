# TSLA 估值助手 — Design System

## Brand Identity

**Product:** TSLA Valuation Tracker for Chinese investors
**Platform:** TikTok Minis, Douyin Mini Program, H5 Web
**Target:** 小红书/抖音 users interested in US stock investing
**Tone:** Professional yet accessible, data-driven, trustworthy

## Colors

### Primary Palette
| Token | Hex | Usage |
|-------|-----|-------|
| `brand-primary` | `#009d80` | Hero backgrounds, primary gradients |
| `brand-primary-text` | `#008a70` | Teal text on white (WCAG AA compliant) |
| `brand-primary-button` | `#007a62` | Button text on white (high contrast) |
| `brand-secondary` | `#6c5ce7` | Pro tier solid accent color |
| `brand-bg` | `#f8f9fa` | Dashboard/content background |

### Semantic Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#2e7d32` | Positive price change, undervalued |
| `danger` | `#c62828` | Negative price change, overvalued |
| `warning` | `#f57f17` | Fair value, caution/alerts |
| `text-primary` | `#1a1a1a` | Headings, key numbers |
| `text-secondary` | `#666666` | Body text, labels |
| `text-muted` | `#999999` | Timestamps, disclaimers |
| `surface` | `#ffffff` | Cards, content areas |
| `surface-alt` | `#f0f0f0` | Locked/disabled areas, backgrounds |

### Gradients
| Name | Value | Usage |
|------|-------|-------|
| Hero | `linear-gradient(180deg, #009d80 0%, #008a70 100%)` | Landing page background |
| CTA | `linear-gradient(135deg, #009d80, #008a70)` | Primary action banners |
| Pro | `linear-gradient(135deg, #667eea 0%, #764ba2 100%)` | Pro tier badges, buttons |
| Pro solid | `#6c5ce7` | Pro text, borders, small accents |

### Contrast Guidelines
- White text on teal: Use `#009d80` or darker (4.5:1 ratio minimum)
- Teal text on white: Use `#008a70` or darker (4.5:1 ratio minimum)
- Never use `#00d4aa` as a text color or text background — it fails WCAG AA

## Typography

All sizes in Taro px (2x CSS px on standard devices).

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Page title | 40-48px | Bold | text-primary |
| Price display | 56-64px | Bold | text-primary |
| Section heading | 28-36px | Bold | text-primary |
| P/S ratio | 56-64px | Bold | text-primary |
| Body text | 22-28px | Regular | text-secondary |
| Small/muted | 20-22px | Regular | text-muted |
| Button text | 28-36px | Bold | white / brand |
| Tab bar text | 20px | Regular / 600 | text-muted / brand-primary-text |

## Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 8px | Icon-to-text gap |
| `sm` | 12px | Grid gap, tight padding |
| `md` | 16px | Card padding, section margins |
| `lg` | 24px | Card padding, between sections |
| `xl` | 32px | Page padding, hero spacing |
| `xxl` | 48-80px | Hero margins, section breaks |

## Components

### Cards
- Background: white
- Border radius: 16px (standard), 20-24px (featured/hero cards)
- Padding: 24px (compact), 36-40px (featured)
- Shadow: `0 2px 8px rgba(0,0,0,0.06)` (standard), `0 4px 20px rgba(0,0,0,0.08)` (elevated)

### Buttons
- Primary: brand gradient bg, white text, 12px radius
- Secondary: white bg, brand-primary-text color, border
- Pro: Pro gradient bg, white text
- Press: `transform: scale(0.98)`
- Focus: `outline: 3px solid #009d80; outline-offset: 2px`

### Tab Bar
- Fixed bottom, white background
- 3 tabs: 首页, 仪表板, 订阅
- Active: brand-primary-text color (#008a70)
- Emoji icons (cross-platform compatible)
- Height: 100px + safe-area-inset-bottom

### Locked/Premium Badge
- Background: surface-alt (#f0f0f0)
- Border radius: 12px
- 🔒 icon prefix
- Text color: text-muted

### Skeleton Loading
- Card shape matches target content (price card, gauge circle, stats grid)
- Fill: `#e8e8e8` (primary), `#f0f0f0` (secondary)
- Animation: shimmer pulse (1.5s infinite)

### Error States
- Icon: ⚠️ (64px)
- Title: bold, text-primary
- Description: text-secondary
- Action: retry button with brand gradient

## Interaction States

| State | Pattern | Where |
|-------|---------|-------|
| Loading | Skeleton cards | DashboardInline, Dashboard |
| Loading (AI) | Pulse animation + dot bounce | AI Assistant |
| Error | Icon + message + retry button | All pages |
| Empty (chat) | Welcome message | AI Assistant |
| Empty (alerts) | Centered muted text | Price Alerts |
| Disabled | `opacity: 0.5; pointer-events: none` | Buttons, chips |
| Press | `scale(0.98)` | Buttons |
| Focus | `outline: 3px solid #009d80` | All interactive elements |

## Layout

- Max content width: none (full mobile width)
- Page padding: 24-32px horizontal
- Bottom safe area: 120px (tab bar clearance)
- Cards stack vertically with 16-32px gap

## Naming Conventions

- AI Assistant: BEM (`.ai-assistant__header-title`, `.ai-assistant__chip--disabled`)
- Dashboard: Flat nested SCSS (`.dashboard .price-card .price`)
- Index SPA: Inline styles (Taro H5 constraint)

## Accessibility

- All clickable `<View>` elements must have `role="button" tabIndex={0}`
- Focus visible: 3px solid #009d80 outline
- Color contrast: minimum 4.5:1 for text (WCAG AA)
- Reduced motion: animations disabled via `prefers-reduced-motion: reduce`
- No reliance on color alone for status — always include emoji/text labels

## Motion

- Button press: `scale(0.98)` on `:active`
- View transitions: instant (no animation — Taro H5 constraint)
- Loading: skeleton shimmer (1.5s), dot bounce (1.4s), pulse glow (1.5s)
- All animations respect `prefers-reduced-motion`

## Platform Notes

- H5: Single-page app, all views in index.tsx (Taro H5 router bug workaround)
- Mini program: Standard Taro tab navigation with separate page files
- Font: System font stack (supports CJK natively on all target devices)
- AI Assistant: Separate page (`/pages/ai-assistant/index`), not in tab bar
