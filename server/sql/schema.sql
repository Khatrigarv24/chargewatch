CREATE TYPE charger_status AS ENUM ('available', 'charging', 'faulted', 'offline');

CREATE TABLE sites (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  capacity_kw NUMERIC NOT NULL
);

CREATE TABLE chargers (
  id SERIAL PRIMARY KEY,
  site_id INTEGER NOT NULL REFERENCES sites (id),
  connector_type TEXT NOT NULL,
  power_kw NUMERIC NOT NULL,
  status charger_status NOT NULL DEFAULT 'available'
);

CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  charger_id INTEGER NOT NULL REFERENCES chargers (id),
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  energy_kwh NUMERIC
);

CREATE TABLE energy_readings (
  id BIGSERIAL PRIMARY KEY,
  charger_id INTEGER NOT NULL REFERENCES chargers (id),
  recorded_at TIMESTAMPTZ NOT NULL,
  power_kw NUMERIC NOT NULL
);

-- Lets the site energy aggregate (GET /api/sites/:id/energy) seek straight to
-- a charger's rows in a date range instead of scanning the whole table --
-- see docs/query-optimization.md.
CREATE INDEX energy_readings_charger_recorded_idx ON energy_readings (charger_id, recorded_at);
CREATE INDEX sessions_charger_started_idx ON sessions (charger_id, started_at);
