import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import BottomSheet from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';
import { theme } from '../../lib/theme';
import { useTheme, type ThemePalette } from '../../lib/contexts/ThemeContext';
import { useInbox, type InboxClip } from '../../lib/hooks/useInbox';
import { useInboxCount } from '../../lib/contexts/InboxCountContext';
import { AssignPickerSheet, type SessionListItem } from '../../components/AssignPickerSheet';
import { CreateSessionSheet } from '../../components/CreateSessionSheet';
import { PaywallSheet } from '../../components/PaywallSheet';

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const diff = Math.max(0, Date.now() - t);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function InboxScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createInboxStyles(colors), [colors]);
  const router = useRouter();
  const { sessionId: originSessionId, sectionName: originSectionName } =
    useLocalSearchParams<{ sessionId?: string; sectionName?: string }>();
  const { clips, loading, staleClips, assignClip, deleteClip, refresh } = useInbox();
  const { refreshCount } = useInboxCount();
  const assignSheetRef = useRef<BottomSheet | null>(null);
  const createSheetRef = useRef<BottomSheet | null>(null);
  const paywallSheetRef = useRef<BottomSheet | null>(null);
  const [selectedClip, setSelectedClip] = useState<InboxClip | null>(null);

  const sectionContext =
    typeof originSessionId === 'string' &&
    originSessionId.length > 0 &&
    typeof originSectionName === 'string' &&
    originSectionName.length > 0
      ? { sessionId: originSessionId, sectionName: originSectionName }
      : null;

  const headerCount = useMemo(() => clips.length, [clips.length]);

  const handleAssign = (clip: InboxClip) => {
    setSelectedClip(clip);
    assignSheetRef.current?.snapToIndex(0);
  };

  const onPickSession = async (s: SessionListItem) => {
    if (!selectedClip) return false;
    const ok = await assignClip(selectedClip.id, s.id);
    if (ok) {
      Toast.show({ type: 'success', text1: `Added to ${s.name}` });
      refreshCount().catch(() => {});
    }
    return ok;
  };

  const renderItem = ({ item }: { item: InboxClip }) => {
    const canPlay = item.upload_status === 'ready' && !!item.mux_playback_id;
    return (
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <Text style={styles.typeIcon}>🎬</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {item.label ?? 'Clip'}
            </Text>
            <Text style={styles.rowMeta}>{timeAgo(item.recorded_at)}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, !canPlay && styles.actionBtnDisabled]}
            onPress={() => {
              if (!canPlay) return;
              router.push({
                pathname: '/session/clip-player',
                params: {
                  mux_playback_id: item.mux_playback_id ?? undefined,
                  move_name: item.label ?? undefined,
                },
              });
            }}
            disabled={!canPlay}
          >
            <Text style={styles.actionText}>▶</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={async () => {
              if (sectionContext) {
                const ok = await assignClip(
                  item.id,
                  sectionContext.sessionId,
                  sectionContext.sectionName
                );
                if (ok) {
                  Toast.show({
                    type: 'success',
                    text1: `Added to ${sectionContext.sectionName}`,
                  });
                  refreshCount().catch(() => {});
                  router.replace({
                    pathname: `/session/${sectionContext.sessionId}`,
                    params: { sectionName: sectionContext.sectionName },
                  });
                }
                return;
              }
              handleAssign(item);
            }}
          >
            <Text style={styles.actionText}>{sectionContext ? '＋' : '→'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={async () => {
              const ok = await deleteClip(item.id);
              if (!ok) {
                Toast.show({ type: 'error', text1: 'Failed to delete' });
                return;
              }
              refreshCount().catch(() => {});
            }}
          >
            <Text style={styles.actionText}>🗑</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>
            {sectionContext ? `Pick for ${sectionContext.sectionName}` : 'Inbox'}
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{headerCount}</Text>
          </View>
        </View>
      </View>

      {staleClips.length > 0 ? (
        <View style={styles.nudge}>
          <Text style={styles.nudgeText}>
            Some clips are older than 48 hours. Assign them to a session to keep things tidy.
          </Text>
        </View>
      ) : null}

      {sectionContext ? (
        <View style={styles.nudge}>
          <Text style={styles.nudgeText}>
            Picking for{' '}
            <Text style={{ color: colors.active, fontWeight: '800' }}>
              {sectionContext.sectionName}
            </Text>
          </Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.active} />
        </View>
      ) : clips.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📥</Text>
          <Text style={styles.emptyTitle}>Nothing here</Text>
          <Text style={styles.emptySub}>Clips you save “Later” will appear in your Inbox.</Text>
        </View>
      ) : (
        <FlatList
          data={clips}
          keyExtractor={(c) => c.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onRefresh={refresh}
          refreshing={loading}
        />
      )}

      <AssignPickerSheet
        bottomSheetRef={assignSheetRef}
        title="Assign clip"
        onPick={onPickSession}
        onCreateNewSession={() => createSheetRef.current?.snapToIndex(0)}
      />
      <CreateSessionSheet
        bottomSheetRef={createSheetRef}
        onPaywallRequired={() => paywallSheetRef.current?.snapToIndex(0)}
        onCreated={(s) => {
          Toast.show({ type: 'success', text1: 'Session created' });
          if (!selectedClip) return;
          assignClip(selectedClip.id, s.id)
            .then((ok) => {
              if (ok) refreshCount().catch(() => {});
            })
            .catch(() => {});
        }}
      />
      <PaywallSheet bottomSheetRef={paywallSheetRef} />
    </View>
  );
}

function createInboxStyles(colors: ThemePalette) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ground },
  header: { paddingTop: 12, paddingHorizontal: 16, paddingBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.active },
  badge: {
    backgroundColor: colors.chrome,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { color: colors.active, fontWeight: '700' },
  nudge: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: theme.borderRadius,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.chrome,
  },
  nudgeText: { color: colors.muted, fontSize: 14 },
  listContent: { padding: 16, paddingTop: 8, gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: 12,
    borderRadius: theme.borderRadius,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.chrome,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  typeIcon: { fontSize: 18 },
  rowTitle: { color: colors.active, fontSize: 15, fontWeight: '700' },
  rowMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.chrome,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDisabled: { opacity: 0.4 },
  deleteBtn: { borderColor: colors.capture },
  actionText: { color: colors.active, fontSize: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyIcon: { fontSize: 42, marginBottom: 12 },
  emptyTitle: { color: colors.active, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  emptySub: { color: colors.muted, fontSize: 14, textAlign: 'center' },
});
}

