import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE } from '../api';
import { supabase } from '../supabase';

interface ReconnectState {
  attempts: number;
  maxAttempts: number;
  backoffMs: number[];
}

export interface ConnectionStatus {
  isConnected: boolean;
  hasError: boolean;
  errorMessage?: string;
}

interface GroupParticipant {
  id: string;
  session_id: string;
  user_id: string;
  display_name: string;
  color: string;
  role: 'choreographer' | 'dancer';
  position_x: number | null;
  position_y: number | null;
  position_note: string | null;
  last_seen_at: string | null;
  created_at: string;
}

interface BroadcastRow {
  id: string;
  session_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

interface PositionState {
  x?: number | null;
  y?: number | null;
  note?: string | null;
}

function upsertParticipantRow(
  list: GroupParticipant[],
  row: GroupParticipant
): GroupParticipant[] {
  const idx = list.findIndex((p) => p.id === row.id);
  if (idx < 0) return [...list, row];
  const next = [...list];
  next[idx] = row;
  return next;
}

function upsertBroadcastRow(list: BroadcastRow[], row: BroadcastRow): BroadcastRow[] {
  const filtered = list.filter((b) => b.id !== row.id);
  return [row, ...filtered].slice(0, 50);
}

export function useGroupRealtime(
  sessionId: string,
  accessToken: string | undefined,
  shareToken?: string | null
) {
  const [participants, setParticipants] = useState<GroupParticipant[]>([]);
  const [myParticipant, setMyParticipant] = useState<GroupParticipant | null>(null);
  const [broadcasts, setBroadcasts] = useState<BroadcastRow[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    hasError: false,
  });
  const latestPositionRef = useRef<PositionState>({});
  const latestParticipantIdRef = useRef<string | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mounted = useRef(true);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectStateRef = useRef<ReconnectState>({
    attempts: 0,
    maxAttempts: 5,
    backoffMs: [1000, 2000, 4000, 8000, 16000],
  });
  const isReconnectingInFlight = useRef(false);
  const reconnectPendingRef = useRef(false);
  const participantsChannelRef = useRef<ReturnType<NonNullable<typeof supabase>['channel']> | null>(null);
  const broadcastsChannelRef = useRef<ReturnType<NonNullable<typeof supabase>['channel']> | null>(null);
  const participantsSubscribedRef = useRef(false);
  const broadcastsSubscribedRef = useRef(false);
  const participantsHealthyRef = useRef(false);
  const broadcastsHealthyRef = useRef(false);

