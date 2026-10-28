# Query optimization: site energy aggregate

The heaviest endpoint is `GET /api/sites/:id/energy`, which aggregates
`energy_readings` into hourly totals for one site's chargers over a date
range. Measured against the seeded dataset (5 sites, 65 chargers, 561,600
energy readings over 30 days) on a site with 13 chargers, for a 1-day range
(2026-10-15, 288 readings/charger/day -- the case that actually benefits from
an index; a range covering most of the table is cheaper as a sequential
scan regardless, since nearly every row qualifies anyway).

## Before: join on chargers, no index beyond primary keys

```sql
SELECT date_trunc('hour', er.recorded_at) AS hour,
       SUM(er.power_kw * 5.0 / 60) AS energy_kwh
FROM energy_readings er
JOIN chargers c ON c.id = er.charger_id
WHERE c.site_id = 1
  AND er.recorded_at >= '2026-10-15T00:00:00.000Z'
  AND er.recorded_at < '2026-10-16T00:00:00.000Z'
GROUP BY 1 ORDER BY 1;
```

```
Finalize GroupAggregate  (actual time=23.867..29.492 rows=24 loops=1)
  Buffers: shared hit=4785
  ->  Gather Merge  (actual time=23.818..29.440 rows=72 loops=1)
        Workers Planned: 2, Workers Launched: 2
        ->  Partial GroupAggregate (actual time=19.993..20.616 rows=24 loops=3)
              ->  Sort (actual time=19.952..20.039 rows=1248 loops=3)
                    ->  Hash Join  (actual time=0.416..19.609 rows=1248 loops=3)
                          ->  Parallel Seq Scan on energy_readings er
                                (actual time=0.342..18.590 rows=6240 loops=3)
                                Filter: (recorded_at >= ... AND recorded_at < ...)
                                Rows Removed by Filter: 180960
                          ->  Hash on chargers c (Filter: site_id = 1)
Execution Time: 29.658 ms
```

**X = 29.658 ms.** Every one of the 561,600 rows in `energy_readings` gets
read and filtered (`Rows Removed by Filter: 180960` per worker, x3 workers)
because there's no index to skip straight to one charger's rows.

## After: index + filter by charger_id instead of joining

```sql
CREATE INDEX energy_readings_charger_recorded_idx ON energy_readings (charger_id, recorded_at);
CREATE INDEX sessions_charger_started_idx ON sessions (charger_id, started_at);
```

Rewrote the query (`server/src/routes/sites.ts`) to filter
`energy_readings.charger_id` against the site's (small) list of charger ids
instead of joining on it. A join plans around matching every row against
`chargers`; filtering by `charger_id = ANY(...)` lets the planner seek
directly into the new composite index per charger id:

```sql
SELECT date_trunc('hour', er.recorded_at) AS hour,
       SUM(er.power_kw * 5.0 / 60) AS energy_kwh
FROM energy_readings er
WHERE er.charger_id = ANY (SELECT id FROM chargers WHERE site_id = 1)
  AND er.recorded_at >= '2026-10-15T00:00:00.000Z'
  AND er.recorded_at < '2026-10-16T00:00:00.000Z'
GROUP BY 1 ORDER BY 1;
```

```
GroupAggregate  (actual time=4.174..6.155 rows=24 loops=1)
  Buffers: shared hit=78 read=32
  ->  Sort (actual time=4.045..4.293 rows=3744 loops=1)
        ->  Nested Loop (actual time=0.056..2.967 rows=3744 loops=1)
              ->  Seq Scan on chargers (Filter: site_id = 1, rows=13)
              ->  Index Scan using energy_readings_charger_recorded_idx on energy_readings er
                    (actual time=0.030..0.115 rows=288 loops=13)
                    Index Cond: (charger_id = chargers.id AND recorded_at >= ... AND recorded_at < ...)
Execution Time: 6.290 ms
```

**Y = 6.290 ms.** For each of the 13 chargers at the site, Postgres now does
one index range scan that returns only that charger's ~288 readings for the
day, instead of scanning all 561,600 rows. Buffer reads dropped from 4,785 to
110.

**≈4.7x faster (29.7 ms → 6.3 ms)** on this dataset size; the gap widens as
`energy_readings` grows, since the baseline cost scales with total table
size while the indexed cost scales with one charger's row count.

### Why not just index and keep the join?

Tested that too: with the index in place, the *original* join-based query
also picks the index (Postgres doesn't care whether the charger ids come
from a join or a subquery, as long as it can get a short list of them
cheaply) and runs in ~6.5 ms as well. The rewrite isn't what makes it fast --
the index is. The rewrite just makes the intent explicit (and reads slightly
better) once the index exists.

### Why a 30-day range doesn't show the same win

Re-running both versions over the full 30-day seeded range, the planner
chooses a parallel sequential scan either way (with or without the index)
and execution time is ~75-85 ms for both. When a query matches close to
100% of a table, scanning it directly is cheaper than paying for index
lookups per row. The index pays off specifically for the common case here:
a user viewing a narrow date range (a day, a week) at a site with few
chargers relative to the whole table.
