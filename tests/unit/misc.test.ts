import { describe, expect, it } from "vitest";
import { docNamespace } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import { firstJsonText, textFromContent } from "@/lib/ai/util";
import {
  buildDraftUser,
  buildExtractUser,
  buildJudgeUser,
} from "@/lib/ai/prompts";

describe("constants & utils", () => {
  it("docNamespace builds the per-document namespace", () => {
    expect(docNamespace("abc")).toBe("doc:abc");
  });

  it("cn merges and dedupes tailwind classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-text", false && "hidden")).toBe("text-text");
  });

  it("formatDate renders a stable label", () => {
    expect(formatDate("2026-01-15T00:00:00.000Z")).toContain("2026");
  });
});

describe("ai/util", () => {
  it("textFromContent concatenates text blocks only", () => {
    const content = [
      { type: "text", text: "Hello " },
      { type: "tool_use", id: "t", name: "x", input: {} },
      { type: "text", text: "world" },
    ] as never;
    expect(textFromContent(content)).toBe("Hello world");
  });

  it("firstJsonText parses clean JSON", () => {
    const content = [{ type: "text", text: '{"a":1}' }] as never;
    expect(firstJsonText(content)).toEqual({ a: 1 });
  });

  it("firstJsonText recovers JSON embedded in noise", () => {
    const content = [{ type: "text", text: 'noise {"a":2} tail' }] as never;
    expect(firstJsonText(content)).toEqual({ a: 2 });
  });

  it("firstJsonText returns {} for unparseable text", () => {
    const content = [{ type: "text", text: "not json" }] as never;
    expect(firstJsonText(content)).toEqual({});
  });
});

describe("ai/prompts builders", () => {
  it("buildExtractUser embeds the document", () => {
    expect(buildExtractUser("DOC BODY")).toContain("DOC BODY");
  });

  it("buildDraftUser lists obligations and context and optional instructions", () => {
    const out = buildDraftUser({
      documentTitle: "T",
      obligations: [
        { id: "o1", text: "Disclose fees", category: "disclosure" },
      ],
      contextText: "[corpus:a] context",
      instructions: "be terse",
    });
    expect(out).toContain("Disclose fees");
    expect(out).toContain("[corpus:a]");
    expect(out).toContain("be terse");
  });

  it("buildJudgeUser includes the draft and context", () => {
    const out = buildJudgeUser({ draft: "DRAFT", contextText: "CTX" });
    expect(out).toContain("DRAFT");
    expect(out).toContain("CTX");
  });
});
