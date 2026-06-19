# ADR 0001: Edge Runtime for Public API Routes

## Status
Accepted — 2026-05-31

## Context

The public API endpoints (`/api/v1/yachts`, `/api/v1/search`, etc.) are the most frequently called routes. They serve yacht data to thousands of visitors and are critical for fast page loads.

Running all API routes on the default Node.js runtime meant:
- Cold start latency of 200-500ms on Vercel serverless functions
- Higher infrastructure costs (Node.js functions are more expensive at scale)
- Slower global response times (functions deployed to limited regions)

## Decision

Migrate public read-only API routes to **Edge Runtime**, keeping admin and heavy write operations on Node.js runtime.

Implementation:
- Created `lib/db-edge.ts` — Edge-safe Drizzle module using `@neondatabase/serverless` HTTP client
- Created `lib/edge-pool.ts` — Neon HTTP Pool wrapper for batched queries over fetch API
- Migrated 6 public routes: yachts list, yacht detail, manufacturers list, manufacturer detail, search, compare
- Removed `pg` dependency from Edge bundle (not Edge-compatible)
- Admin routes remain on Node.js (they need `pg` for transactions and heavy operations)

## Consequences

### Positive
- **~10x faster cold starts** (Edge functions start in ~50ms vs 500ms)
- **Global edge deployment** — responses served from nearest Vercel Edge node
- **Lower costs** — Edge function invocations are cheaper
- **Better Core Web Vitals** — faster API responses improve LCP/FID

### Negative
- **No Node.js APIs** — no `fs`, `crypto.randomBytes`, etc. in Edge routes
- **Database limitations** — must use HTTP-based Neon client, no persistent connections
- **Module compatibility** — some npm packages are not Edge-safe and must be excluded
- **Two DB modules** — developers must choose between `lib/db.ts` and `lib/db-edge.ts`

### Neutral
- Admin routes unaffected (still Node.js)
- Test coverage unchanged (Playwright tests hit the live endpoints)
