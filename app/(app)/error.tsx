"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <EmptyState
      icon={<AlertTriangle className="h-8 w-8" aria-hidden />}
      title="Something went wrong"
      description="An unexpected error occurred. You can try again."
      action={<Button onClick={reset}>Try again</Button>}
    />
  );
}
