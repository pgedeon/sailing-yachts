### Phase 14 — French Localization & Internationalization (Priority: High) — ✅ COMPLETE

- ~~**P14.1 — i18n infrastructure & French translation system**~~ *(completed 2026-04-27)*
- ~~**P14.2 — French translations for yacht listing & search pages**~~ *(completed 2026-04-27)*
- ~~**P14.3 — French translations for yacht detail & comparison pages**~~ *(completed 2026-04-28)*
- ~~**P14.4 — French translations for manufacturers, guides & glossary**~~ *(completed 2026-04-28)*
- ~~**P14.5 — French SEO & metadata**~~ *(completed 2026-04-29)*
- ~~**P14.6 — French long-tail landing pages**~~ *(completed 2026-04-30)*

### Phase 15 — Interactive Spec Visualizations (Priority: High) — ✅ COMPLETE

- ~~**P15.1 — Spec comparison radar chart on compare page**~~ *(completed 2026-05-08 — PR #253, 22 tests)*
- ~~**P15.2 — Spec bars on yacht detail page**~~ *(completed 2026-05-06 — PR #245, #246, 17 tests)*
- ~~**P15.3 — Side-by-side bar charts on compare detail**~~ *(completed 2026-05-07 — PR #249, 15 tests)*
- ~~**P15.4 — Size distribution chart on yacht listing**~~ *(completed 2026-05-07 — PR #251, 10 tests)*
- ~~**P15.5 — Manufacturer fleet overview charts**~~ *(completed 2026-05-08 — PR #255, 8 tests)*

### Phase 16 — Manufacturer Data Enrichment (Priority: High) — ✅ COMPLETE

- ~~**P16.1 — Seed manufacturer metadata**~~ *(completed 2026-05-09 — PR #259, Issue #258)*
- ~~**P16.2 — Manufacturer logos and brand identity**~~ *(completed 2026-05-10 — PR #265, Issue #264, 12 tests)*
- ~~**P16.3 — Enhanced manufacturer listing page**~~ *(completed 2026-05-09 — PR #261, Issue #260)*
- ~~**P16.4 — Manufacturer detail page improvements**~~ *(completed 2026-05-10 — PR #263, Issue #262)*

### Phase 17 — Advanced Yacht Discovery & Smart Recommendations (Priority: High) — ✅ COMPLETE

- ~~**P17.1 — Advanced range filters with slider UI**~~ *(completed 2026-05-11)*
- ~~**P17.2 — Yacht "Use Case" tags & filter**~~ *(completed 2026-05-11 — PR #269, Issue #268, 25 tests)*
- ~~**P17.3 — Yacht Finder Wizard**~~ *(completed 2026-05-11 — PR #271, Issue #270, 23 tests)*
- ~~**P17.4 — "Yachts like this" smart recommendations**~~ *(completed 2026-05-12 — PR #273, Issue #272, 14 tests)*
- ~~**P17.5 — Saved search & alert system enhancement**~~ *(completed 2026-05-12 — PR #275, 31 tests)*

### Phase 18 — Performance & UX Polish (Priority: High)

The site has rich content and features but lacks several Next.js UX best practices: no loading skeletons (loading.tsx), no error boundaries (error.tsx), no custom not-found pages, and no streaming optimization. These gaps hurt perceived performance (LCP/FCP) and user experience when things go wrong. Adding proper loading states, error recovery, and polish transforms the site from "functional" to "professional-grade".

- **P18.1 — Loading skeletons for all route segments:** Add `loading.tsx` files for all major route segments (`/yachts`, `/yachts/[slug]`, `/compare`, `/compare/[slugA]-vs-[slugB]`, `/manufacturers`, `/manufacturers/[slug]`, `/guides`, `/guides/[slug]`, `/search`, `/glossary`, `/glossary/[slug]`). Each skeleton should match the page layout with animated pulse placeholders. Create a shared `Skeleton` component in `components/ui/skeleton.tsx`. Tests: verify loading.tsx files render without errors, snapshot tests for skeleton layout. *(priority: critical — directly impacts perceived LCP and FCP)*

- **P18.2 — Error boundaries with retry for all route segments:** Add `error.tsx` files for all major route segments with user-friendly error messages, retry button, and link back to home. Include error illustration/icon. Log errors to Sentry (already integrated). i18n-compatible error messages. Tests: verify error boundaries catch errors and display retry UI. *(priority: high — prevents white-screen-of-death)*

- **P18.3 — Custom 404/not-found page:** Add `not-found.tsx` at the app root and `[locale]` level with helpful navigation (search bar, popular yachts, browse manufacturers), branded illustration, and proper SEO meta (noindex). Tests: verify 404 renders for invalid routes. *(priority: high — reduces bounce on broken links)*

- **P18.4 — Scroll progress indicator & back-to-top button:** Add a subtle scroll progress bar at the top of content pages (yacht detail, guides, compare). Add a floating "back to top" button that appears after scrolling 300px. Both should be client components with smooth animations. i18n-compatible aria labels. Tests: rendering tests for both components. *(priority: medium — UX polish)*

- **P18.5 — Page transition animations:** Add subtle fade transitions between route changes using Next.js App Router conventions. Animate filter changes on /yachts page (fade in/out of yacht cards). Keep animations lightweight (CSS transitions, no heavy libraries). Respect prefers-reduced-motion. Tests: verify animations don't block content rendering. *(priority: medium — perceived speed)*

### Notes
- All loading skeletons must match the actual page layout — not generic spinners
- Error boundaries must be i18n-compatible (error messages in en + fr)
- Use `suspense` boundaries strategically to stream content progressively
- Skeletons should use the same Tailwind classes as real content for layout stability (CLS prevention)
- All animations must respect `prefers-reduced-motion` media query
- Keep JS bundle impact minimal — use CSS animations where possible
