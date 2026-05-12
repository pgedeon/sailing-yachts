### Phase 14 — French Localization & Internationalization (Priority: High) — ✅ COMPLETE

- ~~**P14.1 — i18n infrastructure & French translation system**~~ *(completed 2026-04-27)*
- ~~**P14.2 — French translations for yacht listing & search pages**~~ *(completed 2026-04-27)*
- ~~**P14.3 — French translations for yacht detail & comparison pages**~~ *(completed 2026-04-28)*
- ~~**P14.4 — French translations for manufacturers, guides & glossary**~~ *(completed 2026-04-28)*
- ~~**P14.5 — French SEO & metadata**~~ *(completed 2026-04-29)*
- ~~**P14.6 — French long-tail landing pages**~~ *(completed 2026-04-30)*

### Phase 15 — Interactive Spec Visualizations (Priority: High) — ✅ COMPLETE

The site has rich spec data (201 yachts with detailed dimensions, displacement, sail area, accommodation) but presents it as plain tables. Adding visual charts and gauges transforms the comparison experience from "reading numbers" to "seeing the differences" — dramatically improving user engagement and decision-making.

- ~~**P15.1 — Spec comparison radar chart on compare page:** Add an interactive radar chart (using Recharts) to the `/compare` page showing normalized spec dimensions (length, beam, draft, displacement, sail area, engine HP) for 2-4 yachts overlaid. Normalize each dimension 0-100 based on min/max across compared yachts. Include toggle to show/hide individual yachts. Fully i18n-compatible with French labels. Tests: unit tests for normalization logic, rendering tests for chart component. *(priority: critical — visual centerpiece of Phase 15)*~~ *(completed 2026-05-08 — PR #253, 22 tests)*

- ~~**P15.2 — Spec bars on yacht detail page:** Add horizontal bar chart visualizations on `/yachts/[slug]` for key specs (LOA, beam, draft, displacement, sail area, ballast ratio) showing where this yacht sits relative to its size class (±20% of its LOA). Color-coded ranges (below avg / average / above avg). Animated on scroll into view. Tests: unit tests for percentile calculation, rendering tests. *(priority: high)*~~ *(completed 2026-05-06 — PR #245, #246, 17 tests)*

- ~~**P15.3 — Side-by-side bar charts on compare detail:** Add grouped bar charts below the comparison table on `/compare/[slugA]-vs-[slugB]` pages, showing key specs side by side. Include performance ratios (D/L ratio, SA/D ratio, ballast ratio) calculated from raw specs. Tests: rendering tests, ratio calculation unit tests. *(priority: high)*~~ *(completed 2026-05-07 — PR #249, 15 tests)*

- ~~**P15.4 — Size distribution chart on yacht listing:** Add a histogram/distribution chart on `/yachts` page showing the length distribution of all yachts, with the current filter range highlighted. Helps users understand the market landscape. Tests: rendering tests, filter interaction tests. *(priority: medium)*~~ *(completed 2026-05-07 — PR #251, 10 tests)*

- **P15.5 — Manufacturer fleet overview charts:** On `/manufacturers/[slug]` pages, add a chart showing the manufacturer's yacht lineup by size, with year of introduction. Gives an overview of the brand's range at a glance. Tests: rendering tests. *(priority: medium)* ~~*(completed 2026-05-08 — PR #255, 8 tests)*~~

### Notes
- Use Recharts (lightweight, React-native, already supports SSR) as the charting library.
- All charts must work with next-intl — labels and tooltips translated.
- Charts should be client components (`"use client"`) to avoid SSR issues with canvas/SVG.
- Performance: use dynamic imports (`next/dynamic`) for chart components to avoid bloating initial JS bundle.
- Accessibility: include text alternatives (data tables) hidden behind a toggle for screen readers.
- **Phase 14 i18n patterns apply**: use `useTranslations()` in client components, `getTranslations()` in server components.

### Phase 16 — Manufacturer Data Enrichment (Priority: High) — ✅ COMPLETE

The manufacturers table has columns for country, founding year, website URL, logo URL, and description — but all 42 manufacturers have empty values. The manufacturer detail pages already render these fields (showing "—" placeholders). Enriching this data transforms thin manufacturer pages into authoritative brand profiles, improving SEO value and user experience.

- ~~**P16.1 — Seed manufacturer metadata (country, founding year, website, description):** Populate country, founded_year, website_url, and description for all 42 manufacturers using well-known sailing industry data. Write a seed script (scripts/seed-manufacturer-metadata.ts) that updates existing rows. Include a data file (scripts/manufacturer-data.json) with the enrichment data. Tests: verify all 42 manufacturers have non-null country and founded_year after seeding. *(priority: critical — foundation for all other P16 items)*~~ *(completed 2026-05-09 — PR #259, Issue #258)*

- ~~**P16.2 — Manufacturer logos and brand identity:** Add logo URLs for manufacturers (sourced from official websites or press kits, using placeholder/gravatar fallback for unavailable ones). Display logos on manufacturer listing page, manufacturer detail page, and yacht detail page. Update OG image generation to include manufacturer logo. Tests: rendering tests for logo display. *(priority: high)*~~ *(completed 2026-05-10 — PR #265, Issue #264, 12 tests)*

- ~~**P16.3 — Enhanced manufacturer listing page:** Redesign `/manufacturers` to show country flags, founding year, yacht count, and a short description in a card grid layout. Add filter by country and sort by name/yacht count/founding year. Tests: component rendering tests, filter logic tests. *(priority: high)*~~ *(completed 2026-05-09 — PR #261, Issue #260)*

- ~~**P16.4 — Manufacturer detail page improvements:**~~ *(completed 2026-05-10 — PR #263, Issue #262)*

### Notes
- Manufacturer metadata should be factually accurate — verify founding years and countries
- Logos should be hosted or use official CDN URLs with proper attribution
- All new content must be i18n-compatible (descriptions in both en and fr)
- Use the existing Neon HTTP client pattern for DB updates (no psql/drizzle-kit push)

### Phase 17 — Advanced Yacht Discovery & Smart Recommendations (Priority: High) — ✅ COMPLETE

The /yachts listing page has basic filter dropdowns (manufacturer, rig type, keel type, hull material, length range) but lacks the advanced filtering and smart discovery features that serious sailors expect. Adding range sliders, cabin/berth filters, smart recommendation engine, and "yacht finder" wizard would transform the discovery experience and significantly increase engagement and time-on-site.

- ~~**P17.1 — Advanced range filters with slider UI:**~~ Replace plain text inputs for length/displacement range with dual-handle range sliders. Add new filterable ranges: cabin count, berth count, draft range, sail area range. *(completed 2026-05-11)*

- ~~**P17.2 — Yacht "Use Case" tags & filter:**~~ Add use-case tags to yachts based on spec heuristics. Display as colored badges, add filter, tag reference page. *(completed 2026-05-11 — PR #269, Issue #268, 25 tests)*

- ~~**P17.3 — Yacht Finder Wizard:**~~ 5-step wizard at /yachts/finder with weighted scoring algorithm. *(completed 2026-05-11 — PR #271, Issue #270, 23 tests)*

- ~~**P17.4 — "Yachts like this" smart recommendations:**~~ Enhance the similar yachts section on detail pages with a weighted similarity score considering: LOA (±15%), use-case tag match, same rig/keel type, similar displacement/length ratio, price tier. Show match percentage badge. Add "Why recommended?" tooltip explaining the match factors. Tests: similarity scoring unit tests, rendering tests. *(completed 2026-05-12 — PR #273, Issue #272, 14 tests)*/

- ~~**P17.5 — Saved search & alert system enhancement:** Enhance existing alert system to support filter-based alerts (e.g., "notify me when a new 35-40ft bluewater cruiser is added"). Add saved search management page at /account/searches. Show saved searches in user account dashboard. Tests: saved search CRUD tests, alert trigger logic tests. *(priority: medium)*~~ *(completed 2026-05-12 — PR #275, 31 tests)*

### Notes
- All new filters must be i18n-compatible (labels in en + fr)
- Range sliders must be accessible (keyboard navigation, ARIA labels)
- Use-case tag heuristics should be documented and configurable
- Wizard should work without login (results available immediately)
- Smart recommendations should fallback gracefully when insufficient data
- Consider performance: filter changes should debounce API calls (300ms)
- Mobile-first: sliders and wizard must work well on touch devices
