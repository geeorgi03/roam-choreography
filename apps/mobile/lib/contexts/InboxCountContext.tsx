import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { supabase } from '../supabase';
import { API_BASE } from '../api';
import { getInboxClips } from '../database';

type InboxCountContextValue = {
  count: number;
  refreshCount: () => Promise<void>;
};

const InboxCountContext = createContext<InboxCountContextValue | null>(null);

async function authHeader(): Promise<{ Authorization: string } | null> {
  if (!supabase) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

export function InboxCountProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);
  const refreshInFlight = useRef<Promise<void> | null>(null);

  const refreshCount = useCallback(async () => {
    if (refreshInFlight.current) return refreshInFlight.current;
    const p = (async () => {
      try {
        const headers = await authHeader();
        if (!headers) {
          setCount(0);
          return;
        }
        const res = await fetch(`${API_BASE}/inbox/count`, { headers });
        if (!res.ok) return;
        const body = (await res.json()) as { count?: number };
        const serverCount = typeof body.count === 'number' ? body.count : 0;

        // Include locally-pending clips (no server_id yet) in the badge count
        let localPending = 0;
        try {
          localPending = getInboxClips().filter((r) => !r.server_id && r.upload_status !== 'failed')
            .length;
        } catch {
          // ignore
        }
        setCount(serverCount + localPending);
      } catch {
        // ignore lightweight count failures
      }
    })().finally(() => {
      refreshInFlight.current = null;
    });

    refreshInFlight.current = p;
    return p;
  }, []);

  useEffect(() => {
    refreshCount().catch(() => {});
  }, [refreshCount]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') {
        refreshCount().catch(() => {});
      }
    });
    return () => sub.remove();
  }, [refreshCount]);

  const value = useMemo(() => ({ count, refreshCount }), [count, refreshCount]);

  return <InboxCountContext.Provider value={value}>{children}</InboxCountContext.Provider>;
}

export function useInboxCount() {
  const ctx = useContext(InboxCountContext);
  if (!ctx) throw new Error('useInboxCount must be used within an InboxCountProvider');
  return ctx;
}

