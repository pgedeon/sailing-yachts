### Concrete PR-Sized Backlog

- ~~**P11.1 — Error monitoring + tracing:** Add Sentry or equivalent for server/client errors, release tagging, and performance traces. Tests: instrumentation smoke tests and environment guard tests.~~ *(completed 2026-04-19)* 
- ~~**P11.2 — Query/index audit:** Review hot browse/search/detail queries, add missing DB indexes, and consider materialized search tables for faster list pages. Tests: query regression benchmarks and API response tests.~~ *(completed 2026-04-20)* 
- ~~**P11.3 — Lighthouse/performance budgets:** Add CI checks for LCP, CLS, JS bundle size, and image weight on the home page, yacht detail page, compare page, and key landing pages. Tests: automated performance budget pipeline.~~ *(completed 2026-04-20)*
- ~~**P11.4 — Feature flags + experiments:** Add a lightweight feature flag system and experiment assignment logic for CTA placement, copy, and monetization modules. Tests: assignment determinism tests and flag fallback tests.~~ *(completed 2026-04-20)*
- ~~**P11.5 — Visual regression testing:** Add screenshot-based coverage for critical pages like yacht detail, compare, long-tail landing pages, and forms. Tests: visual baseline pipeline.~~ *(completed 2026-04-20)*
- ~~**P11.6 — API contract testing:** Generate typed response contracts from route schemas and add CI coverage for public API stability. Tests: contract tests and negative-path coverage.~~ *(completed 2026-04-21)*
- ~~**P11.7 — Docs generation:** Replace the current placeholder docs rendering with generated API docs/OpenAPI-backed examples. Tests: route availability tests and docs snapshot coverage.~~ *(completed 2026-04-21)*
- ~~**P11.8 — Admin hardening:** Improve admin auth, secrets handling, audit logging, and access controls before broader team or partner use. Tests: auth/authorization tests and session expiry coverage.~~ *(completed 2026-04-22)*

### Notes

- Phase 11 should make the site noticeably easier for the cron agent to evolve safely.
- Experimentation is especially important once monetization and personalization are live.
- **Phase 11 is complete.** All 8 items delivered.
