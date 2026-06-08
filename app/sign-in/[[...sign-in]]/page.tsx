import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="pt-safe pb-safe bg-background flex min-h-dvh items-center justify-center px-4">
      <SignIn />
    </main>
  );
}
