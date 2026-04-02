"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGroupRealtime = void 0;
const react_1 = require("react");
const api_1 = require("../api");
const supabase_1 = require("../supabase");
function upsertParticipantRow(list, row) {
    const idx = list.findIndex((p) => p.id === row.id);
    if (idx < 0)
        return [...list, row];
    const next = [...list];
    next[idx] = row;
    return next;
}
function upsertBroadcastRow(list, row) {
    const filtered = list.filter((b) => b.id !== row.id);
    return [row, ...filtered].slice(0, 50);
}
function useGroupRealtime(sessionId, accessToken, shareToken) {
    const [participants, setParticipants] = (0, react_1.useState)([]);
    const [myParticipant, setMyParticipant] = (0, react_1.useState)(null);
    const [broadcasts, setBroadcasts] = (0, react_1.useState)([]);
    const latestPositionRef = (0, react_1.useRef)({});
    const latestParticipantIdRef = (0, react_1.useRef)(null);
    const heartbeatRef = (0, react_1.useRef)(null);
    const isChoreographer = (0, react_1.useMemo)(() => myParticipant?.role === 'choreographer', [myParticipant?.role]);
    const updatePosition = (0, react_1.useCallback)(async (x, y, note) => {
        if (!accessToken || !latestParticipantIdRef.current)
            return;
        latestPositionRef.current = { x, y, note: note ?? latestPositionRef.current.note ?? null };
        await fetch(`${api_1.API_BASE}/sessions/${sessionId}/dancers/${latestParticipantIdRef.current}/position`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                position_x: x,
                position_y: y,
                position_note: note ?? null,
                last_seen_at: new Date().toISOString(),
            }),
        }).catch(() => { });
    }, [accessToken, sessionId]);
    const sendBroadcast = (0, react_1.useCallback)(async (message) => {
        if (!accessToken)
            return false;
        const trimmed = message.trim();
        if (!trimmed)
            return false;
        try {
            const response = await fetch(`${api_1.API_BASE}/sessions/${sessionId}/broadcast`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: trimmed }),
            });
            return response.ok;
        }
        catch {
            return false;
        }
    }, [accessToken, sessionId]);
    (0, react_1.useEffect)(() => {
        if (!sessionId || !accessToken)
            return;
        let mounted = true;
        const startupController = new AbortController();
        const startupSignal = startupController.signal;
        let participantsChannel = null;
        let broadcastsChannel = null;
        const start = async () => {
            const joinRes = await fetch(`${api_1.API_BASE}/sessions/${sessionId}/join`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    ...(shareToken ? { 'x-share-token': shareToken } : {}),
                },
                body: JSON.stringify(shareToken ? { share_token: shareToken } : {}),
                signal: startupSignal,
            }).catch(() => null);
            if (!joinRes?.ok)
                return;
            const joined = (await joinRes.json());
            if (!mounted)
                return;
            setMyParticipant(joined);
            latestParticipantIdRef.current = joined.id;
            setParticipants((prev) => upsertParticipantRow(prev, joined));
            const dancersRes = await fetch(`${api_1.API_BASE}/sessions/${sessionId}/dancers`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                signal: startupSignal,
            }).catch(() => null);
            if (dancersRes?.ok) {
                const dancersPayload = (await dancersRes.json());
                if (mounted)
                    setParticipants(dancersPayload.dancers ?? []);
            }
            const broadcastsRes = await fetch(`${api_1.API_BASE}/sessions/${sessionId}/broadcasts`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                signal: startupSignal,
            }).catch(() => null);
            if (broadcastsRes?.ok) {
                const broadcastsPayload = (await broadcastsRes.json());
                if (mounted)
                    setBroadcasts((broadcastsPayload.broadcasts ?? []).slice(0, 50));
            }
            if (!mounted)
                return;
            if (heartbeatRef.current) {
                clearInterval(heartbeatRef.current);
            }
            heartbeatRef.current = setInterval(() => {
                const participantId = latestParticipantIdRef.current;
                if (!participantId)
                    return;
                const latest = latestPositionRef.current;
                fetch(`${api_1.API_BASE}/sessions/${sessionId}/dancers/${participantId}/position`, {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        position_x: latest.x ?? null,
                        position_y: latest.y ?? null,
                        position_note: latest.note ?? null,
                        last_seen_at: new Date().toISOString(),
                    }),
                }).catch(() => { });
            }, 30000);
        };
        if (supabase_1.supabase) {
            participantsChannel = supabase_1.supabase
                .channel(`group_participants:session_id=eq.${sessionId}`)
                .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'group_participants',
                filter: `session_id=eq.${sessionId}`,
            }, (payload) => {
                if (!mounted)
                    return;
                setParticipants((prev) => upsertParticipantRow(prev, payload.new));
            })
                .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'group_participants',
                filter: `session_id=eq.${sessionId}`,
            }, (payload) => {
                if (!mounted)
                    return;
                const row = payload.new;
                setParticipants((prev) => upsertParticipantRow(prev, row));
                setMyParticipant((prev) => (prev && prev.id === row.id ? row : prev));
            })
                .on('postgres_changes', {
                event: 'DELETE',
                schema: 'public',
                table: 'group_participants',
                filter: `session_id=eq.${sessionId}`,
            }, (payload) => {
                if (!mounted)
                    return;
                const removed = payload.old;
                setParticipants((prev) => prev.filter((p) => p.id !== removed.id));
            })
                .subscribe();
            broadcastsChannel = supabase_1.supabase
                .channel(`broadcasts:session_id=eq.${sessionId}`)
                .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'broadcasts',
                filter: `session_id=eq.${sessionId}`,
            }, (payload) => {
                if (!mounted)
                    return;
                setBroadcasts((prev) => upsertBroadcastRow(prev, payload.new));
            })
                .subscribe();
        }
        start().catch(() => { });
        return () => {
            mounted = false;
            startupController.abort();
            latestParticipantIdRef.current = null;
            if (heartbeatRef.current) {
                clearInterval(heartbeatRef.current);
                heartbeatRef.current = null;
            }
            if (participantsChannel)
                supabase_1.supabase?.removeChannel(participantsChannel);
            if (broadcastsChannel)
                supabase_1.supabase?.removeChannel(broadcastsChannel);
        };
    }, [sessionId, accessToken, shareToken]);
    return { participants, myParticipant, isChoreographer, broadcasts, sendBroadcast, updatePosition };
}
exports.useGroupRealtime = useGroupRealtime;
//# sourceMappingURL=useGroupRealtime.js.map