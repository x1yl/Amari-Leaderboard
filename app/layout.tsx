import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Unoffical Amari Leaderboard",
  description:
    "View your Discord server's leaderboard with Amari. This is a personal project and is not affiliated with Amari.",
  keywords: [
    "Amari",
    "Amari Discord",
    "Amari Leaderboard",
    "Amari Discord Leaderboard",
    "Amari Discord Bot",
    "Amari Discord Bot Leaderboard",
    "Amari Discord Bot Leaderboard Viewer",
    "Amari Discord Bot Leaderboard Viewer Unofficial",
    "Unofficial Amari Leaderboard",
    "Unofficial Amari Discord Leaderboard",
    "Unofficial Amari Discord Bot Leaderboard",
    "Unofficial Amari Discord Bot Leaderboard Viewer",
  ],
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Unoffical Amari Leaderboard",
    description:
      "View your Discord server's leaderboard with Amari. This is a personal project and is not affiliated with Amari.",
    url: "https://amari-leaderboard.vercel.app",
    siteName: "Unoffical Amari Leaderboard",
    type: "website",
  },
  twitter: {
    title: "Unoffical Amari Leaderboard",
    description:
      "View your Discord server's leaderboard with Amari. This is a personal project and is not affiliated with Amari.",
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
