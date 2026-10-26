import { Plus, X } from "lucide-react";
import { formatBytes } from "../../lib/image";
import type { Job } from "../../lib/job";

type PreviewGridProps = {
  jobs: Job[];
  onRemove: (id: string) => void;
  onAdd: () => void;
};

export function PreviewGrid({ jobs, onRemove, onAdd }: PreviewGridProps) {
  return (
    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {jobs.map((job) => (
        <figure
          key={job.id}
          className="group relative overflow-hidden rounded-[14px] border border-line bg-[#070d1c]"
        >
          {/* Blob URLs are local only, so next/image optimisation is not used. */}
          <img
            src={job.previewUrl}
            alt={job.name}
            className="h-[110px] w-full object-cover sm:h-[124px]"
          />
          <button
            type="button"
            onClick={() => onRemove(job.id)}
            aria-label={`Remove ${job.name}`}
            className="absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white/80 opacity-0 transition group-hover:opacity-100 hover:bg-black/85 hover:text-white focus-visible:opacity-100"
          >
            <X size={13} />
          </button>
          <figcaption className="flex items-center justify-between gap-2 border-t border-line/70 bg-surface-2/60 px-2.5 py-1.5">
            <span className="truncate text-[11.5px] font-medium text-muted">
              {job.name}
            </span>
            <span className="shrink-0 text-[10.5px] font-semibold text-faint">
              {job.width
                ? `${job.width}\u00d7${job.height}`
                : formatBytes(job.size)}
            </span>
          </figcaption>
        </figure>
      ))}

      <button
        type="button"
        onClick={onAdd}
        className="grid min-h-[88px] place-items-center rounded-[14px] border border-dashed border-line text-faint transition-colors hover:border-brand/60 hover:text-ink"
      >
        <span className="flex flex-col items-center gap-1 text-[11.5px] font-semibold">
          <Plus size={16} />
          Add images
        </span>
      </button>
    </div>
  );
}
