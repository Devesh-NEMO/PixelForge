import { Download, FileArchive, Loader2 } from "lucide-react";
import { formatBytes, sizeDelta } from "../../lib/image";
import type { Job, PdfResult } from "../../lib/job";

type ResultsListProps = {
  jobs: Job[];
  pdfResult: PdfResult | null;
  onCompare: (id: string) => void;
  onDownloadAll: () => void;
};

export function ResultsList({
  jobs,
  pdfResult,
  onCompare,
  onDownloadAll,
}: ResultsListProps) {
  const finished = jobs.filter((job) => job.status === "done");

  return (
    <div className="mt-6 border-t-2 border-ink pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[9.5px] tracking-[0.16em] uppercase">Results</p>
        {!pdfResult && finished.length > 1 && (
          <button
            type="button"
            onClick={onDownloadAll}
            className="press inline-flex items-center gap-1.5 border-[1.5px] border-ink bg-paper px-3 py-1.5 text-[9px] tracking-[0.1em] uppercase hover:-translate-y-[1px] hover:lime-fill hover:shadow-[2px_2px_0_var(--shadow-color)]"
          >
            <FileArchive size={12} strokeWidth={2.4} />
            Download all ({finished.length})
          </button>
        )}
      </div>

      <div className="mt-3 space-y-2">
        {pdfResult && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-[1.5px] border-ink bg-paper px-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-[11.5px] font-bold">
                {pdfResult.name}
              </p>
              <p className="mt-0.5 text-[9px] tracking-[0.06em] text-muted uppercase">
                {pdfResult.pages} {pdfResult.pages === 1 ? "page" : "pages"}
                {" / "}
                {formatBytes(pdfResult.size)}
                {" / flattened to JPEG"}
              </p>
            </div>
            <a
              href={pdfResult.url}
              download={pdfResult.name}
              className="press inline-flex shrink-0 items-center gap-1.5 border-[1.5px] border-ink lime-fill px-3 py-1.5 text-[9px] tracking-[0.1em] uppercase shadow-[2px_2px_0_var(--shadow-color)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_var(--shadow-color)]"
            >
              <Download size={12} strokeWidth={2.6} />
              Download
            </a>
          </div>
        )}

        {!pdfResult &&
          jobs
            .filter((job) => job.status !== "ready")
            .map((job) => {
              const delta = job.output
                ? sizeDelta(job.size, job.output.size)
                : null;

              return (
                <div
                  key={job.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-[1.5px] border-ink bg-paper px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[11.5px] font-bold">
                      {job.outputName ?? job.name}
                    </p>
                    <p className="mt-0.5 text-[9px] tracking-[0.06em] text-muted uppercase">
                      {job.status === "error" ? (
                        <span className="text-danger">{job.error}</span>
                      ) : job.status === "converting" ? (
                        "Converting..."
                      ) : job.output ? (
                        <>
                          {job.outWidth}
                          {"\u00d7"}
                          {job.outHeight}
                          {" / "}
                          {formatBytes(job.output.size)}
                          {" / "}
                          {delta?.larger
                            ? `${delta.percent}% larger`
                            : delta?.same
                              ? "same size"
                              : `${delta?.percent}% smaller`}
                          {job.outputLossy &&
                          job.outputQuality != null &&
                          job.outputQuality < 0.999
                            ? ` / q${Math.round(job.outputQuality * 100)}`
                            : ""}
                          {job.targetMissed && (
                            <span className="text-danger">
                              {" / target not reached"}
                            </span>
                          )}
                        </>
                      ) : (
                        "Waiting..."
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {job.status === "done" &&
                      job.outputUrl &&
                      job.previewUrl && (
                        <button
                          type="button"
                          onClick={() => onCompare(job.id)}
                          className="press inline-flex shrink-0 items-center gap-1.5 border-[1.5px] border-ink bg-paper-2 px-2.5 py-1.5 text-[9px] tracking-[0.1em] uppercase hover:bg-paper hover:shadow-[2px_2px_0_var(--shadow-color)]"
                        >
                          Compare
                        </button>
                      )}

                    {job.status === "done" && job.outputUrl ? (
                      <a
                        href={job.outputUrl}
                        download={job.outputName}
                        className="press inline-flex shrink-0 items-center gap-1.5 border-[1.5px] border-ink lime-fill px-3 py-1.5 text-[9px] tracking-[0.1em] uppercase shadow-[2px_2px_0_var(--shadow-color)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_var(--shadow-color)]"
                      >
                        <Download size={12} strokeWidth={2.6} />
                        Download
                      </a>
                    ) : job.status === "converting" ? (
                      <Loader2 size={14} className="shrink-0 animate-spin" />
                    ) : null}
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
