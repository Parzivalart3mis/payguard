import { Badge } from "@/components/ui/badge";
import type { Obligation } from "@/lib/types";

function categoryLabel(category: string): string {
  return category
    .split("_")
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function ObligationsList({
  obligations,
}: {
  obligations: Obligation[];
}) {
  if (obligations.length === 0) {
    return (
      <p className="text-text-muted text-sm">
        No obligations were extracted from this document.
      </p>
    );
  }
  return (
    <ol className="space-y-3">
      {obligations.map((o) => (
        <li
          key={o.id}
          className="border-border bg-background/50 rounded-lg border p-3"
        >
          <Badge tone="primary">{categoryLabel(o.category)}</Badge>
          <p className="text-text mt-2 text-base">{o.text}</p>
          {o.sourceSpan ? (
            <p className="border-border text-text-muted mt-1.5 border-l-2 pl-2 text-sm italic">
              “{o.sourceSpan}”
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
