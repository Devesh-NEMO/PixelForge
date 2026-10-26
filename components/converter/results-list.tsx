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
    <div className="mt-6 border-t border-line pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11.5px] font-bold tracking-[0.14em] text-faint uppercase">
          Results
        </p>
        {!pdfResult && finished.length > 1 && (
          <button
            type="button"
            onClick={onDownloadAll}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-4 text-[12.5px] font-semibold text-muted transition-colors hover:border-brand/60 hover:text-ink"
          >
            <FileArchive size={13} />
            Download all ({finished.length})
          </button>
        )}
      </div>

      <div className="mt-3 space-y-2.5">
        {pdfResult && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-line bg-surface-2/40 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-semibold text-ink">
                {pdfResult.name}
              </p>
              <p className="mt-0.5 text-[12px] font-medium text-faint">
                {pdfResult.pages} {pdfResult.pages === 1 ? "page" : "pages"}
                {" \u00b7 "}
                {formatBytes(pdfResult.size)}
                {" \u00b7 flattened to JPEG"}
              </p>
            </div>
            <a
              href={pdfResult.url}
              download={pdfResult.name}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 text-[12.5px] font-semibold text-white transition hover:bg-brand-hover"
            >
              <Download size={13} />
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
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-line bg-surface-2/40 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-semibold text-ink">
                      {job.outputName ?? job.name}
                    </p>
                    <p className="mt-0.5 text-[12px] font-medium text-faint">
                      {job.status === "error" ? (
                        <span className="text-danger">{job.error}</span>
                      ) : job.status === "converting" ? (
                        "Converting..."
                      ) : job.output ? (
                        <>
                          {job.outWidth}
                          {"\u00d7"}
                          {job.outHeight}
                          {" \u00b7 "}
                          {formatBytes(job.output.size)}
                          {" \u00b7 "}
                          {delta?.larger
                            ? `${delta.percent}% larger`
                            : delta?.same
                              ? "same size"
                              : `${delta?.percent}% smaller`}
                          {job.outputLossy &&
                          job.outputQuality != null &&
                          job.outputQuality < 0.999
                            ? ` \u00b7 q${Math.round(job.outputQuality * 100)}`
                            : ""}
                          {job.targetMissed && (
                            <span className="text-[#f0b45f]">
                              {" \u00b7 target not reached"}
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
                          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-line px-3.5 text-[12.5px] font-semibold text-muted transition-colors hover:border-line-strong hover:text-ink"
                        >
                          Compare
                        </button>
                      )}

                    {job.status === "done" && job.outputUrl ? (
                      <a
                        href={job.outputUrl}
                        download={job.outputName}
                        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 text-[12.5px] font-semibold text-white transition hover:bg-brand-hover"
                      >
                        <Download size={13} />
                        Download
                      </a>
                    ) : job.status === "converting" ? (
                      <Loader2
                        size={16}
                        className="shrink-0 animate-spin text-brand-soft"
                      />
                    ) : null}
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
