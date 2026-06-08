import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { Database } from "@/db/client";
import * as schema from "@/db/schema";

/**
 * Spin up an in-memory Postgres (PGlite, WASM — no Docker) with the real
 * Drizzle schema applied via the generated migrations.
 */
export async function createTestDb(): Promise<Database> {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: "db/migrations" });
  return db as unknown as Database;
}
