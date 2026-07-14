import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/db/client";
import type { User } from "@/db/schema";
import { createAnalysis } from "@/lib/repositories/analyses";
import {
  createDocument,
  getDocumentDetail,
} from "@/lib/repositories/documents";
import {
  createDraft,
  getNextVersion,
  listAssignedDrafts,
  submitDraftForReview,
} from "@/lib/repositories/drafts";
import {
  createReview,
  listReviewsForDocument,
} from "@/lib/repositories/reviews";
import { listReviewers, upsertUserFromClerk } from "@/lib/repositories/users";
import { createTestDb } from "./db";

describe("repositories", () => {
  let db: Database;
  let author: User;
  let reviewer: User;

  beforeAll(async () => {
    db = await createTestDb();
    author = await upsertUserFromClerk(db, {
      clerkId: "ck_author",
      email: "author@x.test",
      role: "author",
    });
    reviewer = await upsertUserFromClerk(db, {
      clerkId: "ck_reviewer",
      email: "reviewer@x.test",
      role: "reviewer",
    });
  });

  it("upsert is idempotent on clerkId and updates fields", async () => {
    const again = await upsertUserFromClerk(db, {
      clerkId: "ck_author",
      email: "author2@x.test",
      name: "Author Two",
    });
    expect(again.id).toBe(author.id);
    expect(again.email).toBe("author2@x.test");
    expect(again.name).toBe("Author Two");
  });

  it("listReviewers returns reviewers and admins only", async () => {
    const reviewers = await listReviewers(db);
    expect(reviewers.map((r) => r.id)).toContain(reviewer.id);
    expect(reviewers.map((r) => r.id)).not.toContain(author.id);
  });

  it("assembles a document detail bundle and increments draft versions", async () => {
    const doc = await createDocument(db, {
      ownerId: author.id,
      title: "Agreement",
      sourceType: "text",
      rawText: "Some obligations apply.",
    });

    await createAnalysis(db, {
      documentId: doc.id,
      obligations: [
        {
          id: "o1",
          text: "Disclose fees.",
          category: "disclosure",
          sourceSpan: "fees",
        },
      ],
      model: "gemini-2.5-flash",
    });

    expect(await getNextVersion(db, doc.id)).toBe(1);
    const draft1 = await createDraft(db, {
      documentId: doc.id,
      version: 1,
      content: "Draft v1 [o1]",
      citations: [{ claim: "Disclose fees", sourceChunkIds: ["corpus:x"] }],
      faithfulness: { verdict: "pass", flags: [] },
      status: "drafted",
      createdById: author.id,
    });
    expect(await getNextVersion(db, doc.id)).toBe(2);

    const detail = await getDocumentDetail(db, doc.id);
    expect(detail?.analysis?.obligations).toHaveLength(1);
    expect(detail?.latestDraft?.id).toBe(draft1.id);
    expect(detail?.reviews).toHaveLength(0);
  });

  it("review queue lists drafts in review assigned to the reviewer, and records decisions", async () => {
    const doc = await createDocument(db, {
      ownerId: author.id,
      title: "Submitted doc",
      sourceType: "text",
      rawText: "Content.",
    });
    const draft = await createDraft(db, {
      documentId: doc.id,
      version: 1,
      content: "Draft",
      citations: [],
      faithfulness: { verdict: "pass", flags: [] },
      status: "drafted",
      createdById: author.id,
    });

    await submitDraftForReview(db, draft.id, reviewer.id);
    const queue = await listAssignedDrafts(db, reviewer.id);
    expect(queue.find((q) => q.draft.id === draft.id)?.documentTitle).toBe(
      "Submitted doc",
    );

    await createReview(db, {
      draftId: draft.id,
      reviewerId: reviewer.id,
      decision: "changes_requested",
      comments: "Tighten section 2.",
    });
    const reviews = await listReviewsForDocument(db, doc.id);
    expect(reviews).toHaveLength(1);
    expect(reviews[0]?.decision).toBe("changes_requested");
  });
});
