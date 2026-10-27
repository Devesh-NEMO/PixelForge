"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Plus, RotateCcw } from "lucide-react";
import { useConversion } from "../hooks/use-conversion";
import { useImageJobs } from "../hooks/use-image-jobs";
import { cn } from "../lib/cn";
import { formatBytes } from "../lib/image";
import { CompareDialog } from "./compare-dialog";
import { DropZone } from "./converter/drop-zone";
import { FormatPicker } from "./converter/format-picker";
import { OutputSettings } from "./converter/output-settings";
import { PreviewGrid } from "./converter/preview-grid";
import { ResizePanel } from "./converter/resize-panel";
import { ResultsList } from "./converter/results-list";

export function ImageConverter() {
  const jobsApi = useImageJobs();
  const conversion = useConversion(jobsApi);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [compareId, setCompareId] = useState<string | null>(null);
  const [shortcutKey, setShortcutKey] = useState("Ctrl");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setShortcutKey(
      /mac|iphone|ipad/i.test(navigator.platform ?? "") ? "\u2318" : "Ctrl"
    );
  }, []);

  const { jobs, preparing, removeJob, clearAll, addFiles, pdfResult } = jobsApi;
  const totalSize = jobs.reduce((sum, job) => sum + job.size, 0);
  const compareJob = jobs.find((job) => job.id === compareId);
  const finishing = jobs.some(
    (job) =>
      job.status === "converting" ||
      job.status === "done" ||
      job.status === "error"
  );

  /** "Start over" also aborts anything mid-flight and collapses the panel. */
  const resetAll = () => {
    conversion.cancel();
    clearAll();
    setShowAdvanced(false);
    setCompareId(null);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null))
      return;
    setDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void addFiles(event.dataTransfer.files);
  };

  const ghostButton =
    "press inline-flex h-8 items-center gap-1.5 border-[1.5px] border-ink bg-paper px-2.5 text-[9px] tracking-[0.1em] uppercase hover:lime-fill hover:shadow-[2px_2px_0_var(--shadow-color)]";

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        className="hidden"
        onChange={(event) => {
          void addFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {jobs.length === 0 ? (
        <DropZone
          dragging={dragging}
          onBrowse={() => fileInputRef.current?.click()}
          onPick={(format) => {
            if (format) conversion.setFormatId(format);
            fileInputRef.current?.click();
          }}
        />
      ) : (
        <div
          className={cn(
            "border-2 border-ink shadow-[8px_8px_0_var(--shadow-color)] sm:shadow-[10px_10px_0_var(--shadow-color)]",
            dragging ? "bg-lime/20" : "bg-paper-2"
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink px-4 py-3.5 sm:px-6">
            <div>
              <h2 className="font-display text-[17px] tracking-[-0.01em] uppercase sm:text-[20px]">
                {jobs.length} {jobs.length === 1 ? "image" : "images"}
              </h2>
              <p className="mt-1 text-[9px] tracking-[0.1em] text-muted uppercase sm:text-[9.5px]">
                {preparing
                  ? "Preparing files..."
                  : `${formatBytes(totalSize)} total / nothing leaves this device`}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={ghostButton}
              >
                <Plus size={12} strokeWidth={3} />
                Add
              </button>
              <button type="button" onClick={resetAll} className={ghostButton}>
                <RotateCcw size={12} strokeWidth={2.6} />
                Reset
              </button>
            </div>
          </div>

          <div className="px-4 py-4 sm:px-6 sm:py-5">
            <PreviewGrid
              jobs={jobs}
              onRemove={removeJob}
              onAdd={() => fileInputRef.current?.click()}
            />

            <FormatPicker
              formats={conversion.availableFormats}
              value={conversion.formatId}
              onSelect={(id) => {
                if (id !== conversion.formatId) jobsApi.clearPdfResult();
                conversion.setFormatId(id);
              }}
            />

            <button
              type="button"
              onClick={() => setShowAdvanced((value) => !value)}
              aria-expanded={showAdvanced}
              className="mt-5 inline-flex items-center gap-2 text-[9.5px] tracking-[0.12em] uppercase underline-offset-4 hover:underline"
            >
              <span className="grid h-4 w-4 place-items-center border-[1.5px] border-ink bg-paper text-[10px] leading-none">
                {showAdvanced ? "\u2013" : "+"}
              </span>
              Advanced settings
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-2.5">
                <ResizePanel
                  width={conversion.resizeWidth}
                  height={conversion.resizeHeight}
                  keepAspect={conversion.keepAspect}
                  sample={conversion.sample}
                  target={conversion.sampleSize}
                  onChangeWidth={conversion.setResizeWidth}
                  onChangeHeight={conversion.setResizeHeight}
                  onToggleAspect={() =>
                    conversion.setKeepAspect((value) => !value)
                  }
                  onReset={() => {
                    conversion.setResizeWidth("");
                    conversion.setResizeHeight("");
                  }}
                />

                <OutputSettings
                  format={conversion.format}
                  quality={conversion.quality}
                  onQualityChange={conversion.setQuality}
                  targetEnabled={conversion.targetEnabled}
                  onTargetEnabledChange={conversion.setTargetEnabled}
                  targetKb={conversion.targetKb}
                  onTargetKbChange={conversion.setTargetKb}
                  backgroundColor={conversion.backgroundColor}
                  onBackgroundColorChange={conversion.setBackgroundColor}
                />
              </div>
            )}

            <button
              type="button"
              onClick={conversion.handleConvert}
              disabled={conversion.busy || preparing}
              className="press mt-5 flex w-full items-center justify-center gap-2.5 border-2 border-ink lime-fill px-4 py-3.5 font-display text-[11px] tracking-[0.05em] uppercase shadow-[4px_4px_0_var(--shadow-color)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0_var(--shadow-color)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 sm:py-4 sm:text-[12.5px]"
            >
              {conversion.busy && (
                <Loader2 size={15} strokeWidth={2.6} className="animate-spin" />
              )}
              {conversion.busy
                ? "Converting..."
                : `Convert ${jobs.length === 1 ? "image" : `${jobs.length} images`} to ${conversion.format.label}`}
            </button>

            {finishing && (
              <ResultsList
                jobs={jobs}
                pdfResult={pdfResult}
                onCompare={setCompareId}
                onDownloadAll={() => void conversion.downloadAll()}
              />
            )}

            <p className="mt-5 flex flex-wrap items-center gap-1.5 text-[9px] tracking-[0.1em] text-muted uppercase">
              Tip: press
              <kbd className="border-[1.5px] border-ink bg-paper px-1 py-0.5 text-[9px] text-ink">
                {shortcutKey}
              </kbd>
              <kbd className="border-[1.5px] border-ink bg-paper px-1 py-0.5 text-[9px] text-ink">
                Enter
              </kbd>
              to convert, or paste an image
            </p>
          </div>
        </div>
      )}

      {compareJob?.outputUrl && (
        <CompareDialog
          name={compareJob.name}
          original={{
            url: compareJob.previewUrl,
            width: compareJob.width,
            height: compareJob.height,
            size: compareJob.size,
          }}
          converted={{
            url: compareJob.outputUrl,
            width: compareJob.outWidth,
            height: compareJob.outHeight,
            size: compareJob.output?.size ?? 0,
          }}
          onClose={() => setCompareId(null)}
        />
      )}
    </div>
  );
}
