import { Router } from "express";
import { pool } from "../db/pool.js";
import { asyncHandler, AppError } from "../lib/errors.js";
import { siteIdParamSchema, energyQuerySchema } from "../schemas.js";

export const sitesRouter = Router();

sitesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query(`
      SELECT
        s.id, s.name, s.city, s.capacity_kw,
        COUNT(*) FILTER (WHERE c.status = 'available') AS available,
        COUNT(*) FILTER (WHERE c.status = 'charging') AS charging,
        COUNT(*) FILTER (WHERE c.status = 'faulted') AS faulted,
        COUNT(*) FILTER (WHERE c.status = 'offline') AS offline
      FROM sites s
      LEFT JOIN chargers c ON c.site_id = s.id
      GROUP BY s.id
      ORDER BY s.id
    `);
    res.json(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        city: r.city,
        capacity_kw: Number(r.capacity_kw),
        available: Number(r.available),
        charging: Number(r.charging),
        faulted: Number(r.faulted),
        offline: Number(r.offline),
      })),
    );
  }),
);

sitesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = siteIdParamSchema.parse(req.params);

    const siteRes = await pool.query(
      "SELECT id, name, city, capacity_kw FROM sites WHERE id = $1",
      [id],
    );
    if (siteRes.rows.length === 0) {
      throw new AppError(404, "Site not found");
    }

    const chargersRes = await pool.query(
      "SELECT id, site_id, connector_type, power_kw, status FROM chargers WHERE site_id = $1 ORDER BY id",
      [id],
    );

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const energyRes = await pool.query(
      `SELECT COALESCE(SUM(er.power_kw * 5.0 / 60), 0) AS energy_kwh
       FROM energy_readings er
       JOIN chargers c ON c.id = er.charger_id
       WHERE c.site_id = $1 AND er.recorded_at >= $2`,
      [id, todayStart],
    );

    res.json({
      site: {
        id: siteRes.rows[0].id,
        name: siteRes.rows[0].name,
        city: siteRes.rows[0].city,
        capacity_kw: Number(siteRes.rows[0].capacity_kw),
      },
      chargers: chargersRes.rows.map((c) => ({
        id: c.id,
        site_id: c.site_id,
        connector_type: c.connector_type,
        power_kw: Number(c.power_kw),
        status: c.status,
      })),
      today_energy_kwh: Number(energyRes.rows[0].energy_kwh),
    });
  }),
);

sitesRouter.get(
  "/:id/energy",
  asyncHandler(async (req, res) => {
    const { id } = siteIdParamSchema.parse(req.params);
    const { from, to } = energyQuerySchema.parse(req.query);

    const toExclusive = new Date(`${to}T00:00:00.000Z`);
    toExclusive.setDate(toExclusive.getDate() + 1);

    const { rows } = await pool.query(
      `SELECT
         date_trunc('hour', er.recorded_at) AS hour,
         SUM(er.power_kw * 5.0 / 60) AS energy_kwh
       FROM energy_readings er
       JOIN chargers c ON c.id = er.charger_id
       WHERE c.site_id = $1
         AND er.recorded_at >= $2
         AND er.recorded_at < $3
       GROUP BY 1
       ORDER BY 1`,
      [id, `${from}T00:00:00.000Z`, toExclusive.toISOString()],
    );

    res.json(
      rows.map((r) => ({
        hour: r.hour.toISOString(),
        energy_kwh: Number(r.energy_kwh),
      })),
    );
  }),
);
