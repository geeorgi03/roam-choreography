"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setLoupeState = exports.getLoupeState = exports.setTusUrls = exports.getTusUrls = exports.setUploadQueue = exports.getUploadQueue = exports.storage = void 0;
let storage = null;
exports.storage = storage;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { MMKV: MMKVClass } = require('react-native-mmkv');
    exports.storage = storage = new MMKVClass({ id: 'roam-store' });
}
catch (e) {
    console.error('[storage] MMKV init failed, upload queue will not persist:', e);
}
let loupeStorage = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { MMKV: MMKVClass } = require('react-native-mmkv');
    loupeStorage = new MMKVClass({ id: 'loupe-state' });
}
catch (e) {
    console.error('[storage] Loupe MMKV init failed:', e);
}
const UPLOAD_QUEUE_KEY = 'upload_queue';
const TUS_URLS_KEY = 'tus_urls';
function getUploadQueue() {
    if (!storage)
        return [];
    const raw = storage.getString(UPLOAD_QUEUE_KEY);
    if (!raw)
        return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    }
    catch {
        return [];
    }
}
exports.getUploadQueue = getUploadQueue;
function setUploadQueue(queue) {
    if (!storage)
        return;
    storage.set(UPLOAD_QUEUE_KEY, JSON.stringify(queue));
}
exports.setUploadQueue = setUploadQueue;
function getTusUrls() {
    if (!storage)
        return {};
    const raw = storage.getString(TUS_URLS_KEY);
    if (!raw)
        return {};
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed;
        }
        return {};
    }
    catch {
        return {};
    }
}
exports.getTusUrls = getTusUrls;
function setTusUrls(urls) {
    if (!storage)
        return;
    storage.set(TUS_URLS_KEY, JSON.stringify(urls));
}
exports.setTusUrls = setTusUrls;
function getLoupeState(key) {
    if (!loupeStorage)
        return null;
    const raw = loupeStorage.getString(key);
    if (!raw)
        return null;
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            const state = parsed;
            if (typeof state.x === 'number' && typeof state.y === 'number' && typeof state.zoom === 'number') {
                return { x: state.x, y: state.y, zoom: state.zoom };
            }
        }
        return null;
    }
    catch {
        return null;
    }
}
exports.getLoupeState = getLoupeState;
function setLoupeState(key, state) {
    if (!loupeStorage)
        return;
    loupeStorage.set(key, JSON.stringify(state));
}
exports.setLoupeState = setLoupeState;
//# sourceMappingURL=storage.js.map