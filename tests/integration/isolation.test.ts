import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/db/client";
import { canReadDocument, canWriteDocument } from "@/lib/access";
import type { Principal } from "@/lib/access";
import type { Document, User } from "@/db/schema";
import {
  createDocument,
  getAssignedReviewerIds,
  listVisibleDocuments,
} from "@/lib/repositories/documents";
import { createDraft } from "@/lib/repositories/drafts";
import { upsertUserFromClerk } from "@/lib/repositories/users";
import { createTestDb } from "./db";

function principal(user: User): Principal {
  return { id: user.id, role: user.role };
}

describe("cross-user isolation (mandatory)", () => {
  let db: Database;
  let authorA: User;
  let authorB: User;
  let admin: User;
  let docA: Document;

  beforeAll(async () => {
    db = await createTestDb();
    authorA = await upsertUserFromClerk(db, {
      clerkId: "ck_a",
      email: "a@x.test",
      role: "author",
    });
    authorB = await upsertUserFromClerk(db, {
      clerkId: "ck_b",
      email: "b@x.test",
      role: "author",
    });
    admin = await upsertUserFromClerk(db, {
      clerkId: "ck_admin",
      email: "admin@x.test",
      role: "admin",
    });
    docA = await createDocument(db, {
      ownerId: authorA.id,
      title: "A's confidential filing",
      sourceType: "text",
      rawText: "Sensitive content owned by author A.",
    });
  });

  it("author B cannot read or mutate author A's document", async () => {
    const visibleToB = await listVisibleDocuments(db, principal(authorB));
    expect(visibleToB.find((d) => d.id === docA.id)).toBeUndefined();

    const reviewerIds = await getAssignedReviewerIds(db, docA.id);
    expect(canReadDocument(principal(authorB), docA, reviewerIds)).toBe(false);
    expect(canWriteDocument(principal(authorB), docA)).toBe(false);
  });

  it("the owner can read and write their own document", async () => {
    const visibleToA = await listVisibleDocuments(db, principal(authorA));
    expect(visibleToA.find((d) => d.id === docA.id)).toBeDefined();
    expect(canWriteDocument(principal(authorA), docA)).toBe(true);
  });

  it("author B can read (but not mutate) once assigned as the document's reviewer", async () => {
    await createDraft(db, {
      documentId: docA.id,
      version: 1,
      content: "Draft for review",
      citations: [],
      faithfulness: null,
      status: "in_review",
      createdById: authorA.id,
      assignedReviewerId: authorB.id,
    });

    const reviewerIds = await getAssignedReviewerIds(db, docA.id);
    expect(reviewerIds).toContain(authorB.id);
    expect(canReadDocument(principal(authorB), docA, reviewerIds)).toBe(true);
    expect(canWriteDocument(principal(authorB), docA)).toBe(false);

    const visibleToB = await listVisibleDocuments(db, principal(authorB));
    expect(visibleToB.find((d) => d.id === docA.id)).toBeDefined();
  });

  it("an admin can read any document", async () => {
    const reviewerIds = await getAssignedReviewerIds(db, docA.id);
    expect(canReadDocument(principal(admin), docA, reviewerIds)).toBe(true);
    const visibleToAdmin = await listVisibleDocuments(db, principal(admin));
    expect(visibleToAdmin.find((d) => d.id === docA.id)).toBeDefined();
  });
});
