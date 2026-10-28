import { readFileSync } from "node:fs";
import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    "postgres://chargewatch:chargewatch@localhost:5432/chargewatch",
});

export async function ensureSchema(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("DROP SCHEMA public CASCADE");
    await client.query("CREATE SCHEMA public");
    const schemaSql = readFileSync(
      new URL("../../server/sql/schema.sql", import.meta.url),
      "utf-8",
    );
    await client.query(schemaSql);
  } finally {
    client.release();
  }
}

export async function resetFixture(): Promise<{ siteId: number }> {
  const client = await pool.connect();
  try {
    await client.query(
      "TRUNCATE energy_readings, sessions, chargers, sites RESTART IDENTITY CASCADE",
    );
    const site = await client.query<{ id: number }>(
      "INSERT INTO sites (name, city, capacity_kw) VALUES ('Seattle Hub', 'Seattle', 400) RETURNING id",
    );
    const siteId = site.rows[0].id;

    await client.query(
      "INSERT INTO chargers (site_id, connector_type, power_kw, status) VALUES ($1, 'CCS', 50, 'available')",
      [siteId],
    );
    await client.query(
      "INSERT INTO chargers (site_id, connector_type, power_kw, status) VALUES ($1, 'CCS', 150, 'faulted')",
      [siteId],
    );
    const charging = await client.query<{ id: number }>(
      "INSERT INTO chargers (site_id, connector_type, power_kw, status) VALUES ($1, 'CCS', 50, 'charging') RETURNING id",
      [siteId],
    );
    await client.query(
      "INSERT INTO sessions (charger_id, started_at) VALUES ($1, now() - interval '30 minutes')",
      [charging.rows[0].id],
    );
    await client.query(
      `INSERT INTO energy_readings (charger_id, recorded_at, power_kw)
       SELECT $1, now() - (n * interval '1 minute'), 40
       FROM generate_series(0, 120, 5) AS n`,
      [charging.rows[0].id],
    );

    return { siteId };
  } finally {
    client.release();
  }
}

export async function closeDb(): Promise<void> {
  await pool.end();
}
