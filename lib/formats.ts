export type FormatId = "jpg" | "png" | "webp" | "avif" | "pdf";

export type OutputFormat = {
  id: FormatId;
  mime: string;
  label: string;
  extension: string;
  lossy: boolean;
  /** Raster formats go through the canvas; PDF is assembled from JPEG pages. */
  kind: "raster" | "pdf";
};

export const FORMATS: readonly OutputFormat[] = [
  {
    id: "jpg",
    mime: "image/jpeg",
    label: "JPG",
    extension: "jpg",
    lossy: true,
    kind: "raster",
  },
  {
    id: "png",
    mime: "image/png",
    label: "PNG",
    extension: "png",
    lossy: false,
    kind: "raster",
  },
  {
    id: "webp",
    mime: "image/webp",
    label: "WEBP",
    extension: "webp",
    lossy: true,
    kind: "raster",
  },
  {
    id: "avif",
    mime: "image/avif",
    label: "AVIF",
    extension: "avif",
    lossy: true,
    kind: "raster",
  },
  {
    id: "pdf",
    mime: "application/pdf",
    label: "PDF",
    extension: "pdf",
    lossy: true,
    kind: "pdf",
  },
];

/** Badges shown on the landing card, in the order the design calls for. */
export const BADGES = ["JPG", "PNG", "WEBP", "AVIF", "GIF", "TIFF"] as const;

export const DEFAULT_FORMAT: FormatId = "png";

export function getFormat(id: FormatId): OutputFormat {
  return FORMATS.find((format) => format.id === id) ?? FORMATS[1];
}

/**
 * Ask the canvas which encoders this browser actually implements.
 * The canvas silently falls back to PNG for unsupported types, which is why we
 * compare the emitted data URL prefix instead of trusting `toBlob`.
 */
export function detectNativeFormats(): Record<FormatId, boolean> {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;

  const supported = {} as Record<FormatId, boolean>;

  for (const format of FORMATS) {
    // PDF is written by the app itself, so it never depends on the canvas.
    if (format.kind === "pdf") {
      supported[format.id] = true;
      continue;
    }

    try {
      supported[format.id] = canvas
        .toDataURL(format.mime)
        .startsWith(`data:${format.mime}`);
    } catch {
      supported[format.id] = false;
    }
  }

  return supported;
}

const HEIC_PATTERN = /\.(heic|heif)$/i;

export function looksLikeHeic(file: File): boolean {
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    HEIC_PATTERN.test(file.name)
  );
}
