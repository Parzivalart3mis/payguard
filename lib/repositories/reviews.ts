import { desc, eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { drafts, reviews, type Review } from "@/db/schema";
import type { ReviewDecision } from "@/lib/constants";

export async function createReview(
  db: Database,
  input: {
    draftId: string;
    reviewerId: string;
    decision: ReviewDecision;
    comments?: string | null;
  },
): Promise<Review> {
  const rows = await db
    .insert(reviews)
    .values({
      draftId: input.draftId,
      reviewerId: input.reviewerId,
      decision: input.decision,
      comments: input.comments ?? null,
    })
    .returning();
  const row = rows[0];
  if (!row) throw new Error("Failed to create review");
  return row;
}

export async function listReviewsForDraft(
  db: Database,
  draftId: string,
): Promise<Review[]> {
  return db
    .select()
    .from(reviews)
    .where(eq(reviews.draftId, draftId))
    .orderBy(desc(reviews.createdAt));
}

/** All reviews across every draft of a document, newest first. */
export async function listReviewsForDocument(
  db: Database,
  documentId: string,
): Promise<Review[]> {
  const rows = await db
    .select({ review: reviews })
    .from(reviews)
    .innerJoin(drafts, eq(reviews.draftId, drafts.id))
    .where(eq(drafts.documentId, documentId))
    .orderBy(desc(reviews.createdAt));
  return rows.map((r) => r.review);
}
