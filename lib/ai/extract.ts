import { Type, type Schema } from "@google/genai";
import { MODELS, OBLIGATION_CATEGORIES } from "@/lib/constants";
import type { Obligation } from "@/lib/types";
import { getGemini } from "./client";
import { parseObligations } from "./parse";
import { buildExtractUser, EXTRACT_SYSTEM } from "./prompts";
import { firstJsonText } from "./util";

const OBLIGATIONS_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    obligations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          text: { type: Type.STRING },
          category: { type: Type.STRING, enum: [...OBLIGATION_CATEGORIES] },
          sourceSpan: { type: Type.STRING },
        },
        required: ["id", "text", "category", "sourceSpan"],
        propertyOrdering: ["id", "text", "category", "sourceSpan"],
      },
    },
  },
  required: ["obligations"],
};

/**
 * Step 1 of the pipeline. Extract obligations/clauses from the document's raw
 * text as structured JSON, using the cheap, high-volume Flash model.
 */
export async function extractObligations(
  rawText: string,
): Promise<Obligation[]> {
  const res = await getGemini().models.generateContent({
    model: MODELS.extract,
    contents: buildExtractUser(rawText),
    config: {
      systemInstruction: EXTRACT_SYSTEM,
      maxOutputTokens: 8000,
      responseMimeType: "application/json",
      responseSchema: OBLIGATIONS_SCHEMA,
    },
  });
  return parseObligations(firstJsonText(res.text ?? ""));
}
