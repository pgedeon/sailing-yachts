# Sailing Yachts — Session Log

## Session: 2026-06-06 00:20 UTC

### Issue: #388 — P24.1: User Behavior Analytics Dashboard

### What Was Implemented
- **DB schema**: `analytics_events` table (event_type, page, entity_id, entity_type, session_id, metadata, referrer, user_agent, country, timestamps)
- **Migration**: 0022_analytics_events applied to Neon DB via node/pg
- **Server service**: `lib/analytics-service.ts` — insertAnalyticsEvents, getAnalyticsSummary, getEventTrend, getMultiMetricTrend, getPopularYachts, getPopularSearches, getComparisonPatterns, getPageViewBreakdown, getTopReferrers, getEventCountsByType, getAdminAnalyticsDashboard
- **Client tracker**: `lib/analytics-tracker.ts` — batched event sender (sendBeacon/fetch), anonymous session management, Do Not Track respect, auto-flush on page hide/visibility change
- **Public API**: POST `/api/analytics` (force-dynamic) — collects batched events from client (max 50/batch)
- **Admin API**: GET `/api/admin/analytics` (force-dynamic) — returns full dashboard data with configurable period
- **Admin UI**: `/admin/analytics` — summary cards with sparklines, multi-line SVG trend chart, popular yachts/searches/comparisons, page breakdown bars, event distribution by type, top referrers
- **Client integration**:
  - `trackYachtView` on yacht detail page (YachtDetailClient.tsx)
  - `trackCompare` on compare page (CompareClient.tsx)
  - `trackSearch` on search page (SearchClient.tsx)
  - `trackPageView` globally via AnalyticsPageTracker component in root layout
- **Admin dashboard**: New "Analytics" card added to admin home
- **Tests**: 16 tests in `tests/analytics.test.ts`

### Also Done
- Marked Phase 23 as ✅ COMPLETE in FUTURE_ROADMAP.md
- Marked P23.5 as completed with issue reference
- Updated Phase 24 to 🔲 ACTIVE

### Build/Test Results
- TypeScript: ✅ Pass
- Build: ✅ Pass
- Tests: ✅ 16/16 pass
- CI (Lint + TypeScript + Build + Perf Budgets): ✅ All pass

### Deploy
- PR #389 (feature/issue-388-analytics-dashboard) → merged (squash)
- Manual `vercel --prod` deploy

### Live Verification (all PASS)
- `/` ✅ | `/yachts` ✅ | `/search` ✅ | `/compare` ✅
- `/yachts/beneteau-oceanis-40-1` ✅
- POST `/api/analytics` ✅ — events inserted successfully (verified with test event)
- GET `/api/admin/analytics` ✅ — returns aggregated data with summary
- `/admin/analytics` ✅ — renders dashboard page

### Next Recommended Task
- **P24.2** — A/B testing framework admin dashboard (infrastructure exists in ab-testing.ts, needs admin UI + statistical significance calculator)
- Or **P24.3** — Conversion funnel tracking

### Lessons
- Template literal `${}` in sed/python replacements needs careful escaping — use file-based Python with proper string handling
- `paramIdx` increment must match the number of placeholders/values in batch insert
- Analytics tracker respects Do Not Track by default
- Global page tracking should skip /admin and /api routes
