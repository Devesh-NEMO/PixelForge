"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Download,
  FolderOpen,
  Loader2,
  RotateCcw,
  Settings,
  Sparkles,
} from "lucide-react";

type FormatId = "jpg" | "png" | "webp" | "avif";

type Format = {
  id: FormatId;
  mime: `image/${string}`;
  label: string;
  lossy: boolean;
};

const FORMATS: readonly Format[] = [
  { id: "jpg", mime: "image/jpeg", label: "JPG", lossy: true },
  { id: "png", mime: "image/png", label: "PNG", lossy: false },
  { id: "webp", mime: "image/webp", label: "WEBP", lossy: true },
  { id: "avif", mime: "image/avif", label: "AVIF", lossy: true },
];

/** Decorative format badges shown in the empty state (matches the design). */
const BADGES = ["JPG", "PNG", "WEBP", "AVIF", "GIF", "TIFF"] as const;

type QueueItem = {
  id: string;
  file: File;
  status: "pending" | "converting" | "done" | "error";
  output?: Blob;
  url?: string;
  outputName?: string;
  ratio?: number;
  error?: string;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function outputNameFor(name: string, format: Format) {
  const base = name.replace(/\.[^.]+$/, "") || "image";
  return `${base}.${format.id}`;
}

/**
 * Draw the file into a canvas and re-encode it.
 * Note: `new window.Image()` is deliberate - the bare `Image` identifier in a
 * Next.js page resolves to the next/image React component, not the DOM constructor.
 */
async function convertImage(
  file: File,
  format: Format,
  quality: number,
  background: string
): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new window.Image();
    image.decoding = "async";
    image.src = objectUrl;
    await image.decode();

    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    if (!width || !height) {
      throw new Error("This image has no readable dimensions.");
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Your browser blocked canvas rendering.");
    }

    if (format.mime === "image/jpeg") {
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);
    }

    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, format.mime, quality);
    });

    if (!blob) {
      throw new Error("The browser could not encode this image.");
    }

    if (blob.type !== format.mime) {
      throw new Error(
        `${format.label} encoding is not supported by this browser.`
      );
    }

    return blob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Ask the canvas which encoders this browser actually supports. */
function detectSupportedFormats(): Record<FormatId, boolean> {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;

  const result = {} as Record<FormatId, boolean>;

  for (const format of FORMATS) {
    try {
      result[format.id] = canvas
        .toDataURL(format.mime)
        .startsWith(`data:${format.mime}`);
    } catch {
      result[format.id] = false;
    }
  }

  return result;
}

