import React, { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { theme } from '../../../lib/theme';
import { useMusicTrackStatus } from '../../../lib/hooks/useMusicTrackStatus';
import { useClips } from '../../../lib/hooks/useClips';
import { AssemblyView } from '../../../components/AssemblyView';

type GroupMode = 'choreographer' | 'dancer';

const DANCERS = [
  { id: 'A', name: 'Alex', color: '#7db9a8', online: true },
  { id: 'B', name: 'Bo', color: '#e8a87c', online: true },
  { id: 'C', name: 'Cam', color: '#9aa9ff', online: false },
];

export default function GroupScreen() {
  const { sessionId, id } = useLocalSearchParams<{ sessionId?: string; id?: string }>();
  const [mode, setMode] = useState<GroupMode>('choreographer');
  const resolvedSessionId =
    typeof sessionId === 'string' && sessionId.length > 0
      ? sessionId
      : typeof id === 'string' && id.length > 0
        ? id
        : null;

  const { musicTrack } = useMusicTrackStatus(resolvedSessionId);
  const { clips } = useClips(resolvedSessionId);
  const activeSection = musicTrack?.sections?.[0]?.label ?? 'CHORUS';

  const readyClips = useMemo(
    () => clips.filter((c) => c.upload_status === 'ready' && !!c.mux_playback_id),
    [clips]
  );

  if (!resolvedSessionId) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>Group</Text>
        <Text style={styles.emptyText}>Missing session id.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Group Session</Text>
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'choreographer' && styles.modeBtnActive]}
            onPress={() => setMode('choreographer')}
          >
            <Text style={[styles.modeText, mode === 'choreographer' && styles.modeTextActive]}>
              Choreographer
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'dancer' && styles.modeBtnActive]}
            onPress={() => setMode('dancer')}
          >
            <Text style={[styles.modeText, mode === 'dancer' && styles.modeTextActive]}>
              Dancer
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {mode === 'choreographer' ? (
        <View style={styles.main}>
          <View style={styles.left}>
            <AssemblyView sessionId={resolvedSessionId} />
          </View>
          <View style={styles.right}>
            <Text style={styles.panelTitle}>Dancers</Text>
            {DANCERS.map((d) => (
              <View key={d.id} style={styles.dancerRow}>
                <View style={[styles.dot, { backgroundColor: d.color, opacity: d.online ? 1 : 0.35 }]} />
                <Text style={styles.dancerName}>{d.name}</Text>
                <Text style={styles.dancerState}>{d.online ? 'active' : 'offline'}</Text>
              </View>
            ))}
            <Text style={[styles.panelTitle, { marginTop: 14 }]}>Broadcast</Text>
            <View style={styles.broadcastBox}>
              <Text style={styles.broadcastText}>send note to all dancers...</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.mainDancer}>
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>{activeSection} · everyone</Text>
            <Text style={styles.helper}>
              Full formation visibility is preserved in dancer mode.
            </Text>
          </View>
          <Text style={styles.panelTitle}>All Takes</Text>
          <FlatList
            data={readyClips}
            numColumns={4}
            keyExtractor={(c) => c.local_id}
            columnWrapperStyle={{ gap: 8 }}
            contentContainerStyle={{ gap: 8, paddingBottom: 20 }}
            renderItem={({ item }) => (
              <View style={styles.thumb}>
                <Text style={styles.thumbLabel} numberOfLines={1}>
                  {item.label ?? 'Clip'}
                </Text>
                <Text style={styles.thumbSub}>MINE/REF</Text>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyInline}>
                <Text style={styles.emptyText}>No group clips yet.</Text>
              </View>
            }
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {DANCERS.map((d) => (
              <View key={d.id} style={[styles.badge, { borderColor: d.color }]}>
                <Text style={styles.badgeText}>{d.id}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
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
    gap: 10,
  },
  title: { color: theme.textPrimary, fontSize: 18, fontWeight: '900' },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2A2A32',
    backgroundColor: '#1B1B22',
  },
  modeBtnActive: { borderColor: '#C8F135', backgroundColor: '#1a2300' },
  modeText: { color: theme.textSecondary, fontSize: 12, fontWeight: '700' },
  modeTextActive: { color: '#C8F135' },
  main: { flex: 1, flexDirection: 'row' },
  left: { flex: 1, borderRightWidth: 1, borderRightColor: '#2A2A32' },
  right: { width: 260, padding: 12 },
  panelTitle: { color: theme.textPrimary, fontSize: 13, fontWeight: '800', marginBottom: 8 },
  dancerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A32',
    borderRadius: 10,
    backgroundColor: '#1B1B22',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
    gap: 8,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dancerName: { color: theme.textPrimary, fontSize: 13, fontWeight: '700', flex: 1 },
  dancerState: { color: theme.textSecondary, fontSize: 12 },
  broadcastBox: {
    borderWidth: 1,
    borderColor: '#2A2A32',
    borderRadius: 10,
    backgroundColor: '#1B1B22',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  broadcastText: { color: theme.textSecondary, fontSize: 12 },
  mainDancer: { flex: 1, padding: 12 },
  card: {
    borderWidth: 1,
    borderColor: '#2A2A32',
    borderRadius: 10,
    backgroundColor: '#1B1B22',
    padding: 12,
    marginBottom: 12,
  },
  sectionLabel: { color: theme.textPrimary, fontSize: 13, fontWeight: '800', marginBottom: 4 },
  helper: { color: theme.textSecondary, fontSize: 12 },
  thumb: {
    flex: 1,
    minHeight: 70,
    borderWidth: 1,
    borderColor: '#2A2A32',
    borderRadius: 8,
    backgroundColor: '#1B1B22',
    padding: 8,
    justifyContent: 'space-between',
  },
  thumbLabel: { color: theme.textPrimary, fontSize: 11, fontWeight: '700' },
  thumbSub: { color: theme.textSecondary, fontSize: 10 },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B1B22',
  },
  badgeText: { color: theme.textPrimary, fontSize: 11, fontWeight: '800' },
  emptyWrap: {
    flex: 1,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyInline: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyTitle: { color: theme.textPrimary, fontSize: 20, fontWeight: '900', marginBottom: 8 },
  emptyText: { color: theme.textSecondary, fontSize: 14 },
});
