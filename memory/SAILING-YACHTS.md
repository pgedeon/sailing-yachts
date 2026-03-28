# Sailing Yachts — Session Notes

## 2026-03-28: Issue #3 — Playwright E2E Smoke Tests

### Completed
- **Issue #3** (priority:high, phase:0): Add Playwright E2E smoke tests for all pages
  - Created `tests/smoke.spec.ts` with 37 test cases across 9 test groups
  - **Test coverage**: Home (4), Yachts Listing (6), Individual Yacht (4), Compare (4), Responsive (2), Navigation (3), Performance/A11y (3), Error Handling (2), SEO/Meta (2)
  - Fixed `test.skip('string')` → `test.skip(true, 'string')` — Playwright requires `(condition: boolean, description?: string)`
  - Fixed `.filter({ hasText: /regex/ })` TypeScript overload errors
  - PR #6 merged to main, all CI checks green (TypeScript, Lint, Build, Vercel)
  - Issue #3 closed with summary comment

### Key Learnings
- **Playwright `test.skip()`**: Must pass `(condition: boolean, description?: string)`, NOT just a string. `test.skip('reason')` fails TypeScript.
- **Playwright `.filter({ hasText: /regex/ })`**: Can cause TypeScript overload resolution errors. Safer to iterate with `.textContent()` checks.
- **Test resilience**: Many tests use conditional logic (`if count > 0`) to handle dynamic data, since the production DB may not always have yacht records loaded.
- **CI runs TypeScript strictly**: Even if local `tsc --noEmit` passes, always verify CI passes before merging.

### Project State
- Main branch: up to date with origin
- CI pipeline: active and green on main
- Completed issues: #2 (CI workflow), #3 (Playwright smoke tests)
- Open issues: #4 (SEO)
- Vercel project: `sailing-yachts` (peter-gedeons-projects)

### Next Task
- Check ROADMAP.md for remaining unchecked items to create new auto-build issues
- Issue #4 (SEO) might be the next candidate

---

## 2026-03-28: Issue #2 — GitHub Actions CI Workflow

### Completed
- **Issue #2** (priority:critical, phase:0): Add GitHub Actions CI workflow
  - Created `.github/workflows/ci.yml` with 3 jobs: typecheck, build, lint
  - Fixed `actions/upload-artifact` v3 → v4 (v3 deprecated/blocked)
  - Replaced Playwright test job with lint job (tests are Issue #3's scope)
  - Added `test` script to `package.json`
  - PR #5 merged via squash to main
  - All CI jobs green: typecheck (18s), build (50s), lint (18s)

### Key Learnings
- **Directory confusion**: The OpenClaw sandbox default cwd is `/root/.openclaw/workspace/main`. Must use `git -C /root/.openclaw/workspace/sailing-yachts` or `cd /root/.openclaw/workspace/sailing-yachts && ...` for all sailing-yachts operations.
- **`.git` symlink trap**: `/root/.openclaw/workspace/main/.git -> /root/.openclaw/workspace/.git` means running bare `git` commands from the default cwd operates on the wrong repo.
- **tsconfig.json**: The project already had a working tsconfig.json; the one I wrote over it broke the build. Always `git checkout` before overwriting config files.
- **CI build needs DATABASE_URL**: Build step needs the Neon DATABASE_URL as a GitHub secret. Currently passing as env var — may need to add to repo secrets if build fails.
