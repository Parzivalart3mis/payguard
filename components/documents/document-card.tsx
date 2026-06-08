import Link from "next/link";
import { ChevronRight, FileText, Type } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Document } from "@/db/schema";
import { formatDate } from "@/lib/utils";

export function DocumentCard({ document }: { document: Document }) {
  return (
    <Link href={`/documents/${document.id}`} className="block">
      <Card className="hover:border-accent/50 flex items-center gap-3 transition-colors">
        <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
          {document.sourceType === "pdf" ? (
            <FileText className="h-5 w-5" aria-hidden />
          ) : (
            <Type className="h-5 w-5" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-text truncate font-medium">{document.title}</p>
          <div className="mt-1 flex items-center gap-2">
            <StatusBadge status={document.status} />
            <span className="text-text-muted text-xs">
              {formatDate(document.updatedAt)}
            </span>
          </div>
        </div>
        <ChevronRight
          className="text-text-muted h-5 w-5 shrink-0"
          aria-hidden
        />
      </Card>
    </Link>
  );
}
