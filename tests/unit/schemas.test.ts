import { describe, expect, it } from "vitest";
import {
  createDocumentSchema,
  createReviewSchema,
  regenerateDraftSchema,
  submitDraftSchema,
} from "@/lib/schemas";
import { LIMITS } from "@/lib/constants";

describe("createDocumentSchema", () => {
  it("accepts a text document with rawText", () => {
    const r = createDocumentSchema.safeParse({
      title: "Doc",
      sourceType: "text",
      rawText: "hello",
    });
    expect(r.success).toBe(true);
  });

  it("rejects a text document without rawText", () => {
    const r = createDocumentSchema.safeParse({
      title: "Doc",
      sourceType: "text",
    });
    expect(r.success).toBe(false);
  });

  it("accepts a pdf document with blobUrl", () => {
    const r = createDocumentSchema.safeParse({
      title: "Doc",
      sourceType: "pdf",
      blobUrl: "https://blob.example.com/a.pdf",
    });
    expect(r.success).toBe(true);
  });

  it("rejects a pdf document without blobUrl", () => {
    const r = createDocumentSchema.safeParse({
      title: "Doc",
      sourceType: "pdf",
    });
    expect(r.success).toBe(false);
  });

  it("rejects unknown keys (strict)", () => {
    const r = createDocumentSchema.safeParse({
      title: "Doc",
      sourceType: "text",
      rawText: "hi",
      sneaky: true,
    });
    expect(r.success).toBe(false);
  });

  it("enforces the title length cap", () => {
    const r = createDocumentSchema.safeParse({
      title: "x".repeat(LIMITS.title + 1),
      sourceType: "text",
      rawText: "hi",
    });
    expect(r.success).toBe(false);
  });
});

describe("other schemas", () => {
  it("regenerate accepts optional instructions and rejects overlong", () => {
    expect(regenerateDraftSchema.safeParse({}).success).toBe(true);
    expect(
      regenerateDraftSchema.safeParse({ instructions: "tighten it" }).success,
    ).toBe(true);
    expect(
      regenerateDraftSchema.safeParse({
        instructions: "x".repeat(LIMITS.instructions + 1),
      }).success,
    ).toBe(false);
  });

  it("submit requires a reviewer id", () => {
    expect(
      submitDraftSchema.safeParse({ assignedReviewerId: "abc" }).success,
    ).toBe(true);
    expect(submitDraftSchema.safeParse({}).success).toBe(false);
  });

  it("review requires a valid decision", () => {
    expect(
      createReviewSchema.safeParse({ draftId: "d1", decision: "approved" })
        .success,
    ).toBe(true);
    expect(
      createReviewSchema.safeParse({ draftId: "d1", decision: "nope" }).success,
    ).toBe(false);
  });
});
