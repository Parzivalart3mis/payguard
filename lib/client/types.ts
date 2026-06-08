import type {
  DocumentStatus,
  DraftStatus,
  ReviewDecision,
  SourceType,
} from "@/lib/constants";
import type { Citation, Faithfulness, Obligation } from "@/lib/types";

/** JSON-serialized shapes returned by the API (dates as ISO strings). */

export interface DocumentDTO {
  id: string;
  ownerId: string;
  title: string;
  sourceType: SourceType;
  blobUrl: string | null;
  rawText: string;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisDTO {
  id: string;
  documentId: string;
  obligations: Obligation[];
  model: string;
  createdAt: string;
}

export interface DraftDTO {
  id: string;
  documentId: string;
  version: number;
  content: string;
  citations: Citation[];
  faithfulness: Faithfulness | null;
  status: DraftStatus;
  assignedReviewerId: string | null;
  createdById: string;
  createdAt: string;
}

export interface ReviewDTO {
  id: string;
  draftId: string;
  reviewerId: string;
  decision: ReviewDecision;
  comments: string | null;
  createdAt: string;
}

export interface DocumentDetailDTO {
  document: DocumentDTO;
  analysis: AnalysisDTO | null;
  latestDraft: DraftDTO | null;
  reviews: ReviewDTO[];
}

export interface ReviewerDTO {
  id: string;
  name: string | null;
  email: string;
  role: string;
}
