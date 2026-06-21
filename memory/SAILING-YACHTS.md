# Sailing Yachts — Session Notes

## Session: 2026-06-20 22:40 CEST

### Summary
Maintenance & cleanup session. All roadmap phases (14-27) are COMPLETE.

### Actions Taken

#### 1. Merged PR #448 — Dependency Compatibility Fix
- Added `zod` and `react-is` as explicit dependencies
- Upgraded drizzle-orm 0.35→0.45, drizzle-kit 0.26→0.31, drizzle-zod 0.5→0.8
- Upgraded @sentry/nextjs, next-intl, marked, next-auth, pg, web-vitals, etc.
- TypeScript: ✅ Pass (was 176 errors without zod fix)
- Build: ⚠️ Fails in CI due to Neon compute quota exceeded (HTTP 402) — pre-existing, not caused by changes
- Security Audit: ⚠️ 1 high (next@14 vulns, needs next@16 major upgrade), rest are dev-dep only

#### 2. Merged 4 Dependabot GitHub Actions PRs
- #439: actions/checkout 5→6
- #440: actions/download-artifact 4→8
- #441: github/codeql-action 3→4
- #438: actions/upload-artifact 4→7

#### 3. Closed Stale PRs (7 total)
- #446 (dependabot npm minor/patch) — superseded by #448
- #443 (dependabot npm major) — partially addressed by #448, remaining are breaking
- #368 (data enrichment) — already completed via PR #367
- #233 (French i18n detail/compare) — already completed P14.3
- #67 (JSON-LD bestRating) — already implemented
- #12 (SEO meta tags) — already implemented across multiple phases

#### 4. Closed Stale Issue
- #60 (old status report from 2026-04-03) — no longer relevant

### Live Site Verification
- ✅ / — 200 OK
- ✅ /yachts — 200 OK
- ✅ /search — 200 OK
- ✅ /compare — 200 OK
- ✅ API /api/yachts — returns data

### Known Issues
1. **Neon compute quota exceeded** — CI build fails because Neon returns HTTP 402 during SSG. This is a billing/quota issue, not a code issue.
2. **Next.js 14 security advisories** — Multiple high-severity vulns in next@14. Fix requires major upgrade to next@16 (breaking change). Should be planned as a dedicated effort.
3. **npm audit (dev deps)** — cookie, tmp, esbuild vulnerabilities in dev-only deps (lighthouse, @lhci/cli, drizzle-kit). Not exposed in production.

### Project Status
- **All 14 phases (14-27) COMPLETE**
- No remaining open issues or PRs (clean repo)
- Next major effort: Next.js 14→16 upgrade to address security advisories

### Next Recommended Tasks
1. **Next.js 14→16 migration** — Addresses all high-severity security advisories. Breaking change requiring careful migration (app router, middleware, etc.)
2. **Neon quota investigation** — CI builds fail due to compute quota. Either upgrade Neon plan or optimize SSG to reduce DB queries.
3. **Security hardening** — Consider upgrading next-auth to v5 (Auth.js), which would fix uuid vulnerability.
