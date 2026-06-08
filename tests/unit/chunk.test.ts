import { describe, expect, it } from "vitest";
import { chunkText } from "@/lib/retrieval/chunk";

describe("chunkText", () => {
  it("returns an empty array for empty input", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   ")).toEqual([]);
  });

  it("returns a single chunk for short text", () => {
    expect(chunkText("a short paragraph")).toEqual(["a short paragraph"]);
  });

  it("splits long text into multiple chunks", () => {
    const para = "Sentence number ".repeat(50);
    const text = `${para}\n\n${para}\n\n${para}`;
    const chunks = chunkText(text, { maxChars: 200, overlap: 20 });
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeGreaterThan(0);
  });

  it("hard-splits an oversized single paragraph", () => {
    const huge = "x".repeat(5000);
    const chunks = chunkText(huge, { maxChars: 1000, overlap: 100 });
    expect(chunks.length).toBeGreaterThan(1);
  });
});
