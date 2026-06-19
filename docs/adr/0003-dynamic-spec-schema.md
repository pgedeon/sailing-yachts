# ADR 0003: Dynamic Spec Categories Schema

## Status
Accepted — 2026-01-15

## Context

Sailing yachts have dozens of specification types (length, beam, draft, displacement, sail area, rig type, keel type, hull material, engine power, fuel capacity, etc.). The set of relevant specs varies by yacht type (cruiser vs. racer, mono vs. multihull).

Two approaches were considered:

1. **Fixed columns** — One column per spec type in the `yacht_models` table
2. **Dynamic spec categories** — Core specs as columns, everything else as key-value pairs in a separate `spec_values` table

## Decision

Use a **hybrid approach**: core numeric specs as direct columns + dynamic spec categories for the rest.

### Schema Design

```sql
-- Core specs (always present, indexed, sortable, filterable)
yacht_models (
  id, manufacturer_id, model_name, year, slug,
  length_overall, beam, draft, displacement, ballast,
  sail_area_main, rig_type, keel_type, hull_material,
  cabins, berths, heads, max_occupancy,
  engine_hp, engine_type, fuel_capacity, water_capacity,
  ...
)

-- Dynamic spec categories (extensible without schema changes)
spec_categories (
  id, name, unit, data_type, category_group,
  is_filterable, is_sortable, is_comparable
)

-- Spec values (actual data for dynamic categories)
spec_values (
  id, yacht_model_id, spec_category_id,
  value_numeric, value_text, value_boolean
)
```

Core columns cover ~20 most common specs. Dynamic categories handle any additional spec (e.g., PHRF rating, water tank material, sail plan details).

## Consequences

### Positive
- **Extensible** — new spec types added via INSERT, no ALTER TABLE needed
- **Fast queries** — core specs are indexed columns, not EAV lookups
- **Flexible data types** — `spec_values` supports numeric, text, and boolean values
- **UI auto-generation** — filters and sort options derived from `is_filterable`/`is_sortable` flags
- **Compare table** — `is_comparable` flag determines which specs show in comparison view

### Negative
- **Two query patterns** — core specs are column access; dynamic specs need a JOIN
- **Type complexity** — `value_numeric | value_text | value_boolean` union requires runtime type checking
- **Migration overhead** — when promoting a dynamic spec to core (rare), data migration needed

### Neutral
- Currently ~20 core columns + ~30 dynamic spec categories
- The admin UI handles both core (form fields) and dynamic (key-value editor) specs
