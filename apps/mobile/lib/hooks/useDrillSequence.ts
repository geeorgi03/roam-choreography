import { useCallback, useEffect, useState } from 'react';
import type { DrillSequenceItem } from '@roam/types';
import { API_BASE } from '../api';

interface UseDrillSequenceParams {
  sessionId: string;
  accessToken: string | null | undefined;
}

export function useDrillSequence({ sessionId, accessToken }: UseDrillSequenceParams) {
  const [items, setItems] = useState<DrillSequenceItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!sessionId || !accessToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/drill-sequence`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return;
      const data = (await res.json()) as { items?: DrillSequenceItem[] };
      setItems(Array.isArray(data.items) ? data.items : []);
    } finally {
      setLoading(false);
    }
  }, [sessionId, accessToken]);

  const replace = useCallback(
    async (nextItems: DrillSequenceItem[]) => {
      if (!sessionId || !accessToken) return false;
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/drill-sequence`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: nextItems }),
      });
      if (!res.ok) return false;
      setItems(nextItems);
      return true;
    },
    [sessionId, accessToken]
  );

  const append = useCallback(
    async (item: DrillSequenceItem) => {
      if (!sessionId || !accessToken) return false;
      const nextItems = [...items, item];
      const ok = await replace(nextItems);
      return ok;
    },
    [sessionId, accessToken, items, replace]
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    drillSequence: items,
    drillLoading: loading,
    refreshDrillSequence: refresh,
    replaceDrillSequence: replace,
    appendDrillSequenceItem: append,
  };
}
