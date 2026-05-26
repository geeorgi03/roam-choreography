import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { Clip } from '@roam/types';
import { theme } from '../../lib/theme';
import { useTheme, type ThemePalette } from '../../lib/contexts/ThemeContext';
import { useTranslation } from '../../lib/i18n';
import {
  indexAllMarkingClips,
  searchByClipId,
  searchByThumbnails,
  type MarkingSearchMatch,
} from '../../lib/markingSearch';
import { thumbnailsBase64FromVideoUri } from '../../lib/markingVideoThumbs';

type Props = {
  visible: boolean;
  onClose: () => void;
  token: string | null;
  clips: Clip[];
  onOpenMatch: (clip: Clip) => void;
};

export function MarkingSearchPanel({ visible, onClose, token, clips, onOpenMatch }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [matches, setMatches] = useState<MarkingSearchMatch[]>([]);
  const [pickerMode, setPickerMode] = useState(false);

  const readyClips = useMemo(
    () =>
      clips.filter(
        (c) =>
          (c as { upload_status?: string }).upload_status === 'ready' &&
          !!(c as { mux_playback_id?: string | null }).mux_playback_id
      ),
    [clips]
  );

  const resetResults = () => {
    setMatches([]);
    setStatus(null);
  };

  const runIndexAll = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    setStatus(t('markingSearch.indexing'));
    try {
      const { indexed, failed } = await indexAllMarkingClips(token, 30);
      setStatus(`${t('markingSearch.indexDonePrefix')} ${indexed} (${failed} ${t('markingSearch.indexDoneFailed')})`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : t('markingSearch.failed'));
    } finally {
      setBusy(false);
    }
  }, [token, t]);

  const runSearchClip = useCallback(
    async (clipId: string) => {
      if (!token) return;
      setPickerMode(false);
      setBusy(true);
      setStatus(t('markingSearch.searching'));
      try {
        const data = await searchByClipId(token, clipId);
        setMatches(data.matches ?? []);
        if ((data.matches ?? []).length === 0) {
          setStatus(
            data.hint === 'index_library_first'
              ? t('markingSearch.indexFirst')
              : t('markingSearch.noMatches')
          );
        } else {
          setStatus(null);
        }
      } catch (e) {
        setMatches([]);
        setStatus(e instanceof Error ? e.message : t('markingSearch.failed'));
      } finally {
        setBusy(false);
      }
    },
    [token, t]
  );

  const recordMarkedVideo = useCallback(async () => {
    if (!token) return;
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('markingSearch.title'), t('markingSearch.needCamera'));
      return;
    }
    const recorded = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: 10,
      quality: 0.7,
    });
    if (recorded.canceled || !recorded.assets[0]?.uri) return;

    setBusy(true);
    setStatus(t('markingSearch.searching'));
    try {
      const thumbs = await thumbnailsBase64FromVideoUri(recorded.assets[0].uri);
      const data = await searchByThumbnails(token, thumbs);
      setMatches(data.matches ?? []);
      if ((data.matches ?? []).length === 0) {
        setStatus(
          data.hint === 'index_library_first'
            ? t('markingSearch.indexFirst')
            : t('markingSearch.noMatches')
        );
      } else {
        setStatus(null);
      }
    } catch (e) {
      setMatches([]);
      setStatus(e instanceof Error ? e.message : t('markingSearch.failed'));
    } finally {
      setBusy(false);
    }
  }, [token, t]);

  const pickMarkedVideo = useCallback(async () => {
    if (!token) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('markingSearch.title'), t('markingSearch.needGallery'));
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
    });
    if (picked.canceled || !picked.assets[0]?.uri) return;

    setBusy(true);
    setStatus(t('markingSearch.searching'));
    try {
      const thumbs = await thumbnailsBase64FromVideoUri(picked.assets[0].uri);
      const data = await searchByThumbnails(token, thumbs);
      setMatches(data.matches ?? []);
      if ((data.matches ?? []).length === 0) {
        setStatus(
          data.hint === 'index_library_first'
            ? t('markingSearch.indexFirst')
            : t('markingSearch.noMatches')
        );
      } else {
        setStatus(null);
      }
    } catch (e) {
      setMatches([]);
      setStatus(e instanceof Error ? e.message : t('markingSearch.failed'));
    } finally {
      setBusy(false);
    }
  }, [token, t]);

  const scoreLabel = (score: number) => `${Math.round(Math.max(0, Math.min(1, score)) * 100)}%`;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Text style={styles.close}>{t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('markingSearch.title')}</Text>
          <View style={{ width: 48 }} />
        </View>

        <Text style={styles.subtitle}>{t('markingSearch.subtitle')}</Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, busy && styles.btnDisabled]}
            onPress={runIndexAll}
            disabled={busy || !token}
          >
            <Text style={styles.btnText}>{t('markingSearch.indexLibrary')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary, busy && styles.btnDisabled]}
            onPress={recordMarkedVideo}
            disabled={busy || !token}
          >
            <Text style={styles.btnTextPrimary}>{t('markingSearch.recordMarked')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, busy && styles.btnDisabled]}
            onPress={pickMarkedVideo}
            disabled={busy || !token}
          >
            <Text style={styles.btnText}>{t('markingSearch.pickMarkedVideo')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, busy && styles.btnDisabled]}
            onPress={() => {
              resetResults();
              setPickerMode(true);
            }}
            disabled={busy || !token || readyClips.length === 0}
          >
            <Text style={styles.btnText}>{t('markingSearch.useLibraryClip')}</Text>
          </TouchableOpacity>
        </View>

        {busy ? (
          <View style={styles.statusRow}>
            <ActivityIndicator color={colors.active} />
            <Text style={styles.status}>{status ?? t('markingSearch.searching')}</Text>
          </View>
        ) : status ? (
          <Text style={styles.status}>{status}</Text>
        ) : null}

        {pickerMode ? (
          <FlatList
            data={readyClips}
            keyExtractor={(item) => (item as { id: string }).id}
            style={styles.pickerList}
            renderItem={({ item }) => {
              const id = (item as { id: string }).id;
              const label = (item as { label?: string }).label ?? 'Clip';
              return (
                <TouchableOpacity
                  style={styles.pickerRow}
                  onPress={() => runSearchClip(id)}
                  disabled={busy}
                >
                  <Text style={styles.pickerLabel}>{label}</Text>
                </TouchableOpacity>
              );
            }}
          />
        ) : null}

        <FlatList
          data={matches}
          keyExtractor={(item) => item.clip.id}
          contentContainerStyle={styles.results}
          ListHeaderComponent={
            matches.length > 0 ? (
              <Text style={styles.resultsTitle}>{t('markingSearch.results')}</Text>
            ) : null
          }
          renderItem={({ item }) => {
            const label = (item.clip as { label?: string }).label ?? 'Clip';
            return (
              <TouchableOpacity
                style={styles.matchRow}
                onPress={() => onOpenMatch(item.clip)}
              >
                <View style={styles.matchMeta}>
                  <Text style={styles.matchLabel}>{label}</Text>
                  <Text style={styles.matchScore}>{scoreLabel(item.score)}</Text>
                </View>
                <Text style={styles.matchHint}>{t('markingSearch.tapToOpen')}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </Modal>
  );
}

function createStyles(colors: ThemePalette) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.ground,
      paddingTop: 48,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    close: {
      color: colors.active,
      fontSize: 16,
      fontWeight: '700',
    },
    title: {
      fontFamily: theme.typography.displayFamily,
      fontSize: 18,
      color: colors.active,
    },
    subtitle: {
      paddingHorizontal: 16,
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 12,
    },
    actions: {
      paddingHorizontal: 16,
      gap: 8,
      marginBottom: 12,
    },
    btn: {
      backgroundColor: colors.chrome,
      borderRadius: theme.spacing.radiusMd,
      paddingVertical: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    btnPrimary: {
      backgroundColor: colors.mine,
      borderColor: colors.mine,
    },
    btnDisabled: {
      opacity: 0.6,
    },
    btnText: {
      color: colors.active,
      fontWeight: '700',
      fontSize: 14,
    },
    btnTextPrimary: {
      color: colors.chrome,
      fontWeight: '800',
      fontSize: 14,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    status: {
      color: colors.muted,
      fontSize: 13,
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    pickerList: {
      maxHeight: 160,
      marginHorizontal: 16,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: theme.spacing.radiusMd,
      marginBottom: 12,
    },
    pickerRow: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pickerLabel: {
      color: colors.active,
      fontSize: 14,
    },
    results: {
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    resultsTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.muted,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    matchRow: {
      backgroundColor: colors.chrome,
      borderRadius: theme.spacing.radiusMd,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    matchMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    matchLabel: {
      color: colors.active,
      fontSize: 16,
      fontWeight: '700',
      flex: 1,
    },
    matchScore: {
      color: colors.mine,
      fontWeight: '800',
      fontSize: 14,
    },
    matchHint: {
      marginTop: 4,
      color: colors.muted,
      fontSize: 12,
    },
  });
}
