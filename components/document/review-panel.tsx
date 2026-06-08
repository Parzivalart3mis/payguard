"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/client/api";
import { LIMITS } from "@/lib/constants";

export function ReviewPanel({
  draftId,
  onDecided,
}: {
  draftId: string;
  onDecided: () => void;
}) {
  const [comments, setComments] = useState("");
  const [pending, setPending] = useState<
    null | "approved" | "changes_requested"
  >(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: "approved" | "changes_requested") {
    if (decision === "changes_requested" && !comments.trim()) {
      setError("Add a comment describing the changes you need.");
      return;
    }
    setPending(decision);
    setError(null);
    try {
      await apiFetch("/api/reviews", {
        method: "POST",
        body: JSON.stringify({
          draftId,
          decision,
          comments: comments.trim() || undefined,
        }),
      });
      onDecided();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review failed.");
      setPending(null);
    }
  }

  return (
    <div className="border-border bg-background/50 rounded-lg border p-3">
      <Label htmlFor="comments">Reviewer decision</Label>
      <Textarea
        id="comments"
        value={comments}
        onChange={(e) => setComments(e.target.value)}
        placeholder="Comments (required when requesting changes)…"
        rows={3}
        maxLength={LIMITS.comments}
      />
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <Button
          variant="accent"
          onClick={() => decide("approved")}
          disabled={pending !== null}
          className="flex-1"
        >
          {pending === "approved" ? (
            <Spinner />
          ) : (
            <Check className="h-4 w-4" aria-hidden />
          )}
          Approve
        </Button>
        <Button
          variant="destructive"
          onClick={() => decide("changes_requested")}
          disabled={pending !== null}
          className="flex-1"
        >
          {pending === "changes_requested" ? (
            <Spinner />
          ) : (
            <X className="h-4 w-4" aria-hidden />
          )}
          Request changes
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-error mt-2 text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
