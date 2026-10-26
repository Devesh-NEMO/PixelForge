"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { disposeConverter } from "../lib/convert-client";
import { looksLikeHeic } from "../lib/formats";
import { nextJobId, type Job, type PdfResult } from "../lib/job";

export type ImageJobsApi = {
  jobs: Job[];
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
  preparing: boolean;
  pdfResult: PdfResult | null;
  addFiles: (incoming: FileList | File[] | null) => Promise<void>;
  removeJob: (id: string) => void;
  clearAll: () => void;
  setPdfResult: (result: PdfResult | null) => void;
  clearPdfResult: () => void;
  trackUrl: (url: string) => string;
  releaseUrl: (url?: string) => void;
};

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

/**
 * Owns the selected files: previews, object-URL lifecycle, HEIC decoding, the
 * PDF cache, and removal. Nothing here knows about output formats.
 */
export function useImageJobs(): ImageJobsApi {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [pdfResult, setPdfResultState] = useState<PdfResult | null>(null);

  const urls = useRef(new Set<string>());
  const pdfUrl = useRef<string | null>(null);

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
    setPdfResultState(null);
  }, [releaseUrl]);

  const setPdfResult = useCallback(
    (result: PdfResult | null) => {
      if (pdfUrl.current) {
        releaseUrl(pdfUrl.current);
        pdfUrl.current = null;
      }

      if (result) {
        urls.current.add(result.url);
        pdfUrl.current = result.url;
      }

      setPdfResultState(result);
    },
    [releaseUrl]
  );

  /* Revoke every object URL and stop the worker when the card unmounts. */
  useEffect(
    () => () => {
      urls.current.forEach((url) => URL.revokeObjectURL(url));
      urls.current.clear();
      disposeConverter();
    },
    []
  );

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
    urls.current.forEach((url) => URL.revokeObjectURL(url));
    urls.current.clear();
    pdfUrl.current = null;
    setJobs([]);
    setPdfResultState(null);
  }, []);

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

  return {
    jobs,
    setJobs,
    preparing,
    pdfResult,
    addFiles,
    removeJob,
    clearAll,
    setPdfResult,
    clearPdfResult,
    trackUrl,
    releaseUrl,
  };
}
