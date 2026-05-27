import Jimp from 'jimp';
import {
  MARKING_FINGERPRINT_DIMS,
  MARKING_FRAME_COUNT,
  MARKING_GRID_SIZE,
  frameFromGrayscaleGrid,
  fingerprintFromFrames,
  normalizeVector,
} from '@roam/marking-fingerprint';

async function frameFromImageBuffer(buf: Buffer): Promise<number[]> {
  const image = await Jimp.read(buf);
  image.greyscale();
  image.resize(MARKING_GRID_SIZE * 4, MARKING_GRID_SIZE * 4);
  const { width, height } = image.bitmap;
  const pixels: number[] = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const rgba = Jimp.intToRGBA(image.getPixelColor(x, y));
      pixels.push(rgba.r / 255);
    }
  }
  return frameFromGrayscaleGrid(pixels, width, height);
}

export async function fingerprintFromImageBuffers(buffers: Buffer[]): Promise<number[]> {
  if (buffers.length === 0) {
    throw new Error('At least one image required');
  }
  const frames: number[][] = [];
  for (const buf of buffers.slice(0, MARKING_FRAME_COUNT)) {
    frames.push(await frameFromImageBuffer(buf));
  }
  while (frames.length < MARKING_FRAME_COUNT) {
    frames.push(frames[frames.length - 1] ?? new Array(MARKING_GRID_SIZE * MARKING_GRID_SIZE).fill(0));
  }
  return fingerprintFromFrames(frames);
}

export function parseFingerprintJson(raw: unknown): number[] | null {
  if (!Array.isArray(raw)) return null;
  const nums = raw.map((v) => Number(v)).filter((n) => Number.isFinite(n));
  if (nums.length !== MARKING_FINGERPRINT_DIMS) return null;
  return normalizeVector(nums);
}

export async function fetchMuxThumbnail(url: string): Promise<Buffer> {
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`Thumbnail fetch failed: ${res.status}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

export function muxThumbnailUrl(playbackId: string, timeSec: number): string {
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?time=${timeSec}&width=320`;
}
