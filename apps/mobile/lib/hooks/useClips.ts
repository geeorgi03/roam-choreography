import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../supabase';
import {
  getClipsForSession,
  updateClipFromServer,
  upsertClipFromServer,
  type ClipRow,
} from '../database';
import {
  uploadQueue,
  addUploadQueueListener,
  type UploadQueueEvent,
} from '../../services/uploadQueue';

export function useClips(sessionId: string | null, onPlanLimitReached?: () => void) {
  const [clips, setClips] = useState<ClipRow[]>([]);
  const onPlanLimitReachedRef = useRef(onPlanLimitReached);
  onPlanLimitReachedRef.current = onPlanLimitReached;

  const refresh = useCallback(() => {
    if (!sessionId) {
      setClips([]);
      return;
    }
    setClips(getClipsForSession(sessionId));
  }, [sessionId]);

  const retryClip = useCallback((local_id: string) => {
    uploadQueue.retryClip(local_id);
  }, []);

  const mergeServerClipRow = useCallback(
    (prev: ClipRow[], row: Record<string, unknown>) => {
      if (!sessionId) return prev;

      const apiSourceUrl =
        (row?.source_url as string | null | undefined) ??
        (row?.url as string | null | undefined) ??
        null;
      const muxId = (row?.mux_playback_id as string | null | undefined) ?? null;
      const uploadStatus = (row?.upload_status as string | undefined) ?? 'ready';

      const persistedLocalId = upsertClipFromServer({
        local_id: (row?.local_id as string | null | undefined) ?? null,
        server_id: (row?.id as string | null | undefined) ?? null,
        session_id: sessionId,
        parent_clip_id: (row?.parent_clip_id as string | null | undefined) ?? null,
        triggered_by_note_id: (row?.triggered_by_note_id as string | null | undefined) ?? null,
        label: (row?.label as string | null | undefined) ?? null,
        recorded_at: (row?.recorded_at as string | null | undefined) ?? null,
        upload_status: uploadStatus,
        mux_playback_id: muxId,
        source_url: apiSourceUrl,
        move_name: (row?.move_name as string | null | undefined) ?? null,
        style: (row?.style as string | null | undefined) ?? null,
        energy: (row?.energy as string | null | undefined) ?? null,
        difficulty: (row?.difficulty as string | null | undefined) ?? null,
        bpm: (row?.bpm as number | null | undefined) ?? null,
        notes: (row?.notes as string | null | undefined) ?? null,
        clip_type:
          (row?.clip_type as 'MINE' | 'REF' | 'voice_memo' | null | undefined) ?? null,
      });

      const server_id = (row?.id as string | null | undefined) ?? null;
      const local_id = (row?.local_id as string | null | undefined) ?? null;
      const idx = prev.findIndex(
        (c) =>
          c.local_id === persistedLocalId ||
          (Boolean(server_id) && c.server_id === server_id) ||
          (Boolean(local_id) && c.local_id === local_id)
      );

      const nextClip: ClipRow = {
        local_id: persistedLocalId,
        server_id: server_id ?? null,
        session_id: sessionId,
        parent_clip_id: (row?.parent_clip_id as string | null | undefined) ?? null,
        triggered_by_note_id: (row?.triggered_by_note_id as string | null | undefined) ?? null,
        label: (row?.label as string | null | undefined) ?? null,
        recorded_at: (row?.recorded_at as string | null | undefined) ?? null,
        file_uri: null,
        upload_status: (row?.upload_status as string | undefined) ?? 'ready',
        upload_progress:
          typeof row?.upload_progress === 'number'
            ? (row.upload_progress as number)
            : (row?.upload_status as string | undefined) === 'ready'
              ? 100
              : 0,
        mux_playback_id: muxId,
        source_url: apiSourceUrl,
        move_name: (row?.move_name as string | null | undefined) ?? null,
        style: (row?.style as string | null | undefined) ?? null,
        energy: (row?.energy as string | null | undefined) ?? null,
        difficulty: (row?.difficulty as string | null | undefined) ?? null,
        bpm: (row?.bpm as number | null | undefined) ?? null,
        notes: (row?.notes as string | null | undefined) ?? null,
        clip_type:
          (row?.clip_type as 'MINE' | 'REF' | 'voice_memo' | null | undefined) ?? null,
      };

      if (idx < 0) {
        return [nextClip, ...prev].sort(
          (a, b) => new Date(b.recorded_at ?? 0).getTime() - new Date(a.recorded_at ?? 0).getTime()
        );
      }

      const merged: ClipRow = {
        ...prev[idx],
        local_id: nextClip.local_id,
        server_id: nextClip.server_id ?? prev[idx].server_id,
        session_id: nextClip.session_id ?? prev[idx].session_id,
        parent_clip_id: nextClip.parent_clip_id ?? prev[idx].parent_clip_id,
        triggered_by_note_id: nextClip.triggered_by_note_id ?? prev[idx].triggered_by_note_id,
        label: nextClip.label ?? prev[idx].label,
        recorded_at: nextClip.recorded_at ?? prev[idx].recorded_at,
        upload_status: nextClip.upload_status ?? prev[idx].upload_status,
        upload_progress:
          nextClip.upload_status === 'ready'
            ? 100
            : typeof row?.upload_progress === 'number'
              ? (row.upload_progress as number)
              : prev[idx].upload_progress,
        mux_playback_id: nextClip.mux_playback_id ?? prev[idx].mux_playback_id,
        source_url: nextClip.source_url ?? prev[idx].source_url,
        file_uri:
          nextClip.mux_playback_id && nextClip.upload_status === 'ready'
            ? null
            : prev[idx].file_uri ?? null,
        move_name: nextClip.move_name ?? prev[idx].move_name,
        style: nextClip.style ?? prev[idx].style,
        energy: nextClip.energy ?? prev[idx].energy,
        difficulty: nextClip.difficulty ?? prev[idx].difficulty,
        bpm: nextClip.bpm ?? prev[idx].bpm,
        notes: nextClip.notes ?? prev[idx].notes,
        clip_type: nextClip.clip_type ?? prev[idx].clip_type,
      };
      const next = [...prev];
      next[idx] = merged;
      return next.sort(
        (a, b) => new Date(b.recorded_at ?? 0).getTime() - new Date(a.recorded_at ?? 0).getTime()
      );
    },
    [sessionId]
  );

  /** Update in-memory clip state for local upload progress/status (so cards show live %) */
  const updateLocalClip = useCallback(
    (local_id: string, updates: Partial<Pick<ClipRow, 'upload_status' | 'upload_progress'>>) => {
      if (!sessionId) return;
      setClips((prev) =>
        prev.map((c) =>
          c.local_id === local_id ? { ...c, ...updates } : c
        )
      );
    },
    [sessionId]
  );

  useEffect(() => {
    if (!sessionId) {
      setClips([]);
      return;
    }
    if (!supabase) return;

    setClips(getClipsForSession(sessionId));

    let mounted = true;
    const channel = supabase
      .channel(`clips:session_id=eq.${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'clips',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (!mounted) return;
          const row = payload.new as Record<string, unknown>;
          const local_id = row?.local_id as string | undefined;
          if (local_id) {
            updateClipFromServer(local_id, {
              server_id: (row?.id as string | undefined) ?? undefined,
              mux_playback_id: (row?.mux_playback_id as string | null | undefined) ?? undefined,
              upload_status: (row?.upload_status as string | undefined) ?? undefined,
              move_name: (row?.move_name as string | null | undefined) ?? undefined,
              style: (row?.style as string | null | undefined) ?? undefined,
              energy: (row?.energy as string | null | undefined) ?? undefined,
              difficulty: (row?.difficulty as string | null | undefined) ?? undefined,
              bpm: (row?.bpm as number | null | undefined) ?? undefined,
              notes: (row?.notes as string | null | undefined) ?? undefined,
              clip_type:
                (row?.clip_type as 'MINE' | 'REF' | 'voice_memo' | null | undefined) ??
                undefined,
            });
          }
          setClips((prev) => mergeServerClipRow(prev, row));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'clips',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (!mounted) return;
          const row = payload.new as Record<string, unknown>;
          const local_id = row?.local_id as string | undefined;
          if (local_id) {
            updateClipFromServer(local_id, {
              server_id: (row?.id as string | undefined) ?? undefined,
              mux_playback_id: (row?.mux_playback_id as string | null | undefined) ?? undefined,
              upload_status: (row?.upload_status as string | undefined) ?? undefined,
              move_name: (row?.move_name as string | null | undefined) ?? undefined,
              style: (row?.style as string | null | undefined) ?? undefined,
              energy: (row?.energy as string | null | undefined) ?? undefined,
              difficulty: (row?.difficulty as string | null | undefined) ?? undefined,
              bpm: (row?.bpm as number | null | undefined) ?? undefined,
              notes: (row?.notes as string | null | undefined) ?? undefined,
              clip_type:
                (row?.clip_type as 'MINE' | 'REF' | 'voice_memo' | null | undefined) ??
                undefined,
            });
          }
          setClips((prev) => mergeServerClipRow(prev, row));
        }
      )
      .subscribe();

    const unsubscribe = addUploadQueueListener((event: UploadQueueEvent) => {
      setClips((prev) =>
        prev.map((clip) => {
          if (clip.local_id !== event.local_id) return clip;
          return {
            ...clip,
            upload_status: event.status ?? clip.upload_status,
            upload_progress:
              typeof event.progress === 'number'
                ? event.progress
                : clip.upload_progress,
          };
        })
      );
      if (event.reason === 'plan_limit_reached') {
        onPlanLimitReachedRef.current?.();
      }
    });

    return () => {
      unsubscribe();
      mounted = false;
      supabase?.removeChannel(channel);
    };
  }, [sessionId, mergeServerClipRow]);

  return { clips, refresh, retryClip, updateLocalClip };
}
