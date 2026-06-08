import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Logo } from "@/components/logo";
import { BottomNav } from "@/components/nav/bottom-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background min-h-dvh">
      <header className="select-none-ui pt-safe border-border bg-surface/95 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-2">
          <Link href="/documents" className="flex items-center gap-2">
            <Logo className="h-7 w-7" />
            <span className="text-text text-lg font-medium">PayGuard</span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <UserButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 pt-5 pb-28">{children}</main>
      <BottomNav />
    </div>
  );
}
