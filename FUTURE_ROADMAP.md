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

### Phase 12 — Performance & Reliability (Priority: Critical)
- ~~**P12.1 — Performance optimization:** Core browsing and search API optimization with caching, field selection, parallel queries, dynamic imports, and CDN headers. Tests: 7 unit tests for field selection, caching, and search modes.~~ *(completed 2026-04-23)*

### Notes
- Phase 12 focuses on making the site faster for end users.
- P12.1 delivers measurable payload reduction (50% for list views) and parallel DB queries.
- **Phase 12 is complete.**

### Phase 13 — Accessibility & Usability (Priority: High)
- ~~**P13.1 — Accessibility audit & fixes:** Run automated accessibility checks (axe-core via Playwright), fix critical WCAG 2.1 AA violations across all public pages (contrast, missing labels, keyboard nav, focus management). Tests: 25 accessibility tests (23 pass, 2 skip).~~ *(completed 2026-04-24)*
- ~~**P13.2 — Skip navigation & landmark structure:** Add skip-to-content link, proper ARIA landmarks (banner, main, contentinfo, navigation), and consistent heading hierarchy across all pages. Tests: 27 landmark and heading structure tests.~~ *(completed 2026-04-24)*
- ~~**P13.3 — Keyboard navigation enhancement:** Ensure all interactive elements (filters, compare selector, search, tabs) are fully keyboard-accessible with visible focus indicators. Tests: keyboard navigation E2E tests.~~ *(completed 2026-04-25)*
- ~~**P13.4 — Form accessibility & error handling:** Add proper labels, aria-describedby for errors, live regions for dynamic content updates, and accessible form validation across search, compare, and newsletter forms. Tests: form accessibility tests.~~ *(completed 2026-04-25)*
- ~~**P13.5 — Image alt text & media accessibility:** Audit all images for meaningful alt text, add aria-labels to icon-only buttons, ensure SVG icons have accessible names. Tests: media accessibility audit tests.~~ *(completed 2026-04-25)*
- ~~**P13.6 — Reduced motion & responsive accessibility:** Respect `prefers-reduced-motion`, ensure touch targets are 44px minimum, test with screen reader patterns. Tests: 50 reduced-motion and responsive a11y tests.~~ *(completed 2026-04-26)*

### Notes
- Phase 13 focuses on making the site accessible to all users.
- Accessibility improvements also improve SEO and overall UX.
- Priority order ensures the highest-impact fixes land first.
- **Phase 13 is complete.** All 6 items delivered.

### Phase 14 — French Localization & Internationalization (Priority: High)

The site lives on `info.sailboats.fr` (a French domain) and cross-links with `sailboats.fr` (French content), yet all UI text is English. Adding French language support will double the addressable audience, improve SEO for French search queries, and create a coherent multilingual experience. Implementation uses Next.js 14 App Router i18n with `[locale]` route segment.

- [ ] **P14.1 — i18n infrastructure & French translation system:** Set up `next-intl` (or equivalent) with message catalogs, locale detection middleware, `[locale]` route group, and a `useTranslations` hook. Translate all static UI strings in header, footer, navigation, and homepage. Add language switcher component. Tests: i18n unit tests for message loading, locale detection, and language switcher rendering. *(priority: critical — blocks all other P14 items)*

- [ ] **P14.2 — French translations for yacht listing & search pages:** Translate all UI text on `/yachts`, `/search`, filter labels, sort options, pagination, and yacht card labels. Translate filter presets (Bluewater cruisers, Racing yachts, etc.). Tests: French rendering tests for listing and search pages.

- [ ] **P14.3 — French translations for yacht detail & comparison pages:** Translate yacht detail page labels (specs table headers, performance ratios, "Who is this boat for?", related yachts section). Translate compare page headers and labels. Tests: French rendering tests for detail and compare pages.

- [ ] **P14.4 — French translations for manufacturers, guides & glossary:** Translate manufacturer listing page, guide pages, and glossary pages. Add French glossary descriptions alongside English. Tests: French rendering tests for content pages.

- [ ] **P14.5 — French SEO & metadata:** Add French meta tags, JSON-LD, Open Graph, alternate hreflang tags (en/fr), French sitemap entries, and French RSS feed. Tests: SEO metadata tests for both locales.

- [ ] **P14.6 — French long-tail landing pages:** Translate best-value pages, cheaper-alternatives pages, and search-intent pages to French. Generate French variants of programmatic SEO pages. Tests: French long-tail page rendering tests.

### Notes
- Phase 14 makes the site accessible to the French-speaking sailing community.
- The `.fr` domain strongly signals French market targeting — French content is expected.
- Database content (yacht specs, manufacturer names) stays language-neutral.
- UI strings, labels, descriptions, and SEO metadata get translated.
- **Phase 14 is in progress.**
