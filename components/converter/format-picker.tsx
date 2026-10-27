import { Check } from "lucide-react";
import { cn } from "../../lib/cn";
import type { FormatId, OutputFormat } from "../../lib/formats";

type FormatPickerProps = {
  formats: readonly OutputFormat[];
  value: FormatId;
  onSelect: (id: FormatId) => void;
};

export function FormatPicker({ formats, value, onSelect }: FormatPickerProps) {
  return (
    <div className="mt-6">
      <p className="text-[9px] tracking-[0.16em] text-muted uppercase sm:text-[9.5px]">
        Convert to
      </p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {formats.map((item) => {
          const active = item.id === value;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              aria-pressed={active}
              className={cn(
                "press inline-flex items-center gap-1.5 border-[1.5px] border-ink px-2.5 py-2 text-[10px] tracking-[0.1em] uppercase",
                active
                  ? "lime-fill shadow-[3px_3px_0_var(--shadow-color)]"
                  : "bg-paper-2 hover:-translate-y-[1px] hover:bg-paper hover:shadow-[2px_2px_0_var(--shadow-color)]"
              )}
            >
              {active && <Check size={12} strokeWidth={3} />}
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
