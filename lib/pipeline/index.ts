import type { Database } from "@/db/client";
import type { Draft } from "@/db/schema";
import { MODELS, docNamespace } from "@/lib/constants";
import { extractObligations } from "@/lib/ai/extract";
import { draftCompletion } from "@/lib/ai/draft";
import { extractCitations } from "@/lib/ai/parse";
import { runSelfCheck } from "@/lib/ai/selfcheck";
import { chunkText } from "@/lib/retrieval/chunk";
import { retrieveForObligations, type VectorStore } from "@/lib/retrieval";
import {
  createAnalysis,
  getAnalysisByDocument,
} from "@/lib/repositories/analyses";
import {
  getDocumentById,
  updateDocumentStatus,
} from "@/lib/repositories/documents";
import {
  createDraft,
  getNextVersion,
  updateDraftContent,
} from "@/lib/repositories/drafts";
import { mergeContexts } from "./merge";

export { mergeContexts } from "./merge";

/**
 * Chunk a document's raw text and upsert it into its own `doc:{id}` vector
 * namespace so retrieval can ground drafts in the document itself.
 */
export async function ingestDocumentChunks(
  store: VectorStore,
  documentId: string,
  rawText: string,
): Promise<number> {
  const pieces = chunkText(rawText);
  const namespace = docNamespace(documentId);
  await store.reset(namespace);
  await store.upsert(
    namespace,
    pieces.map((text, i) => ({
      id: `${documentId}:${i}`,
      text,
      metadata: { source: "document", chunkIndex: i, documentId },
    })),
  );
  return pieces.length;
}

/**
 * Step 1–2 setup: extract obligations (Flash), persist the analysis, and ingest
 * document chunks for retrieval. Advances status uploaded → analyzing → analyzed.
 */
export async function analyzeDocument(
  db: Database,
  store: VectorStore,
  documentId: string,
): Promise<void> {
  const document = await getDocumentById(db, documentId);
  if (!document) throw new Error(`Document not found: ${documentId}`);

  await updateDocumentStatus(db, documentId, "analyzing");
  const obligations = await extractObligations(document.rawText);
  await createAnalysis(db, {
    documentId,
    obligations,
    model: MODELS.extract,
  });
  await ingestDocumentChunks(store, documentId, document.rawText);
  await updateDocumentStatus(db, documentId, "analyzed");
}

export interface GenerateDraftOptions {
  createdById: string;
  assignedReviewerId?: string | null;
  instructions?: string;
}

/**
 * Steps 2–4: retrieve grounded context per obligation, draft (Pro + Google
 * Search grounding), persist the draft, then run the faithfulness self-check and persist
 * the verdict. Advances status analyzed → drafting → drafted.
 */
export async function generateDraftForDocument(
  db: Database,
  store: VectorStore,
  documentId: string,
  options: GenerateDraftOptions,
): Promise<Draft> {
  const document = await getDocumentById(db, documentId);
  if (!document) throw new Error(`Document not found: ${documentId}`);
  const analysis = await getAnalysisByDocument(db, documentId);
  if (!analysis) throw new Error(`No analysis for document: ${documentId}`);

  await updateDocumentStatus(db, documentId, "drafting");

  const obligationContexts = await retrieveForObligations(
    store,
    analysis.obligations.map((o) => ({ id: o.id, text: o.text })),
    documentId,
  );
  const merged = mergeContexts(obligationContexts);

  const content = await draftCompletion({
    documentTitle: document.title,
    obligations: analysis.obligations.map((o) => ({
      id: o.id,
      text: o.text,
      category: o.category,
    })),
    contextText: merged.contextText,
    ...(options.instructions ? { instructions: options.instructions } : {}),
  });

  const citations = extractCitations(
    content,
    merged.chunks.map((c) => c.id),
  );
  const version = await getNextVersion(db, documentId);

  const draft = await createDraft(db, {
    documentId,
    version,
    content,
    citations,
    status: "drafted",
    createdById: options.createdById,
    assignedReviewerId: options.assignedReviewerId ?? null,
    faithfulness: null,
  });

  const faithfulness = await runSelfCheck({
    draft: content,
    contextText: merged.contextText,
  });
  await updateDraftContent(db, draft.id, { faithfulness });

  await updateDocumentStatus(db, documentId, "drafted");
  return { ...draft, faithfulness };
}

/**
 * Full pipeline for a freshly-uploaded document: analyze, then draft + check.
 * Each step persists to Postgres, so a re-invocation resumes from the current
 * status rather than redoing completed work. The human-review pause that
 * follows is modelled by the durable `in_review` draft state.
 */
export async function runAnalyzeAndDraft(
  db: Database,
  store: VectorStore,
  documentId: string,
  options: GenerateDraftOptions,
): Promise<Draft> {
  await analyzeDocument(db, store, documentId);
  return generateDraftForDocument(db, store, documentId, options);
}
