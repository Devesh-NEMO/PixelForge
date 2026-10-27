import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="grid-paper flex min-h-screen items-center justify-center bg-paper px-5">
      <div className="w-full max-w-[480px] border-2 border-ink bg-paper-2 p-6 shadow-[8px_8px_0_var(--color-ink)]">
        <p className="text-[9px] tracking-[0.16em] text-muted uppercase">
          Error / 404
        </p>
        <h1 className="mt-2 font-display text-[26px] tracking-[-0.02em] uppercase">
          Nothing to convert here
        </h1>
        <p className="mt-2 text-[11px] leading-relaxed text-muted">
          That page doesn&apos;t exist. Head back to the converter and drop an
          image in.
        </p>
        <Link
          href="/"
          className="press mt-5 inline-flex items-center gap-2 border-2 border-ink bg-lime px-4 py-2.5 font-display text-[11px] tracking-[0.05em] uppercase shadow-[4px_4px_0_var(--color-ink)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0_var(--color-ink)]"
        >
          <ArrowLeft size={14} strokeWidth={2.6} />
          Back to PixelForge
        </Link>
      </div>
    </div>
  );
}
