import { useCallback, useEffect, useState } from 'react';
import { API_BASE } from '../api';
import { useSession } from '../hooks/useSession';
import type { FormationData, Moment, QualityData } from '@roam/types';

export default function useMoments(sessionId: string | null) {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { session } = useSession();
  const token = session?.access_token;

  const fetchMoments = useCallback(async () => {
    if (!sessionId || !token) {
      setMoments([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const res = await fetch(`${API_BASE}/sessions/${sessionId}/moments`, { headers });
      if (!res.ok) return;

      const body = (await res.json()) as { moments?: Moment[] };
      const fetchedMoments = Array.isArray(body.moments) ? body.moments : [];
      setMoments((prev) => {
        const hasActiveOptimisticMoments = prev.some((m) => m.id.startsWith('temp-'));
        if (!hasActiveOptimisticMoments) return fetchedMoments;

        // Merge fetched rows by id into existing state so late fetches don't discard
        // optimistic `temp-*` entries.
        const fetchedById = new Map<string, Moment>(fetchedMoments.map((m) => [m.id, m]));
        const prevIds = new Set(prev.map((m) => m.id));

        // Replace any existing rows with the fetched versions, and append any newly fetched rows.
        return prev
          .map((m) => fetchedById.get(m.id) ?? m)
          .concat(fetchedMoments.filter((m) => !prevIds.has(m.id)));
      });
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, token]);

  useEffect(() => {
    fetchMoments().catch(() => {});
  }, [fetchMoments]);

  const createMoment = useCallback(
    async (name: string, beatPositionMs: number): Promise<Moment | null> => {
      if (!sessionId) return null;

      const tempId = `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const optimisticMoment: Moment = {
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
        if (!accessToken) throw new Error('Not signed in');
        const headers = { Authorization: `Bearer ${accessToken}` };

        const res = await fetch(`${API_BASE}/sessions/${sessionId}/moments`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, beat_position_ms: beatPositionMs }),
        });

        if (!res.ok) throw new Error('Failed to create moment');

        const serverMoment = (await res.json()) as Moment;
        if (!serverMoment?.id) throw new Error('Invalid moment response shape');

        setMoments((prev) => {
          const hasTempRow = prev.some((m) => m.id === tempId);

          // Upsert by id: replace the temp row when present, otherwise append the server-created moment.
          if (hasTempRow) {
            const replaced = prev.map((m) => (m.id === tempId ? serverMoment : m));

            // De-dupe by id while keeping the last occurrence (so the temp row position "wins").
            const seen = new Set<string>();
            const dedupedReversed: Moment[] = [];
            for (let i = replaced.length - 1; i >= 0; i--) {
              const m = replaced[i];
              if (seen.has(m.id)) continue;
              seen.add(m.id);
              dedupedReversed.push(m);
            }

            return dedupedReversed.reverse();
          }

          // Temp row is already gone (e.g., overwritten by a late fetch). Upsert the server row.
          const hasServerRow = prev.some((m) => m.id === serverMoment.id);
          if (hasServerRow) return prev.map((m) => (m.id === serverMoment.id ? serverMoment : m));
          return [...prev, serverMoment];
        });
        return serverMoment;
      } catch {
        setMoments((prev) => prev.filter((m) => m.id !== tempId));
        return null;
      }
    },
    [sessionId, moments.length, accessToken]
  );

  const renameMoment = useCallback(
    async (momentId: string, name: string): Promise<void> => {
      if (!sessionId) return;
      const prevName = moments.find((m) => m.id === momentId)?.name;

      setMoments((p) => p.map((m) => (m.id === momentId ? { ...m, name } : m)));

      try {
        if (!accessToken) throw new Error('Not signed in');
        const headers = { Authorization: `Bearer ${accessToken}` };

        const res = await fetch(`${API_BASE}/sessions/${sessionId}/moments/${momentId}`, {
          method: 'PATCH',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });

        if (!res.ok) throw new Error('Failed to rename moment');
      } catch {
        setMoments((p) =>
          p.map((m) => (m.id === momentId ? { ...m, name: prevName ?? m.name } : m))
        );
      }
    },
    [sessionId, moments, accessToken]
  );

  const updateFormation = useCallback(
    async (momentId: string, formation: FormationData | null): Promise<void> => {
      if (!sessionId) return;
      // Capture the exact pre-mutation payload so rollback can restore `null` precisely.
      const prevMoment = moments.find((m) => m.id === momentId);
      const momentExistedBeforeUpdate = Boolean(prevMoment);
      const prevFormation: FormationData | null = momentExistedBeforeUpdate ? prevMoment!.formation : null;

      setMoments((p) => p.map((m) => (m.id === momentId ? { ...m, formation } : m)));

      try {
        if (!accessToken) throw new Error('Not signed in');
        const headers = { Authorization: `Bearer ${accessToken}` };

        const res = await fetch(`${API_BASE}/sessions/${sessionId}/moments/${momentId}/formation`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ formation }),
        });

        if (!res.ok) throw new Error('Failed to update formation');
      } catch {
        setMoments((p) =>
          momentExistedBeforeUpdate
            ? p.map((m) => (m.id === momentId ? { ...m, formation: prevFormation } : m))
            : p
        );
      }
    },
    [sessionId, moments, accessToken]
  );

  const updateQuality = useCallback(
    async (momentId: string, quality: QualityData | null): Promise<void> => {
      if (!sessionId) return;
      // Capture the exact pre-mutation payload so rollback can restore `null` precisely.
      const prevMoment = moments.find((m) => m.id === momentId);
      const momentExistedBeforeUpdate = Boolean(prevMoment);
      const prevQuality: QualityData | null = momentExistedBeforeUpdate ? prevMoment!.quality : null;

      setMoments((p) => p.map((m) => (m.id === momentId ? { ...m, quality } : m)));

      try {
        if (!accessToken) throw new Error('Not signed in');
        const headers = { Authorization: `Bearer ${accessToken}` };

        const res = await fetch(`${API_BASE}/sessions/${sessionId}/moments/${momentId}/quality`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ quality }),
        });

        if (!res.ok) throw new Error('Failed to update quality');
      } catch {
        setMoments((p) =>
          momentExistedBeforeUpdate
            ? p.map((m) => (m.id === momentId ? { ...m, quality: prevQuality } : m))
            : p
        );
      }
    },
    [sessionId, moments, accessToken]
  );

  return {
    moments,
    isLoading,
    createMoment,
    renameMoment,
    updateFormation,
    updateQuality,
  };
}
