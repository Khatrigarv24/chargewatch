# Query optimization: site energy aggregate

The heaviest endpoint is `GET /api/sites/:id/energy`, which aggregates
`energy_readings` (500k+ rows seeded) into hourly totals for one site's
chargers over a date range.

Status: **pending** — needs a running Postgres instance with the seed data
loaded to capture real `EXPLAIN ANALYZE` numbers. This file will be filled in
with the before/after query plans and timings once that's run.

## What will be measured

1. `EXPLAIN ANALYZE` on the query as it ships in `src/routes/sites.ts`
   (`energy_readings JOIN chargers`, no index beyond primary keys) — baseline
   time **[X] ms**.
2. Add `energy_readings (charger_id, recorded_at)` and
   `sessions (charger_id, started_at)` indexes, and rewrite the query to look
   up the site's charger ids first and filter `energy_readings` by
   `charger_id = ANY(...)` instead of joining — so the new composite index
   can be used directly.
3. `EXPLAIN ANALYZE` again — optimized time **[Y] ms**.

Both query plans will be pasted below once captured.
