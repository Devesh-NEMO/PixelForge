import { Link as LinkIcon, Scaling, Unlink } from "lucide-react";
import { cn } from "../../lib/cn";
import type { Dimensions } from "../../lib/image";

const SIZE_PRESETS = [
  { label: "Instagram", width: 1080, height: 1080 },
  { label: "Story", width: 1080, height: 1920 },
  { label: "OG card", width: 1200, height: 630 },
  { label: "HD", width: 1920, height: 1080 },
] as const;

type ResizePanelProps = {
  width: string;
  height: string;
  keepAspect: boolean;
  sample?: { width?: number; height?: number };
  /** The resolved output size for the first image, or null when unknown. */
  target: Dimensions | null;
  onChangeWidth: (value: string) => void;
  onChangeHeight: (value: string) => void;
  onToggleAspect: () => void;
  onReset: () => void;
};

export function ResizePanel({
  width,
  height,
  keepAspect,
  sample,
  target,
  onChangeWidth,
  onChangeHeight,
  onToggleAspect,
  onReset,
}: ResizePanelProps) {
  const resized =
    target != null &&
    sample?.width != null &&
    sample?.height != null &&
    (target.width !== sample.width || target.height !== sample.height);

  return (
    <div className="rounded-[14px] border border-line bg-surface-2/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-[12.5px] font-semibold text-muted">
          <Scaling size={14} className="text-brand-soft" />
          Resize
        </span>
        {(width || height) && (
          <button
            type="button"
            onClick={onReset}
            className="text-[11.5px] font-semibold text-faint transition-colors hover:text-ink"
          >
            Reset
          </button>
        )}
      </div>

      <div className="mt-3 flex items-end gap-2">
        <label className="min-w-0 flex-1">
          <span className="mb-1 block text-[10.5px] font-semibold tracking-[0.1em] text-faint uppercase">
            Width
          </span>
          <input
            inputMode="numeric"
            value={width}
            placeholder={sample?.width ? String(sample.width) : "auto"}
            onChange={(event) =>
              onChangeWidth(event.target.value.replace(/[^0-9]/g, ""))
            }
            className="h-9 w-full rounded-[10px] border border-line bg-canvas px-3 text-[13px] font-semibold text-ink placeholder:text-faint/70 focus:border-brand/70 focus:outline-none"
          />
        </label>

        <button
          type="button"
          onClick={onToggleAspect}
          aria-pressed={keepAspect}
          title={keepAspect ? "Aspect ratio locked" : "Aspect ratio unlocked"}
          className={cn(
            "mb-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border transition-colors",
            keepAspect
              ? "border-brand/50 bg-brand/15 text-brand-soft"
              : "border-line text-faint hover:text-ink"
          )}
        >
          {keepAspect ? <LinkIcon size={14} /> : <Unlink size={14} />}
        </button>

        <label className="min-w-0 flex-1">
          <span className="mb-1 block text-[10.5px] font-semibold tracking-[0.1em] text-faint uppercase">
            Height
          </span>
          <input
            inputMode="numeric"
            value={height}
            placeholder={sample?.height ? String(sample.height) : "auto"}
            onChange={(event) =>
              onChangeHeight(event.target.value.replace(/[^0-9]/g, ""))
            }
            className="h-9 w-full rounded-[10px] border border-line bg-canvas px-3 text-[13px] font-semibold text-ink placeholder:text-faint/70 focus:border-brand/70 focus:outline-none"
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {SIZE_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              onChangeWidth(String(preset.width));
              onChangeHeight(String(preset.height));
            }}
            className="rounded-full border border-line px-2.5 py-1 text-[11px] font-semibold text-faint transition-colors hover:border-brand/60 hover:text-ink"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <p className="mt-2.5 text-[11.5px] font-medium text-faint">
        {sample && target
          ? resized
            ? `${sample.width}\u00d7${sample.height} \u2192 ${target.width}\u00d7${target.height}`
            : `Original size \u00b7 ${sample.width}\u00d7${sample.height}`
          : "Original size"}
      </p>
    </div>
  );
}
