import { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { Clip } from '@roam/types';
import BottomSheet from '@gorhom/bottom-sheet';
import { theme } from '../../lib/theme';
import { useTheme, type ThemePalette } from '../../lib/contexts/ThemeContext';
import { useTranslation } from '../../lib/i18n';
import { useSession } from '../../lib/hooks/useSession';
import { ClipCard } from '../../components/ClipCard';
import type { ClipRow } from '../../lib/database';
import { ClipViewerSheetStandalone } from '../../components/session/ClipViewerSheetStandalone';
import { thumbnailsBase64FromVideoUri } from '../../lib/markingVideoThumbs';
import {
  indexAllMarkingClips,
  searchByThumbnails,
  type MarkingSearchMatch,
} from '../../lib/markingSearch';

const spacing = theme.spacing;

function fmt(template: string, vars: Record<string, string>): string {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{${k}}`).join(v);
  }
  return out;
}

export default function MarkingSearchScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();
  const { session } = useSession();
  const token = session?.access_token ?? null;

  const [busy, setBusy] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [matches, setMatches] = useState<MarkingSearchMatch[]>([]);
  const [indexedCount, setIndexedCount] = useState<number | null>(null);
  const [selectedClip, setSelectedClip] = useState<ClipRow | null>(null);
  const clipSheetRef = useRef<BottomSheet | null>(null);

  const toClipRow = useCallback((clip: Clip): ClipRow => {
    const localId =
      (clip as unknown as { local_id?: string | null }).local_id ??
      (clip as unknown as { id: string }).id;
    const serverId = (clip as unknown as { id: string }).id;
    const sessionId = (clip as unknown as { session_id?: string | null }).session_id ?? null;
    return {
      local_id: localId,
      server_id: serverId,
      session_id: sessionId,
      label: (clip as unknown as { label?: string | null }).label ?? 'Clip',
      recorded_at: (clip as unknown as { recorded_at?: string | null }).recorded_at ?? null,
      file_uri: null,
      upload_status: 'ready',
      upload_progress: 0,
      mux_playback_id: (clip as unknown as { mux_playback_id?: string | null }).mux_playback_id ?? null,
      source_url: (clip as unknown as { url?: string | null }).url ?? null,
      parent_clip_id: (clip as unknown as { parent_clip_id?: string | null }).parent_clip_id ?? null,
      triggered_by_note_id:
        (clip as unknown as { triggered_by_note_id?: string | null }).triggered_by_note_id ?? null,
      move_name: (clip as unknown as { move_name?: string | null }).move_name ?? null,
      style: (clip as unknown as { style?: string | null }).style ?? null,
      energy: (clip as unknown as { energy?: string | null }).energy ?? null,
      difficulty: (clip as unknown as { difficulty?: string | null }).difficulty ?? null,
      bpm: (clip as unknown as { bpm?: number | null }).bpm ?? null,
      notes: (clip as unknown as { notes?: string | null }).notes ?? null,
      clip_type:
        ((clip as unknown as { clip_type?: string | null }).clip_type as
          | 'MINE'
          | 'REF'
          | 'voice_memo'
          | null
          | undefined) ?? null,
    };
  }, []);

  const runSearch = useCallback(
    async (thumbnails: string[]) => {
      if (!token) {
        Alert.alert(t('marking.notSignedInTitle'), t('marking.notSignedInBody'));
        return;
      }
      setBusy(true);
      setMatches([]);
      try {
        const data = await searchByThumbnails(token, thumbnails, 12);
        setMatches(data.matches ?? []);
        setIndexedCount(data.indexed_count ?? 0);
        if (data.hint === 'index_library_first') {
          Alert.alert(t('marking.indexFirstTitle'), t('marking.indexFirstBody'));
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : t('marking.searchFailed');
        Alert.alert(t('marking.searchFailed'), msg);
      } finally {
        setBusy(false);
      }
    },
    [token, t]
  );

  const pickVideoAndSearch = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('marking.permissionTitle'), t('marking.permissionBody'));
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: 12,
      quality: 0.7,
    });
    if (picked.canceled || !picked.assets[0]?.uri) return;
    setBusy(true);
    try {
      const thumbs = await thumbnailsBase64FromVideoUri(picked.assets[0].uri);
      await runSearch(thumbs);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('marking.searchFailed');
      Alert.alert(t('marking.searchFailed'), msg);
    } finally {
      setBusy(false);
    }
  }, [runSearch, t]);

  const recordMarkingAndSearch = useCallback(async () => {
    const cam = await ImagePicker.requestCameraPermissionsAsync();
    if (!cam.granted) {
      Alert.alert(t('marking.permissionTitle'), t('marking.permissionBody'));
      return;
    }
    const recorded = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: 10,
      quality: 0.7,
    });
    if (recorded.canceled || !recorded.assets[0]?.uri) return;
    setBusy(true);
    try {
      const thumbs = await thumbnailsBase64FromVideoUri(recorded.assets[0].uri);
      await runSearch(thumbs);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('marking.searchFailed');
      Alert.alert(t('marking.searchFailed'), msg);
    } finally {
      setBusy(false);
    }
  }, [runSearch, t]);

  const indexLibrary = useCallback(async () => {
    if (!token) return;
    setIndexing(true);
    try {
      const { indexed, failed } = await indexAllMarkingClips(token, 30);
      Alert.alert(
        t('marking.indexDoneTitle'),
        fmt(t('marking.indexDoneBody'), {
          indexed: String(indexed),
          failed: String(failed),
        })
      );
      setIndexedCount(indexed);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('marking.indexFailed');
      Alert.alert(t('marking.indexFailed'), msg);
    } finally {
      setIndexing(false);
    }
  }, [token, t]);

  const openClip = (clip: Clip) => {
    setSelectedClip(toClipRow(clip));
    requestAnimationFrame(() => {
      clipSheetRef.current?.snapToIndex(0);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>{t('marking.title')}</Text>
        <Text style={styles.subtitle}>{t('marking.subtitle')}</Text>
        {indexedCount != null ? (
          <Text style={styles.meta}>
            {fmt(t('marking.indexedMeta'), { count: String(indexedCount) })}
          </Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryBtn, busy && styles.btnDisabled]}
          onPress={recordMarkingAndSearch}
          disabled={busy}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>{t('marking.recordMarking')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryBtn, busy && styles.btnDisabled]}
          onPress={pickVideoAndSearch}
          disabled={busy}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryBtnText}>{t('marking.pickVideo')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.ghostBtn, indexing && styles.btnDisabled]}
          onPress={indexLibrary}
          disabled={indexing || busy}
          activeOpacity={0.85}
        >
          {indexing ? (
            <ActivityIndicator color={colors.active} size="small" />
          ) : (
            <Text style={styles.ghostBtnText}>{t('marking.indexLibrary')}</Text>
          )}
        </TouchableOpacity>
      </View>

      {busy ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.active} />
          <Text style={styles.busyText}>{t('marking.searching')}</Text>
        </View>
      ) : null}

      <FlatList
        data={matches}
        keyExtractor={(item) => item.clip.id}
        contentContainerStyle={matches.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={
          !busy ? (
            <Text style={styles.emptyHint}>{t('marking.emptyHint')}</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.matchRow}>
            <Text style={styles.score}>
              {fmt(t('marking.matchScore'), {
                percent: String(Math.round(item.score * 100)),
              })}
            </Text>
            <ClipCard clip={toClipRow(item.clip)} onPress={() => openClip(item.clip)} onLongPress={() => {}} />
          </View>
        )}
      />

      <ClipViewerSheetStandalone
        ref={clipSheetRef}
        clip={selectedClip}
        sessionId={selectedClip?.session_id ?? null}
        onClose={() => setSelectedClip(null)}
        allClips={matches.map((m) => toClipRow(m.clip))}
        allNotes={[]}
        onOpenClip={(row) => setSelectedClip(row)}
      />
    </View>
  );
}

function createStyles(colors: ThemePalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.ground },
    hero: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
    title: {
      fontFamily: theme.typography.displayFamily,
      fontSize: 22,
      color: colors.active,
      marginBottom: 6,
    },
    subtitle: { fontSize: 14, color: colors.muted, lineHeight: 20 },
    meta: { marginTop: 8, fontSize: 12, color: colors.muted },
    actions: { paddingHorizontal: 16, gap: 10, paddingBottom: 12 },
    primaryBtn: {
      backgroundColor: colors.mine,
      borderRadius: spacing.radiusMd,
      paddingVertical: 14,
      alignItems: 'center',
    },
    primaryBtnText: { color: colors.chrome, fontWeight: '800', fontSize: 15 },
    secondaryBtn: {
      backgroundColor: colors.chrome,
      borderRadius: spacing.radiusMd,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryBtnText: { color: colors.active, fontWeight: '700', fontSize: 15 },
    ghostBtn: {
      paddingVertical: 12,
      alignItems: 'center',
    },
    ghostBtnText: { color: colors.muted, fontWeight: '600', fontSize: 13 },
    btnDisabled: { opacity: 0.6 },
    center: { alignItems: 'center', paddingVertical: 16 },
    busyText: { marginTop: 8, color: colors.muted, fontSize: 13 },
    list: { paddingBottom: 24 },
    emptyList: { flexGrow: 1, paddingHorizontal: 16 },
    emptyHint: { color: colors.muted, fontSize: 14, textAlign: 'center', paddingTop: 24 },
    matchRow: { paddingHorizontal: 16, marginBottom: 8 },
    score: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.muted,
      marginBottom: 4,
      marginLeft: 4,
    },
  });
}
