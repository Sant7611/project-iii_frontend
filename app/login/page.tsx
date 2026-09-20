import type { Metadata } from "next";

import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to tfacts to write, save, and discuss technology facts.",
  robots: { index: false, follow: true },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const requestedDestination = (await searchParams).next;
  const redirectTo = safeInternalDestination(requestedDestination);

  return (
    <div className="auth-wrap">
      <section className="auth-art">
        <span className="brand">tfacts</span>
        <h1>Pick up where curiosity left off.</h1>
        <p>
          Save ideas, join thoughtful conversations, and share what you know.
        </p>
      </section>
      <section className="auth-panel">
        <h2>Welcome back.</h2>
        <p>Sign in to your tfacts account.</p>
        <AuthForm mode="login" redirectTo={redirectTo} />
      </section>
    </div>
  );
}

function safeInternalDestination(destination: string | undefined): string {
  if (
    destination &&
    destination.startsWith("/") &&
    !destination.startsWith("//")
  ) {
    return destination;
  }
  return "/";
}
