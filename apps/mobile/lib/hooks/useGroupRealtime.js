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
    const [connectionStatus, setConnectionStatus] = (0, react_1.useState)({
        isConnected: false,
        hasError: false,
    });
    const latestPositionRef = (0, react_1.useRef)({});
    const latestParticipantIdRef = (0, react_1.useRef)(null);
    const heartbeatRef = (0, react_1.useRef)(null);
    const mounted = (0, react_1.useRef)(true);
    const reconnectTimeoutRef = (0, react_1.useRef)(null);
    const reconnectStateRef = (0, react_1.useRef)({
        attempts: 0,
        maxAttempts: 5,
        backoffMs: [1000, 2000, 4000, 8000, 16000],
    });
    const isReconnectingInFlight = (0, react_1.useRef)(false);
    const reconnectPendingRef = (0, react_1.useRef)(false);
    const participantsChannelRef = (0, react_1.useRef)(null);
    const broadcastsChannelRef = (0, react_1.useRef)(null);
    const participantsSubscribedRef = (0, react_1.useRef)(false);
    const broadcastsSubscribedRef = (0, react_1.useRef)(false);
    const participantsHealthyRef = (0, react_1.useRef)(false);
    const broadcastsHealthyRef = (0, react_1.useRef)(false);
    const fetchLatestState = (0, react_1.useCallback)(async () => {
        if (!accessToken)
            return;
        try {
            const [dancersRes, broadcastsRes] = await Promise.all([
                fetch(`${api_1.API_BASE}/sessions/${sessionId}/dancers`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                }),
                fetch(`${api_1.API_BASE}/sessions/${sessionId}/broadcasts`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                }),
            ]);
            if (dancersRes.ok) {
                const dancersPayload = (await dancersRes.json());
                setParticipants(dancersPayload.dancers ?? []);
            }
            if (broadcastsRes.ok) {
                const broadcastsPayload = (await broadcastsRes.json());
                setBroadcasts((broadcastsPayload.broadcasts ?? []).slice(0, 50));
            }
        }
        catch (error) {
            console.error('Failed to fetch latest state:', error);
        }
    }, [accessToken, sessionId]);
    const updateConnectionHealth = (0, react_1.useCallback)(() => {
        const bothHealthy = participantsHealthyRef.current && broadcastsHealthyRef.current;
        if (bothHealthy) {
            setConnectionStatus({ isConnected: true, hasError: false });
            reconnectStateRef.current.attempts = 0;
            isReconnectingInFlight.current = false;
            reconnectPendingRef.current = false;
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
            fetchLatestState();
        }
    }, [fetchLatestState]);
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
    const subscribeToChannels = (0, react_1.useCallback)(() => {
        if (!supabase_1.supabase)
            return;
        // Clean up existing channels
        if (participantsChannelRef.current) {
            supabase_1.supabase.removeChannel(participantsChannelRef.current);
        }
        if (broadcastsChannelRef.current) {
            supabase_1.supabase.removeChannel(broadcastsChannelRef.current);
        }
        participantsChannelRef.current = supabase_1.supabase
            .channel(`group_participants:session_id=eq.${sessionId}`)
            .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'group_participants',
            filter: `session_id=eq.${sessionId}`,
        }, (payload) => {
            setParticipants((prev) => upsertParticipantRow(prev, payload.new));
        })
            .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'group_participants',
            filter: `session_id=eq.${sessionId}`,
        }, (payload) => {
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
            const removed = payload.old;
            setParticipants((prev) => prev.filter((p) => p.id !== removed.id));
        })
            .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                participantsSubscribedRef.current = true;
                participantsHealthyRef.current = true;
                updateConnectionHealth();
            }
            else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                participantsSubscribedRef.current = false;
                participantsHealthyRef.current = false;
                scheduleReconnect();
            }
        });
        broadcastsChannelRef.current = supabase_1.supabase
            .channel(`broadcasts:session_id=eq.${sessionId}`)
            .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'broadcasts',
            filter: `session_id=eq.${sessionId}`,
        }, (payload) => {
            setBroadcasts((prev) => upsertBroadcastRow(prev, payload.new));
        })
            .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                broadcastsSubscribedRef.current = true;
                broadcastsHealthyRef.current = true;
                updateConnectionHealth();
            }
            else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                broadcastsSubscribedRef.current = false;
                broadcastsHealthyRef.current = false;
                scheduleReconnect();
            }
        });
    }, [sessionId, fetchLatestState, updateConnectionHealth]);
    const scheduleReconnect = (0, react_1.useCallback)(() => {
        if (!mounted.current || isReconnectingInFlight.current || reconnectPendingRef.current)
            return;
        // Clear any existing timeout
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        const { attempts, maxAttempts } = reconnectStateRef.current;
        const backoffSequence = reconnectStateRef.current.backoffMs;
        // Check if either channel is unhealthy and attempts exceeded max
        const eitherUnhealthy = !participantsHealthyRef.current || !broadcastsHealthyRef.current;
        if (eitherUnhealthy && attempts >= maxAttempts) {
            setConnectionStatus({
                isConnected: false,
                hasError: true,
                errorMessage: 'Connection failed. Please check your network and try again.',
            });
            return;
        }
        const backoffDelay = backoffSequence[attempts];
        reconnectStateRef.current.attempts++;
        isReconnectingInFlight.current = true;
        reconnectPendingRef.current = true;
        setConnectionStatus({
            isConnected: false,
            hasError: false,
            errorMessage: `Reconnecting... (${attempts + 1}/${maxAttempts})`,
        });
        reconnectTimeoutRef.current = setTimeout(() => {
            if (!mounted.current)
                return;
            isReconnectingInFlight.current = false;
            reconnectPendingRef.current = false;
            subscribeToChannels();
        }, backoffDelay);
    }, [subscribeToChannels]);
    (0, react_1.useEffect)(() => {
        if (!sessionId || !accessToken)
            return;
        mounted.current = true;
        const startupController = new AbortController();
        const startupSignal = startupController.signal;
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
            if (!mounted.current)
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
                if (mounted.current)
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
                if (mounted.current)
                    setBroadcasts((broadcastsPayload.broadcasts ?? []).slice(0, 50));
            }
            if (!mounted.current)
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
        // Subscribe to realtime channels after initial setup
        if (mounted.current) {
            subscribeToChannels();
        }
        start().catch(() => { });
        return () => {
            mounted.current = false;
            startupController.abort();
            latestParticipantIdRef.current = null;
            isReconnectingInFlight.current = false;
            reconnectPendingRef.current = false;
            participantsSubscribedRef.current = false;
            broadcastsSubscribedRef.current = false;
            participantsHealthyRef.current = false;
            broadcastsHealthyRef.current = false;
            if (heartbeatRef.current) {
                clearInterval(heartbeatRef.current);
                heartbeatRef.current = null;
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
            if (participantsChannelRef.current)
                supabase_1.supabase?.removeChannel(participantsChannelRef.current);
            if (broadcastsChannelRef.current)
                supabase_1.supabase?.removeChannel(broadcastsChannelRef.current);
        };
    }, [sessionId, accessToken, shareToken, subscribeToChannels]);
    return {
        participants,
        myParticipant,
        isChoreographer,
        broadcasts,
        sendBroadcast,
        updatePosition,
        connectionStatus
    };
}
exports.useGroupRealtime = useGroupRealtime;
//# sourceMappingURL=useGroupRealtime.js.map