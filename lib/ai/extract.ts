import { MODELS, OBLIGATION_CATEGORIES } from "@/lib/constants";
import type { Obligation } from "@/lib/types";
import { getAnthropic } from "./client";
import { parseObligations } from "./parse";
import { buildExtractUser, EXTRACT_SYSTEM } from "./prompts";
import { firstJsonText } from "./util";

const OBLIGATIONS_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    obligations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          text: { type: "string" },
          category: { type: "string", enum: [...OBLIGATION_CATEGORIES] },
          sourceSpan: { type: "string" },
        },
        required: ["id", "text", "category", "sourceSpan"],
        additionalProperties: false,
      },
    },
  },
  required: ["obligations"],
  additionalProperties: false,
};

/**
 * Step 1 of the pipeline. Extract obligations/clauses from the document's raw
 * text as structured JSON, using the cheap, high-volume Haiku model.
 */
export async function extractObligations(
  rawText: string,
): Promise<Obligation[]> {
  const res = await getAnthropic().messages.create({
    model: MODELS.extract,
    max_tokens: 8000,
    system: EXTRACT_SYSTEM,
    messages: [{ role: "user", content: buildExtractUser(rawText) }],
    output_config: {
      format: { type: "json_schema", schema: OBLIGATIONS_SCHEMA },
    },
  });
  return parseObligations(firstJsonText(res.content));
}
