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
      <p className="text-[11.5px] font-bold tracking-[0.14em] text-faint uppercase">
        Convert to
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {formats.map((item) => {
          const active = item.id === value;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              aria-pressed={active}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-full border px-[22px] text-[14px] font-semibold transition-all",
                active
                  ? "border-brand bg-brand text-white shadow-[0_10px_26px_-12px_rgba(85,80,254,0.9)] hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_14px_30px_-12px_rgba(85,80,254,0.95)]"
                  : "border-line bg-white/[0.02] text-muted hover:-translate-y-0.5 hover:border-brand/70 hover:bg-brand/12 hover:text-white hover:shadow-[0_10px_24px_-14px_rgba(85,80,254,0.85)]"
              )}
            >
              {active && <Check size={14} strokeWidth={2.8} />}
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
