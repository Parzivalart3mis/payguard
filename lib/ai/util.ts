/**
 * Parse the JSON returned by a structured-output request. With
 * responseMimeType "application/json" + responseSchema the model returns valid
 * JSON text; we still guard so a malformed result degrades to `{}` for the
 * tolerant parsers.
 */
export function firstJsonText(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) return {};
  try {
    return JSON.parse(trimmed);
  } catch {
    // Best-effort: pull the first {...} block out of mixed text.
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return {};
      }
    }
    return {};
  }
}
