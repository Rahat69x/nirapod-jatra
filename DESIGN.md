---
name: Nirapod Jatra (নিরাপদ যাত্রা)
description: Dhaka commuter transit transparency and safety design system
colors:
  primary: "#059669"
  primary-hover: "#047857"
  primary-light: "#ecfdf5"
  accent: "#f59e0b"
  accent-hover: "#d97706"
  accent-light: "#fffbeb"
  danger: "#dc2626"
  danger-light: "#fef2f2"
  neutral-bg: "#f8fafc"
  neutral-surface: "#ffffff"
  neutral-border: "#e2e8f0"
  neutral-text: "#0f172a"
  neutral-muted: "#64748b"
typography:
  display:
    fontFamily: "'Hind Siliguri', sans-serif"
    fontSize: "clamp(1.75rem, 3.5vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.2
  h1:
    fontFamily: "'Hind Siliguri', sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
  h2:
    fontFamily: "'Hind Siliguri', sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "'Hind Siliguri', sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  numeral:
    fontFamily: "'Inter', monospace, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.2
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  card-vehicle:
    backgroundColor: "{colors.neutral-surface}"
    rounded: "{rounded.lg}"
    padding: "16px"
  badge-cheapest:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "4px 10px"
---

# Design System: Nirapod Jatra (নিরাপদ যাত্রা)

## Overview

Nirapod Jatra operates primarily in **Operate** mode with real-time transit guidance in **Experience** mode. The interface serves daily Dhaka commuters on the move—often standing at bustling road intersections, in hot sunlight, in torrential monsoon rain, or late at night. 

Visual clarity, immediate legibility, high contrast, and rapid scanability take precedence over decorative flair. The visual identity reflects the authentic fabric of Dhaka:
- **MRT-6 Emerald (`#059669`):** Represents modern, efficient, traffic-free metro transit.
- **Rickshaw Hood Amber (`#f59e0b`):** Honors the cultural vibrancy of Dhaka's iconic cycle and battery rickshaws.
- **Distress Crimson (`#dc2626`):** Dedicated exclusively to high-alert emergency utilities (SOS and distress siren).
- **Cool Slate Neutrals (`#0f172a` to `#f8fafc`):** Clean, professional structure avoiding muddy beige or washed-out backgrounds.

## Colors

### Brand Primitives & Roles
- **Primary (Dhaka Metro MRT-6):**
  - `--brand-primary`: `#059669` (Buttons, active states, verified badges, journey highlights)
  - `--brand-primary-hover`: `#047857` (Interactive active states)
  - `--brand-primary-light`: `#ecfdf5` (Subtle selection tints)
- **Accent (Rickshaw Amber):**
  - `--brand-accent`: `#f59e0b` (Fare badges, attention chips, warnings)
  - `--brand-accent-hover`: `#d97706`
  - `--brand-accent-light`: `#fffbeb`
- **Emergency (SOS / Distress):**
  - `--brand-danger`: `#dc2626` (Siren, 999 hotline, SOS triggers)
  - `--brand-danger-light`: `#fef2f2`
- **Neutrals (Slate):**
  - Light Mode Page: `#f8fafc` | Surface: `#ffffff` | Borders: `#e2e8f0`
  - Dark Mode Page: `#020617` | Surface: `#0f172a` | Elevated: `#1e293b` | Borders: `#334155`

### Contrast Ratios
All primary text pairs against background at >7:1 ratio (AAA). Secondary text and captions exceed 4.5:1 (AA).

## Typography

### Font Families
- **Bangla Text:** `Hind Siliguri`, sans-serif (clean ligatures, natural matra strokes, no broken characters).
- **Latin Figures & Tabular Numbers:** `Inter`, tabular-nums, sans-serif (ensures clean numerical columns for fares, times, and distances).
- **Monospace:** `ui-monospace`, `SFMono-Regular`, `Consolas` (used for GPS coordinates).

### Type Hierarchy
| Level | Font Size | Line Height | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display / Hero** | `clamp(1.75rem, 3.5vw, 2.25rem)` | 1.2 | Extrabold (800) | App branding and hero header |
| **Heading 1** | `1.5rem (24px)` | 1.25 | Bold (700) | Main section titles (Fare, Community, Safety) |
| **Heading 2** | `1.25rem (20px)` | 1.3 | Bold (700) | Module headers and comparison titles |
| **Heading 3** | `1.0625rem (17px)` | 1.35 | Semibold (600) | Card titles and vehicle names |
| **Body** | `0.9375rem (15px)` | 1.5 | Regular (400) | Paragraphs, advice text, instructions |
| **Small / Label** | `0.8125rem (13px)` | 1.4 | Medium / Bold | Inputs, badge labels, buttons |
| **Caption** | `0.6875rem (11px)` | 1.4 | Regular (400) | Timestamp metadata, legal disclaimers |

*Note on Bengali script:* Never apply `text-transform: uppercase` or excessive `letter-spacing` (`tracking-wider`) to Bengali text. It breaks the phonetic continuity of the script.

