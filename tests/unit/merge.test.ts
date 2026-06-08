import { describe, expect, it } from "vitest";
import { mergeContexts } from "@/lib/pipeline/merge";
import type { ObligationContext } from "@/lib/retrieval";
import type { RetrievedChunk } from "@/lib/types";

function chunk(id: string, score: number): RetrievedChunk {
  return { id, text: `t-${id}`, score, source: "corpus", chunkIndex: 0 };
}

function oc(id: string, chunks: RetrievedChunk[]): ObligationContext {
  return {
    obligationId: id,
    obligationText: `o-${id}`,
    context: { chunks, contextText: "" },
  };
}

describe("mergeContexts", () => {
  it("dedupes by id keeping the highest score, ranks, and caps", () => {
    const merged = mergeContexts(
      [
        oc("1", [chunk("a", 0.4), chunk("b", 0.9)]),
        oc("2", [chunk("a", 0.8), chunk("c", 0.2)]),
      ],
      2,
    );
    expect(merged.chunks).toHaveLength(2);
    // 'b' (0.9) then 'a' (max 0.8) — 'c' dropped by the cap
    expect(merged.chunks.map((c) => c.id)).toEqual(["b", "a"]);
    expect(merged.chunks[1]?.score).toBe(0.8);
    expect(merged.contextText).toContain("[b]");
  });
});
