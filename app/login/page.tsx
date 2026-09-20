import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Quillora to write, save, like, and discuss stories.",
  robots: { index: false, follow: true },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const requestedDestination = (await searchParams).next;
  const redirectTo = safeInternalDestination(requestedDestination);
  return (
    <div className="auth-wrap">
      <section className="auth-art">
        <span className="quillora-brand"><span className="quillora-mark">Q</span><strong>Quillora</strong></span>
        <h1>Come back to ideas worth reading.</h1>
        <p>Save stories, shape your recommendations, join discussions, and publish your own writing.</p>
      </section>
      <section className="auth-panel">
        <h2>Welcome back.</h2>
        <p>Sign in to your Quillora account.</p>
        <AuthForm mode="login" redirectTo={redirectTo} />
      </section>
    </div>
  );
}

function safeInternalDestination(destination: string | undefined): string {
  return destination && destination.startsWith("/") && !destination.startsWith("//") ? destination : "/";
}
