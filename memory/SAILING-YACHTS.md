# Sailing Yachts — Session Memory

## Latest Session: 2026-05-28 22:20

### Issue Worked On
- **Issue #348** — P22.3: ISR cache audit — enable ISR for by-size, use-case, and compare pages
- **PR #349** — merged (squash)

### What Was Implemented
- Converted 3 page types from `force-dynamic` + `revalidate = 0` to ISR with `revalidate = 3600`:
  - `/yachts/by-size/[sizeCategory]` — Size category hub pages
  - `/yachts/for/[useCase]` — Use-case landing pages
  - `/compare/[slugA]-vs-[slugB]` — Yacht comparison pages
- Wrapped data fetching with `unstable_cache()` + cache tags `["yachts", "manufacturers"]`
- Admin mutations already call `revalidateTag()` on data changes — cached pages auto-invalidate

### Build/Test Results
- Typecheck: ✅ PASS
- Build: ✅ PASS
- CI (Lint, TypeScript, Build, Performance Budgets): ✅ ALL PASS

### Deploy Status
- PR merged to main
- Vercel – sailing-yachts: ✅ deployed

### Live Verification Results
- **/**: ✅ OK
- **/yachts**: ✅ OK
- **/search**: ✅ OK
- **/compare**: ✅ OK
- **/yachts/by-size/35-40ft**: ✅ OK
- **/yachts/for/bluewater-cruiser**: ✅ OK
- **/compare/beneteau-oceanis-40-1-vs-jeanneau-sun-odyssey-410**: ✅ OK
- **/api/yachts**: ⚠️ Neon DB quota exceeded (pre-existing)

### Phase Status
- Phase 14–19: ✅ COMPLETE
- Phase 20 (Content Enrichment): 🔄 ACTIVE
  - P20.1: 🔲 TODO (auto-generated yacht descriptions — needs LLM pipeline)
  - P20.2: ✅ COMPLETE
  - P20.3: ✅ COMPLETE
  - P20.4: ✅ COMPLETE
  - P20.5: ✅ COMPLETE
- Phase 21 (Data Quality): 🔲 PLANNED
- Phase 22 (Performance): 🔄 ACTIVE
  - P22.1: 🔲 TODO (Edge runtime for API routes — most routes use `pool`/pg which isn't edge-compatible, need to convert to drizzle first)
  - P22.2: 🔲 TODO (Image CDN optimization)
  - P22.3: ✅ COMPLETE (ISR audit — Issue #348, PR #349)
  - P22.4: 🔲 TODO (Bundle size optimization)
  - P22.5: 🔲 TODO (Core Web Vitals monitoring)
- Phase 23–27: 🔲 PLANNED

### Technical Notes
- Neon DB quota STILL EXCEEDED — all dynamic/first-time ISR renders fail for uncached pages
- Existing cached ISR pages continue to work
- Most API routes use `pool` (pg/Pool) which is NOT edge-runtime compatible
- Routes using `db` (drizzle/neon-http) ARE edge-compatible
- `sailing-yachts-actual` and `site` Vercel projects fail deployment (pre-existing)

### Next Recommended Tasks
1. **P22.4 — Bundle size optimization**: Audit client JS, code-split heavy components
2. **P22.1 — Edge runtime**: Convert key public API routes from `pool` to `db` (drizzle), then add `export const runtime = 'edge'`
3. **P21.1 — Data completeness scoring**: Admin dashboard for data quality
4. **P20.1 — Auto-generated descriptions**: Needs LLM pipeline design (complex, may need user input)

## Previous Session: 2026-05-28 02:20

### Issue Worked On
- **Issue #346** — P20.4: Best [year] [size] sailboats editorial pages
- **PR #347** — merged (squash)

### What Was Implemented
- New editorial route `/yachts/best/[year]/[sizeCategory]` (e.g., `/yachts/best/2026/40-45ft`)
- Data layer `lib/best-year-size-landing.ts` with editorial content, rankings, sidebar
- `BestYearSizeClient` with ranked yacht cards, gold rank badges
- JSON-LD schemas, OG images, sitemap integration, i18n (en + fr)
- Loading skeleton, error boundary, 13 unit tests

### Deploy Status
- PR merged to main, Vercel deployed

### Live Verification
- Core pages: ✅ OK
- Editorial pages: ⚠️ 404 (Neon DB quota exceeded)
- API: ⚠️ Neon DB quota exceeded
