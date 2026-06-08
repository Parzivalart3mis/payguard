import { CORPUS_NAMESPACE, docNamespace } from "@/lib/constants";
import type { Obligation } from "@/lib/types";
import { assembleContext, fuseByRRF, type GroundedContext } from "./fuse";
import { upstashVectorStore } from "./upstash";
import type { VectorStore } from "./types";

export type { VectorStore, VectorChunk, VectorMatch } from "./types";
export { fuseByRRF, assembleContext } from "./fuse";
export type { GroundedContext } from "./fuse";

/** The production vector store (Upstash hybrid). Tests inject a fake instead. */
export function getVectorStore(): VectorStore {
  return upstashVectorStore;
}

export interface RetrieveOptions {
  /** topK requested per namespace before cross-namespace fusion. */
  topKPerNamespace?: number;
  /** Max chunks kept in the assembled context. */
  finalTopK?: number;
}

/**
 * Retrieve grounded context for a single obligation: query both the shared
 * `corpus` namespace and the document's own `doc:{id}` namespace, fuse with RRF,
 * and assemble a citation-tagged context block.
 */
export async function retrieveForObligation(
  store: VectorStore,
  obligation: Pick<Obligation, "id" | "text">,
  documentId: string,
  options: RetrieveOptions = {},
): Promise<GroundedContext> {
  const topKPerNamespace = options.topKPerNamespace ?? 6;
  const finalTopK = options.finalTopK ?? 8;
  const [corpusMatches, docMatches] = await Promise.all([
    store.query(CORPUS_NAMESPACE, obligation.text, topKPerNamespace),
    store.query(docNamespace(documentId), obligation.text, topKPerNamespace),
  ]);
  const fused = fuseByRRF([corpusMatches, docMatches]);
  return assembleContext(fused, finalTopK);
}

export interface ObligationContext {
  obligationId: string;
  obligationText: string;
  context: GroundedContext;
}

/** Retrieve grounded context for every obligation in an analysis. */
export async function retrieveForObligations(
  store: VectorStore,
  obligations: Array<Pick<Obligation, "id" | "text">>,
  documentId: string,
  options: RetrieveOptions = {},
): Promise<ObligationContext[]> {
  return Promise.all(
    obligations.map(async (o) => ({
      obligationId: o.id,
      obligationText: o.text,
      context: await retrieveForObligation(store, o, documentId, options),
    })),
  );
}
