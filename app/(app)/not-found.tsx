import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <EmptyState
      icon={<FileQuestion className="h-8 w-8" aria-hidden />}
      title="Not found"
      description="This document doesn’t exist, or you don’t have access to it."
      action={
        <Link href="/documents">
          <Button>Back to documents</Button>
        </Link>
      }
    />
  );
}
