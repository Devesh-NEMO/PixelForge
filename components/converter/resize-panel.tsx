import { Link as LinkIcon, Unlink } from "lucide-react";
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

  const field =
    "h-9 w-full border-[1.5px] border-ink bg-paper-2 px-2.5 text-[11.5px] font-semibold text-ink placeholder:font-normal placeholder:text-muted/60";

  return (
    <div className="border-[1.5px] border-ink bg-paper p-3 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[9px] tracking-[0.16em] uppercase sm:text-[9.5px]">
          Resize
        </span>
        {(width || height) && (
          <button
            type="button"
            onClick={onReset}
            className="text-[9px] tracking-[0.1em] text-muted uppercase underline decoration-1 underline-offset-2 hover:text-ink"
          >
            Reset
          </button>
        )}
      </div>

      <div className="mt-3 flex items-end gap-2">
        <label className="min-w-0 flex-1">
          <span className="mb-1 block text-[8.5px] tracking-[0.14em] text-muted uppercase">
            Width
          </span>
          <input
            inputMode="numeric"
            value={width}
            placeholder={sample?.width ? String(sample.width) : "auto"}
            onChange={(event) =>
              onChangeWidth(event.target.value.replace(/[^0-9]/g, ""))
            }
            className={field}
          />
        </label>

        <button
          type="button"
          onClick={onToggleAspect}
          aria-pressed={keepAspect}
          title={keepAspect ? "Aspect ratio locked" : "Aspect ratio unlocked"}
          className={cn(
            "press mb-0.5 grid h-9 w-9 shrink-0 place-items-center border-[1.5px] border-ink",
            keepAspect ? "lime-fill" : "bg-paper-2 hover:bg-paper"
          )}
        >
          {keepAspect ? (
            <LinkIcon size={14} strokeWidth={2.4} />
          ) : (
            <Unlink size={14} strokeWidth={2.4} />
          )}
        </button>

        <label className="min-w-0 flex-1">
          <span className="mb-1 block text-[8.5px] tracking-[0.14em] text-muted uppercase">
            Height
          </span>
          <input
            inputMode="numeric"
            value={height}
            placeholder={sample?.height ? String(sample.height) : "auto"}
            onChange={(event) =>
              onChangeHeight(event.target.value.replace(/[^0-9]/g, ""))
            }
            className={field}
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
            className="press border-[1.5px] border-ink bg-paper-2 px-2 py-1 text-[8.5px] tracking-[0.08em] uppercase hover:-translate-y-[1px] hover:lime-fill hover:shadow-[2px_2px_0_var(--shadow-color)] sm:text-[9px]"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <p className="mt-2.5 text-[9px] tracking-[0.08em] text-muted uppercase">
        {sample && target
          ? resized
            ? `${sample.width}\u00d7${sample.height} \u2192 ${target.width}\u00d7${target.height}`
            : `Original size \u00b7 ${sample.width}\u00d7${sample.height}`
          : "Original size"}
      </p>
    </div>
  );
}
