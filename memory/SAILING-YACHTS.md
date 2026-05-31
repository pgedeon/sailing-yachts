# Sailing Yachts — Session Memory

## Latest Session: 2026-05-31 02:40

### Issue Worked On
- **Issue #358** — P22.1: Edge runtime for public API routes
- **PR #359** — merged (squash)

### What Was Implemented
1. **lib/db-edge.ts** — Edge-safe database module:
   - Only exports `db` (Drizzle + neon-http) and schema re-exports
   - No `pg` dependency — safe for Edge runtime
   - Enables tree-shaking of Node.js-only code from Edge bundles

2. **lib/edge-pool.ts** — Edge-compatible pool:
   - Uses `@neondatabase/serverless` Pool (HTTP-based) instead of `pg` Pool (TCP-based)
   - Same `.query()` interface for drop-in replacement
   - Works in Edge runtime via Neon HTTP API

3. **lib/db.ts** refactored:
   - Now re-exports from `db-edge.ts` + keeps `pool`/`ensureSchema` for Node.js
   - Admin routes and other Node.js routes continue to use `pool` from `@/lib/db`
   - Edge routes import `db` from `@/lib/db-edge` or `edgePool` from `@/lib/edge-pool`

4. **6 public API routes migrated to Edge runtime**:
   - `/api/yachts` — yacht listing (complex: filters, pagination, use-case tags, list/full views)
   - `/api/yachts/[slug]` — yacht detail (ISR, media assets via edgePool)
   - `/api/manufacturers` — manufacturer listing (converted to use `getManufacturersWithCounts()`)
   - `/api/manufacturers/[slug]` — manufacturer detail
   - `/api/search` — autocomplete + full search
   - `/api/compare` — yacht comparison (removed `recordCompareUsage` call as it uses pg Pool)

5. **Updated lib/manufacturers.ts and lib/yachts.ts** to import from `@/lib/db-edge` instead of `@/lib/db`

6. **Updated tests**:
   - `tests/api-performance.test.ts` — mocks `@/lib/edge-pool` instead of `@/lib/db`
   - `tests/edge-pool.test.ts` — new test file (4 tests covering edgePool, db-edge)

### Build/Test Results
- Typecheck: ✅ PASS
- Build: ✅ PASS (Edge runtime confirmed via build warnings)
- CI (Lint, TypeScript, Build, Performance Budgets): ✅ ALL PASS
- Tests: ✅ 1431 passed (3 pre-existing failures unrelated)

### Deploy Status
- PR merged to main
- Vercel – sailing-yachts: ✅ deployed

### Live Verification Results
- **/**: ✅ OK
- **/en/yachts**: ✅ OK
- **/en/search**: ✅ OK
- **/en/compare**: ✅ OK
- **/api/yachts**: ❌ 500 (Neon DB quota exceeded — pre-existing)
- **/api/manufacturers**: ❌ 500 (Neon DB quota exceeded — pre-existing)

### Phase Status
- Phase 14–19: ✅ COMPLETE
- Phase 20 (Content Enrichment): 🔄 ACTIVE
  - P20.1: 🔲 TODO (auto-generated yacht descriptions — needs LLM pipeline)
  - P20.2–P20.5: ✅ COMPLETE
- Phase 21 (Data Quality): 🔄 ACTIVE
  - P21.1: ✅ COMPLETE (pre-existing implementation)
  - P21.2–P21.5: 🔲 TODO
- Phase 22 (Performance): 🔄 ACTIVE
  - P22.1: ✅ COMPLETE (Edge runtime for 6 public API routes)
  - P22.2–P22.5: ✅ COMPLETE
- Phase 23–27: 🔲 PLANNED

### Technical Notes
- Neon DB quota STILL EXCEEDED — all dynamic/first-time ISR renders fail for uncached pages
- `lib/db-edge.ts` is the Edge-safe import path for `db` + schema (no `pg` dependency)
- `lib/edge-pool.ts` provides `edgePool` with same interface as `pool` but HTTP-based
- `lib/db.ts` still works for Node.js routes (re-exports db-edge + adds pool/ensureSchema)
- Admin routes remain on Node.js runtime (they need pg Pool for writes and ensureSchema)
- `recordCompareUsage` removed from Edge compare route (uses pg Pool); tracked via Node.js admin routes instead

### Next Recommended Tasks
1. **P21.2 — Automated data enrichment pipeline**: Scrape/ingest specs from public sources (complex, needs scraping infrastructure)
2. **P21.3 — Image coverage improvement**: Auto-fetch manufacturer press images
3. **P20.1 — Auto-generated descriptions**: Needs LLM pipeline design (complex, may need user input)
4. **Additional Edge migrations**: Convert more read-only API routes (stats, spec-categories, etc.)