export function ImageConverter() {
  const [files, setFiles] = useState<File[]>([]);
  const [formatId, setFormatId] = useState<FormatId>("png");
  const [quality, setQuality] = useState(85);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [supported, setSupported] = useState<Record<FormatId, boolean> | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const outputUrls = useRef<string[]>([]);
  const runId = useRef(0);

  const format = FORMATS.find((item) => item.id === formatId) ?? FORMATS[1];

  useEffect(() => {
    setSupported(detectSupportedFormats());
  }, []);

  /* Preview object URLs are created once per selection and revoked on change. */
  const previews = useMemo(
    () =>
      files.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [files]
  );

  useEffect(
    () => () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    },
    [previews]
  );

  useEffect(
    () => () => {
      outputUrls.current.forEach((url) => URL.revokeObjectURL(url));
    },
    []
  );

  const releaseOutputs = useCallback(() => {
    outputUrls.current.forEach((url) => URL.revokeObjectURL(url));
    outputUrls.current = [];
  }, []);

  const acceptFiles = useCallback(
    (incoming: FileList | File[] | null) => {
      const list = Array.from(incoming ?? []).filter((file) =>
        file.type.startsWith("image/")
      );

      if (!list.length) return;

      runId.current += 1;
      releaseOutputs();
      setFiles(list);
      setQueue([]);
      setBusy(false);
    },
    [releaseOutputs]
  );

  const clearAll = useCallback(() => {
    runId.current += 1;
    releaseOutputs();
    setFiles([]);
    setQueue([]);
    setBusy(false);
    setShowAdvanced(false);
  }, [releaseOutputs]);

  const handleConvert = useCallback(async () => {
    if (!files.length || busy) return;

    const run = ++runId.current;
    setBusy(true);

    const items: QueueItem[] = files.map((file, index) => ({
      id: `${run}-${index}`,
      file,
      status: "pending",
    }));

    setQueue(items);

    for (const item of items) {
      if (run !== runId.current) return;

      setQueue((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, status: "converting" } : entry
        )
      );

      try {
        const blob = await convertImage(
          item.file,
          format,
          quality / 100,
          backgroundColor
        );

        if (run !== runId.current) return;

        const url = URL.createObjectURL(blob);
        outputUrls.current.push(url);

        setQueue((current) =>
          current.map((entry) =>
            entry.id === item.id
              ? {
                  ...entry,
                  status: "done",
                  output: blob,
                  url,
                  outputName: outputNameFor(item.file.name, format),
                  ratio: Math.round(
                    ((item.file.size - blob.size) / item.file.size) * 100
                  ),
                }
              : entry
          )
        );
      } catch (error) {
        if (run !== runId.current) return;

        setQueue((current) =>
          current.map((entry) =>
            entry.id === item.id
              ? {
                  ...entry,
                  status: "error",
                  error:
                    error instanceof Error
                      ? error.message
                      : "Conversion failed.",
                }
              : entry
          )
        );
      }
    }

    if (run === runId.current) setBusy(false);
  }, [files, busy, format, quality, backgroundColor]);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    setDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    acceptFiles(event.dataTransfer.files);
  };

  const availableFormats = supported
    ? FORMATS.filter((item) => supported[item.id])
    : FORMATS;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "card-wash relative w-full overflow-hidden rounded-[22px] transition-colors duration-200",
        files.length > 0
          ? "border border-line shadow-[0_30px_90px_-50px_rgba(0,0,0,0.9)]"
          : "border-2 border-dashed",
        dragging ? "border-brand" : null,
        !dragging && files.length === 0 ? "border-[#5d5fee]" : null
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          acceptFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {files.length === 0 ? (
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
            {BADGES.map((badge) => (
              <span
                key={badge}
                className="inline-flex h-[30px] items-center rounded-full border border-line bg-white/[0.02] px-[14px] text-[13px] font-semibold text-[#a8c6ee] transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/70 hover:bg-brand/15 hover:text-white hover:shadow-[0_8px_22px_-12px_rgba(85,80,254,0.9)] sm:h-9 sm:text-[15px]"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-5 py-6 text-left sm:px-8 sm:py-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[19px] font-bold tracking-[-0.02em] text-ink">
                Your {files.length === 1 ? "image" : "images"}
              </h2>
              <p className="mt-1 text-[13px] font-medium text-muted">
                {files.length} {files.length === 1 ? "file" : "files"} ready
                &middot; nothing leaves this device
              </p>
            </div>
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-line px-4 text-[13px] font-semibold text-muted transition-colors hover:border-line-strong hover:text-ink"
            >
              <RotateCcw size={13} />
              Start over
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {previews.slice(0, 6).map((preview) => (
              <figure
                key={preview.url}
                className="overflow-hidden rounded-[14px] border border-line bg-[#070d1c]"
              >
                {/* Blob URLs are local only, so next/image optimisation is not used here. */}
                <img
                  src={preview.url}
                  alt={preview.file.name}
                  className="h-[110px] w-full object-cover sm:h-[124px]"
                />
                <figcaption className="flex items-center justify-between gap-2 border-t border-line/70 bg-surface-2/60 px-2.5 py-1.5">
                  <span className="truncate text-[11.5px] font-medium text-muted">
                    {preview.file.name}
                  </span>
                  <span className="shrink-0 text-[10.5px] font-semibold text-faint">
                    {formatBytes(preview.file.size)}
                  </span>
                </figcaption>
              </figure>
            ))}
            {previews.length > 6 && (
              <div className="grid min-h-[80px] place-items-center rounded-[14px] border border-dashed border-line text-[13px] font-semibold text-faint">
                +{previews.length - 6} more
              </div>
            )}
          </div>

          <div className="mt-6">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-faint">
              Convert to
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {availableFormats.map((item) => {
                const active = item.id === formatId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormatId(item.id)}
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
            <div className="mt-3 space-y-4 rounded-[16px] border border-line bg-surface-2/40 p-4">
              {format.lossy ? (
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
                    onChange={(event) => setQuality(Number(event.target.value))}
                    className="mt-2 w-full accent-brand"
                  />
                </label>
              ) : (
                <p className="text-[12.5px] font-medium text-faint">
                  {format.label} is lossless &mdash; quality does not apply.
                </p>
              )}

              {format.id === "jpg" && (
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
          )}

          <button
            type="button"
            onClick={handleConvert}
            disabled={busy}
            className="mt-5 inline-flex h-[54px] w-full items-center justify-center gap-2.5 rounded-[14px] bg-[#5550fe] text-[15.5px] font-semibold text-white shadow-[0_18px_38px_-16px_rgba(85,80,254,0.95)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busy ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Sparkles size={17} />
            )}
            {busy ? "Converting\u2026" : `Convert to ${format.label}`}
          </button>

          {queue.length > 0 && (
            <div className="mt-6 space-y-2.5 border-t border-line pt-5">
              <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-faint">
                Results
              </p>
              {queue.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-[14px] border border-line bg-surface-2/40 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-semibold text-ink">
                      {item.outputName ?? item.file.name}
                    </p>
                    <p className="mt-0.5 text-[12px] font-medium text-faint">
                      {item.status === "error" ? (
                        <span className="text-danger">{item.error}</span>
                      ) : item.status === "done" && item.output ? (
                        <>
                          {formatBytes(item.output.size)}
                          {typeof item.ratio === "number" &&
                            item.ratio !== 0 && (
                              <>
                                {" \u00b7 "}
                                {item.ratio > 0
                                  ? `${item.ratio}% smaller`
                                  : `${Math.abs(item.ratio)}% larger`}
                              </>
                            )}
                        </>
                      ) : (
                        "Converting\u2026"
                      )}
                    </p>
                  </div>

                  {item.status === "done" && item.url ? (
                    <a
                      href={item.url}
                      download={item.outputName}
                      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 text-[12.5px] font-semibold text-white transition hover:bg-brand-hover"
                    >
                      <Download size={13} />
                      Download
                    </a>
                  ) : item.status === "converting" ? (
                    <Loader2
                      size={16}
                      className="shrink-0 animate-spin text-brand-soft"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
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
          <stop offset="0.55" stopColor="#8a5bfb" />
          <stop offset="1" stopColor="#5a63fe" />
        </linearGradient>
      </defs>
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M12 21v-8" />
      <path d="m8.5 16.5 3.5-3.5 3.5 3.5" />
    </svg>
  );
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
