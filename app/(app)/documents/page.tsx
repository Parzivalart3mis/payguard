import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, Plus } from "lucide-react";
import { getDb } from "@/db/client";
import { getCurrentDbUser, toPrincipal } from "@/lib/auth/current-user";
import { listVisibleDocuments } from "@/lib/repositories/documents";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { DocumentCard } from "@/components/documents/document-card";
import { FadeIn } from "@/components/motion/fade-in";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const documents = await listVisibleDocuments(getDb(), toPrincipal(user));

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Upload a financial document to extract obligations and draft grounded compliance language."
        action={
          <Link href="/documents/new">
            <Button size="sm">
              <Plus className="h-4 w-4" aria-hidden />
              New
            </Button>
          </Link>
        }
      />

      {documents.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8" aria-hidden />}
          title="No documents yet"
          description="Upload a PDF or paste text to get started. PayGuard will extract the obligations and draft compliance language for review."
          action={
            <Link href="/documents/new">
              <Button>
                <Plus className="h-4 w-4" aria-hidden />
                New document
              </Button>
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {documents.map((doc, i) => (
            <li key={doc.id}>
              <FadeIn delay={i * 0.03}>
                <DocumentCard document={doc} />
              </FadeIn>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
