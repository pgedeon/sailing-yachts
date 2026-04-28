### Phase 14 — French Localization & Internationalization (Priority: High)

The site lives on `info.sailboats.fr` (a French domain) and cross-links with `sailboats.fr` (French content), yet all UI text is English. Adding French language support will double the addressable audience, improve SEO for French search queries, and create a coherent multilingual experience. Implementation uses Next.js 14 App Router i18n with `[locale]` route segment.

- ~~**P14.1 — i18n infrastructure & French translation system:** Set up `next-intl` (or equivalent) with message catalogs, locale detection middleware, `[locale]` route group, and a `useTranslations` hook. Translate all static UI strings in header, footer, navigation, and homepage. Add language switcher component. Tests: i18n unit tests for message loading, locale detection, and language switcher rendering. *(priority: critical — blocks all other P14 items)*~~ *(completed 2026-04-27 — PR #227 + hotfix PR #228 for t.rich() serialization bug)*

- ~~**P14.2 — French translations for yacht listing & search pages:** Translate all UI text on `/yachts`, `/search`, filter labels, sort options, pagination, and yacht card labels. Translate filter presets (Bluewater cruisers, Racing yachts, etc.). Tests: French rendering tests for listing and search pages. *(completed 2026-04-27 — PR #230, 117 i18n tests)*

- ~~**P14.3 — French translations for yacht detail & comparison pages:** Translate yacht detail page labels (specs table headers, performance ratios, "Who is this boat for?", related yachts section). Translate compare page headers and labels. Tests: French rendering tests for detail and compare pages. *(completed 2026-04-28 — PR #232 + hotfix PRs #234 #235 for getMessages locale bug & NextIntlClientProvider locale prop)*

- [ ] **P14.4 — French translations for manufacturers, guides & glossary:** Translate manufacturer listing page, guide pages, and glossary pages. Add French glossary descriptions alongside English. Tests: French rendering tests for content pages.

- [ ] **P14.5 — French SEO & metadata:** Add French meta tags, JSON-LD, Open Graph, alternate hreflang tags (en/fr), French sitemap entries, and French RSS feed. Tests: SEO metadata tests for both locales.

- [ ] **P14.6 — French long-tail landing pages:** Translate best-value pages, cheaper-alternatives pages, and search-intent pages to French. Generate French variants of programmatic SEO pages. Tests: French long-tail page rendering tests.

### Notes
- Phase 14 makes the site accessible to the French-speaking sailing community.
- The `.fr` domain strongly signals French market targeting — French content is expected.
- Database content (yacht specs, manufacturer names) stays language-neutral.
- UI strings, labels, descriptions, and SEO metadata get translated.
- **⚠️ P14.1 gotcha:** `t.rich()` in `next-intl` v4 with RSC passes functions across server→client boundary, causing 500 errors. Use `t()` + direct JSX composition instead.
- **⚠️ P14.3 gotcha:** `getMessages()` without explicit `{ locale }` falls back to default locale (en) for client components. Also `NextIntlClientProvider` needs explicit `locale={locale}` prop. Both must be set in `app/[locale]/layout.tsx`.
- **Phase 14 is in progress.** P14.1–P14.3 complete, P14.4–P14.6 remaining.
