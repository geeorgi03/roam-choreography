"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInboxClips = exports.assignLocalClipToSessionByServerId = exports.getClipsForSession = exports.updateClipTags = exports.updateClipFromServer = exports.updateClipServerData = exports.updateClipStatus = exports.insertClip = exports.upsertClipFromServer = exports.db = exports.getDb = void 0;
const SCHEMA = `
CREATE TABLE IF NOT EXISTS clips (
  local_id TEXT PRIMARY KEY,
  server_id TEXT,
  session_id TEXT,
  dual_pair_id TEXT,
  parent_clip_id TEXT,
  triggered_by_note_id TEXT,
  label TEXT,
  recorded_at TEXT,
  file_uri TEXT,
  upload_status TEXT DEFAULT 'local',
  upload_progress INTEGER DEFAULT 0,
  mux_playback_id TEXT,
  source_url TEXT,
  move_name TEXT,
  style TEXT,
  energy TEXT,
  difficulty TEXT,
  bpm INTEGER,
  notes TEXT,
  clip_type TEXT
);
`;
const MIGRATION_20260318_SESSION_ID_NULLABLE = `
BEGIN;
ALTER TABLE clips RENAME TO clips_old;
CREATE TABLE clips (
  local_id TEXT PRIMARY KEY,
  server_id TEXT,
  session_id TEXT,
  dual_pair_id TEXT,
  label TEXT,
  recorded_at TEXT,
  file_uri TEXT,
  upload_status TEXT DEFAULT 'local',
  upload_progress INTEGER DEFAULT 0,
  mux_playback_id TEXT,
  source_url TEXT,
  move_name TEXT,
  style TEXT,
  energy TEXT,
  difficulty TEXT,
  bpm INTEGER,
  notes TEXT
);
INSERT INTO clips (
  local_id, server_id, session_id, dual_pair_id, label, recorded_at, file_uri,
  upload_status, upload_progress, mux_playback_id, source_url,
  move_name, style, energy, difficulty, bpm, notes
)
SELECT
  local_id, server_id, session_id, NULL, label, recorded_at, file_uri,
  upload_status, upload_progress, mux_playback_id, NULL,
  move_name, style, energy, difficulty, bpm, notes
FROM clips_old;
DROP TABLE clips_old;
COMMIT;
`;
const MIGRATION_DUAL_PAIR_ID = 'ALTER TABLE clips ADD COLUMN dual_pair_id TEXT;';
const MIGRATION_CLIP_TYPE = 'ALTER TABLE clips ADD COLUMN clip_type TEXT;';
const MIGRATION_SOURCE_URL = 'ALTER TABLE clips ADD COLUMN source_url TEXT;';
const MIGRATION_PARENT_CLIP_ID = 'ALTER TABLE clips ADD COLUMN parent_clip_id TEXT;';
const MIGRATION_TRIGGERED_BY_NOTE_ID = 'ALTER TABLE clips ADD COLUMN triggered_by_note_id TEXT;';
let _db = null;
let _dbError = null;
let _dbInitialized = false;
function initDb() {
    if (_dbInitialized)
        return _db;
    _dbInitialized = true;
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { openDatabaseSync } = require('expo-sqlite');
        _db = openDatabaseSync('roam.db');
        _db.execSync('SELECT 1');
        _db.execSync(SCHEMA);
        // One-time migration: allow inbox clips (session_id nullable)
        try {
            const info = _db.getAllSync('PRAGMA table_info(clips)');
            const sessionCol = info?.find?.((c) => c.name === 'session_id');
            if (sessionCol && sessionCol.notnull === 1) {
                _db.execSync(MIGRATION_20260318_SESSION_ID_NULLABLE);
            }
        }
        catch {
            // If PRAGMA/migration fails, keep DB usable for session clips.
        }
        // One-time migration: add dual_pair_id for future dual-camera pairing.
        try {
            const info = _db.getAllSync('PRAGMA table_info(clips)');
            const dualPairCol = info?.find?.((c) => c.name === 'dual_pair_id');
            if (!dualPairCol) {
                _db.execSync(MIGRATION_DUAL_PAIR_ID);
            }
        }
        catch {
            // If PRAGMA/migration fails, keep DB usable for single clips.
        }
        // One-time migration: add clip_type for MINE/REF distinction.
        try {
            const info = _db.getAllSync('PRAGMA table_info(clips)');
            const clipTypeCol = info?.find?.((c) => c.name === 'clip_type');
            if (!clipTypeCol) {
                _db.execSync(MIGRATION_CLIP_TYPE);
            }
        }
        catch {
            // If PRAGMA/migration fails, keep DB usable for existing clips.
        }
        // One-time migration: add source_url for YouTube content.
        try {
            const info = _db.getAllSync('PRAGMA table_info(clips)');
            const sourceUrlCol = info?.find?.((c) => c.name === 'source_url');
            if (!sourceUrlCol) {
                _db.execSync(MIGRATION_SOURCE_URL);
            }
        }
        catch {
            // If PRAGMA/migration fails, keep DB usable for existing clips.
        }
        // One-time migration: add genealogy fields for clip lineage.
        try {
            const info = _db.getAllSync('PRAGMA table_info(clips)');
            const parentClipCol = info?.find?.((c) => c.name === 'parent_clip_id');
            if (!parentClipCol) {
                _db.execSync(MIGRATION_PARENT_CLIP_ID);
            }
            const triggeredByNoteCol = info?.find?.((c) => c.name === 'triggered_by_note_id');
            if (!triggeredByNoteCol) {
                _db.execSync(MIGRATION_TRIGGERED_BY_NOTE_ID);
            }
        }
        catch {
            // If PRAGMA/migration fails, keep DB usable for existing clips.
        }
        console.log('[database] SQLite initialised');
    }
    catch (e) {
        _dbError = e instanceof Error ? e : new Error(String(e));
        console.error('[database] SQLite init failed — local clip storage unavailable:', _dbError.message);
        _db = null;
    }
    return _db;
}
/** Returns the SQLite database, or null if native module is unavailable. */
function getDb() {
    return initDb();
}
exports.getDb = getDb;
/** @deprecated Direct export kept for call-site compat; prefer getDb(). */
exports.db = new Proxy({}, {
    get(_target, prop) {
        const real = initDb();
        if (!real) {
            if (prop === 'runSync' || prop === 'execSync' || prop === 'getAllSync') {
                return () => {
                    console.warn(`[database] db.${String(prop)} called but SQLite is unavailable`);
                    if (prop === 'getAllSync')
                        return [];
                    return undefined;
                };
            }
            return undefined;
        }
        const val = real[prop];
        return typeof val === 'function' ? val.bind(real) : val;
    },
});
function makeRemoteLocalId(session_id, server_id) {
    if (server_id)
        return `remote:${server_id}`;
    return `remote:${session_id}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
}
/**
 * Upsert a server clip into local SQLite storage.
 * Ensures clips recorded by other participants are queryable through getClipsForSession().
 */
function upsertClipFromServer(row) {
    const providedLocalId = row.local_id?.trim() || null;
    const serverId = row.server_id?.trim() || null;
    let resolvedLocalId = providedLocalId;
    if (serverId) {
        const byServer = exports.db.getAllSync('SELECT local_id FROM clips WHERE server_id = ? LIMIT 1', [serverId])[0]?.local_id;
        if (byServer) {
            resolvedLocalId = byServer;
        }
    }
    if (!resolvedLocalId) {
        resolvedLocalId = makeRemoteLocalId(row.session_id, serverId);
    }
    exports.db.runSync(`INSERT INTO clips (
      local_id, server_id, session_id, parent_clip_id, triggered_by_note_id, label, recorded_at, file_uri,
      upload_status, upload_progress, mux_playback_id, source_url,
      move_name, style, energy, difficulty, bpm, notes, clip_type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(local_id) DO UPDATE SET
      server_id = COALESCE(excluded.server_id, clips.server_id),
      session_id = COALESCE(excluded.session_id, clips.session_id),
      parent_clip_id = COALESCE(excluded.parent_clip_id, clips.parent_clip_id),
      triggered_by_note_id = COALESCE(excluded.triggered_by_note_id, clips.triggered_by_note_id),
      label = COALESCE(excluded.label, clips.label),
      recorded_at = COALESCE(excluded.recorded_at, clips.recorded_at),
      file_uri = COALESCE(excluded.file_uri, clips.file_uri),
      upload_status = COALESCE(excluded.upload_status, clips.upload_status),
      upload_progress = COALESCE(excluded.upload_progress, clips.upload_progress),
      mux_playback_id = COALESCE(excluded.mux_playback_id, clips.mux_playback_id),
      source_url = COALESCE(excluded.source_url, clips.source_url),
      move_name = COALESCE(excluded.move_name, clips.move_name),
      style = COALESCE(excluded.style, clips.style),
      energy = COALESCE(excluded.energy, clips.energy),
      difficulty = COALESCE(excluded.difficulty, clips.difficulty),
      bpm = COALESCE(excluded.bpm, clips.bpm),
      notes = COALESCE(excluded.notes, clips.notes),
      clip_type = COALESCE(excluded.clip_type, clips.clip_type)`, [
        resolvedLocalId,
        serverId,
        row.session_id,
        row.parent_clip_id ?? null,
        row.triggered_by_note_id ?? null,
        row.label ?? null,
        row.recorded_at ?? null,
        row.file_uri ?? null,
        row.upload_status ?? null,
        row.upload_progress ?? null,
        row.mux_playback_id ?? null,
        row.source_url ?? null,
        row.move_name ?? null,
        row.style ?? null,
        row.energy ?? null,
        row.difficulty ?? null,
        row.bpm ?? null,
        row.notes ?? null,
        row.clip_type ?? null,
    ]);
    return resolvedLocalId;
}
exports.upsertClipFromServer = upsertClipFromServer;
function insertClip(row) {
    exports.db.runSync(`INSERT INTO clips (
      local_id, session_id, dual_pair_id, parent_clip_id, triggered_by_note_id, label, recorded_at, file_uri,
      upload_status, upload_progress, server_id, mux_playback_id, source_url,
      move_name, style, energy, difficulty, bpm, notes, clip_type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        row.local_id,
        row.session_id,
        row.dual_pair_id ?? null,
        row.parent_clip_id ?? null,
        row.triggered_by_note_id ?? null,
        row.label ?? null,
        row.recorded_at ?? null,
        row.file_uri ?? null,
        row.upload_status ?? 'local',
        row.upload_progress ?? 0,
        row.server_id ?? null,
        row.mux_playback_id ?? null,
        row.source_url ?? null,
        row.move_name ?? null,
        row.style ?? null,
        row.energy ?? null,
        row.difficulty ?? null,
        row.bpm ?? null,
        row.notes ?? null,
        row.clip_type ?? null,
    ]);
}
exports.insertClip = insertClip;
function updateClipStatus(local_id, status, progress) {
    if (progress !== undefined) {
        exports.db.runSync('UPDATE clips SET upload_status = ?, upload_progress = ? WHERE local_id = ?', [status, progress, local_id]);
    }
    else {
        exports.db.runSync('UPDATE clips SET upload_status = ? WHERE local_id = ?', [
            status,
            local_id,
        ]);
    }
}
exports.updateClipStatus = updateClipStatus;
function updateClipServerData(local_id, server_id, mux_playback_id) {
    if (mux_playback_id != null) {
        exports.db.runSync('UPDATE clips SET server_id = ?, mux_playback_id = ? WHERE local_id = ?', [server_id, mux_playback_id, local_id]);
    }
    else {
        exports.db.runSync('UPDATE clips SET server_id = ? WHERE local_id = ?', [
            server_id,
            local_id,
        ]);
    }
}
exports.updateClipServerData = updateClipServerData;
/** Persist server-driven clip fields to SQLite so state survives app restart */
function updateClipFromServer(local_id, update) {
    const setClauses = [];
    const values = [];
    if (update.server_id !== undefined) {
        setClauses.push('server_id = ?');
        values.push(update.server_id);
    }
    if (update.upload_status !== undefined) {
        setClauses.push('upload_status = ?');
        values.push(update.upload_status);
    }
    if (update.mux_playback_id !== undefined) {
        setClauses.push('mux_playback_id = ?');
        values.push(update.mux_playback_id);
    }
    if (update.source_url !== undefined) {
        setClauses.push('source_url = ?');
        values.push(update.source_url);
    }
    if (update.move_name !== undefined) {
        setClauses.push('move_name = ?');
        values.push(update.move_name);
    }
    if (update.style !== undefined) {
        setClauses.push('style = ?');
        values.push(update.style);
    }
    if (update.energy !== undefined) {
        setClauses.push('energy = ?');
        values.push(update.energy);
    }
    if (update.difficulty !== undefined) {
        setClauses.push('difficulty = ?');
        values.push(update.difficulty);
    }
    if (update.bpm !== undefined) {
        setClauses.push('bpm = ?');
        values.push(update.bpm);
    }
    if (update.notes !== undefined) {
        setClauses.push('notes = ?');
        values.push(update.notes);
    }
    if (update.clip_type !== undefined) {
        setClauses.push('clip_type = ?');
        values.push(update.clip_type);
    }
    if (setClauses.length === 0)
        return;
    values.push(local_id);
    exports.db.runSync(`UPDATE clips SET ${setClauses.join(', ')} WHERE local_id = ?`, values);
}
exports.updateClipFromServer = updateClipFromServer;
function updateClipTags(local_id, tags) {
    exports.db.runSync(`UPDATE clips SET
      move_name = ?, style = ?, energy = ?, difficulty = ?, bpm = ?, notes = ?
    WHERE local_id = ?`, [
        tags.move_name ?? null,
        tags.style ?? null,
        tags.energy ?? null,
        tags.difficulty ?? null,
        tags.bpm ?? null,
        tags.notes ?? null,
        local_id,
    ]);
}
exports.updateClipTags = updateClipTags;
function getClipsForSession(session_id) {
    const rows = exports.db.getAllSync('SELECT * FROM clips WHERE session_id = ? ORDER BY recorded_at DESC', [session_id]);
    return rows;
}
exports.getClipsForSession = getClipsForSession;
function assignLocalClipToSessionByServerId(server_id, session_id) {
    exports.db.runSync('UPDATE clips SET session_id = ? WHERE server_id = ?', [session_id, server_id]);
}
exports.assignLocalClipToSessionByServerId = assignLocalClipToSessionByServerId;
/** Returns all local clips with no session assignment (inbox clips). */
function getInboxClips() {
    const rows = exports.db.getAllSync('SELECT * FROM clips WHERE session_id IS NULL ORDER BY recorded_at DESC', []);
    return rows ?? [];
}
exports.getInboxClips = getInboxClips;
//# sourceMappingURL=database.js.map