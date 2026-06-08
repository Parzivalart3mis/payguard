import { getDb } from "@/db/client";
import { canWriteDocument } from "@/lib/access";
import { requireUser, toPrincipal } from "@/lib/auth/current-user";
import { extractCitations } from "@/lib/ai/parse";
import { streamDraft } from "@/lib/ai/draft";
import { runSelfCheck } from "@/lib/ai/selfcheck";
import { textFromContent } from "@/lib/ai/util";
import { ApiError, withErrorHandling } from "@/lib/http";
import { enforceRateLimit } from "@/lib/ratelimit";
import { getVectorStore, retrieveForObligations } from "@/lib/retrieval";
import { mergeContexts } from "@/lib/pipeline";
import { regenerateDraftSchema } from "@/lib/schemas";
import { getAnalysisByDocument } from "@/lib/repositories/analyses";
import {
  getDocumentById,
  updateDocumentStatus,
} from "@/lib/repositories/documents";
import {
  createDraft,
  getDraftById,
  getNextVersion,
  updateDraftContent,
} from "@/lib/repositories/drafts";

export const runtime = "nodejs";
export const maxDuration = 300;

type Ctx = { params: Promise<{ id: string }> };

export const POST = withErrorHandling(async (req: Request, ctx: Ctx) => {
  const user = await requireUser();
  await enforceRateLimit("ai", user.id);
  const { id } = await ctx.params;
  const db = getDb();

  const draft = await getDraftById(db, id);
  if (!draft) throw new ApiError("not_found", "Draft not found.");
  const document = await getDocumentById(db, draft.documentId);
  if (!document) throw new ApiError("not_found", "Document not found.");
  if (!canWriteDocument(toPrincipal(user), document)) {
    throw new ApiError(
      "forbidden",
      "Only the owner can regenerate this draft.",
    );
  }

  const { instructions } = regenerateDraftSchema.parse(
    await req.json().catch(() => ({})),
  );

  const analysis = await getAnalysisByDocument(db, document.id);
  if (!analysis) {
    throw new ApiError("conflict", "Analyze the document before regenerating.");
  }

  const store = getVectorStore();
  const contexts = await retrieveForObligations(
    store,
    analysis.obligations.map((o) => ({ id: o.id, text: o.text })),
    document.id,
  );
  const merged = mergeContexts(contexts);
  const validChunkIds = merged.chunks.map((c) => c.id);

  await updateDocumentStatus(db, document.id, "drafting");

  const stream = streamDraft({
    documentTitle: document.title,
    obligations: analysis.obligations.map((o) => ({
      id: o.id,
      text: o.text,
      category: o.category,
    })),
    contextText: merged.contextText,
    ...(instructions ? { instructions } : {}),
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };
      try {
        stream.on("text", (delta: string) => send("token", { text: delta }));
        const final = await stream.finalMessage();
        const content = textFromContent(final.content).trim();
        const citations = extractCitations(content, validChunkIds);

        const version = await getNextVersion(db, document.id);
        const created = await createDraft(db, {
          documentId: document.id,
          version,
          content,
          citations,
          status: "drafted",
          createdById: user.id,
          faithfulness: null,
        });

        const faithfulness = await runSelfCheck({
          draft: content,
          contextText: merged.contextText,
        });
        await updateDraftContent(db, created.id, { faithfulness });
        await updateDocumentStatus(db, document.id, "drafted");

        send("done", { draft: { ...created, faithfulness } });
      } catch (err) {
        console.error("Regenerate failed:", err);
        await updateDocumentStatus(db, document.id, "drafted").catch(() => {});
        send("error", { message: "Generation failed. Please try again." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
});
