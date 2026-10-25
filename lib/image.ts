export type Dimensions = { width: number; height: number };

export type ResizeOptions = {
  width: number | null;
  height: number | null;
  keepAspectRatio: boolean;
};

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "--";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function outputNameFor(name: string, extension: string): string {
  const base =
    name
      .replace(/\.[^.]+$/, "")
      .replace(/[.\s]+$/, "")
      .trim() || "image";
  return `${base}.${extension}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Largest size that fits inside `max` without changing the aspect ratio. */
export function fitWithin(source: Dimensions, max: Dimensions): Dimensions {
  const ratio = Math.min(
    max.width / source.width,
    max.height / source.height,
    1
  );
  return {
    width: Math.max(1, Math.round(source.width * ratio)),
    height: Math.max(1, Math.round(source.height * ratio)),
  };
}

/**
 * Turn the resize form values into concrete pixel dimensions.
 * - nothing set            -> original size
 * - one axis set            -> the other follows the source ratio
 * - both set, aspect kept   -> the largest size that fits inside the box
 * - both set, aspect free   -> exact box (may stretch)
 */
export function resolveTargetSize(
  source: Dimensions,
  options: ResizeOptions
): Dimensions {
  const width =
    options.width != null && Number.isFinite(options.width)
      ? Math.max(1, Math.round(options.width))
      : null;
  const height =
    options.height != null && Number.isFinite(options.height)
      ? Math.max(1, Math.round(options.height))
      : null;

  if (width == null && height == null) {
    return { width: source.width, height: source.height };
  }

  if (width != null && height != null) {
    return options.keepAspectRatio
      ? fitWithin(source, { width, height })
      : { width, height };
  }

  const ratio = source.width / source.height;

  if (width != null) {
    return { width, height: Math.max(1, Math.round(width / ratio)) };
  }

  return {
    width: Math.max(1, Math.round((height as number) * ratio)),
    height: height as number,
  };
}

export type SizeDelta = { percent: number; larger: boolean; same: boolean };

export function sizeDelta(
  originalBytes: number,
  outputBytes: number
): SizeDelta {
  if (originalBytes <= 0) return { percent: 0, larger: false, same: true };

  const delta = (originalBytes - outputBytes) / originalBytes;
  const percent = Math.round(Math.abs(delta) * 100);

  return {
    percent,
    larger: delta < 0,
    same: percent === 0,
  };
}

export type QualitySearchResult = {
  quality: number;
  size: number;
  reached: boolean;
};

/**
 * Binary-search the highest quality whose encoded size fits `targetBytes`.
 * `encode` is injected so the search itself stays pure and testable.
 */
export async function qualityForTarget(
  targetBytes: number,
  encode: (quality: number) => Promise<number>,
  options: { min?: number; max?: number; attempts?: number } = {}
): Promise<QualitySearchResult> {
  const min = clamp(options.min ?? 0.3, 0.05, 1);
  const max = clamp(options.max ?? 0.95, min, 1);
  const attempts = options.attempts ?? 6;

  const smallest = await encode(min);

  if (smallest > targetBytes) {
    return { quality: min, size: smallest, reached: false };
  }

  let best: QualitySearchResult = {
    quality: min,
    size: smallest,
    reached: true,
  };
  let low = min;
  let high = max;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const quality = (low + high) / 2;
    const size = await encode(quality);

    if (size <= targetBytes) {
      best = { quality, size, reached: true };
      low = quality;
    } else {
      high = quality;
    }
  }

  return best;
}
