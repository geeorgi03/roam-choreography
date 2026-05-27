import type { MMKV } from 'react-native-mmkv';

export type ChoreographyDrawStroke = {
  id: string;
  d: string;
  color: string;
  width: number;
};

let drawStorage: MMKV | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { MMKV: MMKVClass } = require('react-native-mmkv') as typeof import('react-native-mmkv');
  drawStorage = new MMKVClass({ id: 'choreography-draw' });
} catch (e) {
  console.error('[choreographyDrawStrokes] MMKV init failed:', e);
}

function storageKey(sessionId: string, sectionLabel: string): string {
  return `strokes:${sessionId}:${sectionLabel}`;
}

export function getDrawStrokes(sessionId: string, sectionLabel: string): ChoreographyDrawStroke[] {
  if (!drawStorage || !sessionId) return [];
  const raw = drawStorage.getString(storageKey(sessionId, sectionLabel));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s): s is ChoreographyDrawStroke =>
        !!s &&
        typeof s === 'object' &&
        typeof (s as ChoreographyDrawStroke).id === 'string' &&
        typeof (s as ChoreographyDrawStroke).d === 'string' &&
        typeof (s as ChoreographyDrawStroke).color === 'string' &&
        typeof (s as ChoreographyDrawStroke).width === 'number'
    );
  } catch {
    return [];
  }
}

export function setDrawStrokes(
  sessionId: string,
  sectionLabel: string,
  strokes: ChoreographyDrawStroke[]
): void {
  if (!drawStorage || !sessionId) return;
  drawStorage.set(storageKey(sessionId, sectionLabel), JSON.stringify(strokes));
}
