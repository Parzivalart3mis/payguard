import { and, desc, eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { documents, drafts, type Draft, type NewDraft } from "@/db/schema";
import type { DraftStatus } from "@/lib/constants";
import type { Citation, Faithfulness } from "@/lib/types";

export async function createDraft(
  db: Database,
  input: Omit<NewDraft, "id" | "createdAt">,
): Promise<Draft> {
  const rows = await db.insert(drafts).values(input).returning();
  const row = rows[0];
  if (!row) throw new Error("Failed to create draft");
  return row;
}

export async function getDraftById(
  db: Database,
  id: string,
): Promise<Draft | undefined> {
  const rows = await db.select().from(drafts).where(eq(drafts.id, id)).limit(1);
  return rows[0];
}

export async function getLatestDraft(
  db: Database,
  documentId: string,
): Promise<Draft | undefined> {
  const rows = await db
    .select()
    .from(drafts)
    .where(eq(drafts.documentId, documentId))
    .orderBy(desc(drafts.version))
    .limit(1);
  return rows[0];
}

export async function getNextVersion(
  db: Database,
  documentId: string,
): Promise<number> {
  const latest = await getLatestDraft(db, documentId);
  return (latest?.version ?? 0) + 1;
}

export async function updateDraftContent(
  db: Database,
  id: string,
  patch: {
    content?: string;
    citations?: Citation[];
    faithfulness?: Faithfulness | null;
    status?: DraftStatus;
  },
): Promise<void> {
  await db.update(drafts).set(patch).where(eq(drafts.id, id));
}

export async function setDraftStatus(
  db: Database,
  id: string,
  status: DraftStatus,
): Promise<void> {
  await db.update(drafts).set({ status }).where(eq(drafts.id, id));
}

/** Move a draft into review, assigning it to a reviewer. */
export async function submitDraftForReview(
  db: Database,
  id: string,
  assignedReviewerId: string,
): Promise<void> {
  await db
    .update(drafts)
    .set({ status: "in_review", assignedReviewerId })
    .where(eq(drafts.id, id));
}

export interface ReviewQueueItem {
  draft: Draft;
  documentTitle: string;
}

/** Drafts in review currently assigned to this reviewer. */
export async function listAssignedDrafts(
  db: Database,
  reviewerId: string,
): Promise<ReviewQueueItem[]> {
  const rows = await db
    .select({ draft: drafts, documentTitle: documents.title })
    .from(drafts)
    .innerJoin(documents, eq(drafts.documentId, documents.id))
    .where(
      and(
        eq(drafts.assignedReviewerId, reviewerId),
        eq(drafts.status, "in_review"),
      ),
    )
    .orderBy(desc(drafts.createdAt));
  return rows;
}
