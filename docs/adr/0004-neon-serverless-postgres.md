# ADR 0004: Neon Serverless PostgreSQL

## Status
Accepted — 2026-01-10

## Context

The project needed a PostgreSQL provider that:
- Works well with Vercel serverless deployment model
- Supports connection pooling (serverless = many short-lived connections)
- Offers a generous free tier for development
- Has branching for staging/preview environments
- Provides HTTP-based query API for Edge runtime compatibility

Options considered:
1. **Neon** — Serverless Postgres with HTTP API, branching, autoscaling
2. **Supabase** — Managed Postgres with built-in auth/realtime
3. **Railway** — Simple managed Postgres
4. **Self-hosted** — RDS/DigitalOcean (too much ops overhead)

## Decision

Use **Neon** as the PostgreSQL provider.

Key reasons:
- **HTTP serverless driver** — `@neondatabase/serverless` works in Edge Runtime via fetch API
- **Connection pooling built-in** — Neon's pooled connection string handles serverless scale
- **Database branching** — create preview databases for PR review
- **Scale-to-zero** — free tier with autoscaling, no idle costs
- **Standard Postgres** — full compatibility with Drizzle ORM, standard SQL, pg_trgm extension

## Consequences

### Positive
- **Edge-compatible** — HTTP driver enables Edge Runtime API routes (see ADR 0001)
- **No connection pool config** — Neon handles pooling server-side
- **Branching for testing** — schema changes can be tested on a branch before merge
- **Cost-effective** — free tier covers development, predictable pricing at scale

### Negative
- **Cold starts** — Neon compute can have ~1s cold start after idle period (mitigated with autoscaling)
- **Vendor lock-in** — HTTP driver is Neon-specific (but standard pooled connection also available)
- **SSG timeout risk** — during large static generation, Neon connections can time out (handled with retry logic)

### Neutral
- `DATABASE_URL` uses the pooled endpoint (`-pooler`) for app queries
- Migrations use the direct connection (non-pooled) for DDL operations
- pg_trgm extension enabled for fuzzy text search (manufacturer names)
