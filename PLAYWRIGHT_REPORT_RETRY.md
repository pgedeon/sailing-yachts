# Playwright Admin Tests Retry Report

Date: Fri Feb 27 07:38:42 CET 2026
Command: npx playwright test tests/admin.spec.ts --reporter=html --output=test-results --trace=on-first-retry

## Test execution summary
- Total: 15
- Passed: 0
- Failed: 15
- Skipped: 0
- Duration: not available (browser failed to launch before timing data was produced)
- Overall status: failed

## Full results list
- FAILED: tests/admin.spec.ts:12:7 › Admin Section E2E Tests › should show login page when accessing admin without auth
- FAILED: tests/admin.spec.ts:21:7 › Admin Section E2E Tests › should login successfully with valid credentials
- FAILED: tests/admin.spec.ts:30:7 › Admin Section E2E Tests › should logout successfully
- FAILED: tests/admin.spec.ts:42:7 › Admin Section E2E Tests › should protect admin routes without auth
- FAILED: tests/admin.spec.ts:48:7 › Admin Section E2E Tests › should display manufacturers listing after login
- FAILED: tests/admin.spec.ts:62:7 › Admin Section E2E Tests › should display yacht listings after login
- FAILED: tests/admin.spec.ts:76:7 › Admin Section E2E Tests › should display spec categories listing after login
- FAILED: tests/admin.spec.ts:90:7 › Admin Section E2E Tests › should open yacht edit page without error
- FAILED: tests/admin.spec.ts:105:7 › Admin Section E2E Tests › should open manufacturer edit page without error
- FAILED: tests/admin.spec.ts:121:7 › Admin Section E2E Tests › should open spec category edit page without error
- FAILED: tests/admin.spec.ts:137:7 › Admin Section E2E Tests › should create a new yacht via form
- FAILED: tests/admin.spec.ts:157:7 › Admin Section E2E Tests › should create a new manufacturer via form
- FAILED: tests/admin.spec.ts:177:7 › Admin Section E2E Tests › should create a new spec category via form
- FAILED: tests/admin.spec.ts:198:7 › Admin Section E2E Tests › should edit yacht and save changes
- FAILED: tests/admin.spec.ts:223:7 › Admin Section E2E Tests › should have no console errors on admin pages

## Screenshots
- None found in test-results

## Traces
- None found in test-results

## Key findings on admin functionality
- Tests did not reach the application. Chromium failed to launch for every test with a sandbox host error: "Check failed: . shutdown: Operation not permitted (1)".
- All admin scenarios are currently unverified in this run due to the browser launch failure.

## Recommendations
- Ensure the runtime permits Chromium sandboxing, or fully disable sandboxing at the environment level (container security profile, user namespaces, or equivalent).
- Re-run the test suite after the browser can launch to validate admin login, CRUD, and console error checks.
- If this environment must remain locked down, consider running the tests in an environment that allows headless Chromium to start successfully.
