"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { API_URL } from "@/lib/api";
import { storeAuthSession } from "@/lib/auth";

export function AuthForm({ mode, redirectTo = "/" }: { mode: "login" | "register"; redirectTo?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch(`${API_URL}/auth/${mode === "login" ? "login" : "register"}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || Object.values(payload || {}).flat().join(" ") || "Please check your details.");
      const auth = payload.data || payload;
      if (mode === "login") {
        if (!auth.access || !auth.refresh || !auth.user_id) throw new Error("The login response did not include a complete session.");
        storeAuthSession(auth.access, auth.refresh, { id: auth.user_id, username: auth.username, email: auth.email, role: auth.role });
        router.push(redirectTo);
      } else {
        router.push("/login?registered=1");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to connect to the API.");
    } finally {
      setBusy(false);
    }
  }

  return <form className="form" onSubmit={submit}>
    {mode === "register" && <>
      <div className="field"><label htmlFor="username">Username</label><input id="username" name="username" required autoComplete="username" /></div>
      <div className="field"><label htmlFor="first_name">First name</label><input id="first_name" name="first_name" autoComplete="given-name" /></div>
      <div className="field"><label htmlFor="last_name">Last name</label><input id="last_name" name="last_name" autoComplete="family-name" /></div>
    </>}
    <div className="field"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" required autoComplete="email" /></div>
    <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} /></div>
    {mode === "register" && <div className="field"><label htmlFor="password2">Confirm password</label><input id="password2" name="password2" type="password" required minLength={8} autoComplete="new-password" /></div>}
    {error && <div className="form-error" role="alert">{error}</div>}
    <button className="button button-primary" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
    <p className="auth-switch">{mode === "login" ? <>New to Quillora? <Link href="/register">Create an account</Link></> : <>Already have an account? <Link href="/login">Sign in</Link></>}</p>
  </form>;
}
