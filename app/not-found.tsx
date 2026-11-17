import Link from "next/link";
import { SearchX } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
        <div className="arena-card max-w-lg px-8 py-12 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
            <SearchX className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </span>
          <p className="label-caps mt-6">404</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            That page isn&apos;t on the board
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The link may be broken. Head back and paste a server ID or invite
            link to open a leaderboard.
          </p>
          <Link href="/" className="arena-button mt-6">
            Back to search
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
