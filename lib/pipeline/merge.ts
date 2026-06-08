import type { GroundedContext, ObligationContext } from "@/lib/retrieval";
import type { RetrievedChunk } from "@/lib/types";

/**
 * Merge per-obligation grounded contexts into one context block for drafting:
 * union all chunks, keep the highest score per chunk id, rank, and cap.
 */
export function mergeContexts(
  contexts: ObligationContext[],
  limit = 12,
): GroundedContext {
  const byId = new Map<string, RetrievedChunk>();
  for (const oc of contexts) {
    for (const chunk of oc.context.chunks) {
      const existing = byId.get(chunk.id);
      if (!existing || chunk.score > existing.score) {
        byId.set(chunk.id, chunk);
      }
    }
  }
  const chunks = [...byId.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  const contextText = chunks
    .map((c) => `[${c.id}] (source: ${c.source})\n${c.text}`)
    .join("\n\n");
  return { chunks, contextText };
}
