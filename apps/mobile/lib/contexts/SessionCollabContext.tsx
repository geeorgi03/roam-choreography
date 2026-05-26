import React, { createContext, useContext, type ReactNode } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useSession } from '../hooks/useSession';
import { useGroupRealtime, type ConnectionStatus } from '../hooks/useGroupRealtime';

type GroupCollab = ReturnType<typeof useGroupRealtime>;

type SessionCollabValue = {
  participants: GroupCollab['participants'];
  myParticipant: GroupCollab['myParticipant'];
  isChoreographer: boolean;
  /** True when joined as dancer (invite link / dancer role). */
  isDancerMode: boolean;
  broadcasts: GroupCollab['broadcasts'];
  sendBroadcast: (message: string) => Promise<boolean>;
  updatePosition: (x: number, y: number, note?: string) => Promise<void>;
  connectionStatus: ConnectionStatus;
};

const SessionCollabContext = createContext<SessionCollabValue | null>(null);

export function SessionCollabProvider({
  sessionId,
  children,
}: {
  sessionId: string;
  children: ReactNode;
}) {
  const { session } = useSession();
  const { share_token, token } = useLocalSearchParams<{ share_token?: string; token?: string }>();
  const inviteShareToken =
    typeof share_token === 'string' && share_token.length > 0
      ? share_token
      : typeof token === 'string' && token.length > 0
        ? token
        : null;

  const collab = useGroupRealtime(sessionId, session?.access_token, inviteShareToken);

  const isDancerMode = collab.myParticipant?.role === 'dancer';

  const value: SessionCollabValue = {
    ...collab,
    isDancerMode,
  };

  return (
    <SessionCollabContext.Provider value={value}>{children}</SessionCollabContext.Provider>
  );
}

export function useSessionCollab(): SessionCollabValue {
  const ctx = useContext(SessionCollabContext);
  if (!ctx) {
    throw new Error('useSessionCollab must be used within SessionCollabProvider');
  }
  return ctx;
}
