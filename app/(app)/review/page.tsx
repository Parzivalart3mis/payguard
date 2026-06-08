import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardCheck, AlertTriangle } from "lucide-react";
import { getDb } from "@/db/client";
import { getCurrentDbUser } from "@/lib/auth/current-user";
import { listAssignedDrafts } from "@/lib/repositories/drafts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { FadeIn } from "@/components/motion/fade-in";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const queue = await listAssignedDrafts(getDb(), user.id);

  return (
    <div>
      <PageHeader
        title="Review"
        description="Drafts assigned to you, awaiting your sign-off."
      />

      {queue.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck className="h-8 w-8" aria-hidden />}
          title="Nothing to review"
          description="When an author submits a draft to you, it will appear here for approval."
        />
      ) : (
        <ul className="space-y-3">
          {queue.map((item, i) => {
            const flagged = item.draft.faithfulness?.verdict === "flagged";
            return (
              <li key={item.draft.id}>
                <FadeIn delay={i * 0.03}>
                  <Link href={`/documents/${item.draft.documentId}`}>
                    <Card className="hover:border-accent/50 transition-colors">
                      <p className="text-text font-medium">
                        {item.documentTitle}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StatusBadge status="in_review" />
                        <Badge tone="neutral">
                          Version {item.draft.version}
                        </Badge>
                        {flagged ? (
                          <Badge tone="warning">
                            <AlertTriangle className="h-3 w-3" aria-hidden />
                            Faithfulness flags
                          </Badge>
                        ) : null}
                      </div>
                    </Card>
                  </Link>
                </FadeIn>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
