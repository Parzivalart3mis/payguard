import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { UploadForm } from "@/components/documents/upload-form";

export const dynamic = "force-dynamic";

export default function NewDocumentPage() {
  return (
    <div>
      <Link
        href="/documents"
        className="text-text-muted hover:text-text mb-3 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Documents
      </Link>
      <PageHeader
        title="New document"
        description="Paste text or upload a PDF. PayGuard stores the document privately and prepares it for analysis."
      />
      <UploadForm />
    </div>
  );
}
