# Sailing Yachts — Session Notes

## Session: 2026-06-21 22:20 CEST

### Summary
Fixed issue #453 — completed the removal of `@neondatabase/serverless` and migration of all Edge runtime routes to Node.js runtime.

### Issue Worked On
- **#453** — Fix Edge runtime DB routes for OCI PostgreSQL migration (priority: high)

### What Was Implemented
1. **Rewrote `lib/edge-pool.ts`** — Replaced `neon()` HTTP client with `pg` Pool. Kept the `edgePool.query()` API for backward compatibility.
2. **Rewrote `lib/db-edge.ts`** — Replaced `drizzle-orm/neon-http` + `neon()` with `drizzle-orm/node-postgres` + `pg` Pool. Kept as compatibility wrapper.
3. **Removed `runtime = 'edge'`** from 9 DB-backed routes:
   - `app/api/compare/route.ts`
   - `app/api/compare/share/route.ts`
   - `app/api/yachts/route.ts`
   - `app/api/yachts/[slug]/route.ts`
   - `app/api/yachts/[slug]/variants/route.ts`
   - `app/api/yachts/[slug]/also-viewed/route.ts`
   - `app/api/manufacturers/route.ts`
   - `app/api/manufacturers/[slug]/route.ts`
   - `app/api/search/route.ts`
4. **Kept Edge runtime** for `app/api/og/route.tsx` — doesn't use DB, only generates images
5. **Replaced direct `neon()` imports** with `edgePool` in 3 files that bypassed the shared lib
6. **Updated all scripts** (migrate.ts, seed-*.ts/js, p27-index-migration.js) to use `pg` Pool
7. **Updated test files** to use `pg` instead of `@neondatabase/serverless`
8. **Removed `@neondatabase/serverless`** from `package.json` dependencies

### Build/Test Results
- ✅ TypeScript: passes (`tsc --noEmit`)
- ✅ Next.js compilation: succeeds
- ⚠️ SSG fails locally due to pre-existing DB auth issue (`.env` password doesn't match OCI DB — Vercel has correct env vars)

### Deploy Status
- PR #455 merged to main
- ⚠️ Vercel has NOT auto-deployed — latest deploys are 2 days old (repeated SSG build failures may have paused auto-deploy)

### Live Verification Results (current production — OLD code)
- ✅ `/` — 200 OK
- ✅ `/yachts` — 200 OK
- ✅ `/search` — 200 OK
- ✅ `/compare` — 200 OK
- ✅ API `/api/yachts` — 10 yachts returned
- ✅ API `/api/search?q=beneteau` — 2 results
- ✅ API `/api/manufacturers` — 12 manufacturers
- ❌ API `/api/yachts/[slug]/also-viewed` — 500 (pre-existing Neon connection failure — this is exactly what our fix addresses)

### Known Issues
1. **Vercel not auto-deploying** — Latest Vercel deployments are 2+ days old. Likely due to repeated SSG build failures from DB auth issue during build. User may need to manually trigger a Vercel deploy or fix the SSG DB connection.
2. **Local `.env` DB password** — `neondb_owner:sailboats2026` fails auth against OCI PostgreSQL at 92.5.167.113. The correct password may be different or the user may have changed it.
3. **Next.js 14 security advisories** — Still needs major upgrade to next@16.

### Next Recommended Tasks
1. **Trigger Vercel deploy** — Manually deploy main branch or check Vercel auto-deploy settings
2. **Fix SSG DB connection** — Ensure Vercel env vars have correct OCI PostgreSQL credentials for build-time SSG
3. **Next.js 14→16 migration** — Address all high-severity security advisories
4. **Consider dynamic rendering** — If SSG build DB issues persist, consider switching SSG pages to `dynamic = 'force-dynamic'` or use ISR with fallback
