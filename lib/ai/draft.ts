import type Anthropic from "@anthropic-ai/sdk";
import { MODELS } from "@/lib/constants";
import { getAnthropic } from "./client";
import { buildDraftUser, DRAFT_SYSTEM } from "./prompts";
import { textFromContent } from "./util";

export interface DraftInput {
  documentTitle: string;
  obligations: Array<{ id: string; text: string; category: string }>;
  contextText: string;
  instructions?: string;
}

/**
 * Enable Anthropic's web search so the draft can verify time-sensitive
 * regulatory detail (current thresholds, effective dates) instead of relying on
 * model memory. Document-specific claims still cite the retrieved context.
 */
const DRAFT_TOOLS: Anthropic.Messages.ToolUnion[] = [
  { type: "web_search_20260209", name: "web_search", max_uses: 5 },
];

const MAX_TOKENS = 8000;

function draftMessages(input: DraftInput): Anthropic.Messages.MessageParam[] {
  return [{ role: "user", content: buildDraftUser(input) }];
}

/**
 * Step 3 of the pipeline (non-streaming). Produce compliance language grounded
 * in the retrieved context with inline [chunkId] citations.
 */
export async function draftCompletion(input: DraftInput): Promise<string> {
  const client = getAnthropic();
  let messages = draftMessages(input);
  let text = "";
  // Server-side tool (web search) can return pause_turn; resume up to 4 times.
  for (let i = 0; i < 4; i++) {
    const res = await client.messages.create({
      model: MODELS.draft,
      max_tokens: MAX_TOKENS,
      system: DRAFT_SYSTEM,
      tools: DRAFT_TOOLS,
      messages,
    });
    const t = textFromContent(res.content);
    if (t) text = t;
    if (res.stop_reason === "pause_turn") {
      messages = [
        ...messages,
        {
          role: "assistant",
          content:
            res.content as unknown as Anthropic.Messages.ContentBlockParam[],
        },
      ];
      continue;
    }
    break;
  }
  return text.trim();
}

/**
 * Streaming variant for the interactive regenerate route. Returns the SDK
 * stream; the caller pipes text deltas to the client and calls finalMessage().
 */
export function streamDraft(input: DraftInput) {
  return getAnthropic().messages.stream({
    model: MODELS.draft,
    max_tokens: MAX_TOKENS,
    system: DRAFT_SYSTEM,
    tools: DRAFT_TOOLS,
    messages: draftMessages(input),
  });
}
