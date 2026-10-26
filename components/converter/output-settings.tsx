import { Target } from "lucide-react";
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
    <div className="space-y-4 rounded-[14px] border border-line bg-surface-2/30 p-4">
      {format.lossy ? (
        <>
          <label className="block">
            <span className="flex items-center justify-between text-[12.5px] font-semibold text-muted">
              Quality
              <span className="text-ink">{quality}%</span>
            </span>
            <input
              type="range"
              min={40}
              max={100}
              value={quality}
              onChange={(event) => onQualityChange(Number(event.target.value))}
              className="mt-2 w-full accent-brand"
            />
          </label>

          {format.kind !== "pdf" && (
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-[12.5px] font-semibold text-muted">
                  <Target size={14} className="text-brand-soft" />
                  Target file size
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={targetEnabled}
                  aria-label="Target file size"
                  onClick={() => onTargetEnabledChange(!targetEnabled)}
                  className={cn(
                    "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                    targetEnabled ? "bg-brand" : "bg-line"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all",
                      targetEnabled ? "left-[18px]" : "left-0.5"
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
                    className="h-9 w-24 rounded-[10px] border border-line bg-canvas px-3 text-[13px] font-semibold text-ink focus:border-brand/70 focus:outline-none"
                  />
                  <span className="text-[12px] font-medium text-faint">
                    KB max · quality adapts to fit
                  </span>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <p className="text-[12.5px] font-medium text-faint">
          {format.label} is lossless — quality and target size do not apply.
        </p>
      )}

      {(format.id === "jpg" || format.kind === "pdf") && (
        <label className="flex items-center justify-between gap-4">
          <span className="text-[12.5px] font-semibold text-muted">
            Background for transparency
          </span>
          <span className="flex items-center gap-2">
            <span className="text-[12px] font-medium text-faint">
              {backgroundColor}
            </span>
            <input
              type="color"
              value={backgroundColor}
              onChange={(event) => onBackgroundColorChange(event.target.value)}
              className="h-8 w-10 cursor-pointer rounded-md border border-line bg-transparent p-0"
            />
          </span>
        </label>
      )}
    </div>
  );
}
