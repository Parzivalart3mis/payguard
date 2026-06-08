import { getDb } from "@/db/client";
import { canWriteDocument } from "@/lib/access";
import { requireUser, toPrincipal } from "@/lib/auth/current-user";
import { ApiError, jsonResponse, withErrorHandling } from "@/lib/http";
import { enforceRateLimit } from "@/lib/ratelimit";
import { submitDraftSchema } from "@/lib/schemas";
import {
  getDocumentById,
  updateDocumentStatus,
} from "@/lib/repositories/documents";
import { getDraftById, submitDraftForReview } from "@/lib/repositories/drafts";
import { getUserById } from "@/lib/repositories/users";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withErrorHandling(async (req: Request, ctx: Ctx) => {
  const user = await requireUser();
  await enforceRateLimit("mutation", user.id);
  const { id } = await ctx.params;
  const db = getDb();

  const { assignedReviewerId } = submitDraftSchema.parse(await req.json());

  const draft = await getDraftById(db, id);
  if (!draft) throw new ApiError("not_found", "Draft not found.");
  const document = await getDocumentById(db, draft.documentId);
  if (!document) throw new ApiError("not_found", "Document not found.");
  if (!canWriteDocument(toPrincipal(user), document)) {
    throw new ApiError("forbidden", "Only the owner can submit this draft.");
  }
  if (draft.status !== "drafted") {
    throw new ApiError("conflict", "Only a drafted version can be submitted.");
  }

  const reviewer = await getUserById(db, assignedReviewerId);
  if (
    !reviewer ||
    (reviewer.role !== "reviewer" && reviewer.role !== "admin")
  ) {
    throw new ApiError("bad_request", "Choose a valid reviewer.");
  }

  await submitDraftForReview(db, draft.id, assignedReviewerId);
  await updateDocumentStatus(db, document.id, "in_review");

  const updated = await getDraftById(db, draft.id);
  return jsonResponse(updated);
});
