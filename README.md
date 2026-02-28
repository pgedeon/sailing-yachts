# Sailing Yachts Database

A searchable, filterable database of sailing yacht specifications built with Next.js 14, PostgreSQL, and Drizzle ORM. Deployed on Vercel.

## Features

- Browse yachts with dynamic filters (auto-discovered from database)
- Search by manufacturer, length, beam, draft, displacement, rig type, keel type, hull material
- Compare up to 3 yachts side-by-side
- Detailed yacht pages with all specifications grouped by category
- Admin panel for CRUD operations (protected by API key)
- Extensible schema: add new spec categories without code changes
- Customer reviews support (optional)
- Clean, minimalist design inspired by top sailing yacht websites

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase or Neon)
- **ORM**: Drizzle
- **Styling**: Tailwind CSS + shadcn/ui components
- **Deployment**: Vercel

## Quick Start

### 1. Clone and Install

```bash
cd projects/sailing-yachts
npm install
```

### 2. Setup Database

Create a PostgreSQL database (Supabase or Neon) and get the connection string.

Update `.env.local`:

```env
DATABASE_URL="postgresql://user:pass@host:port/dbname"
ADMIN_API_KEY="your-secure-random-key-here"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Run Migrations

```bash
npm run db:generate   # generate migration files from schema
npm run db:migrate    # apply migrations to create tables
```

### 4. Seed Initial Data

```bash
npm run seed
```

This will populate:

- Spec categories (Length, Beam, Draft, Displacement, etc.)
- 12-15 sample yachts across small/medium/large categories
- Manufacturer records
- Spec values and images (placeholder)

### 5. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000

## Project Structure

```
sailing-yachts/
├── app/
│   ├── api/
│   │   ├── yachts/           # list yachts with filters
│   │   ├── yachts/[slug]/   # single yacht
│   │   ├── compare/         # compare endpoint
│   │   ├── spec-categories/ # list all spec categories
│   │   ├── manufacturers/   # list manufacturers
│   │   └── admin/           # admin CRUD (protected)
│   ├── yachts/page.tsx      # browse page
│   ├── yachts/[slug]/page.tsx  # detail page
│   ├── compare/page.tsx     # compare page
│   ├── admin/page.tsx       # admin panel
│   ├── layout.tsx
│   └── page.tsx             # homepage
├── components/ui/           # shadcn/ui components
├── drizzle/
│   ├── schema.ts           # database schema
│   └── migrations/         # auto-generated migrations
├── lib/
│   ├── db.ts              # db connection
│   └── utils.ts           # utilities
├── scripts/
│   └── seed.ts            # database seeder
└── PROJECT.md             # full project plan
```

## Database Schema Highlights

### Core Tables

- `manufacturers`
- `yacht_models` (core numeric columns)
- `spec_categories` (dictionary of all spec types)
- `spec_values` (dynamic spec values per yacht)
- `images`
- `reviews` (optional)

### Adding New Spec Categories

1. Insert a row into `spec_categories`:

```sql
INSERT INTO spec_categories (name, unit, data_type, category_group, is_filterable, is_sortable, is_comparable)
VALUES ('PHRF Rating', 'sec/mile', 'numeric', 'performance', true, true, true);
```

2. Insert values into `spec_values` for each yacht:

```sql
INSERT INTO spec_values (yacht_model_id, spec_category_id, value_numeric)
SELECT yacht_models.id, spec_categories.id, 120
FROM yacht_models, spec_categories
WHERE yacht_models.model_name = 'Oceanis 41.1' AND spec_categories.name = 'PHRF Rating';
```

No code changes needed! The frontend will automatically:

- Show a PHRF filter in the sidebar (is_filterable=true)
- Allow sorting by PHRF (is_sortable=true)
- Display PHRF on detail page and compare table (is_comparable=true)

## Admin API

All admin endpoints require `Authorization: Bearer <ADMIN_API_KEY>` header.

- `GET /api/admin/yachts` - list all yachts (with manufacturer name)
- `GET /api/admin/yachts/[id]` - get single yacht
- `PUT /api/admin/yachts/[id]` - update yacht (partial update supported)

## Deployment to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables:
   - `DATABASE_URL`
   - `ADMIN_API_KEY` (change this!)
   - `NEXT_PUBLIC_APP_URL` (your Vercel URL)
4. Deploy

## Running Tests

```bash
npm run test
```

## Linting & Formatting

```bash
npm run lint
npm run format
npm run typecheck
```

## Verification Ladder

Before considering any task complete:

- [ ] `npm run format` passes
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes (coverage ≥80% for critical paths)
- [ ] `npm run build` succeeds
- [ ] DB migrations work on fresh instance
- [ ] Seed script completes without errors
- [ ] All pages load correctly (list, detail, compare, admin)
- [ ] Filters, search, sort work as expected
- [ ] Compare works with up to 3 yachts
- [ ] Responsive on mobile, tablet, desktop
- [ ] SEO meta tags present
- [ ] Vercel deployment succeeds

## Data Sources

Initial seed data includes sample yachts from:

- Catalina Yachts
- Hunter Marine
- J/Boats
- San Juan Yachts
- Beneteau
- Jeanneau
- Bavaria Yachts
- Dufour Yachts
- Swan
- Amel Yachts
- X-Yachts
- Grand Soleil

Manufacturers are not affiliated with this project; all specs are based on publicly available data for demonstration purposes.

## Roadmap

- [ ] Full CRUD API for spec categories and values
- [ ] Image upload handling for admin
- [ ] CSV import/export for bulk data operations
- [ ] User accounts and saved comparisons
- [ ] Brokerage listings integration (phase 2)
- [ ] Price tracking (phase 2)
- [ ] Advanced performance metrics calculators
- [ ] PWA support for offline browsing

## License

MIT (or choose your preferred license)

## Contributing

Pull requests welcome. Please ensure all verification ladder items pass.

---

Built with ❤️ using Next.js, Drizzle, and Tailwind.
// force deploy Fri Feb 27 13:47:04 CET 2026
