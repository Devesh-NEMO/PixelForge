import { cn } from "../../lib/cn";
import type { OutputFormat } from "../../lib/formats";

type OutputSettingsProps = {
  format: OutputFormat;
  quality: number;
  onQualityChange: (value: number) => void;
  targetEnabled: boolean;
  onTargetEnabledChange: (value: boolean) => void;
  targetKb: number;
  onTargetKbChange: (value: number) => void;
  backgroundColor: string;
  onBackgroundColorChange: (value: string) => void;
};

const label = "text-[9px] tracking-[0.14em] uppercase sm:text-[9.5px]";

export function OutputSettings({
  format,
  quality,
  onQualityChange,
  targetEnabled,
  onTargetEnabledChange,
  targetKb,
  onTargetKbChange,
  backgroundColor,
  onBackgroundColorChange,
}: OutputSettingsProps) {
  return (
    <div className="space-y-4 border-[1.5px] border-ink bg-paper p-3 sm:p-4">
      {format.lossy ? (
        <>
          <label className="block">
            <span className={cn("flex items-center justify-between", label)}>
              Quality
              <span className="text-[10.5px] font-bold text-ink">
                {quality}%
              </span>
            </span>
            <input
              type="range"
              min={40}
              max={100}
              value={quality}
              onChange={(event) => onQualityChange(Number(event.target.value))}
              className="mt-2.5 h-6 w-full accent-ink"
            />
          </label>

          {format.kind !== "pdf" && (
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className={label}>Target file size</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={targetEnabled}
                  aria-label="Target file size"
                  onClick={() => onTargetEnabledChange(!targetEnabled)}
                  className={cn(
                    "relative h-6 w-12 shrink-0 border-[1.5px] border-ink",
                    targetEnabled ? "bg-lime" : "bg-paper-2"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-[2px] h-[16px] w-[16px] border-[1.5px] border-ink bg-ink transition-all",
                      targetEnabled ? "left-[26px]" : "left-[2px]"
                    )}
                  />
                </button>
              </div>

              {targetEnabled && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    inputMode="numeric"
                    value={targetKb}
                    onChange={(event) =>
                      onTargetKbChange(
                        Math.max(
                          1,
                          Number(event.target.value.replace(/[^0-9]/g, "")) || 0
                        )
                      )
                    }
                    className="h-9 w-20 border-[1.5px] border-ink bg-paper-2 px-2.5 text-[11.5px] font-semibold text-ink"
                  />
                  <span className="text-[9px] tracking-[0.08em] text-muted uppercase">
                    KB max / quality adapts
                  </span>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <p className="text-[9.5px] leading-relaxed tracking-[0.06em] text-muted uppercase">
          {format.label} is lossless — quality and target size don&apos;t apply.
        </p>
      )}

      {(format.id === "jpg" || format.kind === "pdf") && (
        <label className="flex items-center justify-between gap-4">
          <span className={label}>Background for transparency</span>
          <span className="flex items-center gap-2">
            <span className="text-[9px] tracking-[0.08em] text-muted uppercase">
              {backgroundColor}
            </span>
            <input
              type="color"
              value={backgroundColor}
              onChange={(event) => onBackgroundColorChange(event.target.value)}
              className="h-8 w-9 cursor-pointer border-[1.5px] border-ink bg-paper-2 p-0"
            />
          </span>
        </label>
      )}
    </div>
  );
}
