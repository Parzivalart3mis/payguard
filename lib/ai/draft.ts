import type { GenerateContentConfig } from "@google/genai";
import { MODELS } from "@/lib/constants";
import { getGemini } from "./client";
import { buildDraftUser, DRAFT_SYSTEM } from "./prompts";

export interface DraftInput {
  documentTitle: string;
  obligations: Array<{ id: string; text: string; category: string }>;
  contextText: string;
  instructions?: string;
}

const MAX_TOKENS = 8000;

const BASE_CONFIG: GenerateContentConfig = {
  systemInstruction: DRAFT_SYSTEM,
  maxOutputTokens: MAX_TOKENS,
};

/**
 * Google Search grounding lets the draft verify time-sensitive regulatory
 * detail (current thresholds, effective dates) instead of relying on model
 * memory; document-specific claims still cite the retrieved context. Grounding
 * is a billing-only capability — on the free tier it returns 429, so we
 * transparently fall back to an ungrounded draft (see `withGroundingFallback`).
 */
const GROUNDED_CONFIG: GenerateContentConfig = {
  ...BASE_CONFIG,
  tools: [{ googleSearch: {} }],
};

/** True for quota/rate errors — e.g. grounding not enabled on the free tier. */
function isQuotaError(err: unknown): boolean {
  const msg =
    err instanceof Error ? err.message : typeof err === "string" ? err : "";
  return /\b429\b|RESOURCE_EXHAUSTED|quota/i.test(msg);
}

/**
 * Step 3 of the pipeline (non-streaming). Produce compliance language grounded
 * in the retrieved context with inline [chunkId] citations. Tries with Google
 * Search grounding, then falls back to an ungrounded draft if grounding is
 * unavailable (free tier).
 */
export async function draftCompletion(input: DraftInput): Promise<string> {
  const models = getGemini().models;
  const contents = buildDraftUser(input);
  try {
    const res = await models.generateContent({
      model: MODELS.draft,
      contents,
      config: GROUNDED_CONFIG,
    });
    return (res.text ?? "").trim();
  } catch (err) {
    if (!isQuotaError(err)) throw err;
    const res = await models.generateContent({
      model: MODELS.draft,
      contents,
      config: BASE_CONFIG,
    });
    return (res.text ?? "").trim();
  }
}

/**
 * Streaming variant for the interactive regenerate route. Yields text deltas.
 * Tries grounded first; if grounding is unavailable and nothing has streamed
 * yet, restarts ungrounded so the free tier still gets a draft.
 */
export async function* streamDraft(input: DraftInput): AsyncGenerator<string> {
  const models = getGemini().models;
  const contents = buildDraftUser(input);
  let grounded = true;

  for (const config of [GROUNDED_CONFIG, BASE_CONFIG]) {
    let yielded = false;
    try {
      const stream = await models.generateContentStream({
        model: MODELS.draft,
        contents,
        config,
      });
      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          yielded = true;
          yield text;
        }
      }
      return;
    } catch (err) {
      // Fall back to the ungrounded config only if grounding failed before it
      // produced any output; otherwise surface the error.
      if (grounded && !yielded && isQuotaError(err)) {
        grounded = false;
        continue;
      }
      throw err;
    }
  }
}
