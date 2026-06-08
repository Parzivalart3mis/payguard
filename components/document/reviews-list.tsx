import { Badge } from "@/components/ui/badge";
import type { ReviewDTO } from "@/lib/client/types";
import { formatDate } from "@/lib/utils";

export function ReviewsList({ reviews }: { reviews: ReviewDTO[] }) {
  if (reviews.length === 0) return null;
  return (
    <ul className="space-y-3">
      {reviews.map((r) => (
        <li
          key={r.id}
          className="border-border bg-background/50 rounded-lg border p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <Badge tone={r.decision === "approved" ? "success" : "error"}>
              {r.decision === "approved" ? "Approved" : "Changes requested"}
            </Badge>
            <span className="text-text-muted text-xs">
              {formatDate(r.createdAt)}
            </span>
          </div>
          {r.comments ? (
            <p className="text-text mt-2 text-sm">{r.comments}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
