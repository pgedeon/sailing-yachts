# Sailing Yachts — Improvement Roadmap

Created: 2026-03-27
Updated: 2026-03-28
Status: Active
Repo: https://github.com/pgedeon/sailing-yachts
Vercel: sailing-yachts (peter-gedeons-projects)
Cron: sailing-yachts-builder (every 6h)

## Current State
- **Version:** 0.1.1
- **Stack:** Next.js 14, Drizzle ORM, Neon PostgreSQL, Vercel
- **CI/CD:** GitHub Actions (typecheck + build + lint), Vercel auto-deploy
- **Tests:** Playwright smoke tests (37 test cases across all public pages)
- **Data:** 3 manufacturers, 3 yacht models (seed data only)
- **Open issues:** 0

## Phase 0 — Fix Build & CI (Priority: Critical)
- [x] Diagnose and fix Vercel build error
- [x] Add GitHub Actions CI workflow (build + typecheck + lint) — Issue #2, PR #5
- [x] Add Playwright E2E test suite (smoke tests for all pages) — Issue #3, PR #6
- [x] Verify successful deploy on Vercel
- [ ] Create GitHub issue template for feature tracking

## Phase 1 — Data & Content (Priority: High)
- [ ] Expand manufacturer database (target: 50+ manufacturers)
- [ ] Add yacht models with real specs (target: 200+ models)
- [ ] Add high-quality yacht images ( royalty-free or manufacturer press)
- [ ] Seed data script for bulk import (CSV/JSON support)
- [ ] Data validation schema (Zod) for all inputs

## Phase 2 — Core Features (Priority: High)
- [ ] Advanced comparison tool (side-by-side 2-4 yachts, all specs)
- [ ] Search with autocomplete (manufacturer + model name)
- [ ] Saved comparisons (localStorage + shareable URLs)
- [ ] Responsive mobile UX audit and fixes
- [ ] SEO: dynamic meta tags, Open Graph, structured data (JSON-LD)
- [ ] Sitemap.xml generation

## Phase 3 — User Features (Priority: Medium)
- [ ] User favorites / shortlist (localStorage, no auth needed)
- [ ] "Find similar yachts" feature (spec-based similarity scoring)
- [ ] Price range indicator (where data available)
- [ ] Filter presets ("Bluewater cruisers", "Racing yachts", "Budget friendly")
- [ ] Print-friendly yacht spec sheets

## Phase 4 — Integration with sailboats.fr (Priority: Medium)
- [ ] Embeddable yacht comparison widget for sailboats.fr posts
- [ ] Cross-linking: yacht pages link to relevant sailboats.fr articles
- [ ] Shared affiliate links on yacht recommendation pages
- [ ] Yacht manufacturer guides on sailboats.fr linking back to database

## Phase 5 — Advanced Features (Priority: Low)
- [ ] Yacht review system (admin-managed, not user-generated)
- [ ] Newsletter signup for new yacht announcements
- [ ] API for external consumption (rate-limited, documented)
- [ ] Performance monitoring (Core Web Vitals tracking)
- [ ] Image optimization pipeline (WebP, lazy loading, blur placeholders)

## Cron Workflow
The `sailing-yachts-builder` cron runs every 6 hours and:
1. Checks GitHub issues labeled `auto-build` for tasks
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
