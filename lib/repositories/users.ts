import { eq, inArray } from "drizzle-orm";
import type { Database } from "@/db/client";
import { users, type User } from "@/db/schema";
import type { UserRole } from "@/lib/constants";

export async function getUserByClerkId(
  db: Database,
  clerkId: string,
): Promise<User | undefined> {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  return rows[0];
}

export async function getUserById(
  db: Database,
  id: string,
): Promise<User | undefined> {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0];
}

/** Users eligible to be assigned a draft for review. */
export async function listReviewers(db: Database): Promise<User[]> {
  return db
    .select()
    .from(users)
    .where(inArray(users.role, ["reviewer", "admin"]));
}

export interface UpsertUserInput {
  clerkId: string;
  email: string;
  name?: string | null;
  role?: UserRole;
}

/** Idempotent sync from a Clerk webhook event (Clerk is the source of truth). */
export async function upsertUserFromClerk(
  db: Database,
  input: UpsertUserInput,
): Promise<User> {
  const values = {
    clerkId: input.clerkId,
    email: input.email,
    name: input.name ?? null,
    ...(input.role ? { role: input.role } : {}),
  };
  const rows = await db
    .insert(users)
    .values(values)
    .onConflictDoUpdate({
      target: users.clerkId,
      set: {
        email: input.email,
        name: input.name ?? null,
        ...(input.role ? { role: input.role } : {}),
      },
    })
    .returning();
  const row = rows[0];
  if (!row) throw new Error("Failed to upsert user");
  return row;
}

export async function deleteUserByClerkId(
  db: Database,
  clerkId: string,
): Promise<void> {
  await db.delete(users).where(eq(users.clerkId, clerkId));
}
