export type ConvertOptions = {
  mime: string;
  quality: number;
  width: number;
  height: number;
  background: string;
  /** When set, the encoder searches for a quality that fits this many bytes. */
  targetBytes?: number;
};

export type ConvertRequest = {
  id: number;
  source: Blob;
  options: ConvertOptions;
};

export type ConvertResponse = {
  id: number;
  ok: boolean;
  blob?: Blob;
  width?: number;
  height?: number;
  quality?: number;
  /** False when even the lowest quality could not reach the requested size. */
  reachedTarget?: boolean;
  error?: string;
};
