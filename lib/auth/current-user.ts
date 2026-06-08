import { auth, currentUser as clerkCurrentUser } from "@clerk/nextjs/server";
import { getDb } from "@/db/client";
import type { User } from "@/db/schema";
import type { Principal } from "@/lib/access";
import { ApiError } from "@/lib/http";
import {
  getUserByClerkId,
  upsertUserFromClerk,
} from "@/lib/repositories/users";
import { roleFromMetadata } from "./roles";

/**
 * Resolve the application user for the current Clerk session. The webhook is the
 * primary sync path; this lazily upserts as a fallback if the webhook hasn't
 * landed yet (e.g. immediately after first sign-up).
 */
export async function getCurrentDbUser(): Promise<User | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const db = getDb();
  const existing = await getUserByClerkId(db, userId);
  if (existing) return existing;

  const clerkUser = await clerkCurrentUser();
  if (!clerkUser) return null;
  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    "";
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
  const role = roleFromMetadata(clerkUser.publicMetadata);

  return upsertUserFromClerk(db, {
    clerkId: userId,
    email,
    name,
    ...(role ? { role } : {}),
  });
}

/** Like getCurrentDbUser but throws an unauthorized ApiError when absent. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentDbUser();
  if (!user) throw new ApiError("unauthorized", "Authentication required.");
  return user;
}

export function toPrincipal(user: User): Principal {
  return { id: user.id, role: user.role };
}
