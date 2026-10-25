"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-[18px] border border-line bg-surface text-danger">
        <TriangleAlert size={24} />
      </span>
      <h1 className="mt-5 text-[24px] font-bold tracking-[-0.02em] text-ink">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-sm text-[14px] font-medium text-muted">
        The converter hit an unexpected error. Your files never left this
        device, so nothing was uploaded — try again and it should recover.
      </p>
      {error.digest && (
        <p className="mt-3 rounded-full border border-line px-3 py-1 text-[11px] font-semibold text-faint">
          {error.digest}
        </p>
      )}
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-[12px] bg-[#5550fe] px-5 text-[14px] font-semibold text-white transition hover:brightness-110"
      >
        <RotateCcw size={15} />
        Try again
      </button>
    </div>
  );
}