## Layout

### Responsive Architecture
- **Mobile (<768px):** Single-column stacked layout, touch-optimized (360px–430px). Bottom navigation bar fixed at bottom for one-thumb reachability.
- **Tablet (768px–1023px):** Two-column container grid (`max-w-5xl`). Top navigation activates in header; bottom bar hides.
- **Desktop (1024px+):** Full 12-column transit dashboard (`max-w-6xl`):
  - *Left Column (7 cols):* Search inputs, quick commute chips, weather banner, multi-option comparison cards, step-by-step milestones.
  - *Right Column (5 cols):* Sticky live route map, spoken negotiation script, audio guide player, Uber/Pathao benchmark cards.

### Spacing Scale (4pt Grid)
Use consistent 4pt increments: `4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`, `48px`. Avoid ad-hoc pixel values like `7px` or `23px`.

## Elevation & Depth

- **Restrained Neutral Elevation:** Shadows are strictly neutral slate tones (`rgba(15, 23, 42, 0.08)` in light mode, `rgba(0, 0, 0, 0.45)` in dark mode).
- **No Chromatic Glows:** Zero-offset colored box-shadow halos (e.g. `0 0 15px #10b981`) are banned as AI-template clutter. Depth is communicated via subtle 1px border contrast (`border-slate-200` / `border-slate-800`) and slight tonal elevation.
- **Flat Nesting:** Avoid "cards inside cards" deeper than 1 level. Use dividers and whitespace to group data instead of multiple nested card boxes.

## Shapes

- **Inputs & Action Buttons:** `rounded-xl` (`12px` radius) — friendly, tactile, and modern.
- **Cards & Dashboard Panels:** `rounded-2xl` (`16px` to `20px` radius) with `1px` subtle borders.
- **Badges & Pills:** `rounded-full` (`9999px`) for status indicators, lowest-cost flags, and filter chips.
- **Modal Dialogs:** `rounded-3xl` (`24px` radius) centered on screen with backdrop blur (`backdrop-blur-sm`).

## Components

### Component Inventory & States

#### 1. Journey Search Inputs (`#startInput`, `#endInput`)
- **Default:** White/slate-800 background, 1px border, placeholder in neutral slate.
- **Focus:** Emerald outline ring (`ring-2 ring-emerald-500/30`), border-emerald-500.
- **Filled:** Shows clear "✕" button on right for one-tap reset.
- **Suggestions Dropdown:** Absolute positioned floating menu with landmark icons and metro station tags.

#### 2. Quick Commute Filter Pills
- Quick routes: "ফার্মগেট ➔ গুলশান ১", "মিরপুর ১০ ➔ মতিঝিল", "ধানমন্ডি ২৭ ➔ নিউ মার্কেট".
- **Default:** Neutral pill, border-slate-200, hover:bg-slate-100.
- **Active:** Emerald background, white text.

#### 3. Vehicle Option Cards (`#optionsComparisonGrid`)
- Renders CNG, Rickshaw, Battery Easybike, and Multimodal Metro side-by-side.
- **Cheapest Option:** Distinctive badge "সবচেয়ে সাশ্রয়ী" (Lowest Fare), highlighted 2px emerald border.
- **Selected State:** Raised elevation, emerald border, radio indicator checked.
- **Disabled State:** For rickshaws >7km or battery >10km, tinted amber/slate with clear distance warning badge.

#### 4. Step-by-Step Journey Guide (`#journeyStepsList`)
- Numbered milestone cards (`১`, `২`, `৩`).
- Displays mode icon, leg description, distance, duration, and estimated leg cost.

#### 5. Safety & Verification Utilities
- **Distress Siren:** High-contrast crimson card, audible audio feedback, volume warning.
- **Emergency SOS:** Pulsing radar button triggering two-step confirmation modal with 999 hotline and trusted SMS draft.
- **Driver Verification:** Input field for vehicle plate number with mock database lookup.

#### 6. Bilingual & Theme Toggles
- Top header toggles with smooth 150ms transitions and persisted state in `localStorage`.

## Do's and Don'ts

### Do's
- **DO** label all fare numbers as estimates ("আনুমানিক").
- **DO** provide complete mathematical transparency in the fare breakdown box (base fare + distance + congestion buffer + surge multiplier).
- **DO** maintain 44×44px minimum touch targets across all mobile buttons and pills.
- **DO** support natural Bengali spelling variations and Bengali digits (`০-৯`).
- **DO** keep Leaflet and OpenStreetMap responsive and inverted for AMOLED dark mode.

### Don'ts
- **DON'T** use `text-transform: uppercase` or letter-spacing on Bengali text.
- **DON'T** use zero-offset colored neon glow shadows.
- **DON'T** nest cards inside cards inside cards; flatten container hierarchy.
- **DON'T** claim "Live official GPS tracking" without real vehicle hardware integration.
- **DON'T** hardcode secrets or private keys into client or server files.
