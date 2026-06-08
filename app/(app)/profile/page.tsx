import { redirect } from "next/navigation";
import { Mail, ShieldCheck } from "lucide-react";
import { getCurrentDbUser } from "@/lib/auth/current-user";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

const ROLE_COPY: Record<
  string,
  { label: string; tone: "primary" | "accent" | "success"; blurb: string }
> = {
  author: {
    label: "Author",
    tone: "primary",
    blurb:
      "You can upload documents, generate and regenerate drafts, and submit them to a reviewer for sign-off.",
  },
  reviewer: {
    label: "Reviewer",
    tone: "accent",
    blurb:
      "You can review drafts assigned to you, read their citations and faithfulness flags, and approve or request changes.",
  },
  admin: {
    label: "Admin",
    tone: "success",
    blurb: "You can read every document, and act as both author and reviewer.",
  },
};

export default async function ProfilePage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const role = ROLE_COPY[user.role] ?? ROLE_COPY.author!;

  return (
    <div>
      <PageHeader title="Profile" />
      <Card className="space-y-4">
        <div>
          <p className="text-text text-xl font-medium">
            {user.name ?? "Unnamed user"}
          </p>
          <div className="text-text-muted mt-1 flex items-center gap-1.5 text-sm">
            <Mail className="h-4 w-4" aria-hidden />
            {user.email}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-text-muted h-4 w-4" aria-hidden />
          <Badge tone={role.tone}>{role.label}</Badge>
        </div>
        <p className="text-text-muted text-sm">{role.blurb}</p>
      </Card>
    </div>
  );
}
