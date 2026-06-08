import { describe, expect, it } from "vitest";
import { assembleContext, fuseByRRF } from "@/lib/retrieval/fuse";
import type { VectorMatch } from "@/lib/retrieval/types";

function match(id: string, score: number): VectorMatch {
  return {
    id,
    text: `text-${id}`,
    score,
    metadata: { source: "corpus", chunkIndex: 0 },
  };
}

describe("fuseByRRF", () => {
  it("ranks items appearing in both lists above singletons", () => {
    const a = [match("x", 0.9), match("y", 0.8)];
    const b = [match("x", 0.7), match("z", 0.6)];
    const fused = fuseByRRF([a, b]);
    expect(fused[0]?.id).toBe("x");
    expect(fused.map((m) => m.id).sort()).toEqual(["x", "y", "z"]);
  });

  it("returns an empty list for empty input", () => {
    expect(fuseByRRF([])).toEqual([]);
  });
});

describe("assembleContext", () => {
  it("caps to the limit and tags chunks with their ids", () => {
    const matches = [match("a", 1), match("b", 0.5), match("c", 0.2)];
    const ctx = assembleContext(matches, 2);
    expect(ctx.chunks).toHaveLength(2);
    expect(ctx.contextText).toContain("[a]");
    expect(ctx.contextText).toContain("[b]");
    expect(ctx.contextText).not.toContain("[c]");
  });
});
