import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="pt-safe pb-safe bg-background flex min-h-dvh items-center justify-center px-4">
      <SignUp />
    </main>
  );
}
