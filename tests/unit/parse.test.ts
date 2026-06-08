import { describe, expect, it } from "vitest";
import {
  extractCitations,
  parseFaithfulness,
  parseObligations,
} from "@/lib/ai/parse";

describe("parseObligations", () => {
  it("parses an { obligations: [...] } envelope and keeps ids", () => {
    const out = parseObligations({
      obligations: [
        { id: "a", text: "Do X", category: "disclosure", sourceSpan: "x" },
      ],
    });
    expect(out).toHaveLength(1);
    expect(out[0]?.id).toBe("a");
    expect(out[0]?.category).toBe("disclosure");
  });

  it("parses a bare array, assigns ids, and coerces unknown categories", () => {
    const out = parseObligations([
      { text: "Do Y", category: "made_up" },
      { text: "Do Z", category: "reporting" },
    ]);
    expect(out).toHaveLength(2);
    expect(out[0]?.id).toBeTruthy();
    expect(out[0]?.category).toBe("other");
    expect(out[1]?.category).toBe("reporting");
  });

  it("returns [] for garbage input", () => {
    expect(parseObligations({ nope: 1 })).toEqual([]);
    expect(parseObligations(null)).toEqual([]);
  });

  it("de-duplicates repeated ids", () => {
    const out = parseObligations([
      { id: "dup", text: "A", category: "other" },
      { id: "dup", text: "B", category: "other" },
    ]);
    expect(out[0]?.id).not.toBe(out[1]?.id);
  });
});

describe("parseFaithfulness", () => {
  it("returns pass when verdict is pass and no flags", () => {
    expect(parseFaithfulness({ verdict: "pass", flags: [] })).toEqual({
      verdict: "pass",
      flags: [],
    });
  });

  it("is flagged when verdict says so", () => {
    const r = parseFaithfulness({
      verdict: "flagged",
      flags: [{ claim: "c", reason: "r" }],
    });
    expect(r.verdict).toBe("flagged");
    expect(r.flags).toHaveLength(1);
  });

  it("fails safe to flagged when flags exist but verdict says pass", () => {
    const r = parseFaithfulness({
      verdict: "pass",
      flags: [{ claim: "c", reason: "r" }],
    });
    expect(r.verdict).toBe("flagged");
  });

  it("returns a flagged fallback for unparseable input", () => {
    const r = parseFaithfulness("nonsense");
    expect(r.verdict).toBe("flagged");
    expect(r.flags).toHaveLength(1);
  });
});

describe("extractCitations", () => {
  const valid = ["corpus:a", "doc:1", "corpus:b"];

  it("links a claim sentence to its cited chunk ids", () => {
    const out = extractCitations(
      "The rule applies [corpus:a]. Unrelated text.",
      valid,
    );
    expect(out).toHaveLength(1);
    expect(out[0]?.sourceChunkIds).toEqual(["corpus:a"]);
    expect(out[0]?.claim).toContain("The rule applies");
    expect(out[0]?.claim).not.toContain("[");
  });

  it("supports multiple ids in one tag and filters invalid ids", () => {
    const out = extractCitations(
      "Both apply [corpus:a, corpus:b, bogus].",
      valid,
    );
    expect(out[0]?.sourceChunkIds).toEqual(["corpus:a", "corpus:b"]);
  });

  it("ignores sentences with no valid citations", () => {
    expect(extractCitations("No citations here. [unknown]", valid)).toEqual([]);
  });
});
