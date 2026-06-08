import { CheckCircle2, ShieldAlert } from "lucide-react";
import type { Faithfulness } from "@/lib/types";

export function FaithfulnessBanner({
  faithfulness,
}: {
  faithfulness: Faithfulness | null;
}) {
  if (!faithfulness) return null;

  if (faithfulness.verdict === "pass") {
    return (
      <div className="border-success/30 bg-success/10 text-success flex items-center gap-2 rounded-lg border p-3 text-sm">
        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
        Faithfulness self-check passed — every claim traces to cited context.
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="border-warning/30 bg-warning/10 text-warning rounded-lg border p-3"
    >
      <div className="flex items-center gap-2 font-medium">
        <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden />
        Needs attention — {faithfulness.flags.length} unsupported claim
        {faithfulness.flags.length === 1 ? "" : "s"} flagged
      </div>
      <ul className="mt-2 space-y-2">
        {faithfulness.flags.map((flag, i) => (
          <li key={i} className="bg-warning/5 rounded-md p-2 text-sm">
            <p className="text-text">“{flag.claim}”</p>
            <p className="text-text-muted mt-0.5">{flag.reason}</p>
          </li>
        ))}
      </ul>
      <p className="text-text-muted mt-2 text-xs">
        Review these before submitting. Consider regenerating with tighter
        instructions to ground the flagged claims.
      </p>
    </div>
  );
}
