import { beforeAll, describe, expect, it } from "vitest";
import { CORPUS_NAMESPACE, docNamespace } from "@/lib/constants";
import { retrieveForObligation } from "@/lib/retrieval";
import { FakeVectorStore } from "@/lib/retrieval/fake";
import { CORPUS_SNIPPETS, seedCorpus } from "@/lib/retrieval/corpus";

describe("FakeVectorStore + retrieval assembler", () => {
  let store: FakeVectorStore;

  beforeAll(async () => {
    store = new FakeVectorStore();
    await seedCorpus(store);
    await store.upsert(docNamespace("doc1"), [
      {
        id: "doc1:0",
        text: "The institution must investigate electronic transfer errors within 10 business days.",
        metadata: { source: "document", chunkIndex: 0, documentId: "doc1" },
      },
    ]);
  });

  it("seedCorpus loads every snippet", async () => {
    const results = await store.query(
      CORPUS_NAMESPACE,
      "money laundering SAR",
      5,
    );
    expect(results.length).toBeGreaterThan(0);
    expect(CORPUS_SNIPPETS.length).toBe(12);
  });

  it("retrieves and fuses across corpus and document namespaces", async () => {
    const ctx = await retrieveForObligation(
      store,
      {
        id: "o1",
        text: "investigate electronic transfer errors within 10 business days",
      },
      "doc1",
    );
    const ids = ctx.chunks.map((c) => c.id);
    expect(ids).toContain("doc1:0");
    expect(ids).toContain("corpus:reg-e-error-resolution");
    expect(ctx.contextText).toContain("[doc1:0]");
  });

  it("returns nothing for an unrelated query", async () => {
    const ctx = await retrieveForObligation(
      store,
      { id: "o2", text: "zzz qqq unrelated nonsense" },
      "doc1",
    );
    expect(ctx.chunks).toHaveLength(0);
  });
});
