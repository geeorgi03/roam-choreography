"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveInboxClip = exports.saveClip = void 0;
const database_1 = require("./database");
const uploadQueue_1 = require("../services/uploadQueue");
/**
 * Persists clip metadata locally and enqueues for upload.
 * Accepts an optional sectionLabel so the upload queue can create a
 * section_clips association once the server clip_id is known.
 */
async function saveClip(sessionId, fileUri, label, token, sectionLabel, dualPairId, clipType) {
    try {
        const existing = (0, database_1.getClipsForSession)(sessionId);
        const finalLabel = `Clip ${existing.length + 1}`;
        const local_id = crypto.randomUUID();
        const recorded_at = new Date().toISOString();
        (0, database_1.insertClip)({
            local_id,
            session_id: sessionId,
            dual_pair_id: dualPairId ?? null,
            label: finalLabel,
            recorded_at,
            file_uri: fileUri,
            upload_status: 'local',
            clip_type: clipType ?? null,
        });
        uploadQueue_1.uploadQueue.enqueue({
            local_id,
            session_id: sessionId,
            file_uri: fileUri,
            label: finalLabel,
            recorded_at,
            token,
            section_label: sectionLabel,
            dual_pair_id: dualPairId,
            clip_type: clipType,
        });
        return { ok: true, local_id };
    }
    catch (e) {
        return {
            ok: false,
            reason: 'error',
            message: e instanceof Error ? e.message : 'Failed to save clip',
        };
    }
}
exports.saveClip = saveClip;
/**
 * Persists an inbox clip locally and enqueues for upload.
 * The server will create the inbox clip row on first /clips/upload-url call.
 */
async function saveInboxClip(fileUri, label, token) {
    try {
        const local_id = crypto.randomUUID();
        const recorded_at = new Date().toISOString();
        (0, database_1.insertClip)({
            local_id,
            session_id: null,
            label,
            recorded_at,
            file_uri: fileUri,
            upload_status: 'local',
        });
        uploadQueue_1.uploadQueue.enqueue({
            local_id,
            session_id: null,
            file_uri: fileUri,
            label,
            recorded_at,
            token,
        });
        return { ok: true, local_id };
    }
    catch (e) {
        return {
            ok: false,
            reason: 'error',
            message: e instanceof Error ? e.message : 'Failed to save clip',
        };
    }
}
exports.saveInboxClip = saveInboxClip;
//# sourceMappingURL=saveClip.js.map