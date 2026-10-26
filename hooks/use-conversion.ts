"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { convertImage } from "../lib/convert-client";
import {
  DEFAULT_FORMAT,
  FORMATS,
  detectNativeFormats,
  getFormat,
  type FormatId,
} from "../lib/formats";
import {
  outputNameFor,
  resolveTargetSize,
  type Dimensions,
} from "../lib/image";
import type { ImageJobsApi } from "./use-image-jobs";
import { buildPdf } from "../lib/pdf";

function parseDimension(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Owns the output settings and the conversion run: the queue loop, both the
 * raster and PDF paths, the ZIP download, and cancellation.
 */
export function useConversion({
  jobs,
  setJobs,
  setPdfResult,
  clearPdfResult,
  trackUrl,
  releaseUrl,
}: ImageJobsApi) {
  const [formatId, setFormatId] = useState<FormatId>(DEFAULT_FORMAT);
  const [quality, setQuality] = useState(85);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [resizeWidth, setResizeWidth] = useState("");
  const [resizeHeight, setResizeHeight] = useState("");
  const [keepAspect, setKeepAspect] = useState(true);
  const [targetEnabled, setTargetEnabled] = useState(false);
  const [targetKb, setTargetKb] = useState(200);
  const [supported, setSupported] = useState<Record<FormatId, boolean> | null>(
    null
  );
  const [busy, setBusy] = useState(false);

  const runId = useRef(0);
  const format = getFormat(formatId);

  useEffect(() => {
    setSupported(detectNativeFormats());
  }, []);

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

  /** Abort an in-flight run and drop the busy flag. */
  const cancel = useCallback(() => {
    runId.current += 1;
    setBusy(false);
  }, []);

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

  return {
    formatId,
    setFormatId,
    quality,
    setQuality,
    backgroundColor,
    setBackgroundColor,
    resizeWidth,
    setResizeWidth,
    resizeHeight,
    setResizeHeight,
    keepAspect,
    setKeepAspect,
    targetEnabled,
    setTargetEnabled,
    targetKb,
    setTargetKb,
    format,
    availableFormats,
    busy,
    handleConvert,
    downloadAll,
    cancel,
    sample,
    sampleSize,
  };
}

export type ConversionApi = ReturnType<typeof useConversion>;
