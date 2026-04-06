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

let loupeStorage: MMKV | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { MMKV: MMKVClass } = require('react-native-mmkv') as typeof import('react-native-mmkv');
  loupeStorage = new MMKVClass({ id: 'loupe-state' });
} catch (e) {
  console.error('[storage] Loupe MMKV init failed:', e);
}

let sessionModeStorage: MMKV | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { MMKV: MMKVClass } = require('react-native-mmkv') as typeof import('react-native-mmkv');
  sessionModeStorage = new MMKVClass({ id: 'session-mode' });
} catch (e) {
  console.error('[storage] Session mode MMKV init failed:', e);
}

const UPLOAD_QUEUE_KEY = 'upload_queue';
const TUS_URLS_KEY = 'tus_urls';

type LoupeState = { x: number; y: number; zoom: number };

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

export function getLoupeState(key: string): LoupeState | null {
  if (!loupeStorage) return null;
  const raw = loupeStorage.getString(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const state = parsed as Record<string, unknown>;
      if (typeof state.x === 'number' && typeof state.y === 'number' && typeof state.zoom === 'number') {
        return { x: state.x, y: state.y, zoom: state.zoom };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function setLoupeState(key: string, state: LoupeState): void {
  if (!loupeStorage) return;
  loupeStorage.set(key, JSON.stringify(state));
}

export function getSessionMode(sessionId: string): boolean {
  if (!sessionModeStorage) return true;
  const raw = sessionModeStorage.getString(`session-mode:${sessionId}`);
  if (raw === undefined || raw === null) return true;
  try {
    return raw === '1' || raw === 'true';
  } catch {
    return true;
  }
}

export function setSessionMode(sessionId: string, value: boolean): void {
  if (!sessionModeStorage) return;
  sessionModeStorage.set(`session-mode:${sessionId}`, value ? '1' : '0');
}

const ACTIVE_SESSION_ID_KEY = 'active_session_id';
const ACTIVE_SECTION_PREFIX = 'active_section:';

export function setActiveSessionId(sessionId: string): void {
  if (!storage) return;
  storage.set(ACTIVE_SESSION_ID_KEY, sessionId);
}

export function getActiveSessionId(): string | null {
  if (!storage) return null;
  return storage.getString(ACTIVE_SESSION_ID_KEY) ?? null;
}

export function setActiveSection(sessionId: string, section: string): void {
  if (!storage) return;
  storage.set(`${ACTIVE_SECTION_PREFIX}${sessionId}`, section);
}

export function getActiveSection(sessionId: string): string | null {
  if (!storage) return null;
  return storage.getString(`${ACTIVE_SECTION_PREFIX}${sessionId}`) ?? null;
}

const ACTIVE_SECTION_ID_KEY = 'active_section_id';

export function setActiveSectionId(sectionId: string): void {
  if (!storage) return;
  storage.set(ACTIVE_SECTION_ID_KEY, sectionId);
}

export function getActiveSectionId(): string | null {
  if (!storage) return null;
  return storage.getString(ACTIVE_SECTION_ID_KEY) ?? null;
}

