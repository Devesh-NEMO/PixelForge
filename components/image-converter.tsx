"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Plus, RotateCcw, Settings, Sparkles } from "lucide-react";
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

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "card-wash relative w-full overflow-hidden rounded-[22px] transition-colors duration-200",
        jobs.length > 0
          ? "border border-line shadow-[0_30px_90px_-50px_rgba(0,0,0,0.9)]"
          : "border-2 border-dashed",
        dragging ? "border-brand" : null,
        !dragging && jobs.length === 0 ? "border-[#5d5fee]" : null
      )}
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
          onBrowse={() => fileInputRef.current?.click()}
          onPick={(format) => {
            if (format) conversion.setFormatId(format);
            fileInputRef.current?.click();
          }}
        />
      ) : (
        <div className="px-5 py-6 text-left sm:px-8 sm:py-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[19px] font-bold tracking-[-0.02em] text-ink">
                {jobs.length} {jobs.length === 1 ? "image" : "images"}
              </h2>
              <p className="mt-1 text-[13px] font-medium text-muted">
                {preparing
                  ? "Preparing files..."
                  : `${formatBytes(totalSize)} total \u00b7 nothing leaves this device`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-4 text-[13px] font-semibold text-muted transition-colors hover:border-brand/60 hover:text-ink"
              >
                <Plus size={13} />
                Add
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-4 text-[13px] font-semibold text-muted transition-colors hover:border-line-strong hover:text-ink"
              >
                <RotateCcw size={13} />
                Start over
              </button>
            </div>
          </div>

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
            className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold text-muted transition-colors hover:text-ink"
          >
            <Settings size={14} className="text-brand-soft" />
            Advanced settings
            <span className="text-faint">{showAdvanced ? "\u2013" : "+"}</span>
          </button>

          {showAdvanced && (
            <div className="mt-3 space-y-3">
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
            className="mt-5 inline-flex h-[54px] w-full items-center justify-center gap-2.5 rounded-[14px] bg-[#5550fe] text-[15.5px] font-semibold text-white shadow-[0_18px_38px_-16px_rgba(85,80,254,0.95)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {conversion.busy ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Sparkles size={17} />
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

          <p className="mt-5 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-faint">
            <Sparkles size={11} className="text-brand-soft" />
            Tip: press
            <kbd className="rounded border border-line px-1 py-0.5 text-[10px] text-muted">
              {shortcutKey}
            </kbd>
            <kbd className="rounded border border-line px-1 py-0.5 text-[10px] text-muted">
              Enter
            </kbd>
            to convert, or paste an image from your clipboard.
          </p>
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
