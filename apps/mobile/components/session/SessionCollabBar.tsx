import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { useSessionCollab } from '../../lib/contexts/SessionCollabContext';
import { CollabStatusBar } from './CollabStatusBar';

/** Live collab strip — uses {@link SessionCollabProvider} (single realtime connection). */
export function SessionCollabBar({
  compact = true,
  embedded = false,
  showInvite,
}: {
  compact?: boolean;
  embedded?: boolean;
  /** Override invite button; defaults to choreographer-only. */
  showInvite?: boolean;
}) {
  const { openSheet } = useSessionContext();
  const { participants, connectionStatus, isChoreographer } = useSessionCollab();
  const inviteVisible = showInvite ?? isChoreographer;

  return (
    <View style={[styles.wrap, embedded && styles.wrapEmbedded]}>
      <CollabStatusBar
        compact={compact}
        connected={connectionStatus.isConnected}
        hasError={connectionStatus.hasError}
        participantCount={participants.length}
        showInvite={inviteVisible}
        onInvite={() => openSheet('share')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  wrapEmbedded: {
    paddingHorizontal: 0,
  },
});
