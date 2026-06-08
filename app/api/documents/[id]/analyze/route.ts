import { createId } from "@paralleldrive/cuid2";
import { after } from "next/server";
import { getDb } from "@/db/client";
import { canWriteDocument } from "@/lib/access";
import { requireUser, toPrincipal } from "@/lib/auth/current-user";
import { ApiError, jsonResponse, withErrorHandling } from "@/lib/http";
import { enforceRateLimit } from "@/lib/ratelimit";
import { getVectorStore } from "@/lib/retrieval";
import { runAnalyzeAndDraft } from "@/lib/pipeline";
import {
  getDocumentById,
  updateDocumentStatus,
} from "@/lib/repositories/documents";

export const runtime = "nodejs";
// The pipeline can run for a while; allow up to the function ceiling.
export const maxDuration = 300;

type Ctx = { params: Promise<{ id: string }> };

export const POST = withErrorHandling(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  await enforceRateLimit("ai", user.id);
  const { id } = await ctx.params;
  const db = getDb();

  const document = await getDocumentById(db, id);
  if (!document) throw new ApiError("not_found", "Document not found.");
  if (!canWriteDocument(toPrincipal(user), document)) {
    throw new ApiError(
      "forbidden",
      "Only the owner can analyze this document.",
    );
  }

  const workflowRunId = createId();
  const store = getVectorStore();

  // Run the durable pipeline after the response is sent. Each step persists to
  // Postgres, so the document's status reflects progress and a failure leaves a
  // recoverable state for re-trigger.
  after(async () => {
    try {
      await runAnalyzeAndDraft(db, store, id, { createdById: user.id });
    } catch (err) {
      console.error("Pipeline failed for document", id, err);
      await updateDocumentStatus(db, id, "uploaded").catch(() => {});
    }
  });

  await updateDocumentStatus(db, id, "analyzing");
  return jsonResponse({ workflowRunId, status: "analyzing" });
});
