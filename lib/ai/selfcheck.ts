import { Type, type Schema } from "@google/genai";
import { MODELS } from "@/lib/constants";
import type { Faithfulness } from "@/lib/types";
import { getGemini } from "./client";
import { parseFaithfulness } from "./parse";
import { buildJudgeUser, JUDGE_SYSTEM } from "./prompts";
import { firstJsonText } from "./util";

const FAITHFULNESS_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    verdict: { type: Type.STRING, enum: ["pass", "flagged"] },
    flags: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          claim: { type: Type.STRING },
          reason: { type: Type.STRING },
        },
        required: ["claim", "reason"],
        propertyOrdering: ["claim", "reason"],
      },
    },
  },
  required: ["verdict", "flags"],
};

/**
 * Step 4 of the pipeline. LLM-as-judge faithfulness self-check: does every
 * claim in the draft trace to the cited context? Returns a verdict + flags.
 */
export async function runSelfCheck(input: {
  draft: string;
  contextText: string;
}): Promise<Faithfulness> {
  const res = await getGemini().models.generateContent({
    model: MODELS.judge,
    contents: buildJudgeUser(input),
    config: {
      systemInstruction: JUDGE_SYSTEM,
      maxOutputTokens: 4000,
      responseMimeType: "application/json",
      responseSchema: FAITHFULNESS_SCHEMA,
    },
  });
  return parseFaithfulness(firstJsonText(res.text ?? ""));
}