  const fetchLatestState = useCallback(async () => {
    if (!accessToken) return;

    try {
      const [dancersRes, broadcastsRes] = await Promise.all([
        fetch(`${API_BASE}/sessions/${sessionId}/dancers`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`${API_BASE}/sessions/${sessionId}/broadcasts`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      if (dancersRes.ok) {
        const dancersPayload = (await dancersRes.json()) as { dancers: GroupParticipant[] };
        setParticipants(dancersPayload.dancers ?? []);
      }

      if (broadcastsRes.ok) {
        const broadcastsPayload = (await broadcastsRes.json()) as { broadcasts: BroadcastRow[] };
        setBroadcasts((broadcastsPayload.broadcasts ?? []).slice(0, 50));
      }
    } catch (error) {
      console.error('Failed to fetch latest state:', error);
    }
  }, [accessToken, sessionId]);

  const updateConnectionHealth = useCallback(() => {
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

  const isChoreographer = useMemo(
    () => myParticipant?.role === 'choreographer',
    [myParticipant?.role]
  );

  const updatePosition = useCallback(
    async (x: number, y: number, note?: string) => {
      if (!accessToken || !latestParticipantIdRef.current) return;
      latestPositionRef.current = { x, y, note: note ?? latestPositionRef.current.note ?? null };

      await fetch(`${API_BASE}/sessions/${sessionId}/dancers/${latestParticipantIdRef.current}/position`, {
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
      }).catch(() => {});
    },
    [accessToken, sessionId]
  );

  const sendBroadcast = useCallback(
    async (message: string) => {
      if (!accessToken) return false;
      const trimmed = message.trim();
      if (!trimmed) return false;

      try {
        const response = await fetch(`${API_BASE}/sessions/${sessionId}/broadcast`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: trimmed }),
        });
        return response.ok;
      } catch {
        return false;
      }
    },
    [accessToken, sessionId]
  );

  const subscribeToChannels = useCallback(() => {
    if (!supabase) return;

    // Clean up existing channels
    if (participantsChannelRef.current) {
      supabase.removeChannel(participantsChannelRef.current);
    }
    if (broadcastsChannelRef.current) {
      supabase.removeChannel(broadcastsChannelRef.current);
    }

    participantsChannelRef.current = supabase
      .channel(`group_participants:session_id=eq.${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_participants',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          setParticipants((prev) => upsertParticipantRow(prev, payload.new as GroupParticipant));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'group_participants',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new as GroupParticipant;
          setParticipants((prev) => upsertParticipantRow(prev, row));
          setMyParticipant((prev) => (prev && prev.id === row.id ? row : prev));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'group_participants',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const removed = payload.old as Partial<GroupParticipant>;
          setParticipants((prev) => prev.filter((p) => p.id !== removed.id));
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          participantsSubscribedRef.current = true;
          participantsHealthyRef.current = true;
          updateConnectionHealth();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          participantsSubscribedRef.current = false;
          participantsHealthyRef.current = false;
          scheduleReconnect();
        }
      });

    broadcastsChannelRef.current = supabase
      .channel(`broadcasts:session_id=eq.${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'broadcasts',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          setBroadcasts((prev) => upsertBroadcastRow(prev, payload.new as BroadcastRow));
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          broadcastsSubscribedRef.current = true;
          broadcastsHealthyRef.current = true;
          updateConnectionHealth();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          broadcastsSubscribedRef.current = false;
          broadcastsHealthyRef.current = false;
          scheduleReconnect();
        }
      });
  }, [sessionId, fetchLatestState, updateConnectionHealth]);

  const scheduleReconnect = useCallback(() => {
    if (!mounted.current || isReconnectingInFlight.current || reconnectPendingRef.current) return;
    
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
      if (!mounted.current) return;
      isReconnectingInFlight.current = false;
      reconnectPendingRef.current = false;
      subscribeToChannels();
    }, backoffDelay);
  }, [subscribeToChannels]);

  useEffect(() => {
    if (!sessionId || !accessToken) return;

    mounted.current = true;
    const startupController = new AbortController();
    const startupSignal = startupController.signal;

    const start = async () => {
      const joinRes = await fetch(`${API_BASE}/sessions/${sessionId}/join`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          ...(shareToken ? { 'x-share-token': shareToken } : {}),
        },
        body: JSON.stringify(shareToken ? { share_token: shareToken } : {}),
        signal: startupSignal,
      }).catch(() => null);
      if (!joinRes?.ok) return;
      const joined = (await joinRes.json()) as GroupParticipant;
      if (!mounted.current) return;
      setMyParticipant(joined);
      latestParticipantIdRef.current = joined.id;
      setParticipants((prev) => upsertParticipantRow(prev, joined));

      const dancersRes = await fetch(`${API_BASE}/sessions/${sessionId}/dancers`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        signal: startupSignal,
      }).catch(() => null);
      if (dancersRes?.ok) {
        const dancersPayload = (await dancersRes.json()) as { dancers: GroupParticipant[] };
        if (mounted.current) setParticipants(dancersPayload.dancers ?? []);
      }

      const broadcastsRes = await fetch(`${API_BASE}/sessions/${sessionId}/broadcasts`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        signal: startupSignal,
      }).catch(() => null);
      if (broadcastsRes?.ok) {
        const broadcastsPayload = (await broadcastsRes.json()) as { broadcasts: BroadcastRow[] };
        if (mounted.current) setBroadcasts((broadcastsPayload.broadcasts ?? []).slice(0, 50));
      }

      if (!mounted.current) return;
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }

      heartbeatRef.current = setInterval(() => {
        const participantId = latestParticipantIdRef.current;
        if (!participantId) return;
        const latest = latestPositionRef.current;
        fetch(`${API_BASE}/sessions/${sessionId}/dancers/${participantId}/position`, {
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
        }).catch(() => {});
      }, 30_000);
    };

    // Subscribe to realtime channels after initial setup
    if (mounted.current) {
      subscribeToChannels();
    }

    start().catch(() => {});

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
      if (participantsChannelRef.current) supabase?.removeChannel(participantsChannelRef.current);
      if (broadcastsChannelRef.current) supabase?.removeChannel(broadcastsChannelRef.current);
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
