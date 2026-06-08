import { Fragment, type ReactNode } from "react";

const TOKEN = /(\[[^\]]+\])/g;

function shorten(id: string): string {
  const idx = id.indexOf(":");
  return idx === -1 ? id : id.slice(idx + 1);
}

function CitationChip({ id }: { id: string }) {
  return (
    <span
      title={id}
      className="bg-accent/10 text-accent mx-0.5 inline-flex max-w-[10rem] items-center truncate rounded px-1.5 py-0.5 align-baseline text-xs font-medium"
    >
      #{shorten(id)}
    </span>
  );
}

function renderParagraph(text: string): ReactNode[] {
  return text.split(TOKEN).map((part, i) => {
    const match = part.match(/^\[([^\]]+)\]$/);
    const inner = match?.[1];
    if (!inner) return <Fragment key={i}>{part}</Fragment>;
    const ids = inner
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
    return (
      <Fragment key={i}>
        {ids.map((id, j) => (
          <CitationChip key={j} id={id} />
        ))}
      </Fragment>
    );
  });
}

/**
 * Render draft prose with inline [chunkId] citations turned into chips. The
 * text stays selectable so reviewers can copy it.
 */
export function DraftView({
  content,
  streaming = false,
}: {
  content: string;
  streaming?: boolean;
}) {
  const paragraphs = content.split(/\n{2,}/).filter((p) => p.trim().length > 0);
  return (
    <div className="text-text space-y-3 leading-relaxed">
      {paragraphs.map((p, i) => (
        <p key={i}>{renderParagraph(p)}</p>
      ))}
      {streaming ? (
        <span
          className="bg-accent inline-block h-4 w-2 animate-pulse align-middle"
          aria-hidden
        />
      ) : null}
    </div>
  );
}
