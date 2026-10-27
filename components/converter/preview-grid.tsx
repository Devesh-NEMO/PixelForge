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
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {jobs.map((job) => (
        <figure
          key={job.id}
          className="group relative overflow-hidden border-[1.5px] border-ink bg-paper"
        >
          {/* Blob URLs are local only, so next/image optimisation is not used. */}
          <img
            src={job.previewUrl}
            alt={job.name}
            className="h-[96px] w-full border-b-[1.5px] border-ink object-cover sm:h-[118px]"
          />
          <button
            type="button"
            onClick={() => onRemove(job.id)}
            aria-label={`Remove ${job.name}`}
            className="absolute top-1.5 right-1.5 grid h-6 w-6 place-items-center border-[1.5px] border-ink bg-paper-2 opacity-0 transition group-hover:opacity-100 hover:lime-fill focus-visible:opacity-100"
          >
            <X size={13} strokeWidth={2.6} />
          </button>
          <figcaption className="flex items-center justify-between gap-2 px-2 py-1.5">
            <span className="truncate text-[10px] text-ink">{job.name}</span>
            <span className="shrink-0 text-[9px] tracking-[0.06em] text-muted uppercase">
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
        className="press grid min-h-[80px] place-items-center border-[1.5px] border-dashed border-ink/50 text-muted hover:border-solid hover:border-ink hover:lime-fill hover:shadow-[3px_3px_0_var(--shadow-color)]"
      >
        <span className="flex flex-col items-center gap-1.5 text-[9.5px] tracking-[0.1em] uppercase">
          <Plus size={16} strokeWidth={2.6} />
          Add images
        </span>
      </button>
    </div>
  );
}
