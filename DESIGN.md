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
| `brand-primary` | `#00d4aa` | CTA buttons, active states, positive indicators |
| `brand-primary-dark` | `#00b894` | Gradients, hover states |
| `brand-secondary` | `#6c5ce7` | Pro tier accent, premium features |
| `brand-bg` | `#f8f9fa` | Dashboard/content background |

### Semantic Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#2e7d32` | Positive price change |
| `danger` | `#c62828` | Negative price change |
| `warning` | `#f57f17` | Caution/alerts |
| `text-primary` | `#333333` | Headings, key numbers |
| `text-secondary` | `#666666` | Body text, labels |
| `text-muted` | `#999999` | Timestamps, disclaimers |
| `surface` | `#ffffff` | Cards, content areas |
| `surface-alt` | `#f0f0f0` | Locked/disabled areas |

### Gradient
- Hero: `linear-gradient(180deg, #00d4aa 0%, #00a88a 100%)`
- CTA Banner: `linear-gradient(135deg, #00d4aa, #00b894)`

## Typography

All sizes in Taro px (2x CSS px on standard devices).

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Page title | 40px | Bold | text-primary |
| Price display | 56px | Bold | text-primary |
| Section heading | 28px | Bold | text-primary |
| P/S ratio | 56px | Bold | text-primary |
| Body text | 22-24px | Regular | text-secondary |
| Small/muted | 20px | Regular | text-muted |
| Button text | 28-36px | Bold | white / brand |
| Tab bar text | — | Regular | text-muted / brand |

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
- Border radius: 16px
- Padding: 24px
- Shadow: `0 2px 8px rgba(0,0,0,0.06)`

### Buttons
- Primary: brand-primary bg, white text, 12px radius
- Secondary: white bg, brand-primary text, border
- Press: `transform: scale(0.98)`

### Tab Bar
- Fixed bottom, white background
- 3 tabs: 首页, 仪表板, 订阅
- Active: brand-primary color
- Emoji icons (cross-platform compatible)

### Locked/Premium Badge
- Background: surface-alt (#f0f0f0)
- Border radius: 12px
- 🔒 icon prefix
- Text color: text-muted

## Layout

- Max content width: none (full mobile width)
- Page padding: 24px horizontal
- Bottom safe area: 120px (tab bar clearance)
- Cards stack vertically with 16px gap

## Motion

- Button press: `scale(0.98)` on `:active`
- View transitions: instant (no animation — Taro H5 constraint)

## Platform Notes

- H5: Single-page app, all views in index.tsx (Taro H5 router bug workaround)
- Mini program: Standard Taro tab navigation
- Font: System font stack (supports CJK natively on all target devices)
