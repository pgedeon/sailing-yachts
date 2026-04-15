# Sailing Yachts Project — Session Memory

## Session: 2026-04-15 21:50 UTC

### Issue #144: P9.2 — DB-backed Favorites + Saved Comparisons ✅
- **PR**: #145 (squash-merged)
- **What**: user_favorites + saved_comparisons tables, API routes, useFavorites DB sync
- **Key changes**:
  - `drizzle/schema.ts`: user_favorites and saved_comparisons tables
  - `app/api/user/favorites/route.ts`: GET/POST/DELETE with auth protection
  - `app/api/user/comparisons/route.ts`: GET/POST/DELETE with auth protection
  - `lib/useFavorites.ts`: Detects auth session, syncs to DB when logged in, localStorage fallback
  - `drizzle/migrations/0005_add_user_favorites_comparisons.sql`: Migration
- **Build**: typecheck ✅, lint ✅, local build ✅
- **Deploy**: Vercel ✅
- **Live verification**: All 5 pages OK, API 201 yachts, all 6 user endpoints return 401
- **Tests**: 9/9 user-favorites + 10/10 auth + 11/11 compare-export = 30 total, 0 regressions

### Issue #141: P9.1 — Real Auth Foundation ✅ (earlier today)
- **PR**: #142 (squash-merged)

### Issue #138: P8.5 — Premium Comparison Exports ✅ (earlier today)
- **PR**: #139 (squash-merged)

## Phase Status
- Phase 6: ALL COMPLETE (P6.1-P6.9)
- Phase 7: ALL COMPLETE (P7.1-P7.8)
- Phase 8: P8.1-P8.6, P8.8 ✅ | P8.7 blocked (needs price data)
- Phase 9: P9.1 ✅, P9.2 ✅ | P9.3-P9.8 pending

## Key Project Facts
- Project: /root/.openclaw/workspace/sailing-yachts
- GitHub: pgedeon/sailing-yachts
- Live URL: https://info.sailboats.fr/
- Yacht count: 201
- Auth: next-auth with credentials provider, DB-backed users table
- Admin: admin@sailing-yachts.com (bcrypt hashed)
- DB tables added: users (P9.1), user_favorites, saved_comparisons (P9.2)

## Known Issues
- CI build fails on GitHub Actions (DATABASE_URL not set) — pre-existing
- P8.7 (best-value pages) blocked by insufficient price data (only 2 records)
- Drizzle migration journal has mismatched filenames — works but messy
- useFavorites clearAll doesn't clear DB favorites (needs DELETE all endpoint)

## Next Recommended Tasks
- **P9.3** — Saved search builder
- **P9.4** — Comparison save UI (button in CompareClient to save to DB)
- **P9.5** — Account dashboard (manage favorites, comparisons, profile)
- P8.7 still blocked by price data
