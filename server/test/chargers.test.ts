import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/index.js";
import { pool } from "../src/db/pool.js";

async function seedCharger(status: string): Promise<number> {
  const site = await pool.query(
    "INSERT INTO sites (name, city, capacity_kw) VALUES ('Test Hub', 'Testville', 400) RETURNING id",
  );
  const charger = await pool.query(
    "INSERT INTO chargers (site_id, connector_type, power_kw, status) VALUES ($1, 'CCS', 50, $2) RETURNING id",
    [site.rows[0].id, status],
  );
  return charger.rows[0].id;
}

describe("GET /api/chargers", () => {
  it("filters by status", async () => {
    await seedCharger("available");
    await seedCharger("faulted");
    const res = await request(app).get("/api/chargers?status=faulted");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].status).toBe("faulted");
  });
});

describe("POST /api/chargers/:id/sessions/start", () => {
  it("starts a session on an available charger", async () => {
    const chargerId = await seedCharger("available");
    const res = await request(app).post(
      `/api/chargers/${chargerId}/sessions/start`,
    );
    expect(res.status).toBe(201);
    const check = await pool.query(
      "SELECT status FROM chargers WHERE id = $1",
      [chargerId],
    );
    expect(check.rows[0].status).toBe("charging");
  });

  it("rejects starting a session on a charger that's already charging", async () => {
    const chargerId = await seedCharger("charging");
    const res = await request(app).post(
      `/api/chargers/${chargerId}/sessions/start`,
    );
    expect(res.status).toBe(409);
  });
});

describe("POST /api/chargers/:id/sessions/stop", () => {
  it("stops an open session and frees the charger", async () => {
    const chargerId = await seedCharger("available");
    await request(app).post(`/api/chargers/${chargerId}/sessions/start`);

    const res = await request(app).post(
      `/api/chargers/${chargerId}/sessions/stop`,
    );
    expect(res.status).toBe(200);
    expect(res.body.energy_kwh).toBeGreaterThanOrEqual(0);
    const check = await pool.query(
      "SELECT status FROM chargers WHERE id = $1",
      [chargerId],
    );
    expect(check.rows[0].status).toBe("available");
  });

  it("rejects stopping a charger that isn't charging", async () => {
    const chargerId = await seedCharger("available");
    const res = await request(app).post(
      `/api/chargers/${chargerId}/sessions/stop`,
    );
    expect(res.status).toBe(409);
  });
});
