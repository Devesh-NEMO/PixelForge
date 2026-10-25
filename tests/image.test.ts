import { describe, expect, it } from "vitest";
import { looksLikeHeic } from "../lib/formats";
import {
  fitWithin,
  formatBytes,
  outputNameFor,
  qualityForTarget,
  resolveTargetSize,
  sizeDelta,
} from "../lib/image";

describe("formatBytes", () => {
  it("scales units", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.00 MB");
  });

  it("handles invalid input", () => {
    expect(formatBytes(-1)).toBe("--");
    expect(formatBytes(Number.NaN)).toBe("--");
  });
});

describe("outputNameFor", () => {
  it("replaces the extension", () => {
    expect(outputNameFor("holiday.photo.JPG", "webp")).toBe(
      "holiday.photo.webp"
    );
  });

  it("adds an extension when there is none", () => {
    expect(outputNameFor("screenshot", "png")).toBe("screenshot.png");
  });

  it("cleans trailing dots and empty names", () => {
    expect(outputNameFor("weird.", "jpg")).toBe("weird.jpg");
    expect(outputNameFor("   ", "png")).toBe("image.png");
  });
});

describe("fitWithin", () => {
  it("never upscales", () => {
    expect(
      fitWithin({ width: 100, height: 50 }, { width: 400, height: 400 })
    ).toEqual({ width: 100, height: 50 });
  });

  it("keeps the aspect ratio", () => {
    expect(
      fitWithin({ width: 400, height: 200 }, { width: 100, height: 100 })
    ).toEqual({ width: 100, height: 50 });
  });
});

describe("resolveTargetSize", () => {
  const source = { width: 1600, height: 900 };

  it("keeps the original size when empty", () => {
    expect(
      resolveTargetSize(source, {
        width: null,
        height: null,
        keepAspectRatio: true,
      })
    ).toEqual(source);
  });

  it("derives the missing axis from the source ratio", () => {
    expect(
      resolveTargetSize(source, {
        width: 800,
        height: null,
        keepAspectRatio: true,
      })
    ).toEqual({ width: 800, height: 450 });
  });

  it("derives the width when only the height is set", () => {
    expect(
      resolveTargetSize(source, {
        width: null,
        height: 450,
        keepAspectRatio: true,
      })
    ).toEqual({ width: 800, height: 450 });
  });

  it("fits inside the box when both axes are set and locked", () => {
    expect(
      resolveTargetSize(source, {
        width: 500,
        height: 500,
        keepAspectRatio: true,
      })
    ).toEqual({ width: 500, height: 281 });
  });

  it("stretches when the aspect ratio is unlocked", () => {
    expect(
      resolveTargetSize(source, {
        width: 500,
        height: 500,
        keepAspectRatio: false,
      })
    ).toEqual({ width: 500, height: 500 });
  });

  it("ignores invalid values", () => {
    expect(
      resolveTargetSize(source, {
        width: Number.NaN,
        height: null,
        keepAspectRatio: true,
      })
    ).toEqual(source);
  });
});

describe("sizeDelta", () => {
  it("reports savings", () => {
    expect(sizeDelta(1000, 400)).toEqual({
      percent: 60,
      larger: false,
      same: false,
    });
  });

  it("reports growth", () => {
    expect(sizeDelta(1000, 1500)).toEqual({
      percent: 50,
      larger: true,
      same: false,
    });
  });

  it("reports equality", () => {
    expect(sizeDelta(1000, 1000).same).toBe(true);
    expect(sizeDelta(0, 500).same).toBe(true);
  });
});

describe("qualityForTarget", () => {
  // Size grows linearly with quality, which is directionally how lossy encoders behave.
  const encodeLinear = async (quality: number) => Math.round(1000 * quality);

  it("finds the highest quality that fits", async () => {
    const result = await qualityForTarget(500, encodeLinear, {
      min: 0.3,
      max: 0.95,
      attempts: 8,
    });

    expect(result.reached).toBe(true);
    expect(result.size).toBeLessThanOrEqual(500);
    expect(result.quality).toBeGreaterThan(0.45);
    expect(result.quality).toBeLessThanOrEqual(0.52);
  });

  it("returns the smallest quality when the target is unreachable", async () => {
    const result = await qualityForTarget(100, encodeLinear, {
      min: 0.3,
      max: 0.95,
    });

    expect(result.reached).toBe(false);
    expect(result.quality).toBe(0.3);
  });

  it("does not encode more than the allowed attempts", async () => {
    let calls = 0;
    await qualityForTarget(
      400,
      async (quality) => {
        calls += 1;
        return Math.round(1000 * quality);
      },
      { min: 0.3, max: 0.95, attempts: 3 }
    );

    expect(calls).toBeLessThanOrEqual(4);
  });
});

describe("looksLikeHeic", () => {
  it("detects HEIC by mime type and extension", () => {
    expect(looksLikeHeic(new File([], "IMG_0001.HEIC"))).toBe(true);
    expect(looksLikeHeic(new File([], "a.heif", { type: "image/heif" }))).toBe(
      true
    );
    expect(
      looksLikeHeic(new File([], "photo.png", { type: "image/png" }))
    ).toBe(false);
  });
});
