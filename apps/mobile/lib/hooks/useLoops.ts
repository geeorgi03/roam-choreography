import { useCallback, useEffect, useState } from 'react';
import { API_BASE } from '../api';
import { useSession } from './useSession';
import type { Loop } from '@roam/types';

export default function useLoops(sessionId: string | null, sourceUrl: string | null) {
  const [loops, setLoops] = useState<Loop[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { session } = useSession();
  const token = session?.access_token;

  const fetchLoops = useCallback(async () => {
    if (!sessionId || !sourceUrl || !token) {
      setLoops([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(
        `${API_BASE}/sessions/${sessionId}/loops?source_url=${encodeURIComponent(sourceUrl)}`,
        { headers }
      );
      
      if (!res.ok) return;

      const body = (await res.json()) as { loops?: Loop[] };
      const fetchedLoops = Array.isArray(body.loops) ? body.loops : [];
      setLoops((prev) => {
        const hasActiveOptimisticLoops = prev.some((l) => l.id.startsWith('temp-'));
        if (!hasActiveOptimisticLoops) return fetchedLoops;

        // Merge fetched rows by id into existing state so late fetches don't discard
        // optimistic `temp-*` entries.
        const fetchedById = new Map<string, Loop>(fetchedLoops.map((l) => [l.id, l]));
        const prevIds = new Set(prev.map((l) => l.id));

        // Replace any existing rows with the fetched versions, and append any newly fetched rows.
        return prev
          .map((l) => fetchedById.get(l.id) ?? l)
          .concat(fetchedLoops.filter((l) => !prevIds.has(l.id)));
      });
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, sourceUrl, token]);

  useEffect(() => {
    fetchLoops().catch(() => {});
  }, [fetchLoops]);

  const createLoop = useCallback(
    async (startMs: number, endMs: number, color: string): Promise<Loop | null> => {
      if (!sessionId || !sourceUrl) return null;

      const tempId = `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const optimisticLoop: Loop = {
        id: tempId,
        session_id: sessionId,
        source_url: sourceUrl,
        start_ms: startMs,
        end_ms: endMs,
        color,
        name: `loop ${loops.length + 1}`,
        created_by: session?.user?.id ?? '',
        created_at: new Date().toISOString(),
      };

      setLoops((prev) => [...prev, optimisticLoop]);

      try {
        if (!token) throw new Error('Not signed in');
        const headers = { Authorization: `Bearer ${token}` };

        const res = await fetch(`${API_BASE}/sessions/${sessionId}/loops`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_url: sourceUrl,
            start_ms: startMs,
            end_ms: endMs,
            color,
            name: `loop ${loops.length + 1}`,
          }),
        });

        if (!res.ok) throw new Error('Failed to create loop');

        const serverLoop = (await res.json()) as Loop;
        if (!serverLoop?.id) throw new Error('Invalid loop response shape');

        setLoops((prev) => {
          const hasTempRow = prev.some((l) => l.id === tempId);

          // Replace the temp row when present, otherwise append the server-created loop.
          if (hasTempRow) {
            const replaced = prev.map((l) => (l.id === tempId ? serverLoop : l));

            // De-dupe by id while keeping the last occurrence (so the temp row position "wins").
            const seen = new Set<string>();
            const dedupedReversed: Loop[] = [];
            for (let i = replaced.length - 1; i >= 0; i--) {
              const l = replaced[i];
              if (seen.has(l.id)) continue;
              seen.add(l.id);
              dedupedReversed.push(l);
            }

            return dedupedReversed.reverse();
          }

          // Temp row is already gone (e.g., overwritten by a late fetch). Upsert the server row.
          const hasServerRow = prev.some((l) => l.id === serverLoop.id);
          if (hasServerRow) return prev.map((l) => (l.id === serverLoop.id ? serverLoop : l));
          return [...prev, serverLoop];
        });
        return serverLoop;
      } catch {
        setLoops((prev) => prev.filter((l) => l.id !== tempId));
        return null;
      }
    },
    [sessionId, sourceUrl, loops.length, token, session?.user?.id]
  );

  const deleteLoop = useCallback(
    async (loopId: string): Promise<boolean> => {
      if (!sessionId) return false;
      const prevLoop = loops.find((l) => l.id === loopId);
      const prevIndex = loops.findIndex((l) => l.id === loopId);

      // Optimistic delete
      setLoops((prev) => prev.filter((l) => l.id !== loopId));

      try {
        if (!token) throw new Error('Not signed in');
        const headers = { Authorization: `Bearer ${token}` };

        const res = await fetch(`${API_BASE}/sessions/${sessionId}/loops/${loopId}`, {
          method: 'DELETE',
          headers,
        });

        if (!res.ok) throw new Error('Failed to delete loop');
        return true;
      } catch {
        // Restore the removed loop at its original position
        if (prevLoop) {
          setLoops((prev) => {
            if (prevIndex === -1) return [...prev, prevLoop];
            return [...prev.slice(0, prevIndex), prevLoop, ...prev.slice(prevIndex)];
          });
        }
        return false;
      }
    },
    [sessionId, loops, token]
  );

  return {
    loops,
    isLoading,
    createLoop,
    deleteLoop,
    fetchLoops,
  };
}
