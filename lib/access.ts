import type { UserRole } from "@/lib/constants";

/**
 * Authorization predicates (deny by default).
 *
 * Read: a user U may read document D if
 *   D.ownerId === U.id  OR  a draft on D has assignedReviewerId === U.id  OR  U.role === 'admin'.
 * Write (create/regenerate/submit): restricted to the owner (or admin).
 * Review decisions: restricted to the assigned reviewer (or admin).
 *
 * These are pure functions so they can be unit-tested in isolation; the
 * repository layer enforces the same rules at the SQL boundary.
 */

export interface Principal {
  id: string;
  role: UserRole;
}

export function isAdmin(user: Principal): boolean {
  return user.role === "admin";
}

export function canReadDocument(
  user: Principal,
  doc: { ownerId: string },
  assignedReviewerIds: readonly string[],
): boolean {
  if (isAdmin(user)) return true;
  if (doc.ownerId === user.id) return true;
  return assignedReviewerIds.includes(user.id);
}

export function canWriteDocument(
  user: Principal,
  doc: { ownerId: string },
): boolean {
  if (isAdmin(user)) return true;
  return doc.ownerId === user.id;
}

export function canDecideReview(
  user: Principal,
  draft: { assignedReviewerId: string | null },
): boolean {
  if (isAdmin(user)) return true;
  return (
    draft.assignedReviewerId !== null && draft.assignedReviewerId === user.id
  );
}
