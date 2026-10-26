export type JobStatus = "ready" | "converting" | "done" | "error";

export type Job = {
  id: string;
  name: string;
  source: Blob;
  size: number;
  previewUrl: string;
  width?: number;
  height?: number;
  status: JobStatus;
  output?: Blob;
  outputUrl?: string;
  outputName?: string;
  outWidth?: number;
  outHeight?: number;
  outputQuality?: number;
  outputLossy?: boolean;
  targetMissed?: boolean;
  error?: string;
};

/** A finished multi-page PDF assembled from the batch. */
export type PdfResult = {
  url: string;
  size: number;
  name: string;
  pages: number;
};

let sequence = 0;

export function nextJobId(): string {
  sequence += 1;
  return `job-${sequence}-${Math.random().toString(36).slice(2, 7)}`;
}
