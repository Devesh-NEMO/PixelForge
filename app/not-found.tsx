import Link from "next/link";
import { ArrowLeft, ImageOff } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-[18px] border border-line bg-surface text-brand-soft">
        <ImageOff size={24} />
      </span>
      <h1 className="mt-5 text-[24px] font-bold tracking-[-0.02em] text-ink">
        Nothing to convert here
      </h1>
      <p className="mt-2 max-w-sm text-[14px] font-medium text-muted">
        That page does not exist. Head back to the converter and drop an image
        in.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-[12px] bg-[#5550fe] px-5 text-[14px] font-semibold text-white transition hover:brightness-110"
      >
        <ArrowLeft size={15} />
        Back to PixelForge
      </Link>
    </div>
  );
}
