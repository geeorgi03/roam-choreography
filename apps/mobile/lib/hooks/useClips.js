"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useClips = void 0;
const react_1 = require("react");
const supabase_1 = require("../supabase");
const database_1 = require("../database");
const uploadQueue_1 = require("../../services/uploadQueue");
function useClips(sessionId, onPlanLimitReached) {
    const [clips, setClips] = (0, react_1.useState)([]);
    const onPlanLimitReachedRef = (0, react_1.useRef)(onPlanLimitReached);
    onPlanLimitReachedRef.current = onPlanLimitReached;
    const refresh = (0, react_1.useCallback)(() => {
        if (!sessionId) {
            setClips([]);
            return;
        }
        setClips((0, database_1.getClipsForSession)(sessionId));
    }, [sessionId]);
    const retryClip = (0, react_1.useCallback)((local_id) => {
        uploadQueue_1.uploadQueue.retryClip(local_id);
    }, []);
    const mergeServerClipRow = (0, react_1.useCallback)((prev, row) => {
        if (!sessionId)
            return prev;
        const persistedLocalId = (0, database_1.upsertClipFromServer)({
            local_id: row?.local_id ?? null,
            server_id: row?.id ?? null,
            session_id: sessionId,
            label: row?.label ?? null,
            recorded_at: row?.recorded_at ?? null,
            upload_status: row?.upload_status ?? null,
            mux_playback_id: row?.mux_playback_id ?? null,
            move_name: row?.move_name ?? null,
            style: row?.style ?? null,
            energy: row?.energy ?? null,
            difficulty: row?.difficulty ?? null,
            bpm: row?.bpm ?? null,
            notes: row?.notes ?? null,
        });
        const server_id = row?.id ?? null;
        const local_id = row?.local_id ?? null;
        const idx = prev.findIndex((c) => c.local_id === persistedLocalId ||
            (Boolean(server_id) && c.server_id === server_id) ||
            (Boolean(local_id) && c.local_id === local_id));
        const nextClip = {
            local_id: persistedLocalId,
            server_id: server_id ?? null,
            session_id: sessionId,
            label: row?.label ?? null,
            recorded_at: row?.recorded_at ?? null,
            file_uri: null,
            upload_status: row?.upload_status ?? 'ready',
            upload_progress: typeof row?.upload_progress === 'number'
                ? row.upload_progress
                : row?.upload_status === 'ready'
                    ? 100
                    : 0,
            mux_playback_id: row?.mux_playback_id ?? null,
            move_name: row?.move_name ?? null,
            style: row?.style ?? null,
            energy: row?.energy ?? null,
            difficulty: row?.difficulty ?? null,
            bpm: row?.bpm ?? null,
            notes: row?.notes ?? null,
        };
        if (idx < 0) {
            return [nextClip, ...prev].sort((a, b) => new Date(b.recorded_at ?? 0).getTime() - new Date(a.recorded_at ?? 0).getTime());
        }
        const merged = {
            ...prev[idx],
            local_id: nextClip.local_id,
            server_id: nextClip.server_id ?? prev[idx].server_id,
            session_id: nextClip.session_id ?? prev[idx].session_id,
            label: nextClip.label ?? prev[idx].label,
            recorded_at: nextClip.recorded_at ?? prev[idx].recorded_at,
            upload_status: nextClip.upload_status ?? prev[idx].upload_status,
            upload_progress: nextClip.upload_status === 'ready'
                ? 100
                : typeof row?.upload_progress === 'number'
                    ? row.upload_progress
                    : prev[idx].upload_progress,
            mux_playback_id: nextClip.mux_playback_id ?? prev[idx].mux_playback_id,
            move_name: nextClip.move_name ?? prev[idx].move_name,
            style: nextClip.style ?? prev[idx].style,
            energy: nextClip.energy ?? prev[idx].energy,
            difficulty: nextClip.difficulty ?? prev[idx].difficulty,
            bpm: nextClip.bpm ?? prev[idx].bpm,
            notes: nextClip.notes ?? prev[idx].notes,
        };
        const next = [...prev];
        next[idx] = merged;
        return next.sort((a, b) => new Date(b.recorded_at ?? 0).getTime() - new Date(a.recorded_at ?? 0).getTime());
    }, [sessionId]);
    /** Update in-memory clip state for local upload progress/status (so cards show live %) */
    const updateLocalClip = (0, react_1.useCallback)((local_id, updates) => {
        if (!sessionId)
            return;
        setClips((prev) => prev.map((c) => c.local_id === local_id ? { ...c, ...updates } : c));
    }, [sessionId]);
    (0, react_1.useEffect)(() => {
        if (!sessionId) {
            setClips([]);
            return;
        }
        if (!supabase_1.supabase)
            return;
        setClips((0, database_1.getClipsForSession)(sessionId));
        let mounted = true;
        const channel = supabase_1.supabase
            .channel(`clips:session_id=eq.${sessionId}`)
            .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'clips',
            filter: `session_id=eq.${sessionId}`,
        }, (payload) => {
            if (!mounted)
                return;
            const row = payload.new;
            const local_id = row?.local_id;
            if (local_id) {
                (0, database_1.updateClipFromServer)(local_id, {
                    server_id: row?.id ?? undefined,
                    mux_playback_id: row?.mux_playback_id ?? undefined,
                    upload_status: row?.upload_status ?? undefined,
                    move_name: row?.move_name ?? undefined,
                    style: row?.style ?? undefined,
                    energy: row?.energy ?? undefined,
                    difficulty: row?.difficulty ?? undefined,
                    bpm: row?.bpm ?? undefined,
                    notes: row?.notes ?? undefined,
                });
            }
            setClips((prev) => mergeServerClipRow(prev, row));
        })
            .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'clips',
            filter: `session_id=eq.${sessionId}`,
        }, (payload) => {
            if (!mounted)
                return;
            const row = payload.new;
            const local_id = row?.local_id;
            if (local_id) {
                (0, database_1.updateClipFromServer)(local_id, {
                    server_id: row?.id ?? undefined,
                    mux_playback_id: row?.mux_playback_id ?? undefined,
                    upload_status: row?.upload_status ?? undefined,
                    move_name: row?.move_name ?? undefined,
                    style: row?.style ?? undefined,
                    energy: row?.energy ?? undefined,
                    difficulty: row?.difficulty ?? undefined,
                    bpm: row?.bpm ?? undefined,
                    notes: row?.notes ?? undefined,
                });
            }
            setClips((prev) => mergeServerClipRow(prev, row));
        })
            .subscribe();
        const unsubscribe = (0, uploadQueue_1.addUploadQueueListener)((event) => {
            setClips((prev) => prev.map((clip) => {
                if (clip.local_id !== event.local_id)
                    return clip;
                return {
                    ...clip,
                    upload_status: event.status ?? clip.upload_status,
                    upload_progress: typeof event.progress === 'number'
                        ? event.progress
                        : clip.upload_progress,
                };
            }));
            if (event.reason === 'plan_limit_reached') {
                onPlanLimitReachedRef.current?.();
            }
        });
        return () => {
            unsubscribe();
            mounted = false;
            supabase_1.supabase?.removeChannel(channel);
        };
    }, [sessionId, mergeServerClipRow]);
    return { clips, refresh, retryClip, updateLocalClip };
}
exports.useClips = useClips;
//# sourceMappingURL=useClips.js.map