### Phase 14 — French Localization & Internationalization (Priority: High) — ✅ COMPLETE

- ~~**P14.1 — i18n infrastructure & French translation system**~~ *(completed 2026-04-27)*
- ~~**P14.2 — French translations for yacht listing & search pages**~~ *(completed 2026-04-27)*
- ~~**P14.3 — French translations for yacht detail & comparison pages**~~ *(completed 2026-04-28)*
- ~~**P14.4 — French translations for manufacturers, guides & glossary**~~ *(completed 2026-04-28)*
- ~~**P14.5 — French SEO & metadata**~~ *(completed 2026-04-29)*
- ~~**P14.6 — French long-tail landing pages**~~ *(completed 2026-04-30)*

### Phase 15 — Interactive Spec Visualizations (Priority: High) — ✅ COMPLETE

- ~~**P15.1 — Spec comparison radar chart on compare page**~~ *(completed 2026-05-08 — PR #253, 22 tests)*
- ~~**P15.2 — Spec bars on yacht detail page**~~ *(completed 2026-05-06 — PR #245, #246, 17 tests)*
- ~~**P15.3 — Side-by-side bar charts on compare detail**~~ *(completed 2026-05-07 — PR #249, 15 tests)*
- ~~**P15.4 — Size distribution chart on yacht listing**~~ *(completed 2026-05-07 — PR #251, 10 tests)*
- ~~**P15.5 — Manufacturer fleet overview charts**~~ *(completed 2026-05-08 — PR #255, 8 tests)*

### Phase 16 — Manufacturer Data Enrichment (Priority: High) — ✅ COMPLETE

- ~~**P16.1 — Seed manufacturer metadata**~~ *(completed 2026-05-09 — PR #259, Issue #258)*
- ~~**P16.2 — Manufacturer logos and brand identity**~~ *(completed 2026-05-10 — PR #265, Issue #264, 12 tests)*
- ~~**P16.3 — Enhanced manufacturer listing page**~~ *(completed 2026-05-09 — PR #261, Issue #260)*
- ~~**P16.4 — Manufacturer detail page improvements**~~ *(completed 2026-05-10 — PR #263, Issue #262)*

### Phase 17 — Advanced Yacht Discovery & Smart Recommendations (Priority: High) — ✅ COMPLETE

- ~~**P17.1 — Advanced range filters with slider UI**~~ *(completed 2026-05-11)*
- ~~**P17.2 — Yacht "Use Case" tags & filter**~~ *(completed 2026-05-11 — PR #269, Issue #268, 25 tests)*
- ~~**P17.3 — Yacht Finder Wizard**~~ *(completed 2026-05-11 — PR #271, Issue #270, 23 tests)*
- ~~**P17.4 — "Yachts like this" smart recommendations**~~ *(completed 2026-05-12 — PR #273, Issue #272, 14 tests)*
- ~~**P17.5 — Saved search & alert system enhancement**~~ *(completed 2026-05-12 — PR #275, 31 tests)*

### Phase 18 — Performance & UX Polish (Priority: High) — ✅ COMPLETE

- ~~**P18.1 — Loading skeletons for all route segments**~~ *(completed 2026-05-21 — 14 loading.tsx files, Skeleton component, 52 tests)*
- ~~**P18.2 — Error boundaries with retry for all route segments**~~ *(completed 2026-05-21 — 14 error.tsx files, shared ErrorBoundary component, 48 tests)*
- ~~**P18.3 — Custom 404/not-found page**~~ *(completed 2026-05-21 — root + locale not-found.tsx, i18n, 13 tests)*
- ~~**P18.4 — Scroll progress indicator & back-to-top button**~~ *(completed 2026-05-21 — ScrollProgress + BackToTop components, 24 tests)*
- ~~**P18.5 — Page transition animations**~~ *(completed 2026-05-21 — PageTransition (View Transitions API) + AnimatedGrid, 30 tests)*

### Notes
- All loading skeletons match the actual page layout — not generic spinners
- Error boundaries are i18n-compatible (error messages in en + fr)
- Uses `suspense` boundaries strategically to stream content progressively
- Skeletons use the same Tailwind classes as real content for layout stability (CLS prevention)
- All animations respect `prefers-reduced-motion` media query
- JS bundle impact kept minimal — CSS animations used where possible

### Phase 19 — Programmatic SEO Landing Pages (Priority: High) — ✅ COMPLETE

- **P19.1 — Manufacturer+size category landing pages** *(completed 2026-05-28)* — Route `/yachts/[manufacturer]/[sizeCategory]` (e.g., `/yachts/beneteau/40ft`) with SEO metadata, filtered yacht grid, breadcrumbs, JSON-LD. Size categories: under-30ft, 30-35ft, 35-40ft, 40-45ft, 45-50ft, over-50ft.
- **P19.2 — Size category hub pages** *(completed 2026-05-25 — PR #330-#332, Issue #329, 8 tests)* — Route `/yachts/by-size/[sizeCategory]` aggregating all manufacturers for a size range. Internal links to manufacturer+size sub-pages.
- **P19.3 — Use-case landing pages** *(completed 2026-05-26 — PR #334, Issue #333, 10 tests)* — Route `/yachts/[useCase]` (e.g., `/yachts/bluewater-cruising`, `/yachts/racing`, `/yachts/family-cruising`) with curated yacht selections, guide links, and SEO content.
- **P19.4 — Sitemap integration for programmatic pages** *(completed 2026-05-26 — Issue #335)* — Add all generated landing pages to sitemap-programmatic.xml with proper `<lastmod>`, `<changefreq>`, and `<priority>` values.
- **P19.5 — Internal linking mesh** *(completed 2026-05-26 — Issue #337)* — Cross-link from yacht detail pages to manufacturer+size, size hub, and use-case pages. Add "Related Categories" section on manufacturer detail and size hub pages.

### Phase 20 — Content Enrichment & Authority Building (Priority: Medium) — 🔲 PLANNED

- **P20.1 — Auto-generated yacht summary descriptions** *(needs LLM pipeline design)* — LLM-powered one-paragraph summaries for yachts missing descriptions, stored in DB, with human review queue.
- **P20.2 — Spec glossary tooltips on yacht detail** *(completed 2026-05-30 — Issue #356, PR #357, 12 tests)* — Enhanced SpecTooltip with keyboard a11y, shared data module, additional spec labels (Sail Area Main/Jib, Engine Type, Max Occupancy), i18n (en+fr), focus-visible ring, aria-describedby/expanded.
- **P20.3 — Manufacturer comparison pages** *(completed 2026-05-27 — Issue #341)* — `/compare-manufacturers/[slugA]-vs-[slugB]` comparing fleet size, price range, popular models.
- **P20.4 — "Best [year] [size] sailboats" editorial pages** *(completed 2026-05-28 — Issue #346, PR #347, 13 tests)* — Curated editorial pages combining guide content with yacht data.
- **P20.5 — Video embed support for yacht pages** *(completed 2026-05-27 — Issue #344, PR #345, 31 tests)* — Click-to-play VideoEmbed component with i18n, YouTube thumbnail derivation, autoplay on click. MediaGallery fully i18n'd (en + fr).

### Phase 21 — Data Quality & Coverage (Priority: Medium) — 🔲 PLANNED

- **P21.1 — Data completeness scoring - **P21.1 — Data completeness scoring & reporting** — Admin dashboard showing completeness % per yacht, missing fields highlighted. reporting** *(completed — pre-existing implementation)* — Admin dashboard at /admin/completeness showing completeness % per yacht, missing fields highlighted, score distribution, category completion rates, and yachts needing attention table. API at /api/admin/completeness.
- **P21.2 — Automated data enrichment pipeline** — Scrape/ingest specs from public sources (sailboatdata.com, boat-specs.com) with deduplication.
- **P21.3 — Image coverage improvement** — Auto-fetch manufacturer press images, ensure every yacht has at least one image.
- **P21.4 — Price data aggregation** — Aggregate new/used price data from listing sites (yachtworld.com, boats.com) with attribution.
- **P21.5 — Year/model variant tracking** — Support multiple year variants per model (e.g., Oceanis 40.1 2019 vs 2023).

### Phase 22 — Performance & Technical Excellence (Priority: Low) — 🔲 PLANNED

- **P22.1 — Edge runtime for API routes** *(completed 2026-05-31 — Issue #358, PR #359, 11 tests)* — Created db-edge.ts (Edge-safe Drizzle module), edge-pool.ts (Neon HTTP Pool wrapper). Migrated 6 public API routes (yachts, yachts/[slug], manufacturers, manufacturers/[slug], search, compare) to Edge runtime. Eliminated pg dependency from Edge bundle. All admin routes remain on Node.js runtime.
- **P22.2 — Image CDN optimization** *(completed 2026-05-30 — Issue #354, PR #355, 20 files)* — Converted all raw <img> to next/image with blur placeholders, shared image-utils, AVIF/WebP optimization.
- **P22.3 — Incremental Static Regeneration audit *(completed 2026-05-28 — Issue #348, PR #349)* — Enabled ISR (1h cache) for by-size, use-case, and compare pages with cache tags.
- **P22.4 — Bundle size optimization** *(completed 2026-05-29 — Issue #350, PR #351, 38 tests)* — Lazy-loaded 15+ below-the-fold components, reducing /yachts/[slug] First Load by 11%, /compare by 21%.
- **P22.5 — Core Web Vitals monitoring** *(completed 2026-05-29 — Issue #352, PR #353, 13 tests)* — Admin dashboard at /admin/vitals with real-time CWV stats, Sentry integration for poor metric alerting, server-side poor metric logging.
