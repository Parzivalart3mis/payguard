import { extractText, getDocumentProxy } from "unpdf";

/**
 * Extract text from a PDF server-side with a maintained library. We only parse
 * the document for text — untrusted content is never executed.
 */
export async function extractPdfText(bytes: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return (Array.isArray(text) ? text.join("\n") : text).trim();
}
