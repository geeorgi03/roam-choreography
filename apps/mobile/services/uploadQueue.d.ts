export interface QueueItem {
    local_id: string;
    session_id: string | null;
    file_uri: string;
    label: string;
    recorded_at: string;
    token: string;
    clip_id?: string;
    tus_upload_url?: string;
    mux_upload_id?: string;
    attempt_count: number;
    next_retry_at?: number;
    status: 'queued' | 'uploading' | 'failed';
    /** When set, a section_clips entry will be created server-side after upload. */
    section_label?: string;
    dual_pair_id?: string;
}
type UploadQueueStatus = QueueItem['status'] | 'processing';
export interface UploadQueueEvent {
    local_id: string;
    status?: UploadQueueStatus;
    progress?: number;
    reason?: string;
}
type UploadQueueListener = (event: UploadQueueEvent) => void;
export declare function addUploadQueueListener(listener: UploadQueueListener): () => void;
export declare class UploadQueueService {
    private _queue;
    private _active;
    private _retryTimers;
    private _isConnected;
    private readonly MAX_CONCURRENT;
    constructor();
    enqueue(item: Omit<QueueItem, 'attempt_count' | 'status'>): void;
    /**
     * Resume queue processing after user intent (e.g. manual retry, post-upgrade).
     * Call this when the user has upgraded or explicitly chooses to retry uploads.
     */
    resumeQueue(): void;
    retryClip(local_id: string): void;
    onAppForeground(): void;
    processQueue(): void;
    private _scheduleRetry;
    private _startUpload;
    /** Best-effort: register a clip with a section after its server ID is known. */
    private _createSectionAssignment;
    private _pauseAll;
}
export declare const uploadQueue: UploadQueueService;
export {};
//# sourceMappingURL=uploadQueue.d.ts.map