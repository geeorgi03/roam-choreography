"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const api_1 = require("../api");
const useSession_1 = require("../hooks/useSession");
const supabase_1 = require("../supabase");
function useMoments(sessionId) {
    const [moments, setMoments] = (0, react_1.useState)([]);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const { session } = (0, useSession_1.useSession)();
    const token = session?.access_token;
    const fetchMoments = (0, react_1.useCallback)(async () => {
        if (!sessionId || !token) {
            setMoments([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const res = await fetch(`${api_1.API_BASE}/sessions/${sessionId}/moments`, { headers });
            if (!res.ok)
                return;
            const body = (await res.json());
            const fetchedMoments = Array.isArray(body.moments) ? body.moments : [];
            setMoments((prev) => {
                const hasActiveOptimisticMoments = prev.some((m) => m.id.startsWith('temp-'));
                if (!hasActiveOptimisticMoments)
                    return fetchedMoments;
                // Merge fetched rows by id into existing state so late fetches don't discard
                // optimistic `temp-*` entries.
                const fetchedById = new Map(fetchedMoments.map((m) => [m.id, m]));
                const prevIds = new Set(prev.map((m) => m.id));
                // Replace any existing rows with the fetched versions, and append any newly fetched rows.
                return prev
                    .map((m) => fetchedById.get(m.id) ?? m)
                    .concat(fetchedMoments.filter((m) => !prevIds.has(m.id)));
            });
        }
        catch {
            // ignore
        }
        finally {
            setIsLoading(false);
        }
    }, [sessionId, token]);
    (0, react_1.useEffect)(() => {
        fetchMoments().catch(() => { });
    }, [fetchMoments]);
    const mergeMoment = (0, react_1.useCallback)((row) => {
        if (!row?.id || row.id.startsWith('temp-'))
            return;
        setMoments((prev) => {
            const existingIndex = prev.findIndex((m) => m.id === row.id);
            if (existingIndex < 0)
                return [...prev, row];
            const next = [...prev];
            next[existingIndex] = row;
            return next;
        });
    }, []);
    const removeMoment = (0, react_1.useCallback)((momentId) => {
        setMoments((prev) => prev.filter((m) => m.id !== momentId));
    }, []);
    (0, react_1.useEffect)(() => {
        if (!sessionId || !supabase_1.supabase)
            return;
        const channel = supabase_1.supabase
            .channel(`moments:session_id=eq.${sessionId}`)
            .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'moments',
            filter: `session_id=eq.${sessionId}`,
        }, (payload) => {
            mergeMoment(payload.new);
        })
            .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'moments',
            filter: `session_id=eq.${sessionId}`,
        }, (payload) => {
            mergeMoment(payload.new);
        })
            .on('postgres_changes', {
            event: 'DELETE',
            schema: 'public',
            table: 'moments',
            filter: `session_id=eq.${sessionId}`,
        }, (payload) => {
            removeMoment(payload.old.id ?? '');
        })
            .subscribe();
        return () => {
            supabase_1.supabase?.removeChannel(channel);
        };
    }, [sessionId, mergeMoment, removeMoment]);
    const createMoment = (0, react_1.useCallback)(async (name, beatPositionMs) => {
        if (!sessionId)
            return null;
        const tempId = `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const optimisticMoment = {
            id: tempId,
            session_id: sessionId,
            name,
            beat_position_ms: beatPositionMs,
            formation: null,
            quality: null,
            position: moments.length + 1,
            created_at: new Date().toISOString(),
        };
        setMoments((prev) => [...prev, optimisticMoment]);
        try {
            if (!token)
                throw new Error('Not signed in');
            const headers = { Authorization: `Bearer ${token}` };
            const res = await fetch(`${api_1.API_BASE}/sessions/${sessionId}/moments`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, beat_position_ms: beatPositionMs }),
            });
            if (!res.ok)
                throw new Error('Failed to create moment');
            const serverMoment = (await res.json());
            if (!serverMoment?.id)
                throw new Error('Invalid moment response shape');
            setMoments((prev) => {
                const hasTempRow = prev.some((m) => m.id === tempId);
                // Upsert by id: replace the temp row when present, otherwise append the server-created moment.
                if (hasTempRow) {
                    const replaced = prev.map((m) => (m.id === tempId ? serverMoment : m));
                    // De-dupe by id while keeping the last occurrence (so the temp row position "wins").
                    const seen = new Set();
                    const dedupedReversed = [];
                    for (let i = replaced.length - 1; i >= 0; i--) {
                        const m = replaced[i];
                        if (seen.has(m.id))
                            continue;
                        seen.add(m.id);
                        dedupedReversed.push(m);
                    }
                    return dedupedReversed.reverse();
                }
                // Temp row is already gone (e.g., overwritten by a late fetch). Upsert the server row.
                const hasServerRow = prev.some((m) => m.id === serverMoment.id);
                if (hasServerRow)
                    return prev.map((m) => (m.id === serverMoment.id ? serverMoment : m));
                return [...prev, serverMoment];
            });
            return serverMoment;
        }
        catch {
            setMoments((prev) => prev.filter((m) => m.id !== tempId));
            return null;
        }
    }, [sessionId, moments.length, token]);
    const renameMoment = (0, react_1.useCallback)(async (momentId, name) => {
        if (!sessionId)
            return;
        const prevName = moments.find((m) => m.id === momentId)?.name;
        setMoments((p) => p.map((m) => (m.id === momentId ? { ...m, name } : m)));
        try {
            if (!token)
                throw new Error('Not signed in');
            const headers = { Authorization: `Bearer ${token}` };
            const res = await fetch(`${api_1.API_BASE}/sessions/${sessionId}/moments/${momentId}`, {
                method: 'PATCH',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            if (!res.ok)
                throw new Error('Failed to rename moment');
        }
        catch {
            setMoments((p) => p.map((m) => (m.id === momentId ? { ...m, name: prevName ?? m.name } : m)));
        }
    }, [sessionId, moments, token]);
    const updateFormation = (0, react_1.useCallback)(async (momentId, formation) => {
        if (!sessionId)
            return;
        // Capture the exact pre-mutation payload so rollback can restore `null` precisely.
        const prevMoment = moments.find((m) => m.id === momentId);
        const momentExistedBeforeUpdate = Boolean(prevMoment);
        const prevFormation = momentExistedBeforeUpdate ? prevMoment.formation : null;
        setMoments((p) => p.map((m) => (m.id === momentId ? { ...m, formation } : m)));
        try {
            if (!token)
                throw new Error('Not signed in');
            const headers = { Authorization: `Bearer ${token}` };
            const res = await fetch(`${api_1.API_BASE}/sessions/${sessionId}/moments/${momentId}/formation`, {
                method: 'PUT',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ formation }),
            });
            if (!res.ok)
                throw new Error('Failed to update formation');
        }
        catch {
            setMoments((p) => momentExistedBeforeUpdate
                ? p.map((m) => (m.id === momentId ? { ...m, formation: prevFormation } : m))
                : p);
        }
    }, [sessionId, moments, token]);
    const updateQuality = (0, react_1.useCallback)(async (momentId, quality) => {
        if (!sessionId)
            return;
        // Capture the exact pre-mutation payload so rollback can restore `null` precisely.
        const prevMoment = moments.find((m) => m.id === momentId);
        const momentExistedBeforeUpdate = Boolean(prevMoment);
        const prevQuality = momentExistedBeforeUpdate ? prevMoment.quality : null;
        setMoments((p) => p.map((m) => (m.id === momentId ? { ...m, quality } : m)));
        try {
            if (!token)
                throw new Error('Not signed in');
            const headers = { Authorization: `Bearer ${token}` };
            const res = await fetch(`${api_1.API_BASE}/sessions/${sessionId}/moments/${momentId}/quality`, {
                method: 'PUT',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ quality }),
            });
            if (!res.ok)
                throw new Error('Failed to update quality');
        }
        catch {
            setMoments((p) => momentExistedBeforeUpdate
                ? p.map((m) => (m.id === momentId ? { ...m, quality: prevQuality } : m))
                : p);
        }
    }, [sessionId, moments, token]);
    return {
        moments,
        isLoading,
        createMoment,
        renameMoment,
        updateFormation,
        updateQuality,
        mergeMoment,
        removeMoment,
    };
}
exports.default = useMoments;
//# sourceMappingURL=useMoments.js.map