import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const siteUrl = getSiteUrl();

const description =
  "Look up any Discord server's Amari leaderboard. See all-time and weekly rankings, find your spot, and share the results. Unofficial and not affiliated with Amari.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Amari Leaderboard — Unofficial Leaderboard Viewer",
    template: "%s · Amari Leaderboard",
  },
  description,
  applicationName: "Amari Leaderboard",
  keywords: [
    "Amari",
    "Amari leaderboard",
    "Amari bot",
    "Discord leaderboard",
    "Discord levels",
    "Amari weekly leaderboard",
    "Unofficial Amari leaderboard",
  ],
  authors: [{ name: "Amari Leaderboard contributors" }],
  creator: "Amari Leaderboard",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Amari Leaderboard — Unofficial Leaderboard Viewer",
    description,
    url: "/",
    siteName: "Amari Leaderboard",
    type: "website",
  },
  twitter: {
    title: "Amari Leaderboard — Unofficial Leaderboard Viewer",
    description,
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0e14",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable} dark`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
