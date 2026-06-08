import type { ObligationCategory } from "@/lib/constants";

/** A single extracted obligation/clause (stored in analyses.obligations jsonb). */
export interface Obligation {
  id: string;
  text: string;
  category: ObligationCategory;
  /** Human-readable pointer to where in the source this came from. */
  sourceSpan: string;
}

/** A grounded claim in a draft and the chunk ids that support it. */
export interface Citation {
  claim: string;
  sourceChunkIds: string[];
}

/** One unsupported claim flagged by the faithfulness self-check. */
export interface FaithfulnessFlag {
  claim: string;
  reason: string;
}

/** Result of the automated faithfulness self-check (stored on a draft). */
export interface Faithfulness {
  verdict: "pass" | "flagged";
  flags: FaithfulnessFlag[];
}

/** A retrieved context chunk used to ground a draft. */
export interface RetrievedChunk {
  id: string;
  text: string;
  score: number;
  source: string;
  documentId?: string;
  chunkIndex?: number;
}
