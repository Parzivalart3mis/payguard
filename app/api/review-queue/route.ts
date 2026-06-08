import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { jsonResponse, withErrorHandling } from "@/lib/http";
import { listAssignedDrafts } from "@/lib/repositories/drafts";

export const runtime = "nodejs";

export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  const queue = await listAssignedDrafts(getDb(), user.id);
  return jsonResponse(queue);
});
