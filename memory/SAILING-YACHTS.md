# Sailing Yachts — Session Memory

## Latest Session: 2026-05-31 22:40

### Issue Worked On
- **Issue #360** — P21.5: Year/model variant tracking
- **PR #361** — merged (squash)

### What Was Implemented
1. **lib/yachts.ts** — Added `getYachtVariants(yachtId, manufacturerId, modelName)`:
   - Queries yacht_models for same manufacturer + same model name, different id
   - Returns YachtVariant[] ordered by year descending
   - New `YachtVariant` interface exported

2. **app/api/yachts/[slug]/variants/route.ts** — Edge API endpoint:
   - GET /api/yachts/[slug]/variants
   - Uses unstable_cache with ISR (1h), tags: yacht:${slug}, yachts
   - Edge runtime
   - Returns JSON { variants: [...] }

3. **app/[locale]/yachts/[slug]/VariantSelector.tsx** — Client component:
   - Shows year variant links in a badge/tag style
   - Current variant highlighted with primary bg
   - Other variants as clickable links with LOA info
   - Uses Calendar + Ruler lucide icons (aria-hidden)
   - i18n: en + fr

4. **YachtDetailClient.tsx** — Integration:
   - Lazy-loaded VariantSelector component
   - Fetches variants from API on mount (non-critical, silent fail)
   - Renders below PriceInsightBlock, above admin links

5. **i18n**: Added "yearVariants" key to en.json and fr.json

6. **Tests**: 4 unit tests in tests/yacht-variants.test.ts

### Build/Test Results
- Typecheck: ✅ PASS
- Build: ✅ PASS
- Tests: 1438 passed, 3 pre-existing failures

### Deploy Status
- PR merged to main
- Vercel: ✅ deployed (required empty commit redeploy for route propagation)
- Production deployment confirmed

### Live Verification Results
- **/**: ✅ OK
- **/en/yachts**: ✅ OK
- **/en/search**: ✅ OK
- **/en/compare**: ✅ OK
- **/en/yachts/beneteau-oceanis-40-1**: ✅ OK
- **/api/yachts/[slug]/variants**: ✅ Route registered (500 due to Neon DB quota — pre-existing)

### Phase Status
- Phase 14–19: ✅ COMPLETE
- Phase 20 (Content Enrichment): 🔄 ACTIVE
  - P20.1: 🔲 TODO (auto-generated yacht descriptions — needs LLM pipeline)
  - P20.2–P20.5: ✅ COMPLETE
- Phase 21 (Data Quality): 🔄 ACTIVE
  - P21.1: ✅ COMPLETE
  - P21.2–P21.4: 🔲 TODO (scraping/aggregation tasks)
  - P21.5: ✅ COMPLETE (year/model variant tracking)
- Phase 22 (Performance): ✅ COMPLETE
- Phase 23–27: 🔲 NOT IN ROADMAP (only phases 14-22 exist)

### Technical Notes
- Neon DB quota STILL EXCEEDED — all dynamic API endpoints return 500
- Vercel deployment required an empty commit to propagate new route registration
- VariantSelector is non-critical — fetches silently, won't break page if API fails
- Variants are detected by matching manufacturer_id + model_name, excluding current yacht id
- No new DB table needed — uses existing yacht_models data

### Next Recommended Tasks
1. **P21.3 — Image coverage improvement**: Auto-fetch manufacturer press images
2. **P21.4 — Price data aggregation**: Aggregate price data from listing sites
3. **P21.2 — Automated data enrichment pipeline**: Scrape/ingest specs from public sources
4. **P20.1 — Auto-generated descriptions**: Needs LLM pipeline design
