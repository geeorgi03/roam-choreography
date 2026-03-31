import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AssemblyCanvas } from '../../../components/AssemblyCanvas';
import { theme } from '../../../lib/theme';

export default function SongMapScreen() {
  const { sessionId, id } = useLocalSearchParams<{ sessionId?: string; id?: string }>();
  const resolvedSessionId =
    typeof sessionId === 'string' && sessionId.length > 0
      ? sessionId
      : typeof id === 'string' && id.length > 0
        ? id
        : null;

  if (!resolvedSessionId) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>Song Map</Text>
        <Text style={styles.emptyText}>Missing session id.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Song Map</Text>
      </View>
      <AssemblyCanvas sessionId={resolvedSessionId} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A32',
  },
  title: { color: theme.textPrimary, fontSize: 16, fontWeight: '900' },
  emptyWrap: {
    flex: 1,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyTitle: { color: theme.textPrimary, fontSize: 20, fontWeight: '900', marginBottom: 8 },
  emptyText: { color: theme.textSecondary, fontSize: 14 },
});
