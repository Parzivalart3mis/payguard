import type Anthropic from "@anthropic-ai/sdk";

type ContentBlock = Anthropic.Messages.ContentBlock;

/** Concatenate all text blocks of a message into one string. */
export function textFromContent(content: ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

/**
 * Parse the JSON returned by a structured-output request. With
 * output_config.format the first text block is guaranteed valid JSON; we still
 * guard so a malformed result degrades to `{}` for the tolerant parsers.
 */
export function firstJsonText(content: ContentBlock[]): unknown {
  const text = textFromContent(content).trim();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    // Best-effort: pull the first {...} block out of mixed text.
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return {};
      }
    }
    return {};
  }
}
