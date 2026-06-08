export interface ChunkOptions {
  /** Target maximum characters per chunk. */
  maxChars?: number;
  /** Characters of overlap carried between consecutive chunks. */
  overlap?: number;
}

/**
 * Split raw document text into overlapping chunks on paragraph/sentence
 * boundaries where possible. Deterministic — the chunk index is stable for a
 * given input, which keeps citation ids reproducible.
 */
export function chunkText(text: string, options: ChunkOptions = {}): string[] {
  const maxChars = options.maxChars ?? 1200;
  const overlap = options.overlap ?? 150;
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  if (normalized.length <= maxChars) return [normalized];

  // Prefer splitting on blank lines, then single newlines, then spaces.
  const paragraphs = normalized.split(/\n{2,}/);
  const chunks: string[] = [];
  let current = "";

  const flush = () => {
    const trimmed = current.trim();
    if (trimmed) chunks.push(trimmed);
    current = trimmed.length > overlap ? trimmed.slice(-overlap) : "";
  };

  for (const para of paragraphs) {
    if (para.length > maxChars) {
      // Hard-split an oversized paragraph.
      for (let i = 0; i < para.length; i += maxChars - overlap) {
        const piece = para.slice(i, i + maxChars);
        if (current && current.length + piece.length > maxChars) flush();
        current = current ? `${current}\n${piece}` : piece;
        if (current.length >= maxChars) flush();
      }
      continue;
    }
    if (current && current.length + para.length + 1 > maxChars) flush();
    current = current ? `${current}\n\n${para}` : para;
  }
  const tail = current.trim();
  if (tail) chunks.push(tail);

  return chunks.filter(
    (c, i) => c.length > 0 && (i === 0 || c !== chunks[i - 1]),
  );
}
