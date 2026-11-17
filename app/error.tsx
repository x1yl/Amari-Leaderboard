"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
        <div className="arena-card max-w-lg px-8 py-12 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-danger/20 bg-danger/10">
            <AlertTriangle className="h-5 w-5 text-danger" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-bold tracking-tight">
            Something went off the board
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            An unexpected error occurred while rendering this page. You can try
            again or head back to the search.
          </p>
          <button type="button" onClick={reset} className="arena-button mt-6">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
