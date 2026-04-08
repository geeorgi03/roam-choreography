"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const react_native_1 = require("react-native");
const theme_1 = require("../../lib/theme");
const ClipCard_1 = require("../../components/ClipCard");
const useSession_1 = require("../../lib/hooks/useSession");
const ClipViewerSheetStandalone_1 = require("../../components/session/ClipViewerSheetStandalone");
const i18n_1 = require("../../lib/i18n");
const api_1 = require("../../lib/api");
const colors = theme_1.theme.light;
const spacing = theme_1.theme.spacing;
function LibraryScreen() {
    const { t } = (0, i18n_1.useTranslation)();
    const { session } = (0, useSession_1.useSession)();
    const token = session?.access_token ?? null;
    const currentUserId = session?.user?.id ?? null;
    const [clips, setClips] = (0, react_1.useState)([]);
    const [nextCursor, setNextCursor] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [loadingMore, setLoadingMore] = (0, react_1.useState)(false);
    const [selectedClip, setSelectedClip] = (0, react_1.useState)(null);
    const [q, setQ] = (0, react_1.useState)('');
    const [debouncedQ, setDebouncedQ] = (0, react_1.useState)('');
    const [filterSegment, setFilterSegment] = (0, react_1.useState)('All');
    const clipSheetRef = (0, react_1.useRef)(null);
    const debounceTimer = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        if (debounceTimer.current)
            clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => setDebouncedQ(q), 300);
        return () => {
            if (debounceTimer.current)
                clearTimeout(debounceTimer.current);
        };
    }, [q]);
    const fetchLibrary = (0, react_1.useCallback)(async (opts) => {
        if (!token) {
            setLoading(false);
            return;
        }
        const cursor = opts?.cursor ?? null;
        const append = opts?.append ?? false;
        const params = new URLSearchParams();
        params.set('limit', '20');
        if (debouncedQ.trim())
            params.set('q', debouncedQ.trim());
        if (cursor)
            params.set('cursor', cursor);
        const res = await fetch(`${api_1.API_BASE}/library?${params.toString()}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await res.json());
        if (!res.ok) {
            throw new Error(data?.error ?? res.statusText);
        }
        const incoming = data.clips ?? [];
        setNextCursor(data.next_cursor ?? null);
        if (append)
            setClips((prev) => [...prev, ...incoming]);
        else
            setClips(incoming);
    }, [token, debouncedQ]);
    (0, react_1.useEffect)(() => {
        let alive = true;
        (async () => {
            setLoading(true);
            try {
                await fetchLibrary({ cursor: null, append: false });
            }
            catch {
                if (alive) {
                    setClips([]);
                    setNextCursor(null);
                }
            }
            finally {
                if (alive)
                    setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [fetchLibrary]);
    const loadMore = async () => {
        if (!nextCursor || loadingMore)
            return;
        setLoadingMore(true);
        try {
            await fetchLibrary({ cursor: nextCursor, append: true });
        }
        catch {
            // ignore
        }
        finally {
            setLoadingMore(false);
        }
    };
    const toClipRow = (clip) => {
        const localId = clip.local_id ??
            clip.id;
        const serverId = clip.id;
        const sessionId = clip.session_id ?? '';
        return {
            local_id: localId,
            server_id: serverId,
            session_id: sessionId,
            label: clip.label ?? 'Clip',
            recorded_at: clip.recorded_at ?? null,
            file_uri: null,
            upload_status: 'ready',
            upload_progress: 0,
            mux_playback_id: clip.mux_playback_id ?? null,
            move_name: clip.move_name ?? null,
            style: clip.style ?? null,
            energy: clip.energy ?? null,
            difficulty: clip.difficulty ?? null,
            bpm: clip.bpm ?? null,
            notes: clip.notes ?? null,
        };
    };
    const openClipSheet = (clip) => {
        const clipRow = toClipRow(clip);
        setSelectedClip(clipRow);
    };
    // Trigger snapToIndex after selectedClip is set and sheet is mounted
    (0, react_1.useEffect)(() => {
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
            }
            catch {
                requestAnimationFrame(openSheet);
            }
        }
    }, [selectedClip]);
    const closeClipViewer = () => {
        setSelectedClip(null);
        clipSheetRef.current?.close();
    };
    const filteredClips = (0, react_1.useMemo)(() => {
        // Segment rules: REF is by `clip_type`; MINE is `clip_type` ('MINE' or null); Shared is "other users" by `user_id`.
        if (filterSegment === 'All')
            return clips;
        if (filterSegment === 'REF') {
            return clips.filter((item) => item.clip_type === 'REF');
        }
        if (filterSegment === 'Shared') {
            return clips.filter((item) => {
                const userId = item.user_id ?? null;
                return !!currentUserId && !!userId && userId !== currentUserId;
            });
        }
        // 'MINE'
        return clips.filter((item) => {
            const clipType = item.clip_type ?? null;
            const mineType = clipType === 'MINE' || clipType === null;
            return mineType;
        });
    }, [clips, filterSegment, currentUserId]);
    return (<react_native_1.View style={styles.container}>
      <react_native_1.FlatList data={filteredClips} keyExtractor={(item) => item.local_id ?? item.id} contentContainerStyle={filteredClips.length === 0 ? styles.emptyList : styles.listContent} ListHeaderComponent={<react_native_1.View style={styles.header}>
            <react_native_1.View style={styles.searchRow}>
              <react_native_1.Text style={styles.searchIcon}>🔍</react_native_1.Text>
              <react_native_1.TextInput style={styles.searchInput} placeholder={t('library.searchPlaceholder')} placeholderTextColor={colors.muted} value={q} onChangeText={setQ} autoCapitalize="none" autoCorrect={false}/>
            </react_native_1.View>

            <react_native_1.View style={styles.segmented}>
              {['All', 'REF', 'MINE', 'Shared'].map((seg) => {
                const active = filterSegment === seg;
                return (<react_native_1.TouchableOpacity key={seg} style={[styles.segment, active && styles.segmentActive]} onPress={() => setFilterSegment(seg)} activeOpacity={0.85}>
                    <react_native_1.Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                      {t(`library.filter${seg === 'All'
                        ? 'All'
                        : seg === 'REF'
                            ? 'Ref'
                            : seg === 'MINE'
                                ? 'Mine'
                                : 'Shared'}`)}
                    </react_native_1.Text>
                  </react_native_1.TouchableOpacity>);
            })}
            </react_native_1.View>
          </react_native_1.View>} ListEmptyComponent={loading ? (<react_native_1.View style={styles.center}>
              <react_native_1.ActivityIndicator color={colors.active}/>
            </react_native_1.View>) : (<react_native_1.View style={styles.emptyWarm}>
              <react_native_1.Text style={styles.emptyIcon}>📂</react_native_1.Text>
              <react_native_1.Text style={styles.emptyTitle}>{t('library.noClips')}</react_native_1.Text>
              <react_native_1.TouchableOpacity style={styles.emptyCta} onPress={() => { }} activeOpacity={0.85}>
                <react_native_1.Text style={styles.emptyCtaText}>{t('library.startRecording')}</react_native_1.Text>
              </react_native_1.TouchableOpacity>
            </react_native_1.View>)} renderItem={({ item }) => {
            const clipRow = toClipRow(item);
            return (<ClipCard_1.ClipCard clip={clipRow} onPress={() => openClipSheet(item)} onLongPress={() => { }}/>);
        }} ListFooterComponent={nextCursor ? (<react_native_1.View style={styles.footer}>
              <react_native_1.TouchableOpacity style={[styles.loadMoreBtn, loadingMore && styles.loadMoreBtnDisabled]} onPress={loadMore} disabled={loadingMore} activeOpacity={0.8}>
                {loadingMore ? (<react_native_1.ActivityIndicator color={colors.active} size="small"/>) : (<react_native_1.Text style={styles.loadMoreText}>{t('library.loadMore')}</react_native_1.Text>)}
              </react_native_1.TouchableOpacity>
            </react_native_1.View>) : (<react_native_1.View style={{ height: 24 }}/>)}/>
      
      <ClipViewerSheetStandalone_1.ClipViewerSheetStandalone ref={clipSheetRef} clip={selectedClip} sessionId={selectedClip?.session_id ?? null} onClose={closeClipViewer}/>
    </react_native_1.View>);
}
exports.default = LibraryScreen;
const themeColors = theme_1.theme.light;
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: themeColors.ground,
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
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
        fontFamily: theme_1.theme.typography.displayFamily,
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
//# sourceMappingURL=library.js.map