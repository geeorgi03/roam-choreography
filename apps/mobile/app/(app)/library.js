"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const theme_1 = require("../../lib/theme");
const ClipCard_1 = require("../../components/ClipCard");
const useSession_1 = require("../../lib/hooks/useSession");
const api_1 = require("../../lib/api");
const colors = theme_1.theme.light;
const spacing = theme_1.theme.spacing;
const STYLES = ['Hip-hop', 'Contemporary', 'Ballet', 'Jazz', 'Fusion', 'Other'];
const ENERGY_LEVELS = ['Low', 'Medium', 'High', 'Explosive'];
const DIFFICULTY_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
function LibraryScreen() {
    const { session } = (0, useSession_1.useSession)();
    const token = session?.access_token ?? null;
    const [clips, setClips] = (0, react_1.useState)([]);
    const [nextCursor, setNextCursor] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [loadingMore, setLoadingMore] = (0, react_1.useState)(false);
    const [q, setQ] = (0, react_1.useState)('');
    const [debouncedQ, setDebouncedQ] = (0, react_1.useState)('');
    const [filterStyle, setFilterStyle] = (0, react_1.useState)(null);
    const [filterEnergy, setFilterEnergy] = (0, react_1.useState)(null);
    const [filterDifficulty, setFilterDifficulty] = (0, react_1.useState)(null);
    const [bpmMin, setBpmMin] = (0, react_1.useState)('');
    const [bpmMax, setBpmMax] = (0, react_1.useState)('');
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
        if (filterStyle)
            params.set('style', filterStyle);
        if (filterEnergy)
            params.set('energy', filterEnergy);
        if (filterDifficulty)
            params.set('difficulty', filterDifficulty);
        if (bpmMin.trim())
            params.set('bpm_min', bpmMin.trim());
        if (bpmMax.trim())
            params.set('bpm_max', bpmMax.trim());
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
    }, [token, debouncedQ, filterStyle, filterEnergy, filterDifficulty, bpmMin, bpmMax]);
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
    const openPlayer = (clip) => {
        const id = clip.id;
        const mux_playback_id = clip.mux_playback_id ?? '';
        const move_name = clip.move_name ?? '';
        const style = clip.style ?? '';
        const energy = clip.energy ?? '';
        const difficulty = clip.difficulty ?? '';
        const bpm = clip.bpm;
        const notes = clip.notes ?? '';
        expo_router_1.router.push({
            pathname: '/(app)/session/clip-player',
            params: {
                clipId: id,
                mux_playback_id,
                move_name,
                style,
                energy,
                difficulty,
                bpm: bpm != null ? String(bpm) : '',
                notes,
            },
        });
    };
    const anyFilter = !!debouncedQ.trim() ||
        !!filterStyle ||
        !!filterEnergy ||
        !!filterDifficulty ||
        !!bpmMin.trim() ||
        !!bpmMax.trim();
    return (<react_native_1.View style={styles.container}>
      <react_native_1.FlatList data={clips} keyExtractor={(item) => item.local_id ?? item.id} contentContainerStyle={clips.length === 0 ? styles.emptyList : styles.listContent} ListHeaderComponent={<react_native_1.View style={styles.header}>
            <react_native_1.View style={styles.searchRow}>
              <react_native_1.Text style={styles.searchIcon}>🔍</react_native_1.Text>
              <react_native_1.TextInput style={styles.searchInput} placeholder="Search clips…" placeholderTextColor={colors.muted} value={q} onChangeText={setQ} autoCapitalize="none" autoCorrect={false}/>
            </react_native_1.View>

            <react_native_1.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
              {STYLES.map((option) => (<react_native_1.TouchableOpacity key={option} style={[styles.chip, filterStyle === option && styles.chipSelected]} onPress={() => setFilterStyle((prev) => (prev === option ? null : option))} activeOpacity={0.8}>
                  <react_native_1.Text style={[
                    styles.chipText,
                    filterStyle === option && styles.chipTextSelected,
                ]}>
                    {option}
                  </react_native_1.Text>
                </react_native_1.TouchableOpacity>))}

              {ENERGY_LEVELS.map((option) => (<react_native_1.TouchableOpacity key={option} style={[styles.chip, filterEnergy === option && styles.chipSelected]} onPress={() => setFilterEnergy((prev) => (prev === option ? null : option))} activeOpacity={0.8}>
                  <react_native_1.Text style={[
                    styles.chipText,
                    filterEnergy === option && styles.chipTextSelected,
                ]}>
                    {option}
                  </react_native_1.Text>
                </react_native_1.TouchableOpacity>))}

              {DIFFICULTY_LEVELS.map((option) => (<react_native_1.TouchableOpacity key={option} style={[
                    styles.chip,
                    filterDifficulty === option && styles.chipSelected,
                ]} onPress={() => setFilterDifficulty((prev) => (prev === option ? null : option))} activeOpacity={0.8}>
                  <react_native_1.Text style={[
                    styles.chipText,
                    filterDifficulty === option && styles.chipTextSelected,
                ]}>
                    {option}
                  </react_native_1.Text>
                </react_native_1.TouchableOpacity>))}
            </react_native_1.ScrollView>

            <react_native_1.View style={styles.bpmRow}>
              <react_native_1.Text style={styles.bpmLabel}>BPM:</react_native_1.Text>
              <react_native_1.TextInput style={styles.bpmInput} placeholder="min" placeholderTextColor={colors.muted} value={bpmMin} onChangeText={setBpmMin} keyboardType="numeric"/>
              <react_native_1.Text style={styles.bpmDash}>–</react_native_1.Text>
              <react_native_1.TextInput style={styles.bpmInput} placeholder="max" placeholderTextColor={colors.muted} value={bpmMax} onChangeText={setBpmMax} keyboardType="numeric"/>
            </react_native_1.View>
          </react_native_1.View>} ListEmptyComponent={loading ? (<react_native_1.View style={styles.center}>
              <react_native_1.ActivityIndicator color={colors.active}/>
            </react_native_1.View>) : anyFilter ? (<react_native_1.View style={styles.center}>
              <react_native_1.Text style={styles.icon}>📦</react_native_1.Text>
              <react_native_1.Text style={styles.title}>No clips match your search</react_native_1.Text>
            </react_native_1.View>) : (<react_native_1.View style={styles.center}>
              <react_native_1.Text style={styles.icon}>📦</react_native_1.Text>
              <react_native_1.Text style={styles.title}>No tagged clips yet</react_native_1.Text>
              <react_native_1.Text style={styles.subtitle}>Start tagging to build your library</react_native_1.Text>
            </react_native_1.View>)} renderItem={({ item }) => {
            const clipRow = toClipRow(item);
            return (<ClipCard_1.ClipCard clip={clipRow} onPress={() => openPlayer(item)} onLongPress={() => { }}/>);
        }} ListFooterComponent={nextCursor ? (<react_native_1.View style={styles.footer}>
              <react_native_1.TouchableOpacity style={[styles.loadMoreBtn, loadingMore && styles.loadMoreBtnDisabled]} onPress={loadMore} disabled={loadingMore} activeOpacity={0.8}>
                {loadingMore ? (<react_native_1.ActivityIndicator color={colors.active} size="small"/>) : (<react_native_1.Text style={styles.loadMoreText}>Load more</react_native_1.Text>)}
              </react_native_1.TouchableOpacity>
            </react_native_1.View>) : (<react_native_1.View style={{ height: 24 }}/>)}/>
    </react_native_1.View>);
}
exports.default = LibraryScreen;
const t = theme_1.theme.light;
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: t.ground,
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
    filtersRow: {
        paddingTop: 10,
        paddingBottom: 6,
        gap: 10,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: spacing.radiusMd,
        backgroundColor: colors.chrome,
        borderWidth: 1,
        borderColor: colors.border,
    },
    chipSelected: {
        backgroundColor: colors.mine,
    },
    chipText: {
        color: colors.muted,
        fontSize: 13,
        fontWeight: '600',
    },
    chipTextSelected: {
        color: colors.active,
    },
    bpmRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingTop: 8,
    },
    bpmLabel: {
        color: colors.muted,
        fontSize: 13,
        fontWeight: '600',
    },
    bpmInput: {
        width: 80,
        backgroundColor: colors.chrome,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: spacing.radiusMd,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: colors.active,
    },
    bpmDash: {
        color: colors.muted,
        fontSize: 16,
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
    icon: {
        fontSize: 48,
        marginBottom: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.active,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: colors.muted,
        textAlign: 'center',
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