export interface ChunkMetadata {
  source: string;
  chunkIndex: number;
  documentId?: string;
}

export interface VectorChunk {
  id: string;
  text: string;
  metadata: ChunkMetadata;
}

export interface VectorMatch extends VectorChunk {
  score: number;
}

/**
 * Minimal vector-store contract. Abstracting retrieval behind this interface
 * lets tests and evals inject an in-memory fake (no network).
 */
export interface VectorStore {
  upsert(namespace: string, chunks: VectorChunk[]): Promise<void>;
  query(namespace: string, text: string, topK: number): Promise<VectorMatch[]>;
  /** Remove every vector in a namespace (used by seed + tests). */
  reset(namespace: string): Promise<void>;
}
