import { getDb } from "@/db/client";
import { canReadDocument } from "@/lib/access";
import { requireUser, toPrincipal } from "@/lib/auth/current-user";
import { ApiError, jsonResponse, withErrorHandling } from "@/lib/http";
import {
  getAssignedReviewerIds,
  getDocumentById,
  getDocumentDetail,
} from "@/lib/repositories/documents";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const db = getDb();

  const document = await getDocumentById(db, id);
  if (!document) throw new ApiError("not_found", "Document not found.");

  const reviewerIds = await getAssignedReviewerIds(db, id);
  if (!canReadDocument(toPrincipal(user), document, reviewerIds)) {
    throw new ApiError("forbidden", "You do not have access to this document.");
  }

  const detail = await getDocumentDetail(db, id);
  if (!detail) throw new ApiError("not_found", "Document not found.");
  return jsonResponse(detail);
});
