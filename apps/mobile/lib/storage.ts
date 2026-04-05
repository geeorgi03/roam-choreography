import type { MMKV } from 'react-native-mmkv';
import type { QueueItem } from '../services/uploadQueue';

let storage: MMKV | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { MMKV: MMKVClass } = require('react-native-mmkv') as typeof import('react-native-mmkv');
  storage = new MMKVClass({ id: 'roam-store' });
} catch (e) {
  console.error('[storage] MMKV init failed, upload queue will not persist:', e);
}
export { storage };

const UPLOAD_QUEUE_KEY = 'upload_queue';
const TUS_URLS_KEY = 'tus_urls';

export function getUploadQueue(): QueueItem[] {
  if (!storage) return [];
  const raw = storage.getString(UPLOAD_QUEUE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as QueueItem[]) : [];
  } catch {
    return [];
  }
}

export function setUploadQueue(queue: QueueItem[]): void {
  if (!storage) return;
  storage.set(UPLOAD_QUEUE_KEY, JSON.stringify(queue));
}

export function getTusUrls(): Record<string, string> {
  if (!storage) return {};
  const raw = storage.getString(TUS_URLS_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
    return {};
  } catch {
    return {};
  }
}

export function setTusUrls(urls: Record<string, string>): void {
  if (!storage) return;
  storage.set(TUS_URLS_KEY, JSON.stringify(urls));
}

// loupe:<mux_playback_id ?? clip_id> → { x: number, y: number, zoom: number }
export function getLoupeState(key: string): { x: number; y: number; zoom: number } | null {
  if (!storage) return null;
  const raw = storage.getString(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === 'object' &&
      'x' in parsed &&
      'y' in parsed &&
      'zoom' in parsed &&
      typeof parsed.x === 'number' &&
      typeof parsed.y === 'number' &&
      typeof parsed.zoom === 'number'
    ) {
      return { x: parsed.x, y: parsed.y, zoom: parsed.zoom };
    }
    return null;
  } catch {
    return null;
  }
}

export function setLoupeState(key: string, state: { x: number; y: number; zoom: number }): void {
  if (!storage) return;
  storage.set(key, JSON.stringify(state));
}
