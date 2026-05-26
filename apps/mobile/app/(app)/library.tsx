import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../../lib/theme';
import type { ThemePalette } from '../../lib/contexts/ThemeContext';
import { useAppChromeTheme } from '../../lib/hooks/useAppChromeTheme';
import {
  ChoreographyHubFilterChip,
  ChoreographyHubSearch,
} from '../../components/choreography/hub/ChoreographyHubChrome';
import { DisplayTitle, MonoCaps } from '../../components/choreography/ChoreographyPrimitives';
import type { Clip } from '@roam/types';
import { ClipCard } from '../../components/ClipCard';
import type { ClipRow } from '../../lib/database';
import { useSession } from '../../lib/hooks/useSession';
import { useNotePins } from '../../lib/hooks/useNotePins';
import { ClipViewerSheetStandalone } from '../../components/session/ClipViewerSheetStandalone';
import { MarkingSearchPanel } from '../../components/library/MarkingSearchPanel';
import { useTranslation } from '../../lib/i18n';

import { API_BASE } from '../../lib/api';
const spacing = theme.spacing;

export default function LibraryScreen() {
  const { colors, isChoreography } = useAppChromeTheme();
  const styles = useMemo(() => createLibraryStyles(colors, isChoreography), [colors, isChoreography]);
  const { t } = useTranslation();
  const { session } = useSession();
  const token = session?.access_token ?? null;
  const currentUserId = session?.user?.id ?? null;

  const [clips, setClips] = useState<Clip[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [selectedClip, setSelectedClip] = useState<ClipRow | null>(null);

  const [q, setQ] = useState<string>('');
  const [debouncedQ, setDebouncedQ] = useState<string>('');
  const [filterSegment, setFilterSegment] = useState<'All' | 'REF' | 'MINE' | 'Shared'>('All');
  const [markingSearchOpen, setMarkingSearchOpen] = useState(false);

  const clipSheetRef = useRef<any>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { notes: selectedSessionNotes } = useNotePins(selectedClip?.session_id ?? null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedQ(q), 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [q]);

  const fetchLibrary = useCallback(
    async (opts?: { cursor?: string | null; append?: boolean }) => {
      if (!token) {
        setLoading(false);
        return;
      }

      const cursor = opts?.cursor ?? null;
      const append = opts?.append ?? false;

      const params = new URLSearchParams();
      params.set('limit', '20');
      if (debouncedQ.trim()) params.set('q', debouncedQ.trim());
      if (cursor) params.set('cursor', cursor);

      const res = await fetch(`${API_BASE}/library?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { clips?: Clip[]; next_cursor?: string | null; error?: string };
      if (!res.ok) {
        throw new Error(data?.error ?? res.statusText);
      }

      const incoming = data.clips ?? [];
      setNextCursor(data.next_cursor ?? null);
      if (append) setClips((prev) => [...prev, ...incoming]);
      else setClips(incoming);
    },
    [token, debouncedQ]
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        await fetchLibrary({ cursor: null, append: false });
      } catch {
        if (alive) {
          setClips([]);
          setNextCursor(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [fetchLibrary]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      await fetchLibrary({ cursor: nextCursor, append: true });
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  };

  const toClipRow = (clip: Clip): ClipRow => {
    const localId =
      (clip as unknown as { local_id?: string | null }).local_id ??
      (clip as unknown as { id: string }).id;
    const serverId = (clip as unknown as { id: string }).id;
    const sessionId = (clip as unknown as { session_id?: string | null }).session_id ?? '';

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
      source_url: (clip as unknown as { source_url?: string | null }).source_url ?? null,
      parent_clip_id: (clip as unknown as { parent_clip_id?: string | null }).parent_clip_id ?? null,
      triggered_by_note_id: (clip as unknown as { triggered_by_note_id?: string | null }).triggered_by_note_id ?? null,
      move_name: (clip as unknown as { move_name?: string | null }).move_name ?? null,
      style: (clip as unknown as { style?: string | null }).style ?? null,
      energy: (clip as unknown as { energy?: string | null }).energy ?? null,
      difficulty: (clip as unknown as { difficulty?: string | null }).difficulty ?? null,
      bpm: (clip as unknown as { bpm?: number | null }).bpm ?? null,
      notes: (clip as unknown as { notes?: string | null }).notes ?? null,
    };
  };

  const openClipSheet = (clip: Clip) => {
    const clipRow = toClipRow(clip);
    setSelectedClip(clipRow);
  };

  // Trigger snapToIndex after selectedClip is set and sheet is mounted
  useEffect(() => {
    if (selectedClip && clipSheetRef.current) {
      // Use a more reliable approach with requestAnimationFrame
      const openSheet = () => {
        if (clipSheetRef.current) {
          clipSheetRef.current.snapToIndex(0);
        }
      };
      
      // Try immediately first, then fallback to requestAnimationFrame
      try {
        openSheet();
      } catch {
        requestAnimationFrame(openSheet);
      }
    }
  }, [selectedClip]);

  const closeClipViewer = () => {
    setSelectedClip(null);
    clipSheetRef.current?.close();
  };

  const filteredClips = useMemo((): Clip[] => {
    // Segment rules: REF is by `clip_type`; MINE is `clip_type` ('MINE' or null); Shared is "other users" by `user_id`.
    if (filterSegment === 'All') return clips;
    if (filterSegment === 'REF') {
      return clips.filter((item) => (item as unknown as { clip_type?: string | null }).clip_type === 'REF');
    }
    if (filterSegment === 'Shared') {
      return clips.filter((item) => {
        const userId = (item as unknown as { user_id?: string | null }).user_id ?? null;
        return !!currentUserId && !!userId && userId !== currentUserId;
      });
    }

    // 'MINE'
    return clips.filter((item) => {
      const clipType = (item as unknown as { clip_type?: string | null }).clip_type ?? null;
      const mineType = clipType === 'MINE' || clipType === null;
      return mineType;
    });
  }, [clips, filterSegment, currentUserId]);
  const allClipRows = useMemo(() => clips.map(toClipRow), [clips]);

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredClips}
        keyExtractor={(item) => (item as unknown as { local_id?: string; id: string }).local_id ?? (item as unknown as { id: string }).id}
        contentContainerStyle={filteredClips.length === 0 ? styles.emptyList : styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            {isChoreography ? (
              <DisplayTitle style={styles.hubTitle}>{t('tabs.library')}</DisplayTitle>
            ) : null}
            {isChoreography ? (
              <ChoreographyHubSearch
                value={q}
                onChangeText={setQ}
                placeholder={t('library.searchPlaceholder')}
                style={styles.searchChoreo}
              />
            ) : (
              <View style={styles.searchRow}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder={t('library.searchPlaceholder')}
                  placeholderTextColor={colors.muted}
                  value={q}
                  onChangeText={setQ}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.markingSearchBtn}
              onPress={() => setMarkingSearchOpen(true)}
              activeOpacity={0.85}
              disabled={!token}
            >
              {isChoreography ? (
                <>
                  <MonoCaps style={styles.markingSearchBtnText}>{t('markingSearch.open')}</MonoCaps>
                  <MonoCaps style={styles.markingSearchBtnSub}>{t('markingSearch.subtitle')}</MonoCaps>
                </>
              ) : (
                <>
                  <Text style={styles.markingSearchBtnText}>{t('markingSearch.open')}</Text>
                  <Text style={styles.markingSearchBtnSub}>{t('markingSearch.subtitle')}</Text>
                </>
              )}
            </TouchableOpacity>

            {isChoreography ? (
              <View style={styles.filterRow}>
                {(['All', 'REF', 'MINE', 'Shared'] as const).map((seg) => {
                  const label = t(
                    `library.filter${
                      seg === 'All'
                        ? 'All'
                        : seg === 'REF'
                          ? 'Ref'
                          : seg === 'MINE'
                            ? 'Mine'
                            : 'Shared'
                    }`
                  );
                  return (
                    <ChoreographyHubFilterChip
                      key={seg}
                      label={label.toUpperCase()}
                      active={filterSegment === seg}
                      onPress={() => setFilterSegment(seg)}
                    />
                  );
                })}
              </View>
            ) : (
              <View style={styles.segmented}>
                {(['All', 'REF', 'MINE', 'Shared'] as const).map((seg) => {
                  const active = filterSegment === seg;
                  return (
                    <TouchableOpacity
                      key={seg}
                      style={[styles.segment, active && styles.segmentActive]}
                      onPress={() => setFilterSegment(seg)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                        {
                          t(
                            `library.filter${
                              seg === 'All'
                                ? 'All'
                                : seg === 'REF'
                                  ? 'Ref'
                                  : seg === 'MINE'
                                    ? 'Mine'
                                    : 'Shared'
                            }`
                          )
                        }
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.active} />
            </View>
          ) : (
            <View style={styles.emptyWarm}>
              <Text style={styles.emptyIcon}>📂</Text>
              <Text style={styles.emptyTitle}>{t('library.noClips')}</Text>
              <TouchableOpacity style={styles.emptyCta} onPress={() => {}} activeOpacity={0.85}>
                <Text style={styles.emptyCtaText}>{t('library.startRecording')}</Text>
              </TouchableOpacity>
            </View>
          )
        }
        renderItem={({ item }) => {
          const clipRow = toClipRow(item);
          return (
            <ClipCard
              clip={clipRow}
              onPress={() => openClipSheet(item)}
              onLongPress={() => {}}
            />
          );
        }}
        ListFooterComponent={
          nextCursor ? (
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.loadMoreBtn, loadingMore && styles.loadMoreBtnDisabled]}
                onPress={loadMore}
                disabled={loadingMore}
                activeOpacity={0.8}
              >
                {loadingMore ? (
                  <ActivityIndicator color={colors.active} size="small" />
                ) : (
                  <Text style={styles.loadMoreText}>{t('library.loadMore')}</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ height: 24 }} />
          )
        }
      />
      
      <ClipViewerSheetStandalone
        ref={clipSheetRef}
        clip={selectedClip}
        sessionId={selectedClip?.session_id ?? null}
        onClose={closeClipViewer}
        allClips={allClipRows}
        allNotes={selectedSessionNotes}
        onOpenClip={setSelectedClip}
      />

      <MarkingSearchPanel
        visible={markingSearchOpen}
        onClose={() => setMarkingSearchOpen(false)}
        token={token}
        clips={clips}
        onOpenMatch={(clip) => {
          setMarkingSearchOpen(false);
          openClipSheet(clip);
        }}
      />
    </View>
  );
}

function createLibraryStyles(colors: ThemePalette, choreography = false) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ground,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  hubTitle: {
    marginBottom: 12,
    fontSize: 22,
  },
  searchChoreo: {
    marginBottom: 10,
  },
  filterRow: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.chrome,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.radiusMd,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
    color: colors.muted,
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    color: colors.active,
    fontSize: 16,
  },
  markingSearchBtn: {
    marginTop: 10,
    backgroundColor: choreography ? colors.surfaceGlass : colors.amberBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: choreography ? 14 : spacing.radiusMd,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  markingSearchBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.active,
  },
  markingSearchBtnSub: {
    marginTop: 4,
    fontSize: 12,
    color: colors.muted,
    lineHeight: 17,
  },
  segmented: {
    marginTop: 10,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.radiusMd,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.chrome,
  },
  segmentActive: {
    backgroundColor: colors.mine,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
  },
  segmentTextActive: {
    color: colors.active,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyList: {
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyWarm: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: colors.amberBg,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: theme.typography.displayFamily,
    fontSize: 20,
    color: colors.active,
    marginBottom: 14,
    textAlign: 'center',
  },
  emptyCta: {
    backgroundColor: colors.mine,
    borderRadius: spacing.radiusMd,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyCtaText: {
    color: colors.chrome,
    fontSize: 14,
    fontWeight: '800',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  loadMoreBtn: {
    backgroundColor: colors.chrome,
    borderRadius: spacing.radiusMd,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadMoreBtnDisabled: {
    opacity: 0.7,
  },
  loadMoreText: {
    color: colors.active,
    fontSize: 14,
    fontWeight: '700',
  },
});
}

