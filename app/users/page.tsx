import type { Metadata } from "next";
import { UserManagement } from "@/components/user-management";
export const metadata: Metadata = { title: "User management", robots: { index: false, follow: false } };
export default function UsersPage() { return <UserManagement />; }
