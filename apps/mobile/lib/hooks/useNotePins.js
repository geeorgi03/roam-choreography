"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNotePins = void 0;
const react_1 = require("react");
const supabase_1 = require("../supabase");
const api_1 = require("../api");
async function authHeader() {
    if (!supabase_1.supabase)
        return null;
    const { data: { session } } = await supabase_1.supabase.auth.getSession();
    const token = session?.access_token;
    if (!token)
        return null;
    return { Authorization: `Bearer ${token}` };
}
function useNotePins(sessionId) {
    const [notes, setNotes] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const sorted = (0, react_1.useMemo)(() => [...notes].sort((a, b) => a.timecode_ms - b.timecode_ms), [notes]);
    const refresh = (0, react_1.useCallback)(async () => {
        if (!sessionId) {
            setNotes([]);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const headers = await authHeader();
            if (!headers) {
                setNotes([]);
                setError('Not signed in');
                return;
            }
            const res = await fetch(`${api_1.API_BASE}/sessions/${sessionId}/notes`, { headers });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setError(body.error ?? 'Failed to load notes');
                return;
            }
            const body = (await res.json());
            setNotes(Array.isArray(body.notes) ? body.notes : []);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Network error');
        }
        finally {
            setLoading(false);
        }
    }, [sessionId]);
    const createNote = (0, react_1.useCallback)(async (input) => {
        if (!sessionId)
            return null;
        setError(null);
        try {
            const headers = await authHeader();
            if (!headers)
                throw new Error('Not signed in');
            const res = await fetch(`${api_1.API_BASE}/sessions/${sessionId}/notes`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify(input),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error ?? 'Failed to create note');
            }
            const body = await res.json();
            // Handle both canonical { note } wrapper and legacy raw object shapes
            const note = body.note ?? body;
            if (!note.id || typeof note.timecode_ms !== 'number') {
                throw new Error('Invalid note response shape');
            }
            setNotes((prev) => [...prev, note]);
            return note;
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Network error');
            return null;
        }
    }, [sessionId]);
    const deleteNote = (0, react_1.useCallback)(async (noteId) => {
        if (!sessionId)
            return false;
        setError(null);
        const prev = notes;
        setNotes((p) => p.filter((n) => n.id !== noteId));
        try {
            const headers = await authHeader();
            if (!headers)
                throw new Error('Not signed in');
            const res = await fetch(`${api_1.API_BASE}/sessions/${sessionId}/notes/${noteId}`, {
                method: 'DELETE',
                headers,
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error ?? 'Failed to delete note');
            }
            return true;
        }
        catch (e) {
            setNotes(prev);
            setError(e instanceof Error ? e.message : 'Network error');
            return false;
        }
    }, [sessionId, notes]);
    (0, react_1.useEffect)(() => {
        refresh().catch(() => { });
    }, [refresh]);
    (0, react_1.useEffect)(() => {
        if (!sessionId)
            return;
        const sb = supabase_1.supabase;
        if (!sb)
            return;
        let mounted = true;
        const channel = sb
            .channel(`note_pins:session_id=eq.${sessionId}`)
            .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'note_pins',
            filter: `session_id=eq.${sessionId}`,
        }, (payload) => {
            if (!mounted)
                return;
            if (payload.eventType === 'INSERT') {
                const n = payload.new;
                setNotes((prev) => {
                    if (prev.some((x) => x.id === n.id))
                        return prev;
                    return [...prev, n];
                });
            }
            else if (payload.eventType === 'UPDATE') {
                const n = payload.new;
                setNotes((prev) => prev.map((x) => (x.id === n.id ? n : x)));
            }
            else if (payload.eventType === 'DELETE') {
                const oldRow = payload.old;
                if (!oldRow?.id)
                    return;
                setNotes((prev) => prev.filter((x) => x.id !== oldRow.id));
            }
        })
            .subscribe();
        return () => {
            mounted = false;
            sb.removeChannel(channel);
        };
    }, [sessionId]);
    return {
        notes: sorted,
        loading,
        error,
        refresh,
        createNote,
        deleteNote,
    };
}
exports.useNotePins = useNotePins;
//# sourceMappingURL=useNotePins.js.map