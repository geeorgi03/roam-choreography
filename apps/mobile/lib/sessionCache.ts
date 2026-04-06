import type { MMKV } from 'react-native-mmkv';
import type { Session } from '@roam/types';

export type CachedSession = {
  session: {
    name: string;
    phrase: string | null;
    quality_target: { clip_url: string; timestamp_ms: number; source_clip_id: string } | null;
  };
  sections: unknown[];
  clips: unknown[];
  cachedAt: number;
};

export type CachedSessionListItem = Pick<Session, 'id' | 'name' | 'created_at'>;

let sessionCacheStorage: MMKV | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { MMKV: MMKVClass } = require('react-native-mmkv') as typeof import('react-native-mmkv');
  sessionCacheStorage = new MMKVClass({ id: 'session-cache' });
} catch (e) {
  console.error('[sessionCache] MMKV init failed:', e);
}

const SESSION_CACHE_INDEX_KEY = 'session-cache:index';
const SESSION_CACHE_KEY_PREFIX = 'session-cache:';
const SESSION_LIST_KEY = 'session-cache:list';
const MAX_CACHED_SESSIONS = 5;

function getCacheKey(sessionId: string): string {
  return `${SESSION_CACHE_KEY_PREFIX}${sessionId}`;
}

export function getCachedSessionIndex(): string[] {
  if (!sessionCacheStorage) return [];
  const raw = sessionCacheStorage.getString(SESSION_CACHE_INDEX_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string');
  } catch {
    return [];
  }
}

function setCachedSessionIndex(order: string[]): void {
  if (!sessionCacheStorage) return;
  sessionCacheStorage.set(SESSION_CACHE_INDEX_KEY, JSON.stringify(order));
}

export function cacheSession(
  sessionId: string,
  payload: {
    session: CachedSession['session'];
    sections: CachedSession['sections'];
    clips: CachedSession['clips'];
    cachedAt: number;
  }
): void {
  if (!sessionCacheStorage || !sessionId) return;
  try {
    sessionCacheStorage.set(getCacheKey(sessionId), JSON.stringify(payload));
    const currentOrder = getCachedSessionIndex().filter((id) => id !== sessionId);
    const nextOrder = [sessionId, ...currentOrder];

    if (nextOrder.length > MAX_CACHED_SESSIONS) {
      const evicted = nextOrder.slice(MAX_CACHED_SESSIONS);
      evicted.forEach((id) => {
        sessionCacheStorage?.delete(getCacheKey(id));
      });
    }

    setCachedSessionIndex(nextOrder.slice(0, MAX_CACHED_SESSIONS));
  } catch (e) {
    console.error('[sessionCache] Failed to cache session:', e);
  }
}

export function cacheSessionList(sessions: CachedSessionListItem[]): void {
  if (!sessionCacheStorage) return;
  const limited = sessions.slice(0, MAX_CACHED_SESSIONS);
  sessionCacheStorage.set(SESSION_LIST_KEY, JSON.stringify(limited));
}

export function getCachedSessionList(): CachedSessionListItem[] {
  if (!sessionCacheStorage) return [];
  const raw = sessionCacheStorage.getString(SESSION_LIST_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is CachedSessionListItem => {
      return (
        typeof item === 'object' &&
        item !== null &&
        typeof (item as { id?: unknown }).id === 'string' &&
        typeof (item as { name?: unknown }).name === 'string' &&
        typeof (item as { created_at?: unknown }).created_at === 'string'
      );
    });
  } catch {
    return [];
  }
}

export function getCachedSession(sessionId: string): CachedSession | null {
  if (!sessionCacheStorage || !sessionId) return null;
  const raw = sessionCacheStorage.getString(getCacheKey(sessionId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedSession;
  } catch {
    return null;
  }
}
