import { Pool } from "pg";

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    "postgres://chargewatch:chargewatch@localhost:5432/chargewatch",
});
