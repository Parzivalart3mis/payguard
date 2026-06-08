import { z } from "zod";
import { LIMITS } from "@/lib/constants";

/**
 * Zod schemas for every API boundary. `.strict()` rejects unknown keys, every
 * free-text field is length-capped (sensitive tier), and these schemas are
 * shared by server route handlers and client forms.
 *
 * Literal unions are inlined here (mirroring lib/constants) so parsed values
 * keep precise types.
 */

const id = z.string().min(1).max(64);

export const createDocumentSchema = z
  .object({
    title: z.string().trim().min(1).max(LIMITS.title),
    sourceType: z.enum(["pdf", "text"]),
    blobUrl: z.string().url().max(2048).optional(),
    rawText: z.string().max(LIMITS.rawText).optional(),
  })
  .strict()
  .refine(
    (d) =>
      d.sourceType === "text"
        ? typeof d.rawText === "string" && d.rawText.trim().length > 0
        : typeof d.blobUrl === "string" && d.blobUrl.length > 0,
    {
      message:
        "Provide rawText for a text document, or blobUrl for a PDF document.",
      path: ["rawText"],
    },
  );
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;

export const regenerateDraftSchema = z
  .object({
    instructions: z.string().trim().max(LIMITS.instructions).optional(),
  })
  .strict();
export type RegenerateDraftInput = z.infer<typeof regenerateDraftSchema>;

export const submitDraftSchema = z
  .object({
    assignedReviewerId: id,
  })
  .strict();
export type SubmitDraftInput = z.infer<typeof submitDraftSchema>;

export const createReviewSchema = z
  .object({
    draftId: id,
    decision: z.enum(["approved", "changes_requested"]),
    comments: z.string().trim().max(LIMITS.comments).optional(),
  })
  .strict();
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

/** Content types accepted by the upload handler. */
export const ALLOWED_UPLOAD_CONTENT_TYPES = [
  "application/pdf",
  "text/plain",
] as const;
