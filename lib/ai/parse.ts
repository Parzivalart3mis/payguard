import { createId } from "@paralleldrive/cuid2";
import { z } from "zod";
import {
  OBLIGATION_CATEGORIES,
  type ObligationCategory,
} from "@/lib/constants";
import type { Citation, Faithfulness, Obligation } from "@/lib/types";

const CATEGORY_SET = new Set<string>(OBLIGATION_CATEGORIES);

function coerceCategory(value: unknown): ObligationCategory {
  return typeof value === "string" && CATEGORY_SET.has(value)
    ? (value as ObligationCategory)
    : "other";
}

const rawObligationSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1),
  category: z.unknown().optional(),
  sourceSpan: z.string().optional(),
});

const obligationsEnvelopeSchema = z.union([
  z.object({ obligations: z.array(rawObligationSchema) }),
  z.array(rawObligationSchema),
]);

/**
 * Parse model output into validated obligations. Accepts either a bare array or
 * an `{ obligations: [...] }` envelope. Assigns stable ids when missing and
 * de-duplicates them so citation references stay unambiguous.
 */
export function parseObligations(raw: unknown): Obligation[] {
  const parsed = obligationsEnvelopeSchema.safeParse(raw);
  if (!parsed.success) return [];
  const list = Array.isArray(parsed.data)
    ? parsed.data
    : parsed.data.obligations;
  const used = new Set<string>();
  const result: Obligation[] = [];
  for (const item of list) {
    let id = item.id?.trim() || createId();
    while (used.has(id)) id = createId();
    used.add(id);
    result.push({
      id,
      text: item.text.trim(),
      category: coerceCategory(item.category),
      sourceSpan: item.sourceSpan?.trim() ?? "",
    });
  }
  return result;
}

const flagSchema = z.object({
  claim: z.string().min(1),
  reason: z.string().min(1),
});

const faithfulnessEnvelopeSchema = z.object({
  verdict: z.string().optional(),
  flags: z.array(flagSchema).optional(),
});

/**
 * Parse model output into a faithfulness verdict. Treats the result as
 * "flagged" if the verdict says so OR any flags are present (fail-safe — never
 * silently report "pass" when unsupported claims were listed).
 */
export function parseFaithfulness(raw: unknown): Faithfulness {
  const parsed = faithfulnessEnvelopeSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      verdict: "flagged",
      flags: [
        {
          claim: "self-check output",
          reason: "Could not parse the faithfulness result.",
        },
      ],
    };
  }
  const flags = parsed.data.flags ?? [];
  const verdict =
    parsed.data.verdict === "flagged" || flags.length > 0 ? "flagged" : "pass";
  return { verdict, flags };
}

/**
 * Extract citations from draft prose. Each sentence containing one or more
 * `[chunkId]` tags becomes a Citation linking the (tag-stripped) claim to the
 * referenced chunk ids, filtered to ids that actually exist in the context.
 */
export function extractCitations(
  content: string,
  validChunkIds: Iterable<string>,
): Citation[] {
  const valid = new Set(validChunkIds);
  const sentences = content.split(/(?<=[.!?])\s+/);
  const citations: Citation[] = [];
  for (const sentence of sentences) {
    const ids = new Set<string>();
    const tagRe = /\[([^\]]+)\]/g;
    let match: RegExpExecArray | null;
    while ((match = tagRe.exec(sentence)) !== null) {
      const inner = match[1];
      if (!inner) continue;
      for (const part of inner.split(/[,;]/)) {
        const id = part.trim();
        if (valid.has(id)) ids.add(id);
      }
    }
    if (ids.size === 0) continue;
    const claim = sentence
      .replace(/\[[^\]]+\]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (claim) citations.push({ claim, sourceChunkIds: [...ids] });
  }
  return citations;
}
