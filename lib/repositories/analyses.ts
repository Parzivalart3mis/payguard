import { desc, eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { analyses, type Analysis } from "@/db/schema";
import type { Obligation } from "@/lib/types";

export async function createAnalysis(
  db: Database,
  input: { documentId: string; obligations: Obligation[]; model: string },
): Promise<Analysis> {
  const rows = await db
    .insert(analyses)
    .values({
      documentId: input.documentId,
      obligations: input.obligations,
      model: input.model,
    })
    .returning();
  const row = rows[0];
  if (!row) throw new Error("Failed to create analysis");
  return row;
}

/** Most recent analysis for a document. */
export async function getAnalysisByDocument(
  db: Database,
  documentId: string,
): Promise<Analysis | undefined> {
  const rows = await db
    .select()
    .from(analyses)
    .where(eq(analyses.documentId, documentId))
    .orderBy(desc(analyses.createdAt))
    .limit(1);
  return rows[0];
}
