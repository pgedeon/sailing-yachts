# ADR 0005: ISR with Cache Tags for Data Freshness

## Status
Accepted — 2026-05-28

## Context

The site has ~1500+ static pages generated at build time (yacht details, manufacturer pages, size category hubs, use-case pages, comparison pages). Rebuilding all pages on every data change is too slow (10+ minute builds).

However, some pages need fresh data:
- Yacht detail pages when specs are updated
- Manufacturer pages when new models are added
- Listing pages when new yachts are seeded

Options considered:
1. **Full SSG** — Rebuild entire site on every data change (simple but slow)
2. **SSR** — Render every request (accurate but slow for users, expensive)
3. **ISR with time-based revalidation** — Revalidate every N seconds (good middle ground)
4. **ISR with on-demand revalidation** — Revalidate specific pages when data changes (best accuracy)

## Decision

Use **ISR with time-based revalidation (1 hour) + cache tags** for granular invalidation.

Implementation:
- Most data-driven pages use `revalidate = 3600` (1 hour)
- Pages are tagged with `cache tags` (e.g., `yachts`, `yacht:beneteau-oceanis-40-1`, `manufacturers`)
- Admin "publish" actions call `revalidateTag()` for targeted cache busting
- Sitemap endpoints revalidate daily
- Home page revalidates every 5 minutes (featured yacht, stats)

## Consequences

### Positive
- **Fast builds** — only changed pages revalidate, not the full site
- **Fresh data** — users see updates within 1 hour (or instantly with manual revalidation)
- **Granular control** — cache tags allow invalidating specific resources (one yacht, one manufacturer)
- **Cost-effective** — fewer full rebuilds means less Vercel build minutes

### Negative
- **Stale data window** — up to 1 hour between data change and user-visible update (without manual revalidation)
- **Cache tag management** — developers must remember to add appropriate tags when calling `unstable_cache`
- **Vercel-specific** — cache tags are a Vercel feature, reducing portability

### Neutral
- Admin dashboard has a "force rebuild" button that triggers `revalidateTag('yachts')` for bulk refresh
- Programmatic landing pages (Phase 19) use the same pattern with per-category tags
