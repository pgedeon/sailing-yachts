# Sailing Yachts — Improvement Roadmap

Created: 2026-03-27
Updated: 2026-04-02
Status: Active
Repo: https://github.com/pgedeon/sailing-yachts
Vercel: sailing-yachts (peter-gedeons-projects)
Cron: sailing-yachts-builder (every 6h)

## Current State
- **Version:** 0.2.0
- **Stack:** Next.js 14, Drizzle ORM, Neon PostgreSQL, Vercel
- **CI/CD:** GitHub Actions (typecheck + build + lint), Vercel auto-deploy
- **Tests:** Playwright smoke tests (44 test cases across all public pages)
- **Data:** 42 manufacturers, 201 yacht models (seed data + bulk import)
- **Open issues:** 0
- **Validation:** Zod schemas on all admin CRUD routes
- **SEO:** Dynamic sitemap.xml, robots.txt, meta tags, JSON-LD
- **Search:** Full-text search with autocomplete

## Phase 0 — Fix Build and CI (Priority: Critical) — COMPLETE
- [x] Diagnose and fix Vercel build error
- [x] Add GitHub Actions CI workflow (build + typecheck + lint) — Issue #2, PR #5
- [x] Add Playwright E2E test suite (smoke tests for all public pages) — Issue #3, PR #6
- [x] Verify successful deploy on Vercel
- [x] Create GitHub issue templates for feature tracking — Issue #7, PR #15

## Phase 1 — Data and Content (Priority: High) — COMPLETE
- [x] Expand manufacturer database (target: 50+ manufacturers) — PR #22 (42 manufacturers with 20 new added)
- [x] Add yacht models with real specs (target: 200+ models) — Issue #35 (201 models across 42 manufacturers)
- [x] Add high-quality yacht images (Issue #23, PR #24) (royalty-free or manufacturer press)
- [x] Seed data script for bulk import (CSV/JSON support) — Issue #9, PR #17
- [x] Data validation schema (Zod) for all inputs — Issue #8, PR #16

## Phase 2 — Core Features (Priority: High) — COMPLETE
- [x] Advanced comparison tool (side-by-side 2-4 yachts, all specs) — Issue #27, PR #28
- [x] Search with autocomplete (manufacturer + model name) — Issue #25, PR #26
- [x] Saved comparisons (localStorage + shareable URLs) — Issue #29, PR #30
- [x] Responsive mobile UX audit and fixes — Issue #31, PR #32
- [x] SEO: dynamic meta tags, Open Graph, structured data (JSON-LD)
- [x] Sitemap.xml generation — Issue #11, PR #14

## Phase 3 — User Features (Priority: Medium) — COMPLETE
- [x] User favorites / shortlist (localStorage, no auth needed) — Issue #33, PR #34
- [x] Find similar yachts feature (spec-based similarity scoring) — API + UI with match scores
- [x] Price range indicator (where data available) — Issue #41, PR #42
- [x] Filter presets (Bluewater cruisers, Racing yachts, Budget friendly) — Issue #43, PR #44
- [x] Print-friendly yacht spec sheets — Issue #45, PR #46

## Phase 4 — Integration with sailboats.fr (Priority: Medium)
- [x] Embeddable yacht comparison widget for sailboats.fr posts — Issue #49, PRs #50 #51 #52
- [x] Cross-linking: yacht pages link to relevant sailboats.fr articles — Issue #47, PR #48
- [x] Shared affiliate links on yacht recommendation pages — Issue #53, PR #54
- [ ] Yacht manufacturer guides on sailboats.fr linking back to database

## Phase 5 — Advanced Features (Priority: Low)
- [x] Yacht review system (admin-managed) — AggregateRating & Review entries in JSON-LD
- [x] Newsletter signup for new yacht announcements
- [x] API for external consumption (rate-limited, documented) — Issue #70, PR #71
- [ ] Performance monitoring (Core Web Vitals tracking)
- [x] Image optimization pipeline (WebP, lazy loading, blur placeholders) ✅ #55

## Cron Workflow
The sailing-yachts-builder cron runs every 6 hours and:
1. Checks GitHub issues labeled auto-build for tasks
2. Picks the highest-priority unassigned issue
3. Implements the feature/fix with tests
4. Runs typecheck + build locally to verify
5. Pushes to a feature branch, opens a PR
6. After CI passes, merges to main (Vercel auto-deploys)
7. Closes the issue with a summary comment
8. Logs progress to memory/SAILING-YACHTS.md

## Testing Standards
- Every new feature must have at least one Playwright E2E test
- All API routes must have error handling tests
- Typecheck must pass before any merge
- Build must succeed locally before push
