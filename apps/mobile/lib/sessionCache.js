"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCachedSession = exports.cacheSession = exports.getCachedSessionIndex = void 0;
let sessionCacheStorage = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { MMKV: MMKVClass } = require('react-native-mmkv');
    sessionCacheStorage = new MMKVClass({ id: 'session-cache' });
}
catch (e) {
    console.error('[sessionCache] MMKV init failed:', e);
}
const SESSION_CACHE_INDEX_KEY = 'session-cache:index';
const SESSION_CACHE_KEY_PREFIX = 'session-cache:';
const MAX_CACHED_SESSIONS = 5;
function getCacheKey(sessionId) {
    return `${SESSION_CACHE_KEY_PREFIX}${sessionId}`;
}
function getCachedSessionIndex() {
    if (!sessionCacheStorage)
        return [];
    const raw = sessionCacheStorage.getString(SESSION_CACHE_INDEX_KEY);
    if (!raw)
        return [];
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed))
            return [];
        return parsed.filter((id) => typeof id === 'string');
    }
    catch {
        return [];
    }
}
exports.getCachedSessionIndex = getCachedSessionIndex;
function setCachedSessionIndex(order) {
    if (!sessionCacheStorage)
        return;
    sessionCacheStorage.set(SESSION_CACHE_INDEX_KEY, JSON.stringify(order));
}
function cacheSession(sessionId, payload) {
    if (!sessionCacheStorage || !sessionId)
        return;
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
    }
    catch (e) {
        console.error('[sessionCache] Failed to cache session:', e);
    }
}
exports.cacheSession = cacheSession;
function getCachedSession(sessionId) {
    if (!sessionCacheStorage || !sessionId)
        return null;
    const raw = sessionCacheStorage.getString(getCacheKey(sessionId));
    if (!raw)
        return null;
    try {
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
exports.getCachedSession = getCachedSession;
//# sourceMappingURL=sessionCache.js.map