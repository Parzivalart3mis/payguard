import { USER_ROLES, type UserRole } from "@/lib/constants";

const ROLE_SET = new Set<string>(USER_ROLES);

/** Read a validated role from Clerk public metadata, if present. */
export function roleFromMetadata(metadata: unknown): UserRole | undefined {
  const role = (metadata as { role?: unknown } | null | undefined)?.role;
  return typeof role === "string" && ROLE_SET.has(role)
    ? (role as UserRole)
    : undefined;
}
