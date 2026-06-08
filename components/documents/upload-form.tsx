"use client";

import { upload } from "@vercel/blob/client";
import { AlertCircle, FileUp, Type } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/client/api";
import { ALLOWED_UPLOAD_CONTENT_TYPES } from "@/lib/schemas";
import { LIMITS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Mode = "text" | "pdf";
type DocResponse = { id: string };

export function UploadForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("text");
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Add a title.");
      return;
    }

    setSubmitting(true);
    try {
      let created: DocResponse;
      if (mode === "text") {
        if (!rawText.trim()) {
          setError("Paste the document text.");
          setSubmitting(false);
          return;
        }
        created = await apiFetch<DocResponse>("/api/documents", {
          method: "POST",
          body: JSON.stringify({
            title: title.trim(),
            sourceType: "text",
            rawText,
          }),
        });
      } else {
        if (!file) {
          setError("Choose a PDF or text file.");
          setSubmitting(false);
          return;
        }
        if (
          !ALLOWED_UPLOAD_CONTENT_TYPES.includes(
            file.type as (typeof ALLOWED_UPLOAD_CONTENT_TYPES)[number],
          )
        ) {
          setError("Only PDF or plain-text files are supported.");
          setSubmitting(false);
          return;
        }
        if (file.size > LIMITS.uploadBytes) {
          setError("That file is larger than 10 MB.");
          setSubmitting(false);
          return;
        }
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
          contentType: file.type,
        });
        created = await apiFetch<DocResponse>("/api/documents", {
          method: "POST",
          body: JSON.stringify({
            title: title.trim(),
            sourceType: "pdf",
            blobUrl: blob.url,
          }),
        });
      }
      router.push(`/documents/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Merchant Services Agreement"
          maxLength={LIMITS.title}
          autoComplete="off"
        />
      </div>

      <div
        role="tablist"
        aria-label="Source type"
        className="grid grid-cols-2 gap-2"
      >
        <TabButton
          active={mode === "text"}
          onClick={() => setMode("text")}
          icon={<Type className="h-4 w-4" aria-hidden />}
          label="Paste text"
        />
        <TabButton
          active={mode === "pdf"}
          onClick={() => setMode("pdf")}
          icon={<FileUp className="h-4 w-4" aria-hidden />}
          label="Upload file"
        />
      </div>

      {mode === "text" ? (
        <div>
          <Label htmlFor="rawText">Document text</Label>
          <Textarea
            id="rawText"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste the financial document text here…"
            rows={12}
            maxLength={LIMITS.rawText}
          />
          <p className="text-text-muted mt-1 text-xs">
            {rawText.length.toLocaleString()} /{" "}
            {LIMITS.rawText.toLocaleString()} characters
          </p>
        </div>
      ) : (
        <div>
          <Label htmlFor="file">PDF or text file</Label>
          <input
            ref={fileInputRef}
            id="file"
            type="file"
            accept="application/pdf,text/plain"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-text-muted file:border-border file:bg-surface file:text-text block w-full text-sm file:mr-3 file:min-h-[44px] file:rounded-lg file:border file:px-4 file:text-base"
          />
          <p className="text-text-muted mt-1 text-xs">Up to 10 MB.</p>
        </div>
      )}

      {error ? (
        <div
          role="alert"
          className="border-error/30 bg-error/10 text-error flex items-start gap-2 rounded-lg border p-3 text-sm"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      ) : null}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? <Spinner /> : null}
        {submitting ? "Saving…" : "Save document"}
      </Button>
    </form>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "select-none-ui flex min-h-[44px] items-center justify-center gap-2 rounded-lg border text-base font-medium transition-colors",
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-border bg-surface text-text-muted hover:text-text",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
