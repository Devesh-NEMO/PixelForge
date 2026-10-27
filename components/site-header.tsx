import Link from "next/link";
import { HowItWorks } from "./how-it-works";

export function SiteHeader() {
  return (
    <header className="border-b-2 border-ink bg-paper">
      <div className="mx-auto flex h-[64px] w-full max-w-[1180px] items-center justify-between px-5 sm:h-[78px] sm:px-10">
        <Link
          href="/"
          aria-label="PixelForge home"
          className="flex items-center gap-3"
        >
          <span className="font-display text-[19px] tracking-[-0.02em] uppercase sm:text-[22px]">
            PixelForge
          </span>
          <span className="hidden border-[1.5px] border-ink bg-lime px-2 py-[3px] text-[9.5px] tracking-[0.14em] uppercase sm:inline">
            Converter
          </span>
        </Link>

        <HowItWorks />
      </div>
    </header>
  );
}
