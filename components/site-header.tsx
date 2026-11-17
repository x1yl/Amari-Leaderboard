import Link from "next/link";
import { ArrowUpRight, Github } from "lucide-react";

import { Logo } from "@/components/logo";

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
      <Logo />
      <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
        <Link
          href="#how-it-works"
          className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
        >
          How it works
        </Link>
        <Link
          href="#faq"
          className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
        >
          FAQ
        </Link>
        <a
          href="https://github.com/x1yl/Amari-Leaderboard"
          target="_blank"
          rel="noreferrer"
          className="arena-button-ghost"
        >
          <Github className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">GitHub</span>
          <ArrowUpRight className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
        </a>
      </nav>
    </header>
  );
}
