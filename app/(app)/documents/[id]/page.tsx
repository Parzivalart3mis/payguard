import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getDb } from "@/db/client";
import { canReadDocument } from "@/lib/access";
import { getCurrentDbUser, toPrincipal } from "@/lib/auth/current-user";
import {
  getAssignedReviewerIds,
  getDocumentById,
  getDocumentDetail,
} from "@/lib/repositories/documents";
import type { DocumentDetailDTO } from "@/lib/client/types";
import { DocumentDetail } from "@/components/document/document-detail";

export const dynamic = "force-dynamic";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const db = getDb();
  const document = await getDocumentById(db, id);
  if (!document) notFound();

  const reviewerIds = await getAssignedReviewerIds(db, id);
  if (!canReadDocument(toPrincipal(user), document, reviewerIds)) {
    notFound();
  }

  const detail = await getDocumentDetail(db, id);
  if (!detail) notFound();

  // Serialize to JSON-safe DTO (Date -> ISO string) for the client component.
  const initial = JSON.parse(JSON.stringify(detail)) as DocumentDetailDTO;

  return (
    <div>
      <Link
        href="/documents"
        className="text-text-muted hover:text-text mb-3 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Documents
      </Link>
      <DocumentDetail
        initial={initial}
        viewer={{ userId: user.id, role: user.role }}
      />
    </div>
  );
}
