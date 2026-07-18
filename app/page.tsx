import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import {
  CheckCircle2,
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

/** Illustrative product preview for the hero — decorative, not real data. */
function DraftPreview() {
  return (
    <div
      aria-hidden
      className="border-border bg-surface rounded-2xl border p-5 shadow-sm lg:p-6"
    >
      <div className="border-border flex items-center gap-3 border-b pb-4">
        <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
          <FileText className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-text truncate font-medium">
            Merchant Services Agreement
          </p>
          <p className="text-text-muted text-sm">3 obligations extracted</p>
        </div>
        <span className="bg-warning/10 text-warning shrink-0 rounded-full px-2.5 py-1 text-xs font-medium">
          In review
        </span>
      </div>

      <div className="flex flex-wrap gap-2 pt-4">
        {["Disclosure", "Record retention", "Funds availability"].map((c) => (
          <span
            key={c}
            className="border-border text-text-muted rounded-full border px-2.5 py-1 text-xs"
          >
            {c}
          </span>
        ))}
      </div>

      <div className="space-y-3 pt-4">
        <p className="text-text text-base leading-relaxed">
          The Provider must disclose all fees at least 30 days before any change
          takes effect{" "}
          <span className="bg-accent/10 text-accent rounded px-1.5 py-0.5 text-sm font-medium">
            [corpus:reg-cc]
          </span>
          .
        </p>
        <p className="text-text-muted text-base leading-relaxed">
          Transaction records are retained for a minimum of five years{" "}
          <span className="bg-accent/10 text-accent rounded px-1.5 py-0.5 text-sm font-medium">
            [doc:1]
          </span>
          .
        </p>
      </div>

      <div className="bg-success/10 mt-5 flex items-center gap-2 rounded-lg px-3 py-2">
        <CheckCircle2 className="text-success h-4 w-4 shrink-0" />
        <span className="text-success text-sm font-medium">
          Faithfulness check passed
        </span>
      </div>
    </div>
  );
}

export default async function Home() {
  // Public landing page. Signed-in users skip straight to the app.
  const { userId } = await auth();
  if (userId) redirect("/documents");

  return (
    <div className="bg-background min-h-dvh">
      <header className="border-border bg-surface/90 pt-safe sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
          <div className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="text-text text-lg font-semibold">PayGuard</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/sign-in"
              className={cn(
                buttonVariants({ variant: "primary", size: "sm" }),
                "hidden sm:inline-flex",
              )}
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero — stacks on mobile, two columns from lg up */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="bg-accent/10 pointer-events-none absolute -top-32 -right-24 h-72 w-72 rounded-full blur-3xl lg:h-[28rem] lg:w-[28rem]"
          />
          <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 gap-12 px-5 py-14 sm:px-8 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-24">
            <div className="min-w-0">
              <FadeIn>
                <span className="border-border bg-surface text-text-muted inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium">
                  <ShieldCheck
                    className="text-accent h-3.5 w-3.5"
                    aria-hidden
                  />
                  Human-approved compliance drafting
                </span>
              </FadeIn>
              <FadeIn delay={0.05}>
                <h1 className="text-text mt-5 text-3xl leading-tight font-bold tracking-tight text-balance sm:text-4xl xl:text-5xl">
                  Turn financial documents into trustworthy,
                  <span className="text-accent">
                    {" "}
                    citation-grounded compliance language.
                  </span>
                </h1>
              </FadeIn>
              <FadeIn delay={0.1}>
                <p className="text-text-muted mt-5 max-w-xl text-lg lg:text-xl">
                  Upload a PDF or paste text. PayGuard extracts the obligations,
                  retrieves supporting context, drafts language with inline
                  citations, and runs a faithfulness self-check — then routes it
                  to a human reviewer. The AI never finalizes on its own.
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
            </div>

            <FadeIn delay={0.2} className="min-w-0">
              <DraftPreview />
            </FadeIn>
          </div>
        </section>

        {/* How it works — 1 / 2 / 4 columns */}
        <section className="border-border border-t">
          <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 lg:py-20">
            <FadeIn>
              <div className="lg:text-center">
                <h2 className="text-text-muted text-xs font-semibold tracking-wide uppercase">
                  How it works
                </h2>
                <p className="text-text mt-2 text-2xl font-semibold lg:text-3xl">
                  Four grounded steps, one human sign-off
                </p>
              </div>
            </FadeIn>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4">
              {STEPS.map((step, i) => (
                <FadeIn key={step.title} delay={0.05 * i}>
                  <div className="border-border bg-surface h-full rounded-xl border p-5 lg:p-6">
                    <div className="bg-accent/10 text-accent flex h-10 w-10 items-center justify-center rounded-lg">
                      <step.icon className="h-5 w-5" aria-hidden />
                    </div>
                    <h3 className="text-text mt-4 flex items-center gap-2 font-semibold">
                      <span className="text-text-muted text-sm tabular-nums">
                        {i + 1}
                      </span>
                      {step.title}
                    </h3>
                    <p className="text-text-muted mt-1 text-base">
                      {step.text}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="border-border border-t">
          <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 lg:py-20">
            <FadeIn>
              <div className="border-border bg-surface rounded-2xl border px-6 py-10 text-center lg:px-12 lg:py-14">
                <h2 className="text-text text-2xl font-semibold lg:text-3xl">
                  Ready to draft with citations you can defend?
                </h2>
                <p className="text-text-muted mx-auto mt-3 max-w-xl text-lg">
                  Every version is reviewed and approved by a person before it
                  is final.
                </p>
                <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/sign-up"
                    className={cn(buttonVariants({ size: "lg" }))}
                  >
                    Create account
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </Link>
                  <Link
                    href="/sign-in"
                    className={cn(
                      buttonVariants({ variant: "secondary", size: "lg" }),
                    )}
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>
      </main>

      <footer className="border-border pb-safe border-t">
        <div className="text-text-muted mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-2">
            <Logo className="h-5 w-5" />
            <span className="text-text font-medium">PayGuard</span>
          </div>
          <p className="text-sm">
            Compliance drafting with citations and human approval.
          </p>
        </div>
      </footer>
    </div>
  );
}
