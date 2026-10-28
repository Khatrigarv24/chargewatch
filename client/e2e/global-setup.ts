import { closeDb, ensureSchema } from "./db";

export default async function globalSetup(): Promise<void> {
  await ensureSchema();
  await closeDb();
}
