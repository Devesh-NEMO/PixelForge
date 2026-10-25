"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Download,
  FileArchive,
  FolderOpen,
  Link as LinkIcon,
  Loader2,
  Plus,
  RotateCcw,
  Scaling,
  Settings,
  Sparkles,
  Target,
  Unlink,
  X,
} from "lucide-react";
import {
  BADGES,
  DEFAULT_FORMAT,
  FORMATS,
  detectNativeFormats,
  getFormat,
  looksLikeHeic,
  type FormatId,
} from "../lib/formats";
import { convertImage, disposeConverter } from "../lib/convert-client";
import {
  formatBytes,
  outputNameFor,
  resolveTargetSize,
  sizeDelta,
  type Dimensions,
} from "../lib/image";
import { buildPdf } from "../lib/pdf";
import { CompareDialog } from "./compare-dialog";

type JobStatus = "ready" | "converting" | "done" | "error";

type PdfResult = {
  url: string;
  size: number;
  name: string;
  pages: number;
};

type Job = {
  id: string;
  name: string;
  source: Blob;
  size: number;
  previewUrl: string;
  width?: number;
  height?: number;
  status: JobStatus;
  output?: Blob;
  outputUrl?: string;
  outputName?: string;
  outWidth?: number;
  outHeight?: number;
  outputQuality?: number;
  outputLossy?: boolean;
  targetMissed?: boolean;
  error?: string;
};

const SIZE_PRESETS = [
  { label: "Instagram", width: 1080, height: 1080 },
  { label: "Story", width: 1080, height: 1920 },
  { label: "OG card", width: 1200, height: 630 },
  { label: "HD", width: 1920, height: 1080 },
] as const;

const BADGE_FORMATS: Record<string, FormatId | undefined> = {
  JPG: "jpg",
  PNG: "png",
  WEBP: "webp",
  AVIF: "avif",
};

let jobSequence = 0;

function nextJobId() {
  jobSequence += 1;
  return `job-${jobSequence}-${Math.random().toString(36).slice(2, 7)}`;
}

