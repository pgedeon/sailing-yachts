## Playwright Admin Test Report (2026-02-27 - Run 2)

### Test Execution Summary
- Command: `npx playwright test tests/admin.spec.ts --reporter=html --output=test-results --trace=on-first-retry`
- Total tests: 15
- Passed: 0
- Failed: 15
- Skipped: 0
- Duration: ~8.9s (command runtime)
- Workers: 1
- HTML report: `playwright-report/index.html`

### Full Test Results
- FAIL: Admin Section E2E Tests › should show login page when accessing admin without auth
- FAIL: Admin Section E2E Tests › should login successfully with valid credentials
- FAIL: Admin Section E2E Tests › should logout successfully
- FAIL: Admin Section E2E Tests › should protect admin routes without auth
- FAIL: Admin Section E2E Tests › should display manufacturers listing after login
- FAIL: Admin Section E2E Tests › should display yacht listings after login
- FAIL: Admin Section E2E Tests › should display spec categories listing after login
- FAIL: Admin Section E2E Tests › should open yacht edit page without error
- FAIL: Admin Section E2E Tests › should open manufacturer edit page without error
- FAIL: Admin Section E2E Tests › should open spec category edit page without error
- FAIL: Admin Section E2E Tests › should create a new yacht via form
- FAIL: Admin Section E2E Tests › should create a new manufacturer via form
- FAIL: Admin Section E2E Tests › should create a new spec category via form
- FAIL: Admin Section E2E Tests › should edit yacht and save changes
- FAIL: Admin Section E2E Tests › should have no console errors on admin pages

### Key Findings
- All tests failed during Chromium launch with `browserType.launch: Target page, context or browser has been closed`.
- The browser exited with `FATAL:content/browser/sandbox_host_linux.cc:41 Check failed: . shutdown: Operation not permitted (1)`.
- No application-level functionality or UI behavior could be validated due to the launch failure.

### Screenshots
- Expected location: `test-results/**/*.png`
- Actual: none generated (browser did not start).

### Traces
- Trace config: `on-first-retry`
- Actual trace files: none generated (no retries occurred before launch failure).

### Recommendations
- Ensure Chromium can start in this environment: verify kernel sandbox support or run in a container/host that permits Playwright sandbox operations.
- If available, set `PLAYWRIGHT_BROWSERS_PATH=0` and rerun `npx playwright install chromium --with-deps` to ensure compatible binaries and dependencies.
- After resolving the sandbox error, rerun the admin suite to capture real functional and UI results (including screenshots and traces).
