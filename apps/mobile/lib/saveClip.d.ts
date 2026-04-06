export type SaveClipResult = {
    ok: true;
    local_id: string;
} | {
    ok: false;
    reason: 'plan_limit_reached';
} | {
    ok: false;
    reason: 'error';
    message: string;
};
/**
 * Persists clip metadata locally and enqueues for upload.
 * Accepts an optional sectionLabel so the upload queue can create a
 * section_clips association once the server clip_id is known.
 */
export declare function saveClip(sessionId: string, fileUri: string, label: string, token: string, sectionLabel?: string, dualPairId?: string, clipType?: string): Promise<SaveClipResult>;
/**
 * Persists an inbox clip locally and enqueues for upload.
 * The server will create the inbox clip row on first /clips/upload-url call.
 */
export declare function saveInboxClip(fileUri: string, label: string, token: string): Promise<SaveClipResult>;
//# sourceMappingURL=saveClip.d.ts.map