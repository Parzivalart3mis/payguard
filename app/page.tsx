import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import {
  ChevronRight,
  FileSearch,
  FileText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { FadeIn } from "@/components/motion/fade-in";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    icon: FileSearch,
    title: "Extract",
    text: "Pull every obligation and clause out of the document as structured data.",
  },
  {
    icon: FileText,
    title: "Retrieve",
    text: "Ground each obligation in a shared regulatory corpus and the document itself.",
  },
  {
    icon: Sparkles,
    title: "Draft",
    text: "Generate compliance language with inline citations to the retrieved context.",
  },
  {
    icon: ShieldCheck,
    title: "Self-check",
    text: "An automated faithfulness pass flags any claim that doesn't trace to a source.",
  },
] as const;

export default async function Home() {
  // Public landing page. Signed-in users skip straight to the app.
  const { userId } = await auth();
  if (userId) redirect("/documents");

  return (
    <div className="bg-background min-h-dvh">
      <header className="pt-safe mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <Logo className="h-8 w-8" />
          <span className="text-text text-lg font-semibold">PayGuard</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="mx-auto max-w-3xl px-5">
        {/* Hero */}
        <section className="pt-10 pb-14 sm:pt-16">
          <FadeIn>
            <span className="border-border bg-surface text-text-muted inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium">
              <ShieldCheck className="text-accent h-3.5 w-3.5" aria-hidden />
              Human-approved compliance drafting
            </span>
          </FadeIn>
          <FadeIn delay={0.05}>
            <h1 className="text-text mt-5 text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
              Turn financial documents into trustworthy,
              <span className="text-accent">
                {" "}
                citation-grounded compliance language.
              </span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="text-text-muted mt-4 max-w-xl text-lg">
              Upload a PDF or paste text. PayGuard extracts the obligations,
              retrieves supporting context, drafts language with inline
              citations, and runs a faithfulness self-check — then routes it to
              a human reviewer. The AI never finalizes on its own.
            </p>
          </FadeIn>
          <FadeIn delay={0.15}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/sign-in"
                className={cn(buttonVariants({ size: "lg" }))}
              >
                Sign in
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/sign-up"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "lg" }),
                )}
              >
                Create account
              </Link>
            </div>
          </FadeIn>
        </section>

        {/* How it works */}
        <section className="pb-16">
          <FadeIn>
            <h2 className="text-text-muted text-xs font-semibold tracking-wide uppercase">
              How it works
            </h2>
          </FadeIn>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {STEPS.map((step, i) => (
              <FadeIn key={step.title} delay={0.05 * i}>
                <div className="border-border bg-surface h-full rounded-xl border p-5">
                  <div className="bg-accent/10 text-accent flex h-10 w-10 items-center justify-center rounded-lg">
                    <step.icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="text-text mt-4 flex items-center gap-2 font-semibold">
                    <span className="text-text-muted text-sm tabular-nums">
                      {i + 1}
                    </span>
                    {step.title}
                  </h3>
                  <p className="text-text-muted mt-1 text-base">{step.text}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>
      </main>

      <footer className="pb-safe border-border border-t">
        <div className="text-text-muted mx-auto flex max-w-3xl flex-col gap-1 px-5 py-6 text-sm">
          <p className="text-text font-medium">PayGuard</p>
          <p>
            Every draft is reviewed and approved by a human before a version is
            final.
          </p>
        </div>
      </footer>
    </div>
  );
}
