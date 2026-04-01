import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AssemblyCanvas } from '../../../components/AssemblyCanvas';
import { theme } from '../../../lib/theme';

const colors = theme.light;
const spacing = theme.spacing;

export default function SongMapScreen() {
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
        <Text style={styles.emptyTitle}>Song Map</Text>
        <Text style={styles.emptyText}>Missing session id.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Song Map</Text>
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() =>
            router.push({
              pathname: './spatial',
              params: { sessionId: resolvedSessionId },
            })
          }
        >
          <Text style={styles.nextBtnText}>Spatial</Text>
        </TouchableOpacity>
      </View>
      <AssemblyCanvas sessionId={resolvedSessionId} />
    </View>
  );
}

const t = theme.light;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.ground },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { color: colors.active, fontSize: 16, fontWeight: '900' },
  nextBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: spacing.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.chrome,
  },
  nextBtnText: { color: colors.active, fontSize: 12, fontWeight: '800' },
  emptyWrap: {
    flex: 1,
    backgroundColor: colors.ground,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyTitle: { color: colors.active, fontSize: 20, fontWeight: '900', marginBottom: 8 },
  emptyText: { color: colors.muted, fontSize: 14 },
});
