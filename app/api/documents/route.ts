import { getDb } from "@/db/client";
import { LIMITS } from "@/lib/constants";
import { ApiError, jsonResponse, withErrorHandling } from "@/lib/http";
import { requireUser, toPrincipal } from "@/lib/auth/current-user";
import { downloadBlobBytes } from "@/lib/blob";
import { extractPdfText } from "@/lib/pdf";
import { enforceRateLimit } from "@/lib/ratelimit";
import { createDocumentSchema } from "@/lib/schemas";
import {
  createDocument,
  listVisibleDocuments,
} from "@/lib/repositories/documents";

export const runtime = "nodejs";

export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  const docs = await listVisibleDocuments(getDb(), toPrincipal(user));
  return jsonResponse(docs);
});

export const POST = withErrorHandling(async (req: Request) => {
  const user = await requireUser();
  await enforceRateLimit("mutation", user.id);

  const input = createDocumentSchema.parse(await req.json());

  let rawText = (input.rawText ?? "").trim();
  const blobUrl = input.blobUrl ?? null;

  if (input.sourceType === "pdf") {
    if (!blobUrl)
      throw new ApiError("bad_request", "A PDF upload requires blobUrl.");
    const bytes = await downloadBlobBytes(blobUrl);
    if (bytes.byteLength > LIMITS.uploadBytes) {
      throw new ApiError(
        "payload_too_large",
        "The uploaded file is too large.",
      );
    }
    rawText = (await extractPdfText(bytes)).trim();
  }

  if (!rawText) {
    throw new ApiError(
      "bad_request",
      "No readable text was found in the document.",
    );
  }
  if (rawText.length > LIMITS.rawText) {
    rawText = rawText.slice(0, LIMITS.rawText);
  }

  const doc = await createDocument(getDb(), {
    ownerId: user.id,
    title: input.title,
    sourceType: input.sourceType,
    rawText,
    blobUrl,
  });
  return jsonResponse(doc, 201);
});
