import type { Metadata } from "next";
import { ModerationDashboard } from "@/components/moderation-dashboard";
export const metadata: Metadata = { title: "Post moderation", robots: { index: false, follow: false } };
export default function ModerationPage() { return <ModerationDashboard />; }
