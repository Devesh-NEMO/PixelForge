import { FolderOpen } from "lucide-react";
import { BADGES, type FormatId } from "../../lib/formats";
import { CloudGlyph } from "./cloud-glyph";

const BADGE_FORMATS: Record<string, FormatId | undefined> = {
  JPG: "jpg",
  PNG: "png",
  WEBP: "webp",
  AVIF: "avif",
};

type DropZoneProps = {
  onBrowse: () => void;
  onPick: (format: FormatId | undefined) => void;
};

export function DropZone({ onBrowse, onPick }: DropZoneProps) {
  return (
    <div
      onClick={onBrowse}
      className="flex cursor-pointer flex-col items-center px-5 pt-[40px] pb-[34px] text-center sm:px-6 sm:pt-[48px] sm:pb-[39px]"
    >
      <CloudGlyph />

      <h2 className="mt-[20px] text-[24px] leading-none font-bold tracking-[-0.02em] text-ink sm:mt-[21px] sm:text-[29px]">
        Drop your image here
      </h2>
      <p className="mt-[10px] text-[16px] leading-none font-medium text-muted sm:mt-[18px] sm:text-[18px]">
        or browse files from your device
      </p>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onBrowse();
        }}
        className="mt-[24px] inline-flex h-[54px] items-center gap-3 rounded-[15px] bg-[#5550fe] px-[30px] text-[17px] font-semibold text-white shadow-[0_20px_45px_-16px_rgba(85,80,254,0.95),inset_0_1px_0_rgba(255,255,255,0.22)] transition hover:brightness-110 active:scale-[0.99] sm:mt-[34px] sm:h-[66px] sm:rounded-[18px] sm:px-[42px] sm:text-[20px]"
      >
        <FolderOpen size={20} strokeWidth={2} />
        Choose image
      </button>

      <div className="mt-[18px] flex flex-wrap items-center justify-center gap-[18px] sm:mt-[34px] sm:gap-[30px]">
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
              className="inline-flex h-[30px] items-center rounded-full border border-line bg-white/[0.02] px-[14px] text-[13px] font-semibold text-[#a8c6ee] transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/70 hover:bg-brand/15 hover:text-white hover:shadow-[0_8px_22px_-12px_rgba(85,80,254,0.9)] sm:h-9 sm:text-[15px]"
            >
              {badge}
            </button>
          );
        })}
      </div>
    </div>
  );
}
