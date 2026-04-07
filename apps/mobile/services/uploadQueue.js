"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadQueue = exports.UploadQueueService = exports.addUploadQueueListener = void 0;
const netinfo_1 = __importDefault(require("@react-native-community/netinfo"));
const storage_1 = require("../lib/storage");
const database_1 = require("../lib/database");
const upload_1 = require("../lib/upload");
const api_1 = require("../lib/api");
const writeQueue_1 = require("../lib/writeQueue");
const uploadQueueListeners = new Set();
function addUploadQueueListener(listener) {
    uploadQueueListeners.add(listener);
    return () => {
        uploadQueueListeners.delete(listener);
    };
}
exports.addUploadQueueListener = addUploadQueueListener;
function emitUploadQueueEvent(event) {
    if (!event.local_id)
        return;
    uploadQueueListeners.forEach((listener) => {
        try {
            listener(event);
        }
        catch {
            // ignore listener errors
        }
    });
}
function updateClipStatusWithEvent(local_id, status, progress, reason) {
    (0, database_1.updateClipStatus)(local_id, status, progress);
    const event = { local_id, status };
    if (typeof progress === 'number') {
        event.progress = progress;
    }
    if (typeof reason === 'string' && reason.length > 0) {
        event.reason = reason;
    }
    emitUploadQueueEvent(event);
}
class UploadQueueService {
    _queue = [];
    _active = new Map();
    _retryTimers = new Map();
    _isConnected = null;
    MAX_CONCURRENT = 2;
    constructor() {
        this._queue = (0, storage_1.getUploadQueue)();
        const interrupted = [];
        this._queue = this._queue.map((item) => {
            if (item.status === 'uploading') {
                interrupted.push(item.local_id);
                return { ...item, status: 'queued' };
            }
            return item;
        });
        if (interrupted.length > 0) {
            (0, storage_1.setUploadQueue)(this._queue);
            interrupted.forEach((local_id) => updateClipStatusWithEvent(local_id, 'queued'));
        }
        const now = Date.now();
        const dueForRetry = [];
        for (const item of this._queue) {
            if (item.status !== 'queued' || item.next_retry_at == null)
                continue;
            if (item.next_retry_at > now) {
                this._scheduleRetry(item);
            }
            else {
                item.next_retry_at = undefined;
                dueForRetry.push(item.local_id);
            }
        }
        if (dueForRetry.length > 0) {
            (0, storage_1.setUploadQueue)(this._queue);
        }
        netinfo_1.default.addEventListener((state) => {
            const connected = state.isConnected === true;
            this._isConnected = connected;
            if (connected)
                this.processQueue();
            else
                this._pauseAll();
        });
        void netinfo_1.default.fetch().then((state) => {
            this._isConnected = state.isConnected === true;
            if (dueForRetry.length > 0 && state.isConnected === true) {
                this.processQueue();
            }
        });
    }
    enqueue(item) {
        const next = { ...item, attempt_count: 0, status: 'queued' };
        this._queue.push(next);
        (0, storage_1.setUploadQueue)(this._queue);
        updateClipStatusWithEvent(item.local_id, 'queued');
        this.processQueue();
    }
    /**
     * Resume queue processing after user intent (e.g. manual retry, post-upgrade).
     * Call this when the user has upgraded or explicitly chooses to retry uploads.
     */
    resumeQueue() {
        this.processQueue();
    }
    retryClip(local_id) {
        const idx = this._queue.findIndex((q) => q.local_id === local_id && q.status === 'failed');
        if (idx < 0)
            return;
        this._queue[idx] = {
            ...this._queue[idx],
            attempt_count: 0,
            status: 'queued',
            next_retry_at: undefined,
        };
        (0, storage_1.setUploadQueue)(this._queue);
        updateClipStatusWithEvent(local_id, 'queued');
        this.processQueue();
    }
    onAppForeground() {
        this.processQueue();
    }
    processQueue() {
        if (this._isConnected === false)
            return;
        const now = Date.now();
        const eligible = this._queue.filter((q) => q.status === 'queued' && (q.next_retry_at ?? 0) <= now);
        const capacity = this.MAX_CONCURRENT - this._active.size;
        if (capacity <= 0)
            return;
        eligible.slice(0, capacity).forEach((item) => {
            void this._startUpload(item);
        });
    }
    _scheduleRetry(item) {
        if (item.next_retry_at == null)
            return;
        const existing = this._retryTimers.get(item.local_id);
        if (existing)
            clearTimeout(existing);
        const delay = Math.max(0, item.next_retry_at - Date.now());
        const t = setTimeout(() => {
            this._retryTimers.delete(item.local_id);
            this.processQueue();
        }, delay);
        this._retryTimers.set(item.local_id, t);
    }
    async _startUpload(item) {
        if (this._active.has(item.local_id))
            return;
        if (this._isConnected === false)
            return;
        try {
            const storedUrl = (0, storage_1.getTusUrls)()[item.local_id];
            const itemUrl = item.tus_upload_url;
            if (storedUrl) {
                item.tus_upload_url = storedUrl;
            }
            else if (itemUrl) {
                item.tus_upload_url = itemUrl;
                (0, storage_1.setTusUrls)({ ...(0, storage_1.getTusUrls)(), [item.local_id]: itemUrl });
            }
            else {
                const requestBody = item.session_id
                    ? {
                        session_id: item.session_id,
                        local_id: item.local_id,
                        recorded_at: item.recorded_at,
                        label: item.label,
                        ...(item.dual_pair_id ? { dual_pair_id: item.dual_pair_id } : {}),
                        ...(item.clip_type ? { clip_type: item.clip_type } : {}),
                    }
                    : {
                        local_id: item.local_id,
                        recorded_at: item.recorded_at,
                        label: item.label,
                        ...(item.dual_pair_id ? { dual_pair_id: item.dual_pair_id } : {}),
                        ...(item.clip_type ? { clip_type: item.clip_type } : {}),
                    };
                const res = await fetch(`${api_1.API_BASE}/clips/upload-url`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${item.token}`,
                    },
                    body: JSON.stringify(requestBody),
                });
                const data = (await res.json());
                if (res.status === 403 && 'error' in data && data.error === 'plan_limit_reached') {
                    const currentIdx = this._queue.findIndex((q) => q.local_id === item.local_id);
                    if (currentIdx >= 0) {
                        const current = this._queue[currentIdx];
                        current.status = 'failed';
                        (0, storage_1.setUploadQueue)(this._queue);
                        updateClipStatusWithEvent(item.local_id, 'failed', undefined, 'plan_limit_reached');
                    }
                    return;
                }
                if (!res.ok) {
                    const errMsg = ('error' in data && data.error) || res.statusText;
                    throw new Error(errMsg);
                }
                const clip_id = data.clip_id;
                const upload_url = data.upload_url;
                const mux_upload_id = data.mux_upload_id;
                item.clip_id = clip_id;
                item.tus_upload_url = upload_url;
                item.mux_upload_id = mux_upload_id;
                (0, database_1.updateClipServerData)(item.local_id, clip_id);
                (0, storage_1.setTusUrls)({ ...(0, storage_1.getTusUrls)(), [item.local_id]: upload_url });
                // If the clip was saved with a section label, create the section_clips
                // association now that we have the authoritative server clip_id.
                if (item.section_label && item.session_id) {
                    void this._createSectionAssignment(clip_id, item.session_id, item.section_label, item.token);
                }
            }
            item.status = 'uploading';
            (0, storage_1.setUploadQueue)(this._queue);
            updateClipStatusWithEvent(item.local_id, 'uploading', 0);
            const handle = (0, upload_1.uploadClipToMux)(item.tus_upload_url, item.file_uri, (pct) => {
                updateClipStatusWithEvent(item.local_id, 'uploading', pct);
            });
            this._active.set(item.local_id, { abort: handle.abort });
            await handle.promise;
            this._active.delete(item.local_id);
            this._queue = this._queue.filter((q) => q.local_id !== item.local_id);
            (0, storage_1.setUploadQueue)(this._queue);
            const nextUrls = (0, storage_1.getTusUrls)();
            delete nextUrls[item.local_id];
            (0, storage_1.setTusUrls)(nextUrls);
            updateClipStatusWithEvent(item.local_id, 'processing');
            this.processQueue();
        }
        catch (error) {
            this._active.delete(item.local_id);
            const currentIdx = this._queue.findIndex((q) => q.local_id === item.local_id);
            if (currentIdx < 0)
                return;
            const current = this._queue[currentIdx];
            const isAbort = error instanceof upload_1.UploadAbortedError ||
                (error &&
                    typeof error === 'object' &&
                    'name' in error &&
                    error.name === 'UploadAbortedError');
            if (isAbort) {
                if (current.status === 'uploading') {
                    current.status = 'queued';
                    current.next_retry_at = undefined;
                    (0, storage_1.setUploadQueue)(this._queue);
                    updateClipStatusWithEvent(current.local_id, 'queued');
                }
                this.processQueue();
                return;
            }
            current.attempt_count += 1;
            if (current.attempt_count < 5) {
                const delay = Math.min(60000, 2000 * Math.pow(2, current.attempt_count)) +
                    Math.random() * 1000;
                current.next_retry_at = Date.now() + delay;
                current.status = 'queued';
                (0, storage_1.setUploadQueue)(this._queue);
                updateClipStatusWithEvent(current.local_id, 'queued');
                this._scheduleRetry(current);
            }
            else {
                current.status = 'failed';
                (0, storage_1.setUploadQueue)(this._queue);
                updateClipStatusWithEvent(current.local_id, 'failed');
            }
            this.processQueue();
        }
    }
    /** Best-effort: register a clip with a section after its server ID is known. */
    async _createSectionAssignment(clipId, sessionId, sectionLabel, token) {
        try {
            const res = await fetch(`${api_1.API_BASE}/sessions/${sessionId}/assembly/section-clip`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ clip_id: clipId, section_label: sectionLabel }),
            });
            if (!res.ok) {
                (0, writeQueue_1.enqueue)({
                    endpoint: `${api_1.API_BASE}/sessions/${sessionId}/assembly/section-clip`,
                    method: 'POST',
                    body: JSON.stringify({ clip_id: clipId, section_label: sectionLabel }),
                    timestamp: Date.now(),
                });
            }
        }
        catch (error) {
            if ((0, writeQueue_1.isNetworkError)(error)) {
                (0, writeQueue_1.enqueue)({
                    endpoint: `${api_1.API_BASE}/sessions/${sessionId}/assembly/section-clip`,
                    method: 'POST',
                    body: JSON.stringify({ clip_id: clipId, section_label: sectionLabel }),
                    timestamp: Date.now(),
                });
            }
        }
    }
    _pauseAll() {
        for (const [local_id, handle] of this._active.entries()) {
            try {
                handle.abort();
            }
            catch {
                // ignore
            }
            const idx = this._queue.findIndex((q) => q.local_id === local_id);
            if (idx >= 0)
                this._queue[idx].status = 'queued';
            updateClipStatusWithEvent(local_id, 'queued');
        }
        (0, storage_1.setUploadQueue)(this._queue);
        this._active.clear();
    }
}
exports.UploadQueueService = UploadQueueService;
exports.uploadQueue = new UploadQueueService();
//# sourceMappingURL=uploadQueue.js.map