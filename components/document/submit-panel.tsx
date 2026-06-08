"use client";

import { Send } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { apiFetch } from "@/lib/client/api";
import type { ReviewerDTO } from "@/lib/client/types";

export function SubmitPanel({
  draftId,
  onSubmitted,
}: {
  draftId: string;
  onSubmitted: () => void;
}) {
  const [reviewers, setReviewers] = useState<ReviewerDTO[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiFetch<ReviewerDTO[]>("/api/users/reviewers")
      .then((list) => {
        if (!active) return;
        setReviewers(list);
        if (list[0]) setSelected(list[0].id);
      })
      .catch((err: unknown) =>
        setError(
          err instanceof Error ? err.message : "Failed to load reviewers.",
        ),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  async function submit() {
    if (!selected) {
      setError("Choose a reviewer.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(`/api/drafts/${draftId}/submit`, {
        method: "POST",
        body: JSON.stringify({ assignedReviewerId: selected }),
      });
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed.");
      setSubmitting(false);
    }
  }

  return (
    <div className="border-border bg-background/50 rounded-lg border p-3">
      <Label htmlFor="reviewer">Submit to reviewer</Label>
      {loading ? (
        <p className="text-text-muted text-sm">Loading reviewers…</p>
      ) : reviewers.length === 0 ? (
        <p className="text-text-muted text-sm">
          No reviewers are available yet. Ask an admin to assign a reviewer
          role.
        </p>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            id="reviewer"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="border-border bg-surface text-text focus-visible:ring-accent min-h-[44px] flex-1 rounded-lg border px-3 text-base focus-visible:ring-2 focus-visible:outline-none"
          >
            {reviewers.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name ?? r.email} ({r.role})
              </option>
            ))}
          </select>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? (
              <Spinner />
            ) : (
              <Send className="h-4 w-4" aria-hidden />
            )}
            Submit for review
          </Button>
        </div>
      )}
      {error ? (
        <p role="alert" className="text-error mt-2 text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
