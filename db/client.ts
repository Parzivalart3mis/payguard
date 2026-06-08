import { neon } from "@neondatabase/serverless";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { env } from "@/lib/env";
import * as schema from "./schema";

/**
 * Driver-agnostic database type. Both the Neon HTTP driver (production) and the
 * PGlite driver (in-memory tests) produce instances assignable to this, so
 * repository functions can accept either.
 */
export type Database = PgDatabase<
  PgQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

let cached: Database | null = null;

/** Lazily-constructed Neon-backed Drizzle client (serverless-friendly). */
export function getDb(): Database {
  if (!cached) {
    const sql = neon(env.databaseUrl);
    cached = drizzle(sql, { schema }) as unknown as Database;
  }
  return cached;
}

export { schema };
