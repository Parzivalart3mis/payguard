export default function Loading() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      <div className="bg-surface h-8 w-40 animate-pulse rounded-lg" />
      <div className="rounded-card bg-surface h-24 animate-pulse" />
      <div className="rounded-card bg-surface h-24 animate-pulse" />
    </div>
  );
}
