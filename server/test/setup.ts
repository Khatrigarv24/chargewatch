import { readFileSync } from "node:fs";
import { afterAll, afterEach, beforeAll } from "vitest";
import { pool } from "../src/db/pool.js";

process.env.NODE_ENV = "test";

beforeAll(async () => {
  await pool.query("DROP SCHEMA public CASCADE");
  await pool.query("CREATE SCHEMA public");
  const schemaSql = readFileSync(
    new URL("../sql/schema.sql", import.meta.url),
    "utf-8",
  );
  await pool.query(schemaSql);
});

afterEach(async () => {
  await pool.query(
    "TRUNCATE energy_readings, sessions, chargers, sites RESTART IDENTITY CASCADE",
  );
});

afterAll(async () => {
  await pool.end();
});
