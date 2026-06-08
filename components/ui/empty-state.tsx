import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-card border-border bg-surface/50 flex flex-col items-center justify-center gap-3 border border-dashed px-6 py-12 text-center">
      {icon ? <div className="text-text-muted">{icon}</div> : null}
      <h3 className="text-text text-lg font-medium">{title}</h3>
      {description ? (
        <p className="text-text-muted max-w-sm text-sm">{description}</p>
      ) : null}
      {action}
    </div>
  );
}
