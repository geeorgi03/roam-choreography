"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useInbox = void 0;
const react_1 = require("react");
const supabase_1 = require("../supabase");
const api_1 = require("../api");
const database_1 = require("../database");
const STALE_MS = 48 * 60 * 60 * 1000;
async function authHeader() {
    if (!supabase_1.supabase)
        return null;
    const { data: { session } } = await supabase_1.supabase.auth.getSession();
    const token = session?.access_token;
    if (!token)
        return null;
    return { Authorization: `Bearer ${token}` };
}
/** Convert a local ClipRow into a pending InboxClip for immediate display. */
function localRowToInboxClip(row) {
    return {
        id: row.server_id ?? row.local_id,
        user_id: '',
        session_id: null,
        label: row.label ?? 'Clip',
        upload_status: row.upload_status,
        mux_playback_id: row.mux_playback_id,
        recorded_at: row.recorded_at ?? new Date().toISOString(),
        created_at: row.recorded_at ?? new Date().toISOString(),
    };
}
function useInbox() {
    const [clips, setClips] = (0, react_1.useState)([]);
    const [count, setCount] = (0, react_1.useState)(0);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const staleClips = (0, react_1.useMemo)(() => {
        const now = Date.now();
        return clips.filter((c) => {
            const t = new Date(c.recorded_at).getTime();
            return Number.isFinite(t) && now - t > STALE_MS;
        });
    }, [clips]);
    const refresh = (0, react_1.useCallback)(async () => {
        setLoading(true);
        setError(null);
        try {
            const headers = await authHeader();
            if (!headers) {
                setClips([]);
                setCount(0);
                setError('Not signed in');
                return;
            }
            const res = await fetch(`${api_1.API_BASE}/inbox`, { headers });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setError(body.error ?? 'Failed to load inbox');
                return;
            }
            const body = (await res.json());
            const serverClips = Array.isArray(body.clips) ? body.clips : [];
            // Merge locally-pending inbox clips so newly-saved clips are visible
            // immediately after capture, even before the upload completes.
            let merged = serverClips;
            try {
                const localRows = (0, database_1.getInboxClips)();
                const serverIds = new Set(serverClips.map((c) => c.id));
                const pendingLocal = localRows
                    .filter((r) => {
                    if (r.upload_status === 'failed')
                        return false;
                    // Skip if the server clip is already in the list (by server_id)
                    if (r.server_id && serverIds.has(r.server_id))
                        return false;
                    return true;
                })
                    .map(localRowToInboxClip);
                if (pendingLocal.length > 0) {
                    merged = [...pendingLocal, ...serverClips];
                }
            }
            catch {
                // Local DB unavailable – fall back to server-only list
            }
            setClips(merged);
            setCount(merged.length);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Network error');
        }
        finally {
            setLoading(false);
        }
    }, []);
    const refreshCount = (0, react_1.useCallback)(async () => {
        setError(null);
        try {
            const headers = await authHeader();
            if (!headers) {
                setCount(0);
                return;
            }
            const res = await fetch(`${api_1.API_BASE}/inbox/count`, { headers });
            if (!res.ok)
                return;
            const body = (await res.json());
            const serverCount = typeof body.count === 'number' ? body.count : 0;
            // Include locally-pending clips (no server_id yet) in the badge count
            let localPending = 0;
            try {
                localPending = (0, database_1.getInboxClips)().filter((r) => !r.server_id && r.upload_status !== 'failed').length;
            }
            catch {
                // ignore
            }
            setCount(serverCount + localPending);
        }
        catch {
            // ignore lightweight count failures
        }
    }, []);
    /**
     * Assign an inbox clip to a session. Optionally supply `sectionName` to
     * also persist the clip's membership in a named section via section_clips.
     */
    const assignClip = (0, react_1.useCallback)(async (clipId, sessionId, sectionName) => {
        setError(null);
        const prev = clips;
        setClips((p) => p.filter((c) => c.id !== clipId));
        setCount((n) => Math.max(0, n - 1));
        try {
            const headers = await authHeader();
            if (!headers)
                throw new Error('Not signed in');
            const res = await fetch(`${api_1.API_BASE}/inbox/${clipId}/assign`, {
                method: 'PATCH',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    ...(sectionName ? { section_label: sectionName } : {}),
                }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error ?? 'Failed to assign');
            }
            try {
                (0, database_1.assignLocalClipToSessionByServerId)(clipId, sessionId);
            }
            catch {
                // ignore local persistence failures
            }
            return true;
        }
        catch (e) {
            setClips(prev);
            setCount(prev.length);
            setError(e instanceof Error ? e.message : 'Network error');
            return false;
        }
    }, [clips]);
    const deleteClip = (0, react_1.useCallback)(async (clipId) => {
        setError(null);
        const prev = clips;
        setClips((p) => p.filter((c) => c.id !== clipId));
        setCount((n) => Math.max(0, n - 1));
        try {
            const headers = await authHeader();
            if (!headers)
                throw new Error('Not signed in');
            const res = await fetch(`${api_1.API_BASE}/inbox/${clipId}`, {
                method: 'DELETE',
                headers,
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error ?? 'Failed to delete');
            }
            return true;
        }
        catch (e) {
            setClips(prev);
            setCount(prev.length);
            setError(e instanceof Error ? e.message : 'Network error');
            return false;
        }
    }, [clips]);
    (0, react_1.useEffect)(() => {
        refresh().catch(() => { });
    }, [refresh]);
    return {
        clips,
        count,
        staleClips,
        loading,
        error,
        refresh,
        refreshCount,
        assignClip,
        deleteClip,
    };
}
exports.useInbox = useInbox;
//# sourceMappingURL=useInbox.js.map