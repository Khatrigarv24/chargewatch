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
