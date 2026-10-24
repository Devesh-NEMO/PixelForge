"use client";

import { useEffect, useState } from "react";
import { CircleHelp, Download, ImageUp, Sparkles, X } from "lucide-react";

const STEPS = [
  {
    icon: ImageUp,
    title: "Drop an image",
    body: "Pick a JPG, PNG, WebP or AVIF file — or drag several onto the drop zone at once.",
  },
  {
    icon: Sparkles,
    title: "Choose your format",
    body: "Select an output format, tune the quality, and hit convert. Everything runs on your device.",
  },
  {
    icon: Download,
    title: "Download instantly",
    body: "Grab each converted file individually. Nothing was ever uploaded to a server.",
  },
];

export function HowItWorks() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2.5 rounded-full text-[15px] font-semibold text-periwinkle transition-colors hover:text-ink sm:text-[17px]"
      >
        <CircleHelp size={21} strokeWidth={2} />
        How it works
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#03060f]/80 px-5 py-8 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="how-it-works-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-[520px] overflow-hidden rounded-[24px] border border-line bg-surface p-7 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] sm:p-9"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 left-1/2 h-56 w-80 -translate-x-1/2 rounded-full bg-brand/25 blur-3xl"
            />

            <div className="relative flex items-start justify-between gap-6">
              <div>
                <h2
                  id="how-it-works-title"
                  className="text-[22px] font-bold tracking-[-0.02em] text-ink"
                >
                  How it works
                </h2>
                <p className="mt-1.5 text-[14px] font-medium text-muted">
                  Three steps, zero uploads.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted transition-colors hover:border-line-strong hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>

            <ol className="relative mt-7 space-y-5">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] border border-line bg-surface-2 text-brand-soft">
                    <step.icon size={19} />
                  </span>
                  <div>
                    <p className="flex items-center gap-2 text-[15px] font-semibold text-ink">
                      <span className="text-[12px] font-bold text-faint">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {step.title}
                    </p>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-muted">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-8 h-[48px] w-full rounded-[14px] bg-[linear-gradient(180deg,#6764ff_0%,#514cfb_100%)] text-[15px] font-semibold text-white shadow-[0_16px_34px_-14px_rgba(85,80,254,0.9)] transition hover:brightness-110"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
