"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { formatBytes } from "../lib/image";

type Side = {
  url: string;
  width?: number;
  height?: number;
  size: number;
};

type CompareDialogProps = {
  name: string;
  original: Side;
  converted: Side;
  onClose: () => void;
};

function dimensionLabel(side: Side) {
  return side.width && side.height ? `${side.width} x ${side.height}` : "image";
}

export function CompareDialog({
  name,
  original,
  converted,
  onClose,
}: CompareDialogProps) {
  const [position, setPosition] = useState(50);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-4 py-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[720px] border-2 border-ink bg-paper-2 p-4 shadow-[10px_10px_0_var(--color-ink)] sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b-2 border-ink pb-3">
          <div className="min-w-0">
            <h2
              id="compare-title"
              className="truncate font-display text-[16px] tracking-[-0.01em] uppercase sm:text-[18px]"
            >
              {name}
            </h2>
            <p className="mt-1 text-[9px] tracking-[0.12em] text-muted uppercase">
              Drag to compare original / converted
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close comparison"
            className="press grid h-8 w-8 shrink-0 place-items-center border-[1.5px] border-ink bg-paper hover:bg-lime hover:shadow-[2px_2px_0_var(--color-ink)]"
          >
            <X size={15} strokeWidth={2.6} />
          </button>
        </div>

        <div className="relative mt-4 overflow-hidden border-[1.5px] border-ink bg-paper">
          {/* The original drives the layout box; the conversion is clipped over it. */}
          <img
            src={original.url}
            alt="Original"
            className="block max-h-[56vh] w-full object-contain"
          />
          <div
            className="absolute inset-0"
            style={{ clipPath: `inset(0 0 0 ${position}%)` }}
          >
            <img
              src={converted.url}
              alt="Converted"
              className="h-full w-full object-contain"
            />
          </div>
          <div
            aria-hidden
            className="absolute inset-y-0 w-[2px] -translate-x-[1px] bg-ink"
            style={{ left: `${position}%` }}
          />
        </div>

        <input
          type="range"
          min={0}
          max={100}
          value={position}
          aria-label="Comparison position"
          onChange={(event) => setPosition(Number(event.target.value))}
          className="mt-3 h-6 w-full accent-ink"
        />

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[9px] tracking-[0.08em] text-muted uppercase">
          <span>
            Converted / {dimensionLabel(converted)} /{" "}
            {formatBytes(converted.size)}
          </span>
          <span>
            Original / {dimensionLabel(original)} / {formatBytes(original.size)}
          </span>
        </div>
      </div>
    </div>
  );
}
