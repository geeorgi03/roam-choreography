/** Frames × grid cells — coarse pose/motion signature for marking search. */
export const MARKING_FRAME_COUNT = 8;
export const MARKING_GRID_SIZE = 8;
export const MARKING_FINGERPRINT_DIMS = MARKING_FRAME_COUNT * MARKING_GRID_SIZE * MARKING_GRID_SIZE;

/** Sample times (seconds) for short marked clips (~8s window). */
export const MARKING_SAMPLE_TIMES_SEC = [0.4, 1.2, 2.0, 2.8, 3.6, 4.4, 5.2, 6.0] as const;

export function normalizeVector(v: number[]): number[] {
  let sumSq = 0;
  for (const x of v) sumSq += x * x;
  const norm = Math.sqrt(sumSq) || 1;
  return v.map((x) => x / norm);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  if (len === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < len; i += 1) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom > 0 ? dot / denom : 0;
}

/** One frame: 8×8 grayscale cells (0–1), row-major. */
export function frameFromGrayscaleGrid(pixels: number[], width: number, height: number): number[] {
  const grid = MARKING_GRID_SIZE;
  const out: number[] = [];
  for (let gy = 0; gy < grid; gy += 1) {
    for (let gx = 0; gx < grid; gx += 1) {
      const x0 = Math.floor((gx / grid) * width);
      const x1 = Math.floor(((gx + 1) / grid) * width);
      const y0 = Math.floor((gy / grid) * height);
      const y1 = Math.floor(((gy + 1) / grid) * height);
      let sum = 0;
      let count = 0;
      for (let y = y0; y < y1; y += 1) {
        for (let x = x0; x < x1; x += 1) {
          const idx = y * width + x;
          if (idx < pixels.length) {
            sum += pixels[idx]!;
            count += 1;
          }
        }
      }
      out.push(count > 0 ? sum / count : 0);
    }
  }
  return out;
}

export function fingerprintFromFrames(frames: number[][]): number[] {
  const flat = frames.flat();
  if (flat.length !== MARKING_FINGERPRINT_DIMS) {
    throw new Error(
      `Expected ${MARKING_FINGERPRINT_DIMS} values, got ${flat.length}`
    );
  }
  return normalizeVector(flat);
}

export function rankBySimilarity(
  query: number[],
  candidates: { clip_id: string; fingerprint: number[] }[],
  limit: number
): { clip_id: string; score: number }[] {
  const scored = candidates.map((c) => ({
    clip_id: c.clip_id,
    score: cosineSimilarity(query, c.fingerprint),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
