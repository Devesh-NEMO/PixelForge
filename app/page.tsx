/* AnyImage Converter - Premium Dark Theme & Centered Layout
=========================================================
Clean, professional SaaS image converter with centered layout,
dark theme, and Lucide React icons.
*/

"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CloudUpload,
  FolderOpen,
  Lock,
  HelpCircle,
  Sparkles,
  Download,
  Trash2,
  Settings,
  Image as ImageIcon
} from "lucide-react";

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<string | null>("png");
  const [quality, setQuality] = useState(80);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  // Handle file drop / selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(newFiles);
    }
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/")
      );
      if (droppedFiles.length > 0) {
        setFiles(droppedFiles);
      }
    }
  };

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
    <div className="min-h-screen bg-[#0B1020] text-[#F4F7FF] flex flex-col justify-between items-center selection:bg-[#6557FF]/30 selection:text-[#F4F7FF] relative overflow-x-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-[#6557FF]/15 via-[#A855F7]/5 to-transparent blur-3xl pointer-events-none" />

      {/* Main Container - Centered max-width 960px */}
      <div className="w-full max-w-[960px] mx-auto px-4 sm:px-8 flex flex-col items-center justify-center my-auto py-12 relative z-10">
        
        {/* Header */}
        <header className="w-full flex items-center justify-between mb-12 bg-[#0E1425] border border-[#27334D] rounded-2xl px-6 py-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#A855F7] to-[#6557FF] flex items-center justify-center shadow-md shadow-[#6557FF]/20">
              <ImageIcon size={20} className="text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-[#F4F7FF]">AnyImage Converter</span>
            </div>
          </div>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#91A2C2] hover:text-[#F4F7FF] transition-colors bg-[#182238] px-4 py-2 rounded-full border border-[#27334D]"
          >
            <HelpCircle size={15} />
            How it works
          </a>
        </header>

        {/* Hero Section */}
        <section className="text-center mb-10 w-full">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#F4F7FF] mb-3">
            Convert images <span className="gradient-text">in seconds.</span>
          </h1>
          <p className="text-base sm:text-lg text-[#91A2C2] max-w-lg mx-auto">
            Your images, your format. Simple, fast, and secure.
          </p>
        </section>

        {/* Upload Card - max width 680px */}
        <div className="w-full max-w-[680px] bg-[#111A2D] border border-[#27334D] rounded-[24px] p-6 sm:p-8 shadow-2xl relative">
          {files.length === 0 ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`min-h-[320px] sm:min-h-[360px] rounded-[18px] border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-6 sm:p-10 text-center ${
                isDragging
                  ? "border-[#6557FF] bg-[#6557FF]/10 scale-[0.99]"
                  : "border-[#27334D] bg-[#182238]/40 hover:border-[#6557FF] hover:bg-[#182238]/70"
              }`}
            >
              {/* Cloud Upload Icon */}
              <div className="w-16 h-16 rounded-2xl bg-[#6557FF]/10 border border-[#6557FF]/30 flex items-center justify-center mb-5 text-[#6557FF] shadow-inner">
                <CloudUpload size={44} />
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-[#F4F7FF] mb-1">
                Drop your image here
              </h3>
              <p className="text-sm text-[#91A2C2] mb-6">
                or browse files from your device
              </p>

              {/* Choose image button with folder icon */}
              <button
                type="button"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#6557FF] text-white font-semibold text-sm shadow-lg shadow-[#6557FF]/25 hover:bg-[#796BFF] hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <FolderOpen size={18} />
                Choose image
              </button>

              {/* Format badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
                {["JPG", "PNG", "WebP", "AVIF", "GIF", "TIFF"].map((fmt, idx, arr) => (
                  <span key={fmt} className="inline-flex items-center gap-2 text-xs font-medium text-[#91A2C2]">
                    <span className="px-3.5 py-1 rounded-full bg-[#182238] border border-[#27334D]">
                      {fmt}
                    </span>
                    {idx < arr.length - 1 && <span className="text-[#27334D]">&middot;</span>}
                  </span>
                ))}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Image Preview Panel */}
              <div className="relative rounded-2xl overflow-hidden border border-[#27334D] bg-[#182238]/50 p-6">
                <div className="relative w-full h-64 sm:h-72">
                  <Image
                    src={URL.createObjectURL(files[0])}
                    alt="Uploaded image preview"
                    fill
                    className="object-contain rounded-xl"
                  />
                </div>
                <div className="mt-6 flex items-center justify-between text-left border-t border-[#27334D] pt-4">
                  <div>
                    <p className="text-sm font-semibold text-[#F4F7FF] truncate max-w-xs sm:max-w-md">
                      {files[0].name}
                    </p>
                    <p className="text-xs text-[#91A2C2] mt-0.5">
                      {files[0].size > 1024
                        ? `${(files[0].size / 1024).toFixed(1)} KB`
                        : `${files[0].size} bytes`}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setFiles([]);
                      setConversionQueue([]);
                    }}
                    className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-medium px-3.5 py-2 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                </div>
              </div>

              {/* Format Selector */}
              <div className="text-left bg-[#182238]/40 p-5 rounded-2xl border border-[#27334D]">
                <label className="block text-sm font-semibold text-[#F4F7FF] mb-3">
                  Convert to format
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {["jpg", "png", "webp", "avif", "gif", "bmp", "tiff", "ico"].map(
                    (format) => (
                      <button
                        key={format}
                        onClick={() => handleFormatChange(format)}
                        className={cn(
                          selectedFormat === format,
                          "py-2.5 px-3 text-sm font-semibold rounded-xl border transition-all text-center",
                          selectedFormat === format
                            ? "bg-[#6557FF] text-white border-[#6557FF] shadow-lg shadow-[#6557FF]/30"
                            : "bg-[#111A2D] text-[#91A2C2] border-[#27334D] hover:border-[#6557FF]/50 hover:text-[#F4F7FF]"
                        )}
                      >
                        {format.toUpperCase()}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="text-left bg-[#182238]/40 p-5 rounded-2xl border border-[#27334D]">
                <button
                  onClick={handleAdvancedToggle}
                  className="w-full flex items-center justify-between text-sm font-semibold text-[#F4F7FF]"
                >
                  <span className="flex items-center gap-2">
                    <Settings size={16} className="text-[#6557FF]" />
                    Advanced Settings
                  </span>
                  <span className="text-[#91A2C2] text-xs">{showAdvanced ? "Hide" : "Show"}</span>
                </button>

                {showAdvanced && (
                  <div className="mt-4 pt-4 border-t border-[#27334D] space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-medium text-[#91A2C2]">
                          Quality ({quality}%)
                        </label>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={quality}
                        onChange={(e) => handleQualityChange(parseInt(e.target.value))}
                        className="w-full accent-[#6557FF] cursor-pointer"
                      />
                    </div>

                    {selectedFormat === "jpg" && (
                      <div>
                        <label className="block text-xs font-medium text-[#91A2C2] mb-2">
                          Background Color for Transparency (JPG)
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={backgroundColor || "#ffffff"}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            className="w-10 h-10 rounded-lg border border-[#27334D] cursor-pointer p-0 bg-transparent"
                          />
                          <span className="text-xs text-[#91A2C2]">
                            {backgroundColor || "#ffffff"} (Defaults to white)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Convert Button */}
              <div>
                <button
                  onClick={handleConvert}
                  className="w-full py-4 px-6 bg-[#6557FF] text-white font-bold rounded-xl shadow-lg shadow-[#6557FF]/30 hover:bg-[#796BFF] hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles size={18} />
                  Convert Image
                </button>
              </div>

              {/* Results / Download Section */}
              {conversionQueue.length > 0 && (
                <div className="mt-6 space-y-4 pt-6 border-t border-[#27334D]">
                  <h4 className="text-sm font-bold text-[#F4F7FF] text-left">
                    Converted Result
                  </h4>
                  {conversionQueue.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-[#27334D] bg-[#111A2D] flex items-center justify-between"
                    >
                      <div className="text-left">
                        <p className="text-sm font-semibold text-[#F4F7FF]">
                          {item.outputName || "converted-image"}
                        </p>
                        <p className="text-xs text-[#91A2C2]">
                          {item.status === "success" && item.output
                            ? `Size: ${(item.output.size / 1024).toFixed(1)} KB (${item.reductionPercent}% saved)`
                            : item.status === "error"
                            ? item.error || "Conversion failed"
                            : "Converting..."}
                        </p>
                      </div>
                      {item.status === "success" && item.output && (
                        <button
                          onClick={() => handleDownloadIndividual(item)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-[#6557FF] text-white text-xs font-semibold rounded-lg hover:bg-[#796BFF] hover:shadow-md hover:shadow-[#6557FF]/30 transition-all"
                        >
                          <Download size={14} />
                          Download
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setFiles([]);
                      setConversionQueue([]);
                    }}
                    className="w-full py-3 bg-[#182238] border border-[#27334D] text-[#91A2C2] hover:text-[#F4F7FF] text-sm font-semibold rounded-xl transition-colors"
                  >
                    Convert Another Image
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Privacy message */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-[#91A2C2]">
          <Lock size={14} className="text-[#6557FF]" />
          <span>Your files stay on your device</span>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-[#27334D] bg-[#0E1425]/50 py-6 px-4 text-center text-xs text-[#91A2C2] relative z-10">
        <p>AnyImage &middot; Convert, enjoy and edit your images &middot; v1.0</p>
      </footer>
    </div>
  );
}

/* Helper function for className merging */
function cn(condition: boolean | null | undefined, ...classes: string[]): string {
  if (condition === null || condition === undefined || !condition) return "";
  return classes.filter(Boolean).join(" ");
}