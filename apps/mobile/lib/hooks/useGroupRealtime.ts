import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE } from '../api';
import { supabase } from '../supabase';

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
  const latestPositionRef = useRef<PositionState>({});
  const latestParticipantIdRef = useRef<string | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  useEffect(() => {
    if (!sessionId || !accessToken) return;

    let mounted = true;
    const startupController = new AbortController();
    const startupSignal = startupController.signal;
    let participantsChannel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null;
    let broadcastsChannel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null;

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
      if (!mounted) return;
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
        if (mounted) setParticipants(dancersPayload.dancers ?? []);
      }

      const broadcastsRes = await fetch(`${API_BASE}/sessions/${sessionId}/broadcasts`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        signal: startupSignal,
      }).catch(() => null);
      if (broadcastsRes?.ok) {
        const broadcastsPayload = (await broadcastsRes.json()) as { broadcasts: BroadcastRow[] };
        if (mounted) setBroadcasts((broadcastsPayload.broadcasts ?? []).slice(0, 50));
      }

      if (!mounted) return;
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

    if (supabase) {
      participantsChannel = supabase
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
            if (!mounted) return;
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
            if (!mounted) return;
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
            if (!mounted) return;
            const removed = payload.old as Partial<GroupParticipant>;
            setParticipants((prev) => prev.filter((p) => p.id !== removed.id));
          }
        )
        .subscribe();

      broadcastsChannel = supabase
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
            if (!mounted) return;
            setBroadcasts((prev) => upsertBroadcastRow(prev, payload.new as BroadcastRow));
          }
        )
        .subscribe();
    }

    start().catch(() => {});

    return () => {
      mounted = false;
      startupController.abort();
      latestParticipantIdRef.current = null;
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      if (participantsChannel) supabase?.removeChannel(participantsChannel);
      if (broadcastsChannel) supabase?.removeChannel(broadcastsChannel);
    };
  }, [sessionId, accessToken, shareToken]);

  return { participants, myParticipant, isChoreographer, broadcasts, sendBroadcast, updatePosition };
}
