# ChargeWatch — design system

Not a marketing site: a real product redesign of the existing dashboard
(`client/src/pages/*`, `components/*`). Scope is the UI layer only — API
contracts, routes and every `data-testid` the Playwright suite depends on
are unchanged.

## Brief

- **Subject:** ChargeWatch, an EV charging network monitoring dashboard.
- **Audience:** a fleet operator watching site/charger health and energy
  use; secondarily, anyone reviewing this as a portfolio piece.
- **Job:** read site and charger status at a glance, drill into one site,
  see energy trends, start/stop sessions.
- **Constraint:** existing stack (Vite, React, React Router, Tailwind,
  Recharts). No loader, no WebGL, no scroll narrative — this is a tool
  that's opened, not a story that's scrolled.

## Concept

Three directions considered:

| # | Idea | Anchor | Originality | Fit | Feasibility | Portability (lower better) |
|---|---|---|---|---|---|---|
| 1 | **Control room** — a technical NOC board; a charging badge visibly carries current, because it literally does | A charger that's "charging" has real current flowing through it right now | 3 | 5 | 5 | 2 |
| 2 | Circuit diagram — site/chargers as schematic symbols with animated traces | Chargers are wired to a site | 4 | 3 | 2 | 2 |
| 3 | Fuel-gauge dashboard — analog gauges per charger | Car dashboards use gauges | 3 | 2 | 3 | 3 |

**Picked #1.** It's the only one that scales to a dense table of 13+ rows
without becoming illustrative-over-functional, and the signature motion is
earned by a real fact about the subject, not borrowed from a mood board.

```
Idea:        a control-room board for a charging network, precise and legible
Metaphor:    a NOC monitor: dark ground, mono digits, status LEDs
Signature:   a "charging" badge carries a slow current-flow shimmer; every
             other status is still, because it has nothing flowing through it
Emotion:     calm precision — you can read the whole fleet's health in 3 seconds
Motion verb: "flows" — things that are live move; things that are static don't
Screenshot:  the chargers table, one row's badge visibly carrying current
             while its neighbors sit still
```

## System

- **Palette** (dark, one committed theme):
  - `ground` #0a0d10, `surface` #12161b (cards/rows), `ink` #e7ecf0,
    `muted` #8b96a3, `line` rgba(231,236,240,.09), `accent` #35e7b7 (UI:
    links, focus ring, primary actions)
  - Status colors are content, not decoration: `available` #35e7b7,
    `charging` #3ba7ff, `faulted` #ff6b5c, `offline` #7b8290 (lightened from an
    earlier #5b6472, which measured 3.0:1 on `surface` -- failed AA)
- **Type:** Geist (UI/display) + Geist Mono (every number: kW, kWh, counts,
  dates) — both free on Google Fonts. Tabular figures throughout.
- **Grid:** 8px spacing scale, hairline borders instead of shadows, 8px
  radius (precise, not soft/bubbly — avoids the generic SaaS-card look).
- **Motion:** hover = border brightens + 1px lift (`soft`/power3.out,
  0.25s); filter control = segmented pill, active state is a solid fill;
  Start/Stop buttons flood from the bottom on hover/focus; table rows and
  overview cards stagger in on mount/filter change (`out`/expo.out); status
  counts count up from 0. The one idle motion: the current-flow shimmer on
  `charging` badges only — everything else stays still, which is the point.
  All motion respects `prefers-reduced-motion` (shimmer and stagger both
  drop to an instant, fully visible state).

## QA results (production build, real screenshots + axe + vitals)

- **Home:** 0 axe violations, 0 small tap targets, 0 hover gaps, idle motion
  present (the live "charging" count chip), mobile LCP 2.56s.
- **404 (`NotFound`):** 0 axe violations, 0 small targets, mobile LCP 2.32s.
  No idle motion -- a deliberate decision, it's a static error state.
- **Site detail:** 0 axe violations, every primary hover reacts (one
  `colorOnly`: the already-selected segmented-filter button, where a
  background fill is the correct treatment for a toggle). Fully visible
  under reduced motion.
- **Known tradeoff:** `SiteDetail` (and Recharts) is code-split out of the
  home bundle, cutting the home route from 717 KB to 334 KB and its LCP from
  4.3s to 2.6s. That moves cost onto a *cold* direct link to `/sites/:id`
  (bookmarked or refreshed): its LCP measured 5.1s, because the browser has
  to fetch the main chunk, then the lazy SiteDetail chunk, before it can even
  request the site's data. Mitigated for the common path -- opening a site
  from the overview -- by prefetching that chunk on card hover/focus
  (`SitesOverview.tsx`); a cold deep link still pays the full cost. Fixing
  that fully would need SSR or a framework with route-aware server bundling
  (Next.js), out of scope for a UI pass on the existing Vite SPA.

## What's out of scope

No loader, no deploy/OG/sitemap work (this is an internal tool, not a
marketing site being shipped to a domain) — see the chat summary instead of
a Phase 5 here.
