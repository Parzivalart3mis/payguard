"use client";

import { FileSearch, RefreshCw, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { FadeIn } from "@/components/motion/fade-in";
import { DraftView } from "./draft-view";
import { FaithfulnessBanner } from "./faithfulness-banner";
import { ObligationsList } from "./obligations-list";
import { ReviewPanel } from "./review-panel";
import { ReviewsList } from "./reviews-list";
import { SubmitPanel } from "./submit-panel";
import { apiFetch, postEventStream } from "@/lib/client/api";
import type { DocumentDetailDTO } from "@/lib/client/types";
import { LIMITS, type UserRole } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export function DocumentDetail({
  initial,
  viewer,
}: {
  initial: DocumentDetailDTO;
  viewer: { userId: string; role: UserRole };
}) {
  const [detail, setDetail] = useState(initial);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [regenError, setRegenError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructions, setInstructions] = useState("");
  const streamRef = useRef("");

  const doc = detail.document;
  const latestDraft = detail.latestDraft;
  const canWrite = viewer.role === "admin" || doc.ownerId === viewer.userId;
  const isAssignedReviewer =
    !!latestDraft &&
    (viewer.role === "admin" ||
      latestDraft.assignedReviewerId === viewer.userId);
  const transitional =
    doc.status === "analyzing" ||
    doc.status === "drafting" ||
    (doc.status === "analyzed" && !latestDraft);

  const refresh = useCallback(async () => {
    try {
      const next = await apiFetch<DocumentDetailDTO>(
        `/api/documents/${doc.id}`,
      );
      setDetail(next);
    } catch {
      // transient; the poll will retry
    }
  }, [doc.id]);

  // Poll while the pipeline is running.
  useEffect(() => {
    if (!transitional) return;
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [transitional, refresh]);

  async function handleAnalyze() {
    setAnalyzeError(null);
    setAnalyzing(true);
    try {
      await apiFetch(`/api/documents/${doc.id}/analyze`, { method: "POST" });
      setDetail((d) => ({
        ...d,
        document: { ...d.document, status: "analyzing" },
      }));
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Failed to start.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleRegenerate() {
    if (!latestDraft) return;
    setRegenError(null);
    setStreaming(true);
    setStreamContent("");
    streamRef.current = "";
    try {
      await postEventStream(
        `/api/drafts/${latestDraft.id}/regenerate`,
        { instructions: instructions.trim() || undefined },
        {
          onEvent: (event, data) => {
            if (event === "token") {
              const text = (data as { text?: string }).text ?? "";
              streamRef.current += text;
              setStreamContent(streamRef.current);
            } else if (event === "done") {
              setStreaming(false);
              setInstructions("");
              setShowInstructions(false);
              void refresh();
            } else if (event === "error") {
              setRegenError(
                (data as { message?: string }).message ?? "Generation failed.",
              );
              setStreaming(false);
            }
          },
        },
      );
    } catch (err) {
      setRegenError(err instanceof Error ? err.message : "Generation failed.");
      setStreaming(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-text text-2xl font-medium">{doc.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={doc.status} />
          <Badge tone="neutral">
            {doc.sourceType === "pdf" ? "PDF" : "Text"}
          </Badge>
          <span className="text-text-muted text-xs">
            Updated {formatDate(doc.updatedAt)}
          </span>
        </div>
      </div>

      {doc.status === "uploaded" ? (
        <Card>
          <CardHeader>
            <CardTitle>Ready to analyze</CardTitle>
          </CardHeader>
          <p className="text-text-muted text-sm">
            PayGuard will extract the obligations, retrieve grounding context,
            draft compliance language, and run a faithfulness self-check.
          </p>
          {canWrite ? (
            <div className="mt-3">
              <Button onClick={handleAnalyze} disabled={analyzing}>
                {analyzing ? (
                  <Spinner />
                ) : (
                  <FileSearch className="h-4 w-4" aria-hidden />
                )}
                Analyze document
              </Button>
              {analyzeError ? (
                <p role="alert" className="text-error mt-2 text-sm">
                  {analyzeError}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-text-muted mt-3 text-sm">
              The owner hasn’t analyzed this document yet.
            </p>
          )}
        </Card>
      ) : null}

      {transitional ? (
        <Card>
          <div className="flex items-center gap-3">
            <Spinner className="text-accent h-5 w-5" />
            <div>
              <p className="text-text font-medium">
                {doc.status === "drafting"
                  ? "Drafting compliance language…"
                  : "Analyzing document…"}
              </p>
              <p className="text-text-muted text-sm">
                This can take a moment. The page updates automatically.
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {detail.analysis ? (
        <FadeIn>
          <Card>
            <CardHeader>
              <CardTitle>Obligations</CardTitle>
            </CardHeader>
            <ObligationsList obligations={detail.analysis.obligations} />
          </Card>
        </FadeIn>
      ) : null}

      {latestDraft ? (
        <FadeIn>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Compliance draft</CardTitle>
                <Badge tone="neutral">Version {latestDraft.version}</Badge>
              </div>
            </CardHeader>

            {!streaming ? (
              <div className="mb-3">
                <FaithfulnessBanner faithfulness={latestDraft.faithfulness} />
              </div>
            ) : null}

            <DraftView
              content={streaming ? streamContent : latestDraft.content}
              streaming={streaming}
            />

            {regenError ? (
              <p role="alert" className="text-error mt-2 text-sm">
                {regenError}
              </p>
            ) : null}

            {canWrite &&
            !streaming &&
            (latestDraft.status === "drafted" ||
              latestDraft.status === "changes_requested") ? (
              <div className="border-border mt-4 space-y-3 border-t pt-4">
                {latestDraft.status === "changes_requested" ? (
                  <p className="text-warning text-sm">
                    Changes were requested. Regenerate to create a new version,
                    then submit it again.
                  </p>
                ) : null}

                {showInstructions ? (
                  <div>
                    <Label htmlFor="instructions">
                      Regeneration instructions (optional)
                    </Label>
                    <Textarea
                      id="instructions"
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="e.g. Tighten the funds-availability section and cite Reg CC."
                      rows={3}
                      maxLength={LIMITS.instructions}
                    />
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={handleRegenerate}>
                    <RefreshCw className="h-4 w-4" aria-hidden />
                    Regenerate
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowInstructions((s) => !s)}
                  >
                    <Sparkles className="h-4 w-4" aria-hidden />
                    {showInstructions
                      ? "Hide instructions"
                      : "Add instructions"}
                  </Button>
                </div>

                {latestDraft.status === "drafted" ? (
                  <SubmitPanel draftId={latestDraft.id} onSubmitted={refresh} />
                ) : null}
              </div>
            ) : null}

            {streaming ? (
              <p className="text-text-muted mt-3 text-sm">
                Generating and running the faithfulness check…
              </p>
            ) : null}

            {isAssignedReviewer && latestDraft.status === "in_review" ? (
              <div className="border-border mt-4 border-t pt-4">
                <ReviewPanel draftId={latestDraft.id} onDecided={refresh} />
              </div>
            ) : null}

            {latestDraft.status === "approved" ? (
              <p className="border-border text-success mt-4 border-t pt-4 text-sm">
                This version was approved. It is finalized.
              </p>
            ) : null}
          </Card>
        </FadeIn>
      ) : null}

      {detail.reviews.length > 0 ? (
        <FadeIn>
          <Card>
            <CardHeader>
              <CardTitle>Review history</CardTitle>
            </CardHeader>
            <ReviewsList reviews={detail.reviews} />
          </Card>
        </FadeIn>
      ) : null}
    </div>
  );
}
