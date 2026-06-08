import type { RetrievedChunk } from "@/lib/types";
import type { VectorMatch } from "./types";

/**
 * Reciprocal Rank Fusion across ranked result lists.
 *
 * Upstash's hybrid index already fuses dense + sparse results *within* a single
 * namespace query (it returns one ranked list). RRF here fuses *across* the two
 * namespaces we query (shared `corpus` + per-document `doc:{id}`) into one list.
 *
 * RRF score for a document = Σ over lists of 1 / (k + rank). Higher is better.
 */
export function fuseByRRF(lists: VectorMatch[][], k = 60): VectorMatch[] {
  const fused = new Map<string, { match: VectorMatch; score: number }>();
  for (const list of lists) {
    list.forEach((match, i) => {
      const rank = i + 1;
      const increment = 1 / (k + rank);
      const existing = fused.get(match.id);
      if (existing) {
        existing.score += increment;
      } else {
        fused.set(match.id, { match, score: increment });
      }
    });
  }
  return [...fused.values()]
    .sort((a, b) => b.score - a.score)
    .map((entry) => ({ ...entry.match, score: entry.score }));
}

export interface GroundedContext {
  chunks: RetrievedChunk[];
  /** Citation-tagged context block fed to the drafting model. */
  contextText: string;
}

/**
 * Assemble a grounded-context block from fused matches. Each chunk is tagged
 * with its id so the drafting model can cite it inline as [chunkId].
 */
export function assembleContext(
  matches: VectorMatch[],
  limit = 8,
): GroundedContext {
  const chunks: RetrievedChunk[] = matches.slice(0, limit).map((m) => ({
    id: m.id,
    text: m.text,
    score: m.score,
    source: m.metadata.source,
    chunkIndex: m.metadata.chunkIndex,
    ...(m.metadata.documentId ? { documentId: m.metadata.documentId } : {}),
  }));
  const contextText = chunks
    .map((c) => `[${c.id}] (source: ${c.source})\n${c.text}`)
    .join("\n\n");
  return { chunks, contextText };
}
