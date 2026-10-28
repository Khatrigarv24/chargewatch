import { Router } from "express";
import { pool } from "../db/pool.js";
import { asyncHandler, AppError } from "../lib/errors.js";
import { computeSessionEnergyKwh } from "../lib/energy.js";
import { chargerIdParamSchema, listChargersQuerySchema } from "../schemas.js";

export const chargersRouter = Router();

chargersRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { status } = listChargersQuerySchema.parse(req.query);
    const { rows } = await pool.query(
      status
        ? "SELECT id, site_id, connector_type, power_kw, status FROM chargers WHERE status = $1 ORDER BY id"
        : "SELECT id, site_id, connector_type, power_kw, status FROM chargers ORDER BY id",
      status ? [status] : [],
    );
    res.json(
      rows.map((c) => ({
        id: c.id,
        site_id: c.site_id,
        connector_type: c.connector_type,
        power_kw: Number(c.power_kw),
        status: c.status,
      })),
    );
  }),
);

chargersRouter.post(
  "/:id/sessions/start",
  asyncHandler(async (req, res) => {
    const { id } = chargerIdParamSchema.parse(req.params);

    const chargerRes = await pool.query(
      "SELECT id, status FROM chargers WHERE id = $1",
      [id],
    );
    if (chargerRes.rows.length === 0) {
      throw new AppError(404, "Charger not found");
    }
    if (chargerRes.rows[0].status !== "available") {
      throw new AppError(409, "Charger is not available");
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const sessionRes = await client.query(
        "INSERT INTO sessions (charger_id, started_at) VALUES ($1, now()) RETURNING id, started_at",
        [id],
      );
      await client.query(
        "UPDATE chargers SET status = 'charging' WHERE id = $1",
        [id],
      );
      await client.query("COMMIT");
      res.status(201).json({
        session_id: sessionRes.rows[0].id,
        started_at: sessionRes.rows[0].started_at,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }),
);

chargersRouter.post(
  "/:id/sessions/stop",
  asyncHandler(async (req, res) => {
    const { id } = chargerIdParamSchema.parse(req.params);

    const chargerRes = await pool.query(
      "SELECT id, status, power_kw FROM chargers WHERE id = $1",
      [id],
    );
    if (chargerRes.rows.length === 0) {
      throw new AppError(404, "Charger not found");
    }
    if (chargerRes.rows[0].status !== "charging") {
      throw new AppError(409, "Charger is not charging");
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const openSession = await client.query(
        `SELECT id, started_at FROM sessions
         WHERE charger_id = $1 AND ended_at IS NULL
         ORDER BY started_at DESC LIMIT 1`,
        [id],
      );
      if (openSession.rows.length === 0) {
        throw new AppError(409, "No open session for this charger");
      }
      const energyKwh = computeSessionEnergyKwh(
        new Date(openSession.rows[0].started_at),
        new Date(),
        Number(chargerRes.rows[0].power_kw),
      );

      await client.query(
        "UPDATE sessions SET ended_at = now(), energy_kwh = $2 WHERE id = $1",
        [openSession.rows[0].id, energyKwh],
      );
      await client.query(
        "UPDATE chargers SET status = 'available' WHERE id = $1",
        [id],
      );
      await client.query("COMMIT");
      res.json({ session_id: openSession.rows[0].id, energy_kwh: energyKwh });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }),
);
