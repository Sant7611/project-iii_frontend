import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/app-shell";
import "./globals.css";
import "./quillora.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Quillora — Ideas worth reading", template: "%s | Quillora" },
  description: "A community blog for thoughtful writing, relevance-ranked discovery, personalized recommendations, likes, comments, saves, and publishing.",
  keywords: ["blog", "community writing", "article discovery", "recommendations", "search"],
  openGraph: { type: "website", siteName: "Quillora", title: "Quillora — Ideas worth reading", description: "Thoughtful stories, clearer discovery." },
  twitter: { card: "summary_large_image", title: "Quillora — Ideas worth reading", description: "Thoughtful stories, clearer discovery." },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#fbfaf7" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><a className="skip-link" href="#main-content">Skip to content</a><AppShell>{children}</AppShell></body></html>;
}
