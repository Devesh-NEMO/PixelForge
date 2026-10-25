import { qualityForTarget } from "../lib/image";
import type { ConvertRequest, ConvertResponse } from "../lib/convert-types";

/** Beyond this the tab is likely to die on mobile hardware anyway. */
const MAX_PIXELS = 60_000_000;

const scope = self as unknown as {
  addEventListener: (
    type: "message",
    listener: (event: MessageEvent<ConvertRequest>) => void
  ) => void;
  postMessage: (message: ConvertResponse) => void;
};

async function run({
  id,
  source,
  options,
}: ConvertRequest): Promise<ConvertResponse> {
  const bitmap = await createImageBitmap(source, {
    imageOrientation: "from-image",
  });

  try {
    const pixels = bitmap.width * bitmap.height;
    if (pixels > MAX_PIXELS) {
      throw new Error(
        "That image is too large to process safely (over 60 megapixels)."
      );
    }

    // A zero width/height means "keep the natural size" (the UI may not know it yet).
    const width =
      options.width > 0 ? Math.max(1, Math.round(options.width)) : bitmap.width;
    const height =
      options.height > 0
        ? Math.max(1, Math.round(options.height))
        : bitmap.height;

    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Your browser blocked canvas rendering.");
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    if (options.mime === "image/jpeg") {
      context.fillStyle = options.background;
      context.fillRect(0, 0, width, height);
    }

    context.drawImage(bitmap, 0, 0, width, height);

    const encode = async (quality: number) => {
      const blob = await canvas.convertToBlob({
        type: options.mime,
        quality,
      });

      if (blob.type !== options.mime) {
        throw new Error(
          `${options.mime} encoding is not supported by this browser.`
        );
      }

      return blob;
    };

    let quality = options.quality;
    let blob = await encode(quality);
    let reachedTarget = true;

    const target = options.targetBytes ?? 0;

    if (target > 0 && options.mime !== "image/png" && blob.size > target) {
      const match = await qualityForTarget(
        target,
        async (candidate) => (await encode(candidate)).size,
        { min: 0.3, max: quality, attempts: 6 }
      );

      quality = match.quality;
      reachedTarget = match.reached;
      blob = await encode(quality);
    }

    return { id, ok: true, blob, width, height, quality, reachedTarget };
  } finally {
    bitmap.close();
  }
}

scope.addEventListener("message", async (event) => {
  const request = event.data;

  try {
    scope.postMessage(await run(request));
  } catch (error) {
    scope.postMessage({
      id: request.id,
      ok: false,
      error: error instanceof Error ? error.message : "Conversion failed.",
    });
  }
});
