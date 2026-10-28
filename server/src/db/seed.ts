import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    "postgres://chargewatch:chargewatch@localhost:5432/chargewatch",
});

const CITIES = ["Seattle", "Austin", "Denver", "Phoenix", "Atlanta"];
const CONNECTOR_TYPES = ["CCS", "CHAdeMO", "NACS", "J1772"];
const DAYS = 30;
const READING_INTERVAL_MIN = 5;
const CHUNK = 5000;

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

type SessionRow = [number, Date, Date, number];
type ReadingRow = [number, Date, number];

async function bulkInsertSessions(client: any, rows: SessionRow[]) {
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    await client.query(
      `INSERT INTO sessions (charger_id, started_at, ended_at, energy_kwh)
       SELECT * FROM UNNEST($1::int[], $2::timestamptz[], $3::timestamptz[], $4::numeric[])`,
      [
        chunk.map((r) => r[0]),
        chunk.map((r) => r[1]),
        chunk.map((r) => r[2]),
        chunk.map((r) => r[3]),
      ],
    );
  }
}

async function bulkInsertReadings(client: any, rows: ReadingRow[]) {
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    await client.query(
      `INSERT INTO energy_readings (charger_id, recorded_at, power_kw)
       SELECT * FROM UNNEST($1::int[], $2::timestamptz[], $3::numeric[])`,
      [chunk.map((r) => r[0]), chunk.map((r) => r[1]), chunk.map((r) => r[2])],
    );
  }
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "TRUNCATE energy_readings, sessions, chargers, sites RESTART IDENTITY CASCADE",
    );

    const siteIds: number[] = [];
    for (const city of CITIES) {
      const res = await client.query<{ id: number }>(
        "INSERT INTO sites (name, city, capacity_kw) VALUES ($1, $2, $3) RETURNING id",
        [`${city} Hub`, city, randInt(200, 800)],
      );
      siteIds.push(res.rows[0].id);
    }

    const chargers: { id: number; power_kw: number }[] = [];
    for (const siteId of siteIds) {
      const count = randInt(8, 16);
      for (let i = 0; i < count; i++) {
        const power_kw = pick([50, 62.5, 150, 350]);
        const status = pick([
          "available",
          "available",
          "available",
          "charging",
          "faulted",
          "offline",
        ]);
        const res = await client.query<{ id: number }>(
          "INSERT INTO chargers (site_id, connector_type, power_kw, status) VALUES ($1, $2, $3, $4) RETURNING id",
          [siteId, pick(CONNECTOR_TYPES), power_kw, status],
        );
        chargers.push({ id: res.rows[0].id, power_kw });
      }
    }
    console.log(`Created ${siteIds.length} sites, ${chargers.length} chargers`);

    const start = new Date();
    start.setDate(start.getDate() - DAYS);
    start.setHours(0, 0, 0, 0);

    const sessionRows: SessionRow[] = [];
    for (const charger of chargers) {
      for (let d = 0; d < DAYS; d++) {
        const sessionsToday = randInt(0, 3);
        for (let s = 0; s < sessionsToday; s++) {
          const startedAt = new Date(start);
          startedAt.setDate(startedAt.getDate() + d);
          startedAt.setHours(randInt(0, 22), randInt(0, 59), 0, 0);
          const durationMin = randInt(15, 90);
          const endedAt = new Date(startedAt.getTime() + durationMin * 60_000);
          const energyKwh =
            (durationMin / 60) * charger.power_kw * (0.7 + Math.random() * 0.3);
          sessionRows.push([charger.id, startedAt, endedAt, energyKwh]);
        }
      }
    }
    await bulkInsertSessions(client, sessionRows);
    console.log(`Inserted ${sessionRows.length} sessions`);

    const readingsPerCharger = (DAYS * 24 * 60) / READING_INTERVAL_MIN;
    let totalReadings = 0;
    for (const charger of chargers) {
      const readingRows: ReadingRow[] = [];
      for (let r = 0; r < readingsPerCharger; r++) {
        const recordedAt = new Date(
          start.getTime() + r * READING_INTERVAL_MIN * 60_000,
        );
        const isCharging = Math.random() < 0.15;
        const power = isCharging
          ? charger.power_kw * (0.6 + Math.random() * 0.4)
          : Math.random() * 0.5;
        readingRows.push([charger.id, recordedAt, power]);
      }
      await bulkInsertReadings(client, readingRows);
      totalReadings += readingRows.length;
    }
    console.log(`Inserted ${totalReadings} energy readings`);

    await client.query("COMMIT");
    console.log("Seed complete.");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
