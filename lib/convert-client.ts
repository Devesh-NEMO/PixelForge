import type {
  ConvertOptions,
  ConvertRequest,
  ConvertResponse,
} from "./convert-types";

export type ConvertOutput = {
  blob: Blob;
  width: number;
  height: number;
  quality: number;
  reachedTarget?: boolean;
};

type Pending = {
  resolve: (response: ConvertResponse) => void;
  reject: (error: Error) => void;
};

let worker: Worker | null = null;
let workerBroken = false;
let sequence = 0;
const pending = new Map<number, Pending>();

class WorkerUnavailable extends Error {}

export function supportsWorkerConversion(): boolean {
  return (
    typeof Worker !== "undefined" &&
    typeof OffscreenCanvas !== "undefined" &&
    typeof createImageBitmap === "function"
  );
}

function getWorker(): Worker | null {
  if (workerBroken || !supportsWorkerConversion()) return null;
  if (worker) return worker;

  try {
    const instance = new Worker(
      new URL("../workers/convert.worker.ts", import.meta.url),
      { type: "module" }
    );

    instance.addEventListener(
      "message",
      (event: MessageEvent<ConvertResponse>) => {
        const response = event.data;
        const entry = pending.get(response.id);
        if (!entry) return;
        pending.delete(response.id);
        entry.resolve(response);
      }
    );

    instance.addEventListener("error", () => {
      workerBroken = true;
      worker?.terminate();
      worker = null;
      for (const entry of pending.values()) {
        entry.reject(new WorkerUnavailable("The conversion worker crashed."));
      }
      pending.clear();
    });

    worker = instance;
    return worker;
  } catch {
    workerBroken = true;
    return null;
  }
}

function convertOnMainThread(
  source: Blob,
  options: ConvertOptions
): Promise<ConvertOutput> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(source);
    const image = new window.Image();

    const cleanup = () => URL.revokeObjectURL(objectUrl);

    image.onerror = () => {
      cleanup();
      reject(new Error("This image could not be decoded by your browser."));
    };

    image.onload = () => {
      try {
        const width =
          options.width > 0
            ? Math.max(1, Math.round(options.width))
            : image.naturalWidth;
        const height =
          options.height > 0
            ? Math.max(1, Math.round(options.height))
            : image.naturalHeight;

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        if (!context) throw new Error("Your browser blocked canvas rendering.");

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";

        if (options.mime === "image/jpeg") {
          context.fillStyle = options.background;
          context.fillRect(0, 0, width, height);
        }

        context.drawImage(image, 0, 0, width, height);

        const encode = (quality: number) =>
          new Promise<Blob>((done, fail) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  fail(new Error("The browser could not encode this image."));
                  return;
                }
                if (blob.type !== options.mime) {
                  fail(
                    new Error(
                      `${options.mime} encoding is not supported by this browser.`
                    )
                  );
                  return;
                }
                done(blob);
              },
              options.mime,
              quality
            );
          });

        const finish = async () => {
          let quality = options.quality;
          let blob = await encode(quality);
          let reachedTarget = true;
          const target = options.targetBytes ?? 0;

          if (
            target > 0 &&
            options.mime !== "image/png" &&
            blob.size > target
          ) {
            const { qualityForTarget } = await import("./image");
            const match = await qualityForTarget(
              target,
              async (candidate) => (await encode(candidate)).size,
              { min: 0.3, max: quality, attempts: 6 }
            );
            quality = match.quality;
            reachedTarget = match.reached;
            blob = await encode(quality);
          }

          return { blob, width, height, quality, reachedTarget };
        };

        finish()
          .then((result) => {
            cleanup();
            resolve(result);
          })
          .catch((error) => {
            cleanup();
            reject(error instanceof Error ? error : new Error(String(error)));
          });
      } catch (error) {
        cleanup();
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    };

    image.src = objectUrl;
  });
}

export async function convertImage(
  source: Blob,
  options: ConvertOptions
): Promise<ConvertOutput> {
  const instance = getWorker();
  if (!instance) return convertOnMainThread(source, options);

  const id = (sequence += 1);

  try {
    const response = await new Promise<ConvertResponse>((resolve, reject) => {
      pending.set(id, { resolve, reject });
      const request: ConvertRequest = { id, source, options };
      instance.postMessage(request);
    });

    if (!response.ok || !response.blob) {
      throw new Error(response.error ?? "Conversion failed.");
    }

    return {
      blob: response.blob,
      width: response.width ?? options.width,
      height: response.height ?? options.height,
      quality: response.quality ?? options.quality,
      reachedTarget: response.reachedTarget,
    };
  } catch (error) {
    if (error instanceof WorkerUnavailable) {
      return convertOnMainThread(source, options);
    }
    throw error;
  }
}

export function disposeConverter(): void {
  worker?.terminate();
  worker = null;
  pending.clear();
}
