import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "tfacts — Technology, made clear",
    template: "%s | tfacts",
  },
  description:
    "Useful technology facts, thoughtful explainers, and practical ideas for curious people.",
  keywords: ["technology facts", "tech explainers", "software", "AI", "internet"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "tfacts",
    title: "tfacts — Technology, made clear",
    description: "Useful technology facts and thoughtful explainers, without the noise.",
  },
  twitter: {
    card: "summary_large_image",
    title: "tfacts — Technology, made clear",
    description: "Useful technology facts and thoughtful explainers, without the noise.",
  },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f8fc",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
