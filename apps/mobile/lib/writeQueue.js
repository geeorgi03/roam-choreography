"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.drainQueue = exports.getQueueLength = exports.enqueueWrite = exports.isNetworkError = void 0;
const expo_crypto_1 = require("expo-crypto");
let writeQueueStorage = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { MMKV: MMKVClass } = require('react-native-mmkv');
    writeQueueStorage = new MMKVClass({ id: 'write-queue' });
}
catch (e) {
    console.error('[writeQueue] MMKV init failed:', e);
}
const WRITE_QUEUE_KEY = 'write-queue:items';
function getQueue() {
    if (!writeQueueStorage)
        return [];
    const raw = writeQueueStorage.getString(WRITE_QUEUE_KEY);
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
function setQueue(queue) {
    if (!writeQueueStorage)
        return;
    writeQueueStorage.set(WRITE_QUEUE_KEY, JSON.stringify(queue));
}
function isNetworkError(error) {
    if (!(error instanceof TypeError))
        return false;
    const message = error.message.toLowerCase();
    return message.includes('network') || message.includes('fetch') || message.includes('net::');
}
exports.isNetworkError = isNetworkError;
function enqueueWrite(write) {
    const queue = getQueue();
    queue.push({
        id: (0, expo_crypto_1.randomUUID)(),
        endpoint: write.endpoint,
        method: write.method,
        body: write.body,
        timestamp: Date.now(),
    });
    setQueue(queue);
}
exports.enqueueWrite = enqueueWrite;
function getQueueLength() {
    return getQueue().length;
}
exports.getQueueLength = getQueueLength;
async function drainQueue(accessToken) {
    const queue = getQueue().sort((a, b) => a.timestamp - b.timestamp);
    if (queue.length === 0)
        return;
    const remaining = [];
    for (let i = 0; i < queue.length; i++) {
        const write = queue[i];
        try {
            const res = await fetch(write.endpoint, {
                method: write.method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: write.body,
            });
            if (!res.ok) {
                // Non-network HTTP failures should be dropped so they do not block replay.
                continue;
            }
        }
        catch (error) {
            if (isNetworkError(error)) {
                remaining.push(write, ...queue.slice(i + 1));
                break;
            }
            // Non-network errors should be dropped so replay can proceed.
        }
    }
    setQueue(remaining);
}
exports.drainQueue = drainQueue;
//# sourceMappingURL=writeQueue.js.map