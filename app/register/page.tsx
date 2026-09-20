import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
export const metadata: Metadata = { title: "Join tfacts", description: "Create a tfacts account and contribute clear technology facts.", robots: { index: false, follow: true } };
export default function RegisterPage() { return <div className="auth-wrap"><section className="auth-art"><span className="brand">tfacts</span><h1>Curiosity looks good on you.</h1><p>Create your space to learn, save, discuss, and contribute.</p></section><section className="auth-panel"><h2>Join tfacts.</h2><p>A thoughtful technology community starts here.</p><AuthForm mode="register" /></section></div>; }
