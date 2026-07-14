/**
 * Google Gemini model IDs (per ai.google.dev).
 * Flash across the board keeps the app working on the free tier (Pro models
 * are billing-only: free-tier quota is 0). With billing enabled, bump `draft`
 * and `judge` to `gemini-pro-latest` for stronger reasoning on the
 * drafting and faithfulness self-check passes.
 */
export const MODELS = {
  extract: "gemini-3.5-flash",
  draft: "gemini-3.5-flash",
  judge: "gemini-3.5-flash",
} as const;

/** Field-length caps enforced by Zod at every API boundary (sensitive tier). */
export const LIMITS = {
  title: 200,
  comments: 4000,
  instructions: 2000,
  rawText: 200_000,
  /** Upload size cap: 10 MB. */
  uploadBytes: 10 * 1024 * 1024,
} as const;

/** Upstash Vector namespaces. */
export const CORPUS_NAMESPACE = "corpus";
export function docNamespace(documentId: string): string {
  return `doc:${documentId}`;
}

/** Document lifecycle state machine. */
export const DOCUMENT_STATUSES = [
  "uploaded",
  "analyzing",
  "analyzed",
  "drafting",
  "drafted",
  "in_review",
  "approved",
  "changes_requested",
] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

/** Draft lifecycle. */
export const DRAFT_STATUSES = [
  "generating",
  "drafted",
  "in_review",
  "approved",
  "changes_requested",
] as const;
export type DraftStatus = (typeof DRAFT_STATUSES)[number];

export const USER_ROLES = ["author", "reviewer", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const SOURCE_TYPES = ["pdf", "text"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const REVIEW_DECISIONS = ["approved", "changes_requested"] as const;
export type ReviewDecision = (typeof REVIEW_DECISIONS)[number];

export const OBLIGATION_CATEGORIES = [
  "disclosure",
  "reporting",
  "consumer_protection",
  "data_privacy",
  "anti_money_laundering",
  "risk_management",
  "other",
] as const;
export type ObligationCategory = (typeof OBLIGATION_CATEGORIES)[number];
