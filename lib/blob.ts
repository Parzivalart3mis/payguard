/**
 * Fetch the bytes of an uploaded Blob (e.g. to extract PDF text server-side).
 * The URL comes from the trusted client-upload handler, which validated the
 * content type and size before issuing the upload token.
 */
export async function downloadBlobBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download blob (${res.status})`);
  }
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}
