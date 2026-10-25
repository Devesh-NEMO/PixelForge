import Link from "next/link";
import { Image as ImageIcon } from "lucide-react";
import { HowItWorks } from "./how-it-works";

export function SiteHeader() {
  return (
    <header className="relative z-30 border-b border-white/[0.06] bg-canvas">
      <div className="mx-auto flex h-[64px] w-full items-center justify-between px-5 sm:h-[86px] sm:px-[34px] lg:px-[55px]">
        <Link
          href="/"
          className="group flex items-center gap-5"
          aria-label="PixelForge home"
        >
          <span className="grid h-[44px] w-[44px] place-items-center rounded-[13px] bg-[linear-gradient(150deg,#5a57f8_0%,#5754f7_58%,#5450f5_100%)] shadow-[0_8px_18px_-10px_rgba(85,80,254,0.9),inset_0_1px_0_rgba(255,255,255,0.28)] sm:h-[44px] sm:w-[44px] sm:rounded-[13px]">
            <ImageIcon size={21} strokeWidth={2} className="text-white" />
          </span>
          <span className="flex items-center gap-3">
            <span className="text-[20px] font-bold tracking-[-0.02em] text-ink sm:text-[22px]">
              PixelForge
            </span>
            <span aria-hidden className="h-7 w-px bg-line-strong" />
            <span className="hidden text-[20px] font-medium tracking-[-0.01em] text-faint sm:inline sm:text-[22px]">
              Converter
            </span>
          </span>
        </Link>

        <HowItWorks />
      </div>
    </header>
  );
}
