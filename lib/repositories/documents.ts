import { desc, eq, inArray, or } from "drizzle-orm";
import type { Database } from "@/db/client";
import {
  documents,
  drafts,
  type Analysis,
  type Document,
  type Draft,
  type NewDocument,
} from "@/db/schema";
import type { Principal } from "@/lib/access";
import type { DocumentStatus } from "@/lib/constants";
import { getAnalysisByDocument } from "@/lib/repositories/analyses";
import { getLatestDraft } from "@/lib/repositories/drafts";
import { listReviewsForDocument } from "@/lib/repositories/reviews";
import type { Review } from "@/db/schema";

export async function createDocument(
  db: Database,
  input: Pick<NewDocument, "ownerId" | "title" | "sourceType" | "rawText"> & {
    blobUrl?: string | null;
  },
): Promise<Document> {
  const rows = await db
    .insert(documents)
    .values({
      ownerId: input.ownerId,
      title: input.title,
      sourceType: input.sourceType,
      rawText: input.rawText,
      blobUrl: input.blobUrl ?? null,
    })
    .returning();
  const row = rows[0];
  if (!row) throw new Error("Failed to create document");
  return row;
}

export async function getDocumentById(
  db: Database,
  id: string,
): Promise<Document | undefined> {
  const rows = await db
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1);
  return rows[0];
}

/** Distinct reviewer ids assigned to any draft of this document. */
export async function getAssignedReviewerIds(
  db: Database,
  documentId: string,
): Promise<string[]> {
  const rows = await db
    .select({ reviewerId: drafts.assignedReviewerId })
    .from(drafts)
    .where(eq(drafts.documentId, documentId));
  const ids = new Set<string>();
  for (const r of rows) if (r.reviewerId) ids.add(r.reviewerId);
  return [...ids];
}

/** Documents visible to the principal under the access predicate. */
export async function listVisibleDocuments(
  db: Database,
  user: Principal,
): Promise<Document[]> {
  if (user.role === "admin") {
    return db.select().from(documents).orderBy(desc(documents.updatedAt));
  }
  const reviewerDocIds = db
    .select({ id: drafts.documentId })
    .from(drafts)
    .where(eq(drafts.assignedReviewerId, user.id));
  return db
    .select()
    .from(documents)
    .where(
      or(eq(documents.ownerId, user.id), inArray(documents.id, reviewerDocIds)),
    )
    .orderBy(desc(documents.updatedAt));
}

export async function updateDocumentStatus(
  db: Database,
  id: string,
  status: DocumentStatus,
): Promise<void> {
  await db
    .update(documents)
    .set({ status, updatedAt: new Date() })
    .where(eq(documents.id, id));
}

export interface DocumentDetail {
  document: Document;
  analysis: Analysis | null;
  latestDraft: Draft | null;
  reviews: Review[];
}

/** Assemble the document detail bundle (no access check — caller enforces). */
export async function getDocumentDetail(
  db: Database,
  documentId: string,
): Promise<DocumentDetail | null> {
  const document = await getDocumentById(db, documentId);
  if (!document) return null;
  const [analysis, latestDraft, reviews] = await Promise.all([
    getAnalysisByDocument(db, documentId),
    getLatestDraft(db, documentId),
    listReviewsForDocument(db, documentId),
  ]);
  return {
    document,
    analysis: analysis ?? null,
    latestDraft: latestDraft ?? null,
    reviews,
  };
}
