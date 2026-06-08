import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { jsonResponse, withErrorHandling } from "@/lib/http";
import { listReviewers } from "@/lib/repositories/users";

export const runtime = "nodejs";

export const GET = withErrorHandling(async () => {
  await requireUser();
  const reviewers = await listReviewers(getDb());
  return jsonResponse(
    reviewers.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
    })),
  );
});
