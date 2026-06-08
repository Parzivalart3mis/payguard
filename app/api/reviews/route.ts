import { getDb } from "@/db/client";
import { canDecideReview } from "@/lib/access";
import { requireUser, toPrincipal } from "@/lib/auth/current-user";
import { ApiError, jsonResponse, withErrorHandling } from "@/lib/http";
import { enforceRateLimit } from "@/lib/ratelimit";
import { createReviewSchema } from "@/lib/schemas";
import { updateDocumentStatus } from "@/lib/repositories/documents";
import { getDraftById, setDraftStatus } from "@/lib/repositories/drafts";
import { createReview } from "@/lib/repositories/reviews";

export const runtime = "nodejs";

export const POST = withErrorHandling(async (req: Request) => {
  const user = await requireUser();
  await enforceRateLimit("mutation", user.id);

  const { draftId, decision, comments } = createReviewSchema.parse(
    await req.json(),
  );

  const db = getDb();
  const draft = await getDraftById(db, draftId);
  if (!draft) throw new ApiError("not_found", "Draft not found.");
  if (!canDecideReview(toPrincipal(user), draft)) {
    throw new ApiError(
      "forbidden",
      "Only the assigned reviewer can decide on this draft.",
    );
  }
  if (draft.status !== "in_review") {
    throw new ApiError("conflict", "This draft is not awaiting review.");
  }

  const review = await createReview(db, {
    draftId,
    reviewerId: user.id,
    decision,
    comments: comments ?? null,
  });

  if (decision === "approved") {
    await setDraftStatus(db, draft.id, "approved");
    await updateDocumentStatus(db, draft.documentId, "approved");
  } else {
    // changes_requested loops the document back to drafting (new version).
    await setDraftStatus(db, draft.id, "changes_requested");
    await updateDocumentStatus(db, draft.documentId, "changes_requested");
  }

  return jsonResponse(review, 201);
});
