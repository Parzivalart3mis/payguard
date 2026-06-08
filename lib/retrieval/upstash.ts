import { Index } from "@upstash/vector";
import { env } from "@/lib/env";
import type {
  ChunkMetadata,
  VectorChunk,
  VectorMatch,
  VectorStore,
} from "./types";

let index: Index | null = null;

function getIndex(): Index {
  if (!index) {
    index = new Index({
      url: env.upstashVectorUrl,
      token: env.upstashVectorToken,
    });
  }
  return index;
}

function parseMetadata(raw: unknown): ChunkMetadata {
  const m = (raw ?? {}) as Record<string, unknown>;
  const source = typeof m.source === "string" ? m.source : "unknown";
  const chunkIndex = typeof m.chunkIndex === "number" ? m.chunkIndex : 0;
  const documentId =
    typeof m.documentId === "string" ? m.documentId : undefined;
  return { source, chunkIndex, ...(documentId ? { documentId } : {}) };
}

/**
 * Upstash Vector hybrid store. The index is created as a hybrid index backed by
 * Upstash-hosted dense + sparse embedding models, so we upsert/query raw text
 * via the `data` field — no separate embeddings API call. Dense + sparse
 * results are fused (RRF) by Upstash within each namespace query.
 */
export const upstashVectorStore: VectorStore = {
  async upsert(namespace, chunks) {
    if (chunks.length === 0) return;
    await getIndex()
      .namespace(namespace)
      .upsert(
        chunks.map((c: VectorChunk) => ({
          id: c.id,
          data: c.text,
          metadata: c.metadata as unknown as Record<string, unknown>,
        })),
      );
  },

  async query(namespace, text, topK) {
    if (!text.trim()) return [];
    const results = await getIndex().namespace(namespace).query({
      data: text,
      topK,
      includeMetadata: true,
      includeData: true,
    });
    return results.map(
      (r): VectorMatch => ({
        id: String(r.id),
        text: typeof r.data === "string" ? r.data : "",
        score: r.score,
        metadata: parseMetadata(r.metadata),
      }),
    );
  },

  async reset(namespace) {
    await getIndex().namespace(namespace).reset();
  },
};
