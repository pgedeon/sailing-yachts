# Contributing to Sailing Yachts Database

Thank you for your interest in contributing! This guide covers everything you need to get started.

## Quick Start

### Prerequisites

- **Node.js** 18+ (recommend 20+)
- **PostgreSQL** database (we recommend [Neon](https://neon.tech) — free tier works great)
- **npm** 9+

### Setup

```bash
# Clone the repo
git clone https://github.com/pgedeon/sailing-yachts.git
cd sailing-yachts

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL, ADMIN_API_KEY, etc.

# Run database migrations
npx drizzle-kit migrate

# Seed initial data (optional, creates sample yachts & manufacturers)
npm run seed

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `ADMIN_API_KEY` | ✅ | Secret key for admin API access |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public URL (e.g., `https://info.sailboats.fr`) |
| `NEXTAUTH_SECRET` | For auth | NextAuth session secret |
| `NEXTAUTH_URL` | For auth | Auth callback URL |
| `SENTRY_DSN` | Optional | Sentry error tracking |
| `RESEND_API_KEY` | Optional | Email sending (Resend) |

---

## Development Workflow

### Branching

- **Never** push directly to `main`
- Create a feature branch: `git checkout -b feature/description`
- Use conventional prefixes: `feature/`, `fix/`, `refactor/`, `docs/`, `chore/`

### Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add yacht comparison radar chart
fix: correct displacement unit display on compare page
refactor: extract shared spec tooltip data module
docs: update API documentation for v1 endpoints
chore: bump next.js to 14.2.5
test: add integration tests for search API
```

### Pull Requests

1. Ensure your branch is up to date with `main`
2. Run the full verification ladder (below)
3. Create a PR with a clear description
4. Link any related issues
5. Wait for CI checks to pass

### PR Description Template

```markdown
## What
Brief description of the change.

## Why
Context / motivation.

## How
Key implementation details.

## Testing
- [ ] TypeScript passes
- [ ] Build succeeds
- [ ] Tests pass
- [ ] Manual verification done
```

---

## Verification Ladder

Before submitting a PR, **all** of these must pass:

```bash
npm run typecheck      # TypeScript type checking
npm run build          # Next.js production build
npx playwright test    # E2E + integration tests
```

For changes affecting specific pages, manually verify in the browser:
- Page loads without console errors
- Mobile and desktop layouts render correctly
- French locale (`/fr/`) still works (if i18n-relevant)

---

## Code Style & Conventions

### TypeScript

- **Strict mode** is enabled — no `any` without explicit `// eslint-disable` justification
- Use `type` for unions/intersections, `interface` for object shapes
- Prefer `unknown` over `any` for untrusted input
- All API inputs validated with [Zod](https://zod.dev) schemas

### React / Next.js

- **App Router** only — no Pages Router code
- Server Components by default; `"use client"` only when needed (state, effects, event handlers)
- Use `async/await` for data fetching in Server Components
- Prefer `next/image` over raw `<img>` tags
- Use `loading.tsx` and `error.tsx` for route-level UX states

### Styling

- **Tailwind CSS** for all styling
- **shadcn/ui** for component primitives
- Use `class-variance-authority` for component variants
- Dark mode via `prefers-color-scheme` (no manual toggle)

### Database

- **Drizzle ORM** for all queries
- Schema defined in `drizzle/schema.ts`
- Migrations in `drizzle/migrations/`
- **Never** use `drizzle-kit push` (it requires interactive TTY). Use `drizzle-kit migrate` with pre-generated migrations
- For manual DDL, use the Neon HTTP client, not `psql`
- Edge-safe queries use `lib/db-edge.ts`; Node.js queries use `lib/db.ts`

### API Routes

- Public routes under `/api/v1/` are versioned and stable
- Internal routes under `/api/` are unversioned (may change)
- Admin routes under `/api/admin/` require Bearer token auth
- All POST/PUT/DELETE routes must have Zod input validation
- Use `lib/api-response.ts` for consistent error responses
- Use `lib/api-validate.ts` for request validation helpers

### Internationalization (i18n)

- **next-intl** for message translation
- Messages in `messages/en.json` and `messages/fr.json`
- All user-facing strings must be translated (EN + FR)
- Route structure: `/[locale]/...` for localized pages
- Admin pages are English-only (under `app/admin/`)

### Testing

- **Playwright** for E2E and integration tests
- Test files in `tests/` directory
- Each new feature should include tests
- Test both happy path and error cases
- Run tests: `npx playwright test`

### File Organization

```
app/
  [locale]/           # Localized pages (EN/FR)
    yachts/           # Yacht listing & detail
    compare/          # Comparison pages
    manufacturers/    # Manufacturer pages
    guides/           # Sailing guides
    ...
  admin/              # Admin dashboard (English-only)
  api/                # API routes
components/            # Shared React components
  ui/                 # shadcn/ui primitives
lib/                   # Business logic, services, utilities
drizzle/               # DB schema & migrations
messages/              # i18n translation files
tests/                 # Playwright test files
public/                # Static assets
docs/                  # Documentation
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (Edge + Node)                   │
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  Next.js 14 │  │  App Router  │  │  Edge Runtime  │  │
│  │  (SSG/ISR)  │  │  (RSC + CC)  │  │  (API routes)  │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘  │
│         │                │                   │            │
│         └────────────────┼───────────────────┘            │
│                          │                                │
│                   ┌──────┴───────┐                        │
│                   │  Neon (Postgres)                      │
│                   │  + Drizzle ORM                       │
│                   └──────────────┘                        │
└─────────────────────────────────────────────────────────┘
```

- **Frontend**: React Server Components (default) with selective client components
- **Rendering**: SSG for static pages, ISR for data-driven pages (1h cache)
- **API**: Edge runtime for public read endpoints, Node.js for admin/heavy operations
- **Database**: Neon serverless Postgres with connection pooling
- **Auth**: NextAuth.js (credentials provider, session cookies)
- **Monitoring**: Sentry for errors, custom Core Web Vitals tracking

---

## Component Development with Storybook

We use Storybook for isolated component development.

```bash
npm run storybook    # Start Storybook dev server (port 6006)
npm run build-storybook  # Build static Storybook for deployment
```

Stories live alongside components: `components/*.stories.tsx`.

See [Storybook section in README](./README.md#storybook) for details.

---

## Deployment

- **Platform**: Vercel (auto-deploys from `main` branch)
- **Build command**: `npm run build`
- **Output**: `.next/` (handled by Vercel)
- **Environment variables**: Configured in Vercel dashboard

Production URL: [https://info.sailboats.fr](https://info.sailboats.fr)

---

## Getting Help

- Check existing [GitHub Issues](https://github.com/pgedeon/sailing-yachts/issues)
- Read [Architecture Decision Records](./adr/) for design rationale
- Review the [API documentation](./API.md)

---

## License

Custom Non-Commercial License — free for individuals and organizations with under $100k/year gross revenue. See [LICENSE](../LICENSE) for details.
