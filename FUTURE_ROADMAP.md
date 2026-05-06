### Phase 14 — French Localization & Internationalization (Priority: High) — ✅ COMPLETE

- ~~**P14.1 — i18n infrastructure & French translation system**~~ *(completed 2026-04-27)*
- ~~**P14.2 — French translations for yacht listing & search pages**~~ *(completed 2026-04-27)*
- ~~**P14.3 — French translations for yacht detail & comparison pages**~~ *(completed 2026-04-28)*
- ~~**P14.4 — French translations for manufacturers, guides & glossary**~~ *(completed 2026-04-28)*
- ~~**P14.5 — French SEO & metadata**~~ *(completed 2026-04-29)*
- ~~**P14.6 — French long-tail landing pages**~~ *(completed 2026-04-30)*

### Phase 15 — Interactive Spec Visualizations (Priority: High)

The site has rich spec data (201 yachts with detailed dimensions, displacement, sail area, accommodation) but presents it as plain tables. Adding visual charts and gauges transforms the comparison experience from "reading numbers" to "seeing the differences" — dramatically improving user engagement and decision-making.

- **P15.1 — Spec comparison radar chart on compare page:** Add an interactive radar chart (using Recharts) to the `/compare` page showing normalized spec dimensions (length, beam, draft, displacement, sail area, engine HP) for 2-4 yachts overlaid. Normalize each dimension 0-100 based on min/max across compared yachts. Include toggle to show/hide individual yachts. Fully i18n-compatible with French labels. Tests: unit tests for normalization logic, rendering tests for chart component. *(priority: critical — visual centerpiece of Phase 15)*

- ~~**P15.2 — Spec bars on yacht detail page:** Add horizontal bar chart visualizations on `/yachts/[slug]` for key specs (LOA, beam, draft, displacement, sail area, ballast ratio) showing where this yacht sits relative to its size class (±20% of its LOA). Color-coded ranges (below avg / average / above avg). Animated on scroll into view. Tests: unit tests for percentile calculation, rendering tests. *(priority: high)*~~ *(completed 2026-05-06 — PR #245, #246, 17 tests)*

- **P15.3 — Side-by-side bar charts on compare detail:** Add grouped bar charts below the comparison table on `/compare/[slugA]-vs-[slugB]` pages, showing key specs side by side. Include performance ratios (D/L ratio, SA/D ratio, ballast ratio) calculated from raw specs. Tests: rendering tests, ratio calculation unit tests. *(priority: high)*

- **P15.4 — Size distribution chart on yacht listing:** Add a histogram/distribution chart on `/yachts` page showing the length distribution of all yachts, with the current filter range highlighted. Helps users understand the market landscape. Tests: rendering tests, filter interaction tests. *(priority: medium)*

- **P15.5 — Manufacturer fleet overview charts:** On `/manufacturers/[slug]` pages, add a chart showing the manufacturer's yacht lineup by size, with year of introduction. Gives an overview of the brand's range at a glance. Tests: rendering tests. *(priority: medium)*

### Notes
- Use Recharts (lightweight, React-native, already supports SSR) as the charting library.
- All charts must work with next-intl — labels and tooltips translated.
- Charts should be client components (`"use client"`) to avoid SSR issues with canvas/SVG.
- Performance: use dynamic imports (`next/dynamic`) for chart components to avoid bloating initial JS bundle.
- Accessibility: include text alternatives (data tables) hidden behind a toggle for screen readers.
- **Phase 14 i18n patterns apply**: use `useTranslations()` in client components, `getTranslations()` in server components.
