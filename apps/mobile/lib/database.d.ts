import type { SQLiteDatabase } from 'expo-sqlite';
/** Returns the SQLite database, or null if native module is unavailable. */
export declare function getDb(): SQLiteDatabase | null;
/** @deprecated Direct export kept for call-site compat; prefer getDb(). */
export declare const db: SQLiteDatabase;
export interface ClipRow {
    local_id: string;
    server_id: string | null;
    session_id: string | null;
    dual_pair_id?: string | null;
    parent_clip_id?: string | null;
    triggered_by_note_id?: string | null;
    label: string | null;
    recorded_at: string | null;
    file_uri: string | null;
    upload_status: string;
    upload_progress: number;
    mux_playback_id: string | null;
    source_url: string | null;
    move_name: string | null;
    style: string | null;
    energy: string | null;
    difficulty: string | null;
    bpm: number | null;
    notes: string | null;
    clip_type?: string | null;
}
export interface InsertClipRow {
    local_id: string;
    session_id: string | null;
    dual_pair_id?: string | null;
    parent_clip_id?: string | null;
    triggered_by_note_id?: string | null;
    label?: string | null;
    recorded_at?: string | null;
    file_uri?: string | null;
    upload_status?: string;
    upload_progress?: number;
    server_id?: string | null;
    mux_playback_id?: string | null;
    source_url?: string | null;
    move_name?: string | null;
    style?: string | null;
    energy?: string | null;
    difficulty?: string | null;
    bpm?: number | null;
    notes?: string | null;
    clip_type?: string | null;
}
export interface ClipTags {
    move_name?: string | null;
    style?: string | null;
    energy?: string | null;
    difficulty?: string | null;
    bpm?: number | null;
    notes?: string | null;
}
export interface ServerClipSnapshot {
    local_id?: string | null;
    server_id?: string | null;
    session_id: string;
    parent_clip_id?: string | null;
    triggered_by_note_id?: string | null;
    label?: string | null;
    recorded_at?: string | null;
    file_uri?: string | null;
    upload_status?: string | null;
    upload_progress?: number | null;
    mux_playback_id?: string | null;
    source_url?: string | null;
    move_name?: string | null;
    style?: string | null;
    energy?: string | null;
    difficulty?: string | null;
    bpm?: number | null;
    notes?: string | null;
    clip_type?: string | null;
}
/**
 * Upsert a server clip into local SQLite storage.
 * Ensures clips recorded by other participants are queryable through getClipsForSession().
 */
export declare function upsertClipFromServer(row: ServerClipSnapshot): string;
export declare function insertClip(row: InsertClipRow): void;
export declare function updateClipStatus(local_id: string, status: string, progress?: number): void;
export declare function updateClipServerData(local_id: string, server_id: string, mux_playback_id?: string | null): void;
export interface ClipServerUpdate {
    server_id?: string;
    upload_status?: string;
    mux_playback_id?: string | null;
    source_url?: string | null;
    move_name?: string | null;
    style?: string | null;
    energy?: string | null;
    difficulty?: string | null;
    bpm?: number | null;
    notes?: string | null;
    clip_type?: string | null;
}
/** Persist server-driven clip fields to SQLite so state survives app restart */
export declare function updateClipFromServer(local_id: string, update: ClipServerUpdate): void;
export declare function updateClipTags(local_id: string, tags: ClipTags): void;
export declare function getClipsForSession(session_id: string): ClipRow[];
export declare function assignLocalClipToSessionByServerId(server_id: string, session_id: string): void;
/** Returns all local clips with no session assignment (inbox clips). */
export declare function getInboxClips(): ClipRow[];
//# sourceMappingURL=database.d.ts.map