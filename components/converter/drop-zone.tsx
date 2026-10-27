import { ArrowUpRight } from "lucide-react";
import { cn } from "../../lib/cn";
import { BADGES, type FormatId } from "../../lib/formats";

const BADGE_FORMATS: Record<string, FormatId | undefined> = {
  JPG: "jpg",
  PNG: "png",
  WEBP: "webp",
  AVIF: "avif",
};

type DropZoneProps = {
  dragging?: boolean;
  onBrowse: () => void;
  onPick: (format: FormatId | undefined) => void;
};

export function DropZone({
  dragging = false,
  onBrowse,
  onPick,
}: DropZoneProps) {
  return (
    <div
      onClick={onBrowse}
      className={cn(
        "relative cursor-pointer border-2 border-ink p-5 shadow-[8px_8px_0_var(--shadow-color)] sm:p-9 sm:shadow-[10px_10px_0_var(--shadow-color)]",
        dragging ? "bg-lime/25" : "bg-paper-2"
      )}
    >
      <span className="absolute -top-[11px] left-4 border-[1.5px] border-ink lime-fill px-2 py-[2px] text-[9px] tracking-[0.14em] uppercase sm:left-5">
        Drop zone — 01
      </span>

      <div className="flex flex-col gap-6 pt-2 sm:flex-row sm:items-end sm:justify-between sm:gap-8 sm:pt-0">
        <div>
          <h2 className="font-display text-[26px] leading-none tracking-[-0.02em] uppercase sm:text-[38px]">
            Drop image
          </h2>
          <p className="mt-2.5 text-[11px] text-muted sm:text-[12px]">
            {"// or browse from your device"}
          </p>
        </div>

        <div className="sm:text-right">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onBrowse();
            }}
            className="press inline-flex items-center gap-2 border-2 border-ink lime-fill px-4 py-3 font-display text-[11px] tracking-[0.05em] uppercase shadow-[4px_4px_0_var(--shadow-color)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0_var(--shadow-color)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none sm:px-5 sm:py-3.5 sm:text-[12.5px]"
          >
            Choose image
            <ArrowUpRight size={15} strokeWidth={2.6} />
          </button>

          <div className="mt-4 flex flex-wrap gap-1.5 sm:justify-end">
            {BADGES.map((badge) => {
              const badgeFormat = BADGE_FORMATS[badge];

              return (
                <button
                  key={badge}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onPick(badgeFormat);
                  }}
                  aria-label={
                    badgeFormat
                      ? `Convert to ${badge}`
                      : `${badge} output is not supported by browsers`
                  }
                  className="press border-[1.5px] border-ink bg-paper px-2 py-1 text-[9px] tracking-[0.1em] uppercase hover:-translate-y-[1px] hover:lime-fill hover:shadow-[2px_2px_0_var(--shadow-color)] sm:text-[10px]"
                >
                  {badge}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
