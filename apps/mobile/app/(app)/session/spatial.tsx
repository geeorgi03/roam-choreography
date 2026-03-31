import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AssemblyView } from '../../../components/AssemblyView';
import { theme } from '../../../lib/theme';

export default function SpatialScreen() {
  const router = useRouter();
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
        <Text style={styles.emptyTitle}>Spatial</Text>
        <Text style={styles.emptyText}>Missing session id.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Spatial</Text>
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() =>
            router.push({
              pathname: './group',
              params: { sessionId: resolvedSessionId },
            })
          }
        >
          <Text style={styles.nextBtnText}>Group</Text>
        </TouchableOpacity>
      </View>
      <AssemblyView sessionId={resolvedSessionId} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { color: theme.textPrimary, fontSize: 16, fontWeight: '900' },
  nextBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2A2A32',
    backgroundColor: '#1B1B22',
  },
  nextBtnText: { color: theme.textPrimary, fontSize: 12, fontWeight: '800' },
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
