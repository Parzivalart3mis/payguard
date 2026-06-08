import { Badge } from "@/components/ui/badge";
import type { DocumentStatus, DraftStatus } from "@/lib/constants";

type Status = DocumentStatus | DraftStatus;

const LABELS: Record<string, string> = {
  uploaded: "Uploaded",
  analyzing: "Analyzing",
  analyzed: "Analyzed",
  drafting: "Drafting",
  generating: "Generating",
  drafted: "Drafted",
  in_review: "In review",
  approved: "Approved",
  changes_requested: "Changes requested",
};

const TONES: Record<
  string,
  "neutral" | "primary" | "accent" | "success" | "warning" | "error"
> = {
  uploaded: "neutral",
  analyzing: "accent",
  drafting: "accent",
  generating: "accent",
  analyzed: "primary",
  drafted: "primary",
  in_review: "warning",
  approved: "success",
  changes_requested: "error",
};

const PULSING = new Set(["analyzing", "drafting", "generating"]);

export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge tone={TONES[status] ?? "neutral"}>
      {PULSING.has(status) ? (
        <span
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-current"
          aria-hidden
        />
      ) : null}
      {LABELS[status] ?? status}
    </Badge>
  );
}
