import type { Metadata } from "next";
import { ManagedUserDetail } from "@/components/managed-user-detail";
export const metadata: Metadata = { title: "Account details", robots: { index: false, follow: false } };
export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) { return <ManagedUserDetail id={(await params).id} />; }
