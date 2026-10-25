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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#03060f]/85 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[720px] overflow-hidden rounded-[24px] border border-line bg-surface p-5 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2
              id="compare-title"
              className="truncate text-[17px] font-bold tracking-[-0.01em] text-ink"
            >
              {name}
            </h2>
            <p className="mt-1 text-[12.5px] font-medium text-muted">
              Drag the handle to compare the converted result with the original
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close comparison"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-muted transition-colors hover:border-line-strong hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        <div className="relative mt-5 overflow-hidden rounded-[16px] border border-line bg-[#070d1c]">
          {/* The original drives the layout box; the conversion is clipped over it. */}
          <img
            src={original.url}
            alt="Original"
            className="block max-h-[58vh] w-full object-contain"
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
            className="absolute inset-y-0 w-[2px] -translate-x-[1px] bg-white/70"
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
          className="mt-4 w-full accent-brand"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] font-medium">
          <span className="text-faint">
            Converted · {dimensionLabel(converted)} ·{" "}
            {formatBytes(converted.size)}
          </span>
          <span className="text-faint">
            Original · {dimensionLabel(original)} · {formatBytes(original.size)}
          </span>
        </div>
      </div>
    </div>
  );
}
