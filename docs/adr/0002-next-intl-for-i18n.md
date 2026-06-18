# ADR 0002: next-intl for Internationalization

## Status
Accepted — 2026-04-27

## Context

The site targets both English-speaking and French-speaking sailing audiences. We needed an i18n solution that:
- Works seamlessly with Next.js App Router (Server Components)
- Supports locale-based routing (`/yachts` for EN, `/fr/yachts` for FR)
- Allows JSON-based message catalogs for easy translation management
- Supports SSR/SSG so translated content is in the HTML
- Doesn't require a heavy client-side bundle

Options considered:
1. **next-intl** — Purpose-built for Next.js App Router, JSON catalogs, RSC-compatible
2. **react-i18next** — Popular but requires client provider, larger bundle
3. **Custom solution** — Full control but high maintenance burden
4. **Lingui.js** — Good DX but less ecosystem support for Next.js App Router

## Decision

Use **next-intl** (v4+) for internationalization.

Implementation:
- Locale routing via `app/[locale]/` directory structure
- Messages in `messages/en.json` and `messages/fr.json`
- `i18n.ts` configuration at project root
- `next-intl/plugin` integrated via `next.config.js`
- Middleware for locale detection and redirect
- Server and client component translation hooks (`getTranslations`, `useTranslations`)
- Admin pages (`app/admin/`) are English-only (not under `[locale]`)

## Consequences

### Positive
- **Server Components compatible** — translations resolved at build time, zero client JS for translations
- **SEO-friendly** — localized URLs, proper `hreflang` tags, per-locale sitemaps
- **Developer-friendly** — `useTranslations('Namespace.Key')` with IDE autocomplete
- **Extensible** — adding a new locale is just a new JSON file + route segment
- **Message format** — ICU MessageFormat supports plurals, gender, selects

### Negative
- **Message catalog bloat** — `en.json` and `fr.json` can get large (hundreds of keys)
- **No auto-translation** — manual translation or external tooling required for new strings
- **Two message files to keep in sync** — if a key is added to `en.json` but not `fr.json`, French shows the key

### Neutral
- 2 locales (EN/FR) currently; architecture supports N locales
- Translation memory system (Phase 25) partially automates French content generation
