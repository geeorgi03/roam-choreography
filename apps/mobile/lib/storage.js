"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setTusUrls = exports.getTusUrls = exports.setUploadQueue = exports.getUploadQueue = exports.storage = void 0;
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
//# sourceMappingURL=storage.js.map