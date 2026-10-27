"use client";

import { useEffect, useState } from "react";
import { CircleHelp, Download, ImageUp, Sparkles, X } from "lucide-react";

const STEPS = [
  {
    icon: ImageUp,
    title: "Drop an image",
    body: "Pick a JPG, PNG, WebP, AVIF or HEIC file — or drag several onto the drop zone at once.",
  },
  {
    icon: Sparkles,
    title: "Choose a format",
    body: "Select an output, tune quality or a target size, and hit convert. Everything runs on your device.",
  },
  {
    icon: Download,
    title: "Download",
    body: "Grab each file individually, the whole batch as a ZIP, or all pages as one PDF.",
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
        aria-label="How it works"
        className="press inline-flex h-8 items-center gap-1.5 border-[1.5px] border-ink bg-paper px-2.5 hover:lime-fill hover:shadow-[2px_2px_0_var(--shadow-color)]"
      >
        <CircleHelp size={14} strokeWidth={2.4} />
        <span className="hidden text-[9.5px] tracking-[0.1em] uppercase sm:inline">
          How it works
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--scrim)] px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="how-it-works-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-[520px] border-2 border-ink bg-paper-2 p-5 shadow-[10px_10px_0_var(--shadow-color)] sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b-2 border-ink pb-3">
              <div>
                <h2
                  id="how-it-works-title"
                  className="font-display text-[18px] tracking-[-0.01em] uppercase"
                >
                  How it works
                </h2>
                <p className="mt-1 text-[9px] tracking-[0.12em] text-muted uppercase">
                  Three steps / zero uploads
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="press grid h-8 w-8 shrink-0 place-items-center border-[1.5px] border-ink bg-paper hover:lime-fill hover:shadow-[2px_2px_0_var(--shadow-color)]"
              >
                <X size={15} strokeWidth={2.6} />
              </button>
            </div>

            <ol className="mt-4 space-y-3">
              {STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="flex gap-3 border-[1.5px] border-ink bg-paper p-3"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center border-[1.5px] border-ink lime-fill">
                    <step.icon size={16} strokeWidth={2.2} />
                  </span>
                  <div>
                    <p className="flex items-center gap-2 text-[11.5px] font-bold">
                      <span className="text-[9px] tracking-[0.1em] text-muted">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {step.title}
                    </p>
                    <p className="mt-1 text-[10px] leading-relaxed text-muted">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="press mt-4 w-full border-2 border-ink lime-fill py-3 font-display text-[11px] tracking-[0.05em] uppercase shadow-[4px_4px_0_var(--shadow-color)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0_var(--shadow-color)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
