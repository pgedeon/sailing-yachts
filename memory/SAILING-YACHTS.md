# Sailing Yachts — Session Notes

## 2026-04-07: P6.4 Canonical X vs Y Comparison Pages (INCOMPLETE)

### Issue #81: P6.4 - Canonical X vs Y comparison pages
- **Status**: ⚠️ Partial - Deployed but data fetch failing in production
- **PRs**: #89 (initial implementation), #90 (DB query fix attempt)

### What was implemented
1. Created new route `/compare/[slugA]-vs-[slugB]` for SEO-friendly canonical comparison pages
2. Added `lib/compare-canonical.ts` with:
   - `getYachtsBySlugs()` - fetch yacht data by slugs with caching
   - `getPrimaryImage()` - fetch primary yacht image
   - `generateComparisonIntro()` - dynamic intro copy from yacht data
   - `generateComparisonMetadata()` - SEO metadata and keywords
3. Server-side rendered with ISR (6-hour revalidation)
4. Canonical tags and unique intro copy generated dynamically
5. JSON-LD structured data (Product schema + BreadcrumbList)
6. Internal links to both yacht detail pages:
   - Header View buttons
   - Learn More section with yacht detail links
7. Comprehensive comparison table with all spec groups:
   - Dimensions (LOA, beam, draft, displacement, ballast)
   - Rigging & Sails (sail area, rig type)
   - Construction (keel type, hull material)
   - Accommodation (cabins, berths, heads, max occupancy)
   - Technical (engine HP/type, fuel/water capacity)
   - Design notes (if present)
   - Price tier badges
8. Updated sitemap.xml to include canonical comparison pages for top 50 yachts (1,225 pairs)
9. Playwright tests created: `e2e/canonical-compare.spec.ts`

### Verification
- ✅ Typecheck: PASS
- ✅ Build: PASS (both PRs)
- ✅ All critical pages: OK (/, /yachts, /search, /compare)
- ✅ Canonical page loads: OK (returns 200)
- ❌ Canonical page content: FAIL (shows "Yacht Comparison Not Found")

### Issues found post-deploy
**CRITICAL: Canonical comparison pages have runtime data fetch failure**
- Page loads (HTTP 200) but displays "Yacht Comparison Not Found"
- Both yachts exist in DB (verified via /api/yachts?slug=beneteau-oceanis-30-1)
- Query using Drizzle ORM with `.or(eq(yachtModels.slug, slugA), eq(yachtModels.slug, slugB))` returns empty
- Debug logging added but not accessible in production response
- Root cause likely: `yachtModels.slug` is NULL in Vercel Neon DB or query pattern incompatible

### Fix attempts
1. **PR #89**: Initial implementation with pool.query for getPrimaryImage - failed in Vercel
2. **PR #90**: Replaced pool.query with Drizzle select, added debug logging - deployed but query still fails

### Blocker
Cannot diagnose further without:
- Access to Vercel function logs to see debug output
- Local reproduction of Vercel Neon DB state
- Direct DB query inspection (slugs may be NULL)

### Current state
- Canonical comparison page route exists and is deployed
- Page structure, UI, and SEO implementation is correct
- Data fetching fails due to DB query issue
- Issue #81 cannot be closed until root cause is identified and fixed

### Next recommended tasks
Continue Phase 6 with:
- P6.5: Schema enrichment sweep (adds CollectionPage, ItemList, FAQPage schemas)
- P6.6: Split sitemaps + image sitemap
- P6.7: Internal linking modules
- P6.8: Thin-page governance (canonical/noindex rules)

Return to P6.4 once Vercel logs available for debugging.

---

## 2026-04-04: AggregateRating JSON-LD + Bug Fixes

[... previous entries unchanged ...]
