# Sailing Yachts — Session Notes

## 2026-04-07: P6.3 Programmatic Long-Tail Landing Pages (Issue #80)

### Issue #80: Programmatic long-tail landing pages
- **Status**: ✅ Complete
- **PR**: #88 (merged)

### What was implemented
1. Created `/data/landing-pages.ts` with 5 high-intent landing page definitions:
   - /best/40-foot-cruising-sailboats
   - /best/bluewater-sailboats-under-45-feet
   - /best/liveaboard-sailboats-with-3-cabins
   - /best/performance-cruisers-under-35-feet
   - /best/family-cruisers-3-cabins
2. Created `/lib/landing-pages.ts` service to fetch matching yachts from DB with filter criteria
3. Implemented `/best/[slug]` dynamic route with ISR (6h revalidation)
4. Added `generateStaticParams` for SSG with known slugs
5. Extended `lib/seo.ts` with `generateCollectionPageJsonLd` function
6. Each page includes unique intro copy, H1, meta description, and canonical tags
7. CollectionPage, BreadcrumbList, and Product JSON-LD for rich search results
8. Related categories cross-linking for internal navigation
9. Added Playwright tests for landing pages

### Verification
- ✅ Typecheck: PASS
- ✅ Build: PASS
- ✅ All critical pages: OK (/, /yachts, /search, /compare)
- ✅ API: OK (201 yachts)
- ✅ Landing pages: OK (all 5 pages load: 40ft cruisers, bluewater, liveaboard, performance, family)
- ✅ Browser console: No JS errors on /best/* or /yachts
- ✅ JSON-LD: CollectionPage, BreadcrumbList, and Product schemas present
- ✅ Yacht cards render with key specs (LOA, cabins, displacement)
- ✅ Related categories section renders and links correctly

### Next recommended task
Continue with Phase 6 remaining items in priority order:
- P6.4: Canonical X vs Y comparison pages (Issue #81)
- P6.5: Schema enrichment sweep (Issue #82)
- P6.6: Split sitemaps + image sitemap (Issue #83)
- P6.7: Internal linking modules (Issue #84)
- P6.8: Thin-page governance (Issue #85)

---

## 2026-04-04: AggregateRating JSON-LD + Bug Fixes

### Issue #65: Add AggregateRating to yacht JSON-LD
- **Status**: ✅ Complete
- **PRs**: #66 (initial), #68 (bestRating fix), #69 (rating.toFixed fix)

### What was implemented
1. Added `AggregateRating` and `Review` schema entries to yacht Product JSON-LD
2. Updated `generateYachtJsonLd()` in `lib/seo.ts` to accept optional reviews
3. Yacht detail page now fetches reviews from DB and passes to JSON-LD generator
4. Fixed `bestRating` to be 10 (reviews use 1-10 scale, not 1-5)
5. Fixed pre-existing `TypeError: e.rating.toFixed is not a function` on yacht detail pages with reviews (Neon DB returns numeric columns as strings)

### Verification
- ✅ Typecheck: PASS
- ✅ Build: PASS
- ✅ All critical pages: OK (/, /yachts, /search, /compare)
- ✅ API: OK (201 yachts)
- ✅ JSON-LD: AggregateRating 8.5/10 (3 reviews) + 3 Review entries on beneteau-oceanis-30-1
- ✅ Browser console: No JS errors (only pre-existing 404 for test image on example.com)
- ✅ Page snapshot: Full render confirmed

### Key findings
- Reviews in the database use a 1-10 scale, not 1-5
- Neon DB numeric columns return strings — always use `parseFloat()` before `.toFixed()`
- Only 1 yacht has reviews: beneteau-oceanis-30-1 (6 reviews in DB, 3 with non-null ratings)
- The `reviews` table has columns: rating (numeric), summary, authorName, reviewDate, source

### Pre-existing test failures (not caused by this change)
- admin-reviews tests: table/heading not found (6 failures)
- compare tests: strict mode violation, table not loading (3 failures)
- embed-compare: regex syntax error in test, target assertion (2 failures)
- filter-presets: URL encoding mismatch (%5B vs [) (3 failures)
- favorites/mobile-ux/newsletter: localhost:3000 not running (~30 failures)
- price-tier: element not found (2 failures)
- print-spec-sheet: timeout clicking yacht link (3 failures)

### ROADMAP status
- Phase 5 item "Yacht review system" now complete
- Remaining Phase 5 items:
  - [ ] API for external consumption (rate-limited, documented)
  - [ ] Performance monitoring (Core Web Vitals tracking)

### Next recommended task
- Pick from remaining Phase 5 items, or Phase 4 (Yacht manufacturer guides on sailboats.fr linking back to database)
