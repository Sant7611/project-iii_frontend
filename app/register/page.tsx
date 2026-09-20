import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Join Quillora",
  description: "Create a Quillora account to publish, save, like, and discuss thoughtful stories.",
  robots: { index: false, follow: true },
};

export default function RegisterPage() {
  return (
    <div className="auth-wrap">
      <section className="auth-art">
        <span className="quillora-brand"><span className="quillora-mark">Q</span><strong>Quillora</strong></span>
        <h1>Your next good idea starts here.</h1>
        <p>Build your reading space, discover better recommendations, and contribute to the community.</p>
      </section>
      <section className="auth-panel">
        <h2>Join Quillora.</h2>
        <p>Create your account and start reading with intention.</p>
        <AuthForm mode="register" />
      </section>
    </div>
  );
}
