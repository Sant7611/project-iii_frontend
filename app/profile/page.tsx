import type { Metadata } from "next";
import { ProfileDashboard } from "@/components/profile-dashboard";
export const metadata: Metadata = { title: "Your profile", robots: { index: false, follow: false } };
export default function ProfilePage() { return <ProfileDashboard />; }
