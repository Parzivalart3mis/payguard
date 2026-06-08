import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireUser } from "@/lib/auth/current-user";
import { LIMITS } from "@/lib/constants";
import { errorResponse } from "@/lib/http";
import { ALLOWED_UPLOAD_CONTENT_TYPES } from "@/lib/schemas";

export const runtime = "nodejs";

/**
 * Vercel Blob client-upload handler. The browser uploads the file straight to
 * Blob storage; this endpoint only issues a short-lived, constrained token
 * (validates content type + size cap) after confirming the user is authed.
 */
export async function POST(req: Request): Promise<Response> {
  const body = (await req.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        const user = await requireUser();
        return {
          allowedContentTypes: [...ALLOWED_UPLOAD_CONTENT_TYPES],
          maximumSizeInBytes: LIMITS.uploadBytes,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: user.id }),
        };
      },
      onUploadCompleted: async () => {
        // No-op: the document row is created via POST /api/documents, which
        // downloads the blob and extracts text server-side.
      },
    });
    return Response.json(result);
  } catch (err) {
    return errorResponse(
      "bad_request",
      err instanceof Error ? err.message : "Upload failed.",
    );
  }
}
