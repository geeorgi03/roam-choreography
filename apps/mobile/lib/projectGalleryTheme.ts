/** Thumbnail fills for Procreate-style project grid (Figma Make landing). */
export const PROJECT_THUMB_COLORS = [
  ['#6a1fa5', '#c44bff'],
  ['#e8a650', '#b35c1a'],
  ['#0a1628', '#3388ff'],
  ['#ff7c3a', '#ff4466'],
  ['#1a2a4a', '#44aaff'],
  ['#0a1a0a', '#44ff88'],
  ['#2a0a1a', '#ff2d6b'],
  ['#1a1a2e', '#8b7cf8'],
  ['#141428', '#6868a0'],
  ['#3d2200', '#e8a650'],
  ['#0a0a2a', '#2255b8'],
  ['#1a0d00', '#ff6eb4'],
] as const;

export function thumbColorsForIndex(index: number): readonly [string, string] {
  return PROJECT_THUMB_COLORS[index % PROJECT_THUMB_COLORS.length]!;
}

// Slightly deeper + softer than iOS system gray (closer to Procreate)
export const GALLERY_SHELL_BG = '#161618';
