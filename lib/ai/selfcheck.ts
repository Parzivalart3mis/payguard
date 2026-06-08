import { MODELS } from "@/lib/constants";
import type { Faithfulness } from "@/lib/types";
import { getAnthropic } from "./client";
import { parseFaithfulness } from "./parse";
import { buildJudgeUser, JUDGE_SYSTEM } from "./prompts";
import { firstJsonText } from "./util";

const FAITHFULNESS_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    verdict: { type: "string", enum: ["pass", "flagged"] },
    flags: {
      type: "array",
      items: {
        type: "object",
        properties: {
          claim: { type: "string" },
          reason: { type: "string" },
        },
        required: ["claim", "reason"],
        additionalProperties: false,
      },
    },
  },
  required: ["verdict", "flags"],
  additionalProperties: false,
};

/**
 * Step 4 of the pipeline. LLM-as-judge faithfulness self-check: does every
 * claim in the draft trace to the cited context? Returns a verdict + flags.
 */
export async function runSelfCheck(input: {
  draft: string;
  contextText: string;
}): Promise<Faithfulness> {
  const res = await getAnthropic().messages.create({
    model: MODELS.judge,
    max_tokens: 4000,
    system: JUDGE_SYSTEM,
    messages: [{ role: "user", content: buildJudgeUser(input) }],
    output_config: {
      format: { type: "json_schema", schema: FAITHFULNESS_SCHEMA },
    },
  });
  return parseFaithfulness(firstJsonText(res.content));
}
