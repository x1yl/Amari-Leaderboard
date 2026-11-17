import Link from "next/link";
import { ExternalLink, ShieldCheck } from "lucide-react";

import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-20 w-full max-w-6xl border-t border-white/[0.06] px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm space-y-3">
          <Logo showTag={false} />
          <p className="text-sm leading-relaxed text-muted-foreground">
            A fast, no-login viewer for Amari leaderboards. This is a personal
            project and is not affiliated with, endorsed by, or operated by
            Amari.
          </p>
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/80">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Data is provided by the Amari API.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 text-sm">
          <div className="space-y-3">
            <p className="label-caps">Explore</p>
            <div className="flex flex-col gap-2 text-muted-foreground">
              <Link href="/" className="transition-colors hover:text-foreground">
                Look up a server
              </Link>
              <Link
                href="/#how-it-works"
                className="transition-colors hover:text-foreground"
              >
                How it works
              </Link>
              <Link
                href="/#faq"
                className="transition-colors hover:text-foreground"
              >
                FAQ
              </Link>
            </div>
          </div>
          <div className="space-y-3">
            <p className="label-caps">Elsewhere</p>
            <div className="flex flex-col gap-2 text-muted-foreground">
              <a
                href="https://github.com/x1yl/Amari-Leaderboard"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
              >
                Source code
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
              <a
                href="https://litochee.gitbook.io/amaribot"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
              >
                Amari documentation
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
              <a
                href="https://amaribot.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
              >
                Amari website
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-2 border-t border-white/[0.06] pt-6 text-xs text-muted-foreground/70 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} Amari Leaderboard. Unofficial fan
          project.
        </p>
        <p>Built for the communities that level up together.</p>
      </div>
    </footer>
  );
}
