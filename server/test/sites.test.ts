import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/index.js";
import { pool } from "../src/db/pool.js";

async function seedFixture() {
  const site = await pool.query(
    "INSERT INTO sites (name, city, capacity_kw) VALUES ('Test Hub', 'Testville', 400) RETURNING id",
  );
  const siteId = site.rows[0].id;
  const available = await pool.query(
    "INSERT INTO chargers (site_id, connector_type, power_kw, status) VALUES ($1, 'CCS', 50, 'available') RETURNING id",
    [siteId],
  );
  const charging = await pool.query(
    "INSERT INTO chargers (site_id, connector_type, power_kw, status) VALUES ($1, 'CCS', 50, 'charging') RETURNING id",
    [siteId],
  );
  return {
    siteId,
    chargerIds: [available.rows[0].id, charging.rows[0].id],
  };
}

describe("GET /api/sites", () => {
  it("returns sites with charger counts by status", async () => {
    await seedFixture();
    const res = await request(app).get("/api/sites");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].available).toBe(1);
    expect(res.body[0].charging).toBe(1);
    expect(res.body[0].faulted).toBe(0);
  });
});

describe("GET /api/sites/:id", () => {
  it("404s for a missing site", async () => {
    const res = await request(app).get("/api/sites/999999");
    expect(res.status).toBe(404);
  });

  it("returns the site with its chargers", async () => {
    const { siteId } = await seedFixture();
    const res = await request(app).get(`/api/sites/${siteId}`);
    expect(res.status).toBe(200);
    expect(res.body.chargers).toHaveLength(2);
    expect(res.body.today_energy_kwh).toBe(0);
  });
});

describe("GET /api/sites/:id/energy", () => {
  it("400s on an invalid date range", async () => {
    const { siteId } = await seedFixture();
    const res = await request(app).get(
      `/api/sites/${siteId}/energy?from=2026-01-05&to=2026-01-01`,
    );
    expect(res.status).toBe(400);
  });

  it("returns hourly totals within range", async () => {
    const { siteId, chargerIds } = await seedFixture();
    await pool.query(
      `INSERT INTO energy_readings (charger_id, recorded_at, power_kw)
       VALUES ($1, '2026-01-01T10:00:00Z', 50), ($1, '2026-01-01T10:05:00Z', 50)`,
      [chargerIds[0]],
    );
    const res = await request(app).get(
      `/api/sites/${siteId}/energy?from=2026-01-01&to=2026-01-01`,
    );
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].energy_kwh).toBeCloseTo((50 * 5) / 60 + (50 * 5) / 60, 3);
  });
});