function parseDimension(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

async function probeDimensions(
  blob: Blob
): Promise<{ width?: number; height?: number }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(blob);
      const dimensions = { width: bitmap.width, height: bitmap.height };
      bitmap.close();
      return dimensions;
    } catch {
      return {};
    }
  }
  return {};
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function ImageConverter() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [formatId, setFormatId] = useState<FormatId>(DEFAULT_FORMAT);
  const [quality, setQuality] = useState(85);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [resizeWidth, setResizeWidth] = useState("");
  const [resizeHeight, setResizeHeight] = useState("");
  const [keepAspect, setKeepAspect] = useState(true);
  const [targetEnabled, setTargetEnabled] = useState(false);
  const [targetKb, setTargetKb] = useState(200);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [supported, setSupported] = useState<Record<FormatId, boolean> | null>(
    null
  );
  const [compareId, setCompareId] = useState<string | null>(null);
  const [pdfResult, setPdfResult] = useState<PdfResult | null>(null);
  const [shortcutKey, setShortcutKey] = useState("Ctrl");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const urls = useRef(new Set<string>());
  const pdfUrl = useRef<string | null>(null);
  const runId = useRef(0);

  const format = getFormat(formatId);

  const trackUrl = useCallback((url: string) => {
    urls.current.add(url);
    return url;
  }, []);

  const releaseUrl = useCallback((url?: string) => {
    if (url && urls.current.delete(url)) URL.revokeObjectURL(url);
  }, []);

  const clearPdfResult = useCallback(() => {
    if (pdfUrl.current) {
      releaseUrl(pdfUrl.current);
      pdfUrl.current = null;
    }
    setPdfResult(null);
  }, [releaseUrl]);

  useEffect(() => {
    setSupported(detectNativeFormats());
    setShortcutKey(
      /mac|iphone|ipad/i.test(navigator.platform ?? "") ? "\u2318" : "Ctrl"
    );
  }, []);

  useEffect(
    () => () => {
      urls.current.forEach((url) => URL.revokeObjectURL(url));
      urls.current.clear();
      disposeConverter();
    },
    []
  );

  /* Shareable defaults: /?format=webp&q=80&w=1280 */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("format");
    const qualityParam = Number.parseInt(params.get("q") ?? "", 10);
    const widthParam = Number.parseInt(params.get("w") ?? "", 10);
    const heightParam = Number.parseInt(params.get("h") ?? "", 10);

    if (requested && FORMATS.some((item) => item.id === requested)) {
      setFormatId(requested as FormatId);
    }
    if (
      Number.isFinite(qualityParam) &&
      qualityParam >= 40 &&
      qualityParam <= 100
    ) {
      setQuality(qualityParam);
    }
    if (Number.isFinite(widthParam) && widthParam > 0) {
      setResizeWidth(String(widthParam));
    }
    if (Number.isFinite(heightParam) && heightParam > 0) {
      setResizeHeight(String(heightParam));
    }
  }, []);

  const addFiles = useCallback(
    async (incoming: FileList | File[] | null) => {
      const files = Array.from(incoming ?? []).filter(
        (file) => file.type.startsWith("image/") || looksLikeHeic(file)
      );

      if (!files.length) return;

      setPreparing(true);

      try {
        const prepared: Job[] = [];

        for (const file of files) {
          let source: Blob = file;

          if (looksLikeHeic(file)) {
            try {
              const { default: heic2any } = await import("heic2any");
              const decoded = await heic2any({
                blob: file,
                toType: "image/png",
              });
              source = Array.isArray(decoded) ? decoded[0] : decoded;
            } catch {
              // Leave the original; the converter will surface a decode error.
            }
          }

          const previewUrl = trackUrl(URL.createObjectURL(source));
          const dimensions = await probeDimensions(source);

          prepared.push({
            id: nextJobId(),
            name: file.name,
            source,
            size: file.size,
            previewUrl,
            status: "ready",
            ...dimensions,
          });
        }

        clearPdfResult();
        setJobs((current) => [...current, ...prepared]);
      } finally {
        setPreparing(false);
      }
    },
    [trackUrl, clearPdfResult]
  );

  const removeJob = useCallback(
    (id: string) => {
      const job = jobs.find((item) => item.id === id);
      if (!job) return;

      releaseUrl(job.previewUrl);
      releaseUrl(job.outputUrl);
      clearPdfResult();
      setJobs((current) => current.filter((item) => item.id !== id));
    },
    [jobs, releaseUrl, clearPdfResult]
  );

  const clearAll = useCallback(() => {
    runId.current += 1;
    urls.current.forEach((url) => URL.revokeObjectURL(url));
    urls.current.clear();
    setJobs([]);
    setBusy(false);
    setShowAdvanced(false);
    setCompareId(null);
    clearPdfResult();
  }, [clearPdfResult]);

  const handleConvert = useCallback(async () => {
    // Re-convert everything, so switching the format re-runs finished jobs too.
    const pending = jobs.filter((job) => job.status !== "converting");

    if (!pending.length || busy) return;

    const run = (runId.current += 1);
    const target = getFormat(formatId);
    const width = parseDimension(resizeWidth);
    const height = parseDimension(resizeHeight);
    const targetBytes = targetEnabled
      ? Math.max(1024, Math.round(targetKb * 1024))
      : undefined;

    setBusy(true);
    clearPdfResult();

    // PDF is a container: encode every image to JPEG, then assemble one document.
    if (target.kind === "pdf") {
      const pages: { jpeg: Uint8Array; width: number; height: number }[] = [];

      for (const job of pending) {
        if (run !== runId.current) return;

        setJobs((current) =>
          current.map((item) =>
            item.id === job.id
              ? { ...item, status: "converting", error: undefined }
              : item
          )
        );

        try {
          const source: Dimensions | null =
            job.width && job.height
              ? { width: job.width, height: job.height }
              : null;

          const size = source
            ? resolveTargetSize(source, {
                width,
                height,
                keepAspectRatio: keepAspect,
              })
            : { width: width ?? 0, height: height ?? 0 };

          const output = await convertImage(job.source, {
            mime: "image/jpeg",
            quality: quality / 100,
            width: size.width,
            height: size.height,
            background: backgroundColor,
          });

          if (run !== runId.current) return;

          pages.push({
            jpeg: new Uint8Array(await output.blob.arrayBuffer()),
            width: output.width,
            height: output.height,
          });

          setJobs((current) =>
            current.map((item) =>
              item.id === job.id
                ? {
                    ...item,
                    status: "done",
                    outWidth: output.width,
                    outHeight: output.height,
                    output: undefined,
                    outputUrl: undefined,
                    outputName: undefined,
                    outputLossy: false,
                    outputQuality: undefined,
                  }
                : item
            )
          );
        } catch (error) {
          if (run !== runId.current) return;

          setJobs((current) =>
            current.map((item) =>
              item.id === job.id
                ? {
                    ...item,
                    status: "error",
                    error:
                      error instanceof Error
                        ? error.message
                        : "Conversion failed.",
                  }
                : item
            )
          );
        }
      }

      if (run !== runId.current) return;

      if (pages.length) {
        const single = pending.length === 1;
        const name = single
          ? outputNameFor(pending[0].name, target.extension)
          : `pixelforge-${pages.length}-pages.pdf`;

        try {
          const bytes = buildPdf(pages, { title: name });
          const blob = new Blob([bytes as unknown as BlobPart], {
            type: "application/pdf",
          });
          const url = trackUrl(URL.createObjectURL(blob));

          pdfUrl.current = url;
          setPdfResult({ url, size: blob.size, name, pages: pages.length });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Could not build the PDF.";

          setJobs((current) =>
            current.map((item) =>
              item.status === "done"
                ? { ...item, status: "error", error: message }
                : item
            )
          );
        }
      }

      setBusy(false);
      return;
    }

    for (const job of pending) {
      if (run !== runId.current) break;

      setJobs((current) =>
        current.map((item) =>
          item.id === job.id
            ? { ...item, status: "converting", error: undefined }
            : item
        )
      );

      try {
        const source: Dimensions | null =
          job.width && job.height
            ? { width: job.width, height: job.height }
            : null;

        const wantsTarget = Boolean(targetBytes && target.lossy);
        const size = source
          ? resolveTargetSize(source, {
              width,
              height,
              keepAspectRatio: keepAspect,
            })
          : { width: width ?? 0, height: height ?? 0 };

        const output = await convertImage(job.source, {
          mime: target.mime,
          quality: quality / 100,
          width: size.width,
          height: size.height,
          background: backgroundColor,
          targetBytes: targetBytes && target.lossy ? targetBytes : undefined,
        });

        if (run !== runId.current) return;

        releaseUrl(job.outputUrl);
        const outputUrl = trackUrl(URL.createObjectURL(output.blob));

        setJobs((current) =>
          current.map((item) =>
            item.id === job.id
              ? {
                  ...item,
                  status: "done",
                  output: output.blob,
                  outputUrl,
                  outputName: outputNameFor(job.name, target.extension),
                  outWidth: output.width,
                  outHeight: output.height,
                  outputQuality: output.quality,
                  outputLossy: target.lossy,
                  targetMissed: wantsTarget && output.reachedTarget === false,
                }
              : item
          )
        );
      } catch (error) {
        if (run !== runId.current) return;

        setJobs((current) =>
          current.map((item) =>
            item.id === job.id
              ? {
                  ...item,
                  status: "error",
                  error:
                    error instanceof Error
                      ? error.message
                      : "Conversion failed.",
                }
              : item
          )
        );
      }
    }

    if (run === runId.current) setBusy(false);
  }, [
    jobs,
    busy,
    formatId,
    quality,
    backgroundColor,
    resizeWidth,
    resizeHeight,
    keepAspect,
    targetEnabled,
    targetKb,
    trackUrl,
    releaseUrl,
    clearPdfResult,
  ]);

  const downloadAll = useCallback(async () => {
    const finished = jobs.filter(
      (job) => job.status === "done" && job.output && job.outputName
    );

    if (!finished.length) return;

    const { zipSync } = await import("fflate");
    const entries: Record<string, Uint8Array> = {};

    for (const job of finished) {
      entries[job.outputName as string] = new Uint8Array(
        await (job.output as Blob).arrayBuffer()
      );
    }

    const zipped = zipSync(entries, { level: 0 });
    const blob = new Blob([zipped as unknown as BlobPart], {
      type: "application/zip",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pixelforge-images.zip";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }, [jobs]);

  /* Paste an image straight from the clipboard (screenshots, etc.). */
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const files = Array.from(event.clipboardData?.files ?? []);
      if (!files.length) return;
      event.preventDefault();
      void addFiles(files);
    };

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [addFiles]);

  /* Cmd/Ctrl + Enter converts without reaching for the mouse. */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        void handleConvert();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleConvert]);

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

  const availableFormats = supported
    ? FORMATS.filter((item) => supported[item.id])
    : FORMATS;

  const sample = jobs[0];
  const sampleSize = useMemo(() => {
    if (!sample?.width || !sample.height) return null;
    return resolveTargetSize(
      { width: sample.width, height: sample.height },
      {
        width: parseDimension(resizeWidth),
        height: parseDimension(resizeHeight),
        keepAspectRatio: keepAspect,
      }
    );
  }, [sample, resizeWidth, resizeHeight, keepAspect]);

  const totalSize = jobs.reduce((sum, job) => sum + job.size, 0);
  const finished = jobs.filter((job) => job.status === "done");
  const finishing = jobs.some(
    (job) =>
      job.status === "converting" ||
      job.status === "done" ||
      job.status === "error"
  );
  const compareJob = jobs.find((job) => job.id === compareId);
  const resized =
    sampleSize != null &&
    sample != null &&
    (sampleSize.width !== sample.width || sampleSize.height !== sample.height);

  const resetResize = () => {
    setResizeWidth("");
    setResizeHeight("");
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
        <div
          onClick={() => fileInputRef.current?.click()}
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
              fileInputRef.current?.click();
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
                    if (badgeFormat) setFormatId(badgeFormat);
                    fileInputRef.current?.click();
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
                onClick={clearAll}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-4 text-[13px] font-semibold text-muted transition-colors hover:border-line-strong hover:text-ink"
              >
                <RotateCcw size={13} />
                Start over
              </button>
            </div>
          </div>

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
                  onClick={() => removeJob(job.id)}
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
              onClick={() => fileInputRef.current?.click()}
              className="grid min-h-[88px] place-items-center rounded-[14px] border border-dashed border-line text-faint transition-colors hover:border-brand/60 hover:text-ink"
            >
              <span className="flex flex-col items-center gap-1 text-[11.5px] font-semibold">
                <Plus size={16} />
                Add images
              </span>
            </button>
          </div>

          <div className="mt-6">
            <p className="text-[11.5px] font-bold tracking-[0.14em] text-faint uppercase">
              Convert to
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {availableFormats.map((item) => {
                const active = item.id === formatId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.id !== formatId) clearPdfResult();
                      setFormatId(item.id);
                    }}
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
              <div className="rounded-[14px] border border-line bg-surface-2/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-[12.5px] font-semibold text-muted">
                    <Scaling size={14} className="text-brand-soft" />
                    Resize
                  </span>
                  {(resizeWidth || resizeHeight) && (
                    <button
                      type="button"
                      onClick={resetResize}
                      className="text-[11.5px] font-semibold text-faint transition-colors hover:text-ink"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="mt-3 flex items-end gap-2">
                  <label className="min-w-0 flex-1">
                    <span className="mb-1 block text-[10.5px] font-semibold tracking-[0.1em] text-faint uppercase">
                      Width
                    </span>
                    <input
                      inputMode="numeric"
                      value={resizeWidth}
                      placeholder={
                        sample?.width ? String(sample.width) : "auto"
                      }
                      onChange={(event) =>
                        setResizeWidth(
                          event.target.value.replace(/[^0-9]/g, "")
                        )
                      }
                      className="h-9 w-full rounded-[10px] border border-line bg-canvas px-3 text-[13px] font-semibold text-ink placeholder:text-faint/70 focus:border-brand/70 focus:outline-none"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setKeepAspect((value) => !value)}
                    aria-pressed={keepAspect}
                    title={
                      keepAspect
                        ? "Aspect ratio locked"
                        : "Aspect ratio unlocked"
                    }
                    className={cn(
                      "mb-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border transition-colors",
                      keepAspect
                        ? "border-brand/50 bg-brand/15 text-brand-soft"
                        : "border-line text-faint hover:text-ink"
                    )}
                  >
                    {keepAspect ? <LinkIcon size={14} /> : <Unlink size={14} />}
                  </button>

                  <label className="min-w-0 flex-1">
                    <span className="mb-1 block text-[10.5px] font-semibold tracking-[0.1em] text-faint uppercase">
                      Height
                    </span>
                    <input
                      inputMode="numeric"
                      value={resizeHeight}
                      placeholder={
                        sample?.height ? String(sample.height) : "auto"
                      }
                      onChange={(event) =>
                        setResizeHeight(
                          event.target.value.replace(/[^0-9]/g, "")
                        )
                      }
                      className="h-9 w-full rounded-[10px] border border-line bg-canvas px-3 text-[13px] font-semibold text-ink placeholder:text-faint/70 focus:border-brand/70 focus:outline-none"
                    />
                  </label>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {SIZE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setResizeWidth(String(preset.width));
                        setResizeHeight(String(preset.height));
                      }}
                      className="rounded-full border border-line px-2.5 py-1 text-[11px] font-semibold text-faint transition-colors hover:border-brand/60 hover:text-ink"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <p className="mt-2.5 text-[11.5px] font-medium text-faint">
                  {sample && sampleSize
                    ? resized
                      ? `${sample.width}\u00d7${sample.height} \u2192 ${sampleSize.width}\u00d7${sampleSize.height}`
                      : `Original size \u00b7 ${sample.width}\u00d7${sample.height}`
                    : "Original size"}
                </p>
              </div>

              <div className="space-y-4 rounded-[14px] border border-line bg-surface-2/30 p-4">
                {format.lossy ? (
                  <>
                    <label className="block">
                      <span className="flex items-center justify-between text-[12.5px] font-semibold text-muted">
                        Quality
                        <span className="text-ink">{quality}%</span>
                      </span>
                      <input
                        type="range"
                        min={40}
                        max={100}
                        value={quality}
                        onChange={(event) =>
                          setQuality(Number(event.target.value))
                        }
                        className="mt-2 w-full accent-brand"
                      />
                    </label>

                    {format.kind !== "pdf" && (
                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-2 text-[12.5px] font-semibold text-muted">
                            <Target size={14} className="text-brand-soft" />
                            Target file size
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={targetEnabled}
                            aria-label="Target file size"
                            onClick={() => setTargetEnabled((value) => !value)}
                            className={cn(
                              "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                              targetEnabled ? "bg-brand" : "bg-line"
                            )}
                          >
                            <span
                              className={cn(
                                "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all",
                                targetEnabled ? "left-[18px]" : "left-0.5"
                              )}
                            />
                          </button>
                        </div>

                        {targetEnabled && (
                          <div className="mt-2 flex items-center gap-2">
                            <input
                              inputMode="numeric"
                              value={targetKb}
                              onChange={(event) =>
                                setTargetKb(
                                  Math.max(
                                    1,
                                    Number(
                                      event.target.value.replace(/[^0-9]/g, "")
                                    ) || 0
                                  )
                                )
                              }
                              className="h-9 w-24 rounded-[10px] border border-line bg-canvas px-3 text-[13px] font-semibold text-ink focus:border-brand/70 focus:outline-none"
                            />
                            <span className="text-[12px] font-medium text-faint">
                              KB max · quality adapts to fit
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-[12.5px] font-medium text-faint">
                    {format.label} is lossless — quality and target size do not
                    apply.
                  </p>
                )}

                {(format.id === "jpg" || format.kind === "pdf") && (
                  <label className="flex items-center justify-between gap-4">
                    <span className="text-[12.5px] font-semibold text-muted">
                      Background for transparency
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-[12px] font-medium text-faint">
                        {backgroundColor}
                      </span>
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(event) =>
                          setBackgroundColor(event.target.value)
                        }
                        className="h-8 w-10 cursor-pointer rounded-md border border-line bg-transparent p-0"
                      />
                    </span>
                  </label>
                )}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleConvert}
            disabled={busy || preparing}
            className="mt-5 inline-flex h-[54px] w-full items-center justify-center gap-2.5 rounded-[14px] bg-[#5550fe] text-[15.5px] font-semibold text-white shadow-[0_18px_38px_-16px_rgba(85,80,254,0.95)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busy ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Sparkles size={17} />
            )}
            {busy
              ? "Converting..."
              : `Convert ${jobs.length === 1 ? "image" : `${jobs.length} images`} to ${format.label}`}
          </button>

          {finishing && (
            <div className="mt-6 border-t border-line pt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[11.5px] font-bold tracking-[0.14em] text-faint uppercase">
                  Results
                </p>
                {!pdfResult && finished.length > 1 && (
                  <button
                    type="button"
                    onClick={() => void downloadAll()}
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
                        {pdfResult.pages}{" "}
                        {pdfResult.pages === 1 ? "page" : "pages"}
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
                                  onClick={() => setCompareId(job.id)}
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

function CloudGlyph() {
  return (
    <svg
      viewBox="0.25 2.15 22.5 19.6"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden
      className="h-[52px] w-[72px] drop-shadow-[0_0_22px_rgba(124,99,255,0.4)] sm:h-[67px] sm:w-[89px]"
      stroke="url(#cloud-upload-gradient)"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <linearGradient
          id="cloud-upload-gradient"
          x1="12"
          y1="3"
          x2="12"
          y2="21"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#b55cf7" />
          <stop offset="0.55" stopColor="#8b5bfc" />
          <stop offset="1" stopColor="#5a63fe" />
        </linearGradient>
      </defs>
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M12 21v-8" />
      <path d="m8.5 16.5 3.5-3.5 3.5 3.5" />
    </svg>
  );
}
