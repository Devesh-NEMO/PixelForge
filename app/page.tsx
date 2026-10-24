/* AnyImage Converter - Main Page
==============================
Clean, minimal image converter with upload, format selection,
and conversion functionality.
*/

"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [quality, setQuality] = useState(80);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState<string | null>(null);
  const [conversionProgress, setConversionProgress] = useState<
    | null
    | {
        fileIndex: number;
        progress: number;
        status: "pending" | "converting" | "success" | "error";
        error?: string;
      }
  >(null);

  const [conversionQueue, setConversionQueue] = useState<
    Array<{
      id: string;
      file: File;
      status: "pending" | "converting" | "success" | "error";
      progress: number;
      output?: Blob;
      outputName?: string;
      reductionPercent: number;
      error?: string;
    }>
  >([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detect format from filename
  const detectFormatFromName = (name: string): string => {
    const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
    const map: Record<string, string> = {
      ".jpg": "jpg",
      ".jpeg": "jpg",
      ".png": "png",
      ".webp": "webp",
      ".gif": "gif",
      ".avif": "avif",
      ".bmp": "bmp",
      ".tiff": "tiff",
      ".ico": "ico",
    };
    return map[ext] || "png";
  };

  // Handle file input change
  const handleFilesChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []) as File[];
      if (files.length > 0) {
        setFiles(files);
        setSelectedFormat("png");
      }
      // Reset input to allow same file selection
      e.target!.value = "";
    },
    []
  );

  // Handle format change
  const handleFormatChange = useCallback(
    (format: string) => setSelectedFormat(format),
    []
  );

  // Handle quality change
  const handleQualityChange = useCallback(
    (q: number) => setQuality(q),
    []
  );

  // Handle advanced settings toggle
  const handleAdvancedToggle = useCallback(() =>
    setShowAdvanced((prev) => !prev),
    []
  );

  // Convert using Canvas API
  const doConvert = useCallback(
    (
      file: File,
      targetFormat: string,
      qualityNum: number,
      onSuccess: (blob: Blob) => void,
      onError: (err: string) => void
    ) => {
      /* @ts-ignore */
      const img = new Image();
      /* @ts-ignore */
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target!.result as string;

        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            onError("Could not get canvas context");
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;

          // For JPG conversion with transparency, add background
          if (targetFormat === "jpg") {
            ctx.fillStyle = backgroundColor || "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          ctx.drawImage(img, 0, 0);

          const mimeType = `image/${targetFormat}`;

          canvas.toBlob(
            (blob) => {
              if (blob) {
                onSuccess(blob);
              } else {
                onError("Conversion returned no blob");
              }
            },
            mimeType,
            qualityNum
          );
        };
      };

      reader.readAsDataURL(file);
    },
    [backgroundColor]
  );

  // Process the conversion queue
  const processConversion = useCallback(async () => {
    if (conversionQueue.length === 0) return;

    for (let i = 0; i < conversionQueue.length; i++) {
      const item = conversionQueue[i];
      if (item.status !== "pending") continue;

      try {
        doConvert(
          item.file,
          selectedFormat || "png",
          quality / 100,
          (output) => {
            const outputName = `${item.file.name.replace(
              /\.[^.]+$/,
              ""
            )}.${selectedFormat || "png"}`;

            setConversionQueue((prev) => {
              const updated = [...prev];
              updated[i] = {
                ...updated[i],
                status: "success",
                output,
                outputName,
                reductionPercent:
                  Math.round(((item.file.size - output.size) / item.file.size) *
                    100) || 0,
              };
              return updated;
            });
          },
          (err) => {
            setConversionQueue((prev) => {
              const updated = [...prev];
              updated[i] = {
                ...updated[i],
                status: "error",
                error: err,
              };
              return updated;
            });
          }
        );
      } catch (err) {
        console.error("Conversion error:", err);
        setConversionQueue((prev) => {
          const updated = [...prev];
          updated[i] = {
            ...updated[i],
            status: "error",
            error: err instanceof Error ? err.message : "Conversion failed",
          };
          return updated;
        });
      }
    }
  }, [conversionQueue, selectedFormat, quality, backgroundColor]);

  // Handle convert button
  const handleConvert = useCallback(async () => {
    if (!files.length || !selectedFormat) return;

    // Reset queue and start fresh
    setConversionQueue(
      files.map((file, index) => ({
        id: `conv-${Date.now()}-${index}`,
        file,
        status: "pending",
        progress: 0,
        reductionPercent: 0,
      }))
    );

    await processConversion();
  }, [files, selectedFormat, processConversion]);

  // Handle download individual
  const handleDownloadIndividual = useCallback(
    (item: { outputName?: string; output?: Blob }) => {
      if (!item.output) return;
      const url = URL.createObjectURL(item.output);
      const link = document.createElement("a");
      link.href = url;
      link.download = item.outputName || `${files[0].name}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    [files]
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-3">
            AnyImage Converter
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Convert any image to JPG, PNG, WebP, GIF, BMP, TIFF, AVIF, or ICO format
          </p>
        </header>

        {/* Upload Card */}
        <div className="border-2 border-border-default rounded-2xl p-8 text-center relative mx-auto max-w-680px">
          {files.length === 0 && (
            <div className="relative">
              <div
                className="drag-upload-box rounded-2xl p-12 border-2 border-dashed border-border-default bg-background transition-colors hover:border-primary-indigo cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <svg
                  className="w-14 h-14 mx-auto mb-4 opacity-50"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M10 7l5 5L17 14M21 3v9a2 2 0 01-2 2H5a2 2 0 01-2-2V3m20-8-6.18 6.18a2 2 0 01-2.83 0L1 15l8.18 8.18a2 2 0 1 0 0 3.46 2 2 0 0 1 2.83 0L25 8l-6.18 6.18a2 2 0 01-2.83 0L1 15l8.18 8.18a2 2 0 1 0 0 3.46 2 2 0 0 1 2.83 0L5 13l-8 8 8 8L5 13l-8-8-8 8L1 5z" />
                </svg>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Drop your image here
                </h3>
                <p className="text-sm text-muted-foreground">
                  or click to browse files
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Upload JPG, PNG, WebP, GIF, AVIF, BMP, TIFF, and other supported formats.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                />
              </div>
            </div>
          )}

          {files.length > 0 && (
            <div className="relative">
              {/* Image Preview */}
              <div className="mt-6">
                <Image
                  src={URL.createObjectURL(files[0])}
                  alt="Uploaded image"
                  width={500}
                  height={375}
                  className="rounded-md border border-border-default w-full h-auto max-h-[400px] object-cover mx-auto"
                />
              </div>

              {/* Image Info */}
              <div className="mt-4 flex flex-col gap-2 text-center">
                <p className="text-sm text-muted-foreground">
                  {files[0].name}
                </p>
                <p className="text-xs text-muted-foreground/70">
                  {files[0].size > 1024
                    ? `${(files[0].size / 1024).toFixed(1)} KB`
                    : `${files[0].size} bytes`}
                </p>
              </div>

              {/* Remove button */}
              <button
                onClick={() => setFiles([])}
                className="absolute top-3 right-3 text-muted-foreground/70 hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Advanced Settings */}
        {files.length > 0 && (
          <div className="mt-6">
            <button
              onClick={handleAdvancedToggle}
              className="text-sm text-primary-indigo underline underline-offset-2 flex items-center gap-1 transition-colors"
            >
              {showAdvanced ? "Hide advanced settings" : "Show advanced settings"}
            </button>

            {showAdvanced && (
              <div className="mt-4 p-4 rounded-xl bg-white border border-border-default">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Quality
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={quality}
                      onChange={(e) => handleQualityChange(parseInt(e.target.value))}
                      className="w-full accent-primary-indigo"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1</span>
                      <span>100</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Background color (for JPG)
                    </label>
                    {selectedFormat === "jpg" && backgroundColor ? (
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded bg-${backgroundColor.replace(
                            "#",
                            ""
                          )} flex items-center justify-center text-xs font-medium`}
                        >
                          {backgroundColor}
                        </div>
                        <input
                          type="color"
                          value={backgroundColor || "#ffffff"}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground/70">
                        No background needed (PNG/WebP/AVIF support transparency)
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Resize
                  </label>
                  <p className="text-xs text-muted-foreground/70">
                    Image resize options
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        {files.length > 0 && selectedFormat && (
          <div className="mt-8 pt-8 border-t border-border-default">
            <button
              onClick={handleConvert}
              className="w-full rounded-xl px-6 py-3 bg-primary-indigo text-white font-medium transition-colors hover:bg-primary-indigo-light disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Convert Image
            </button>
            <button
              onClick={() => setFiles([])}
              className="w-full rounded-xl px-6 py-3 bg-white text-primary-indigo font-medium transition-colors border border-primary-indigo mt-3"
            >
              Convert Another Image
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* Helper function for className merging */
function cn(condition: boolean | null | undefined, ...classes: string[]): string {
  if (condition === null || condition === undefined || !condition) return "";
  return classes.filter(Boolean).join(" ");
}