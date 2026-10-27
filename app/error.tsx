"use client";

import { RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="grid-paper flex min-h-screen items-center justify-center bg-paper px-5">
      <div className="w-full max-w-[480px] border-2 border-ink bg-paper-2 p-6 shadow-[8px_8px_0_var(--color-ink)]">
        <p className="text-[9px] tracking-[0.16em] text-muted uppercase">
          Error / 500
        </p>
        <h1 className="mt-2 font-display text-[26px] tracking-[-0.02em] uppercase">
          Something broke
        </h1>
        <p className="mt-2 text-[11px] leading-relaxed text-muted">
          The converter hit an unexpected error. Your files never left this
          device, so nothing was uploaded — try again and it should recover.
        </p>
        {error.digest && (
          <p className="mt-3 inline-block border-[1.5px] border-ink bg-paper px-2 py-1 text-[9px] tracking-[0.08em] uppercase">
            {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          className="press mt-5 inline-flex items-center gap-2 border-2 border-ink bg-lime px-4 py-2.5 font-display text-[11px] tracking-[0.05em] uppercase shadow-[4px_4px_0_var(--color-ink)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0_var(--color-ink)]"
        >
          <RotateCcw size={14} strokeWidth={2.6} />
          Try again
        </button>
      </div>
    </div>
  );
}
