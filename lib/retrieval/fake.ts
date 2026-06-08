import type { VectorChunk, VectorMatch, VectorStore } from "./types";

/** Lowercase alphanumeric word tokens. */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
}

/**
 * Deterministic in-memory vector store for tests and evals.
 *
 * Scores matches by weighted term overlap (a stand-in for hybrid dense+sparse
 * similarity) so retrieval is exercised end-to-end with zero network calls.
 */
export class FakeVectorStore implements VectorStore {
  private readonly namespaces = new Map<string, Map<string, VectorChunk>>();

  private ns(namespace: string): Map<string, VectorChunk> {
    let m = this.namespaces.get(namespace);
    if (!m) {
      m = new Map();
      this.namespaces.set(namespace, m);
    }
    return m;
  }

  async upsert(namespace: string, chunks: VectorChunk[]): Promise<void> {
    const m = this.ns(namespace);
    for (const c of chunks) m.set(c.id, c);
  }

  async query(
    namespace: string,
    text: string,
    topK: number,
  ): Promise<VectorMatch[]> {
    const queryTokens = new Set(tokenize(text));
    if (queryTokens.size === 0) return [];
    const scored: VectorMatch[] = [];
    for (const chunk of this.ns(namespace).values()) {
      const chunkTokens = tokenize(chunk.text);
      if (chunkTokens.length === 0) continue;
      let overlap = 0;
      const seen = new Set<string>();
      for (const t of chunkTokens) {
        if (queryTokens.has(t) && !seen.has(t)) {
          overlap += 1;
          seen.add(t);
        }
      }
      if (overlap === 0) continue;
      const score = overlap / queryTokens.size;
      scored.push({ ...chunk, score });
    }
    return scored.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  async reset(namespace: string): Promise<void> {
    this.namespaces.delete(namespace);
  }
}
