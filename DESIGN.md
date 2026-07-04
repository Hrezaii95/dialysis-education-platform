# Raouf Clinical Simulator — Design System

**Tier-1 Linear-dark clinical variant**

## Tokens

| Token | Value | Use |
|-------|-------|-----|
| `--canvas` | `#010102` | Page background |
| `--surface-0`–`3` | `#0f1011` → `#1f2124` | Elevation ladder |
| `--accent` | `#5e6ad2` | Primary actions, focus |
| `--raouf-blue` | `#1d3a88` | Brand, 5008S |
| `--teal` | `#0d9488` | HDF, circuit |
| `--gold` | `#c9a227` | Evidence, CONVINCE |
| `--text` | `#f4f4f5` | Body |
| `--text-muted` | `#9b9ba6` | Secondary |

## Typography

- **Display:** Instrument Serif (`--font-instrument`)
- **UI:** Inter / Geist Sans (`--font-geist-sans`)
- **Clinical data:** `tabular-nums` always on vitals, TMP, labs

## Components

- `.glass-panel` — frosted card with hairline border
- `.btn` / `.btn-primary` / `.btn-ghost` — 6 microstates via CSS transitions
- `.alarm-pulse` — critical alarm animation (respects reduced-motion)

## Motion

- Page enter: opacity + 8px Y, 300ms
- Card stagger: 50ms delay per item
- Flipbook page turn: rotateY 8° crossfade

## Accessibility

- WCAG 2.2 AA target
- `:focus-visible` accent ring 2px offset 2px
- `prefers-reduced-motion` collapses animations to 0.01ms

## Stack

Next.js 15 · React 19 · Tailwind 4 · Framer Motion · cmdk · XState · R3F · Recharts
