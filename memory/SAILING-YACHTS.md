# Sailing Yachts — Session Log

## Session: 2026-06-05 22:20 CEST

### Issue: #385 — P23.5: Yacht of the Week / Featured Rotation

### What Was Implemented
- **DB schema**: `featured_yachts` table (id, yacht_model_id, week_start, week_end, headline, editorial_text, newsletter_sent, is_manual_override, is_active, timestamps)
- **Migration**: 0008_featured_yachts applied to Neon DB via node/pg
- **Service layer**: `lib/featured-yacht-service.ts` — getActiveFeaturedYacht, getRecentFeaturedYachts, getAllFeaturedYachts, createFeaturedYacht, updateFeaturedYacht, deleteFeaturedYacht, markNewsletterSent, generateDefaultHeadline
- **Public API**: `/api/featured` (force-dynamic) — returns active + recent featured yachts
- **Admin API**: `/api/admin/featured` (force-dynamic) — full CRUD + newsletter tracking
- **Admin UI**: `/admin/featured` — search/select yacht, week range picker, headline/editorial fields, activate/deactivate, delete, mark newsletter sent
- **Admin dashboard**: New "Featured Yachts" card added to admin home
- **Homepage component**: `FeaturedYachtOfTheWeek` — client component, gracefully hidden when no featured yacht
- **Landing page**: `/[locale]/yacht-of-the-week` — hero, active featured yacht with full specs, archive grid, newsletter CTA, Product JSON-LD
- **i18n**: Full en + fr translations for all new strings (FeaturedYacht namespace)
- **Tests**: 27 tests in `tests/featured-yacht.test.ts`

### Build/Test Results
- TypeScript: ✅ Pass
- Build: ✅ Pass
- Tests: ✅ 27/27 pass

### Deploy
- PR #386 (feature) → merged (squash)
- PR #387 (force-dynamic fix) → merged (squash)
- Manual `vercel --prod` deploy required (auto-deploy disabled in vercel.json)

### Live Verification (all PASS)
- `/` ✅ | `/yachts` ✅ | `/search` ✅ | `/compare` ✅
- `/yacht-of-the-week` ✅ — renders correctly with empty state
- `/api/featured` ✅ — returns `{active: null, recent: []}`
- `/api/yachts` ✅ — returns yacht data

### Post-Deploy Fix
- `/api/featured` initially returned 404 — route was prerendered as static (○) because it had no `force-dynamic` export
- Fix: Added `export const dynamic = "force-dynamic"` to both `/api/featured/route.ts` and `/api/admin/featured/route.ts`

### Next Recommended Task
- **P23.6** — Referral link generator (next unchecked item in FUTURE_ROADMAP.md Phase 23)
- Or seed the first featured yacht via admin UI to validate the full flow end-to-end

### Lessons
- API routes using DB must have `export const dynamic = "force-dynamic"` to prevent static prerendering on Vercel
- `vercel.json` has `deploymentEnabled: false` for GitHub — need manual `vercel --prod` deploys
