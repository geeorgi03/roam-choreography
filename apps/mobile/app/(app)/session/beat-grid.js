"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const react_1 = require("react");
const expo_av_1 = require("expo-av");
const slider_1 = __importDefault(require("@react-native-community/slider"));
const theme_1 = require("../../../lib/theme");
const useSession_1 = require("../../../lib/hooks/useSession");
const supabase_1 = require("../../../lib/supabase");
const api_1 = require("../../../lib/api");
const PX_PER_MS = 0.1;
const SLIDER_MIN = -200;
const SLIDER_MAX = 200;
const colors = theme_1.theme.light;
const spacing = theme_1.theme.spacing;
function formatMs(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
}
function BeatGridScreen() {
    const { sessionId, musicTrackJson } = (0, expo_router_1.useLocalSearchParams)();
    const router = (0, expo_router_1.useRouter)();
    const { session } = (0, useSession_1.useSession)();
    const musicTrack = sessionId && musicTrackJson ? JSON.parse(musicTrackJson) : null;
    const [baseBeatMarkers, setBaseBeatMarkers] = (0, react_1.useState)([]);
    const [sections, setSections] = (0, react_1.useState)([]);
    const [isPlaying, setIsPlaying] = (0, react_1.useState)(false);
    const [playbackPositionMs, setPlaybackPositionMs] = (0, react_1.useState)(0);
    const [tapOffset, setTapOffset] = (0, react_1.useState)(0);
    const [sliderOffset, setSliderOffset] = (0, react_1.useState)(0);
    const [editingSection, setEditingSection] = (0, react_1.useState)(null);
    const [saved, setSaved] = (0, react_1.useState)(false);
    const soundRef = (0, react_1.useRef)(null);
    const totalDurationMs = (0, react_1.useRef)(0);
    (0, react_1.useEffect)(() => {
        if (!musicTrack)
            return;
        setBaseBeatMarkers(musicTrack.beat_grid ?? []);
        setSections(musicTrack.sections ?? []);
        const last = musicTrack.beat_grid?.length
            ? Math.max(...musicTrack.beat_grid.map((b) => b.time_ms))
            : 0;
        totalDurationMs.current = last || 300000;
    }, [musicTrack]);
    (0, react_1.useEffect)(() => {
        if (!musicTrack?.storage_path)
            return;
        if (!supabase_1.supabase)
            return;
        const { data } = supabase_1.supabase.storage.from('audio').getPublicUrl(musicTrack.storage_path);
        const uri = data.publicUrl;
        let mounted = true;
        (async () => {
            try {
                const { sound } = await expo_av_1.Audio.Sound.createAsync({ uri }, { shouldPlay: false }, (status) => {
                    if (mounted && status.isLoaded && status.positionMillis != null)
                        setPlaybackPositionMs(status.positionMillis);
                });
                if (mounted)
                    soundRef.current = sound;
            }
            catch (e) {
                if (__DEV__)
                    console.warn('[BeatGrid] load error', e);
            }
        })();
        return () => {
            mounted = false;
            soundRef.current?.unloadAsync?.();
            soundRef.current = null;
        };
    }, [musicTrack?.storage_path]);
    const togglePlay = async () => {
        const sound = soundRef.current;
        if (!sound)
            return;
        const status = await sound.getStatusAsync();
        if (!status.isLoaded)
            return;
        if (status.isPlaying) {
            await sound.pauseAsync();
        }
        else {
            await sound.playAsync();
        }
        setIsPlaying(!status.isPlaying);
    };
    const handleTapOnOne = () => {
        const tapTime = playbackPositionMs;
        const downbeats = baseBeatMarkers.filter((b) => b.is_downbeat);
        if (downbeats.length === 0)
            return;
        let nearest = downbeats[0];
        let minDist = Math.abs(downbeats[0].time_ms - tapTime);
        for (const d of downbeats) {
            const dist = Math.abs(d.time_ms - tapTime);
            if (dist < minDist) {
                minDist = dist;
                nearest = d;
            }
        }
        setTapOffset(tapTime - nearest.time_ms);
    };
    const offsetMs = tapOffset + sliderOffset;
    const displayedBeatMarkers = baseBeatMarkers.map((b) => ({
        ...b,
        time_ms: b.time_ms + offsetMs,
    }));
    const canvasWidth = Math.max(totalDurationMs.current * PX_PER_MS, 2000);
    const handleSaveAlignment = async () => {
        if (!sessionId || !session?.access_token)
            return;
        try {
            const res = await fetch(`${api_1.API_BASE}/sessions/${sessionId}/music`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    sections,
                    downbeat_offset_ms: offsetMs,
                }),
            });
            if (!res.ok)
                throw new Error('Save failed');
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }
        catch (e) {
            if (__DEV__)
                console.warn(e);
        }
    };
    const addSectionAtPlayhead = () => {
        const start_ms = playbackPositionMs;
        setSections((prev) => [...prev, { label: 'Section', start_ms }]);
    };
    const updateSectionLabel = (index, label) => {
        setSections((prev) => prev.map((s, i) => (i === index ? { ...s, label } : s)));
        setEditingSection((e) => (e?.index === index ? { index, label } : e));
    };
    const removeSection = (index) => {
        setSections((prev) => prev.filter((_, i) => i !== index));
        setEditingSection(null);
    };
    if (!musicTrack || !sessionId) {
        return (<react_native_1.View style={styles.container}>
        <react_native_1.Text style={styles.placeholder}>Missing session or track.</react_native_1.Text>
      </react_native_1.View>);
    }
    const bpm = musicTrack.bpm ?? 0;
    return (<react_native_1.View style={styles.container}>
      <react_native_1.View style={styles.header}>
        <react_native_1.Text style={styles.title}>Beat Alignment</react_native_1.Text>
        <react_native_1.Text style={styles.bpm}>{bpm} BPM</react_native_1.Text>
      </react_native_1.View>

      <react_native_1.ScrollView horizontal style={styles.scrollView} contentContainerStyle={{ width: canvasWidth, height: 120 }} showsHorizontalScrollIndicator>
        <react_native_1.View style={[styles.canvas, { width: canvasWidth }]}>
          {displayedBeatMarkers.map((beat, i) => (<react_native_1.View key={i} style={[
                styles.beatLine,
                beat.is_downbeat ? styles.beatLineDownbeat : undefined,
                { left: beat.time_ms * PX_PER_MS },
            ]}/>))}
          <react_native_1.View style={[
            styles.playhead,
            { left: playbackPositionMs * PX_PER_MS },
        ]}/>
          {sections.map((sec, i) => (<react_native_1.TouchableOpacity key={i} style={[styles.sectionPill, { left: sec.start_ms * PX_PER_MS }]} onPress={() => setEditingSection({ index: i, label: sec.label })}>
              <react_native_1.Text style={styles.sectionPillText} numberOfLines={1}>
                {sec.label}
              </react_native_1.Text>
            </react_native_1.TouchableOpacity>))}
        </react_native_1.View>
      </react_native_1.ScrollView>

      <react_native_1.View style={styles.controls}>
        <react_native_1.TouchableOpacity style={styles.playBtn} onPress={togglePlay} activeOpacity={0.8}>
          <react_native_1.Text style={styles.playBtnText}>{isPlaying ? '⏸ Pause' : '▶ Play'}</react_native_1.Text>
        </react_native_1.TouchableOpacity>
        {isPlaying && (<react_native_1.TouchableOpacity style={styles.tapBtn} onPress={handleTapOnOne} activeOpacity={0.8}>
            <react_native_1.Text style={styles.tapBtnText}>👇 Tap on the &quot;1&quot;</react_native_1.Text>
          </react_native_1.TouchableOpacity>)}
        <react_native_1.View style={styles.sliderRow}>
          <react_native_1.Text style={styles.sliderLabel}>Fine offset:</react_native_1.Text>
          <slider_1.default style={styles.slider} minimumValue={SLIDER_MIN} maximumValue={SLIDER_MAX} step={1} value={sliderOffset} onValueChange={setSliderOffset} minimumTrackTintColor={colors.muted} maximumTrackTintColor={colors.inactive} thumbTintColor={colors.active}/>
          <react_native_1.Text style={styles.sliderValue}>{sliderOffset}ms</react_native_1.Text>
        </react_native_1.View>
      </react_native_1.View>

      <react_native_1.View style={styles.sectionsBlock}>
        <react_native_1.Text style={styles.sectionsTitle}>SECTIONS</react_native_1.Text>
        {sections.map((sec, i) => (<react_native_1.View key={i} style={styles.sectionRow}>
            {editingSection?.index === i ? (<react_native_1.TextInput style={styles.sectionInput} value={editingSection.label} onChangeText={(label) => setEditingSection({ index: i, label })} onBlur={() => {
                    updateSectionLabel(i, editingSection.label);
                    setEditingSection(null);
                }} autoFocus placeholderTextColor={colors.muted}/>) : (<react_native_1.Text style={styles.sectionLabel} onPress={() => setEditingSection({ index: i, label: sec.label })}>
                • {sec.label} {formatMs(sec.start_ms)}
              </react_native_1.Text>)}
            <react_native_1.TouchableOpacity onPress={() => removeSection(i)} hitSlop={8}>
              <react_native_1.Text style={styles.removeBtn}>✕</react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>))}
        <react_native_1.TouchableOpacity style={styles.addSectionBtn} onPress={addSectionAtPlayhead} activeOpacity={0.8}>
          <react_native_1.Text style={styles.addSectionText}>＋ Add section at playhead</react_native_1.Text>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>

      <react_native_1.View style={styles.saveRow}>
        <react_native_1.TouchableOpacity style={styles.saveBtn} onPress={handleSaveAlignment} activeOpacity={0.8}>
          <react_native_1.Text style={styles.saveBtnText}>Save alignment</react_native_1.Text>
        </react_native_1.TouchableOpacity>
        {saved && <react_native_1.Text style={styles.savedLabel}>Saved ✓</react_native_1.Text>}
      </react_native_1.View>
    </react_native_1.View>);
}
exports.default = BeatGridScreen;
const t = theme_1.theme.light;
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: t.ground,
        padding: 16,
    },
    placeholder: {
        color: colors.muted,
        fontSize: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.active,
    },
    bpm: {
        fontSize: 16,
        color: colors.muted,
    },
    scrollView: {
        maxHeight: 120,
        marginBottom: 16,
    },
    canvas: {
        height: 80,
        position: 'relative',
    },
    beatLine: {
        position: 'absolute',
        width: 1,
        height: '100%',
        backgroundColor: colors.inactive,
        top: 0,
    },
    beatLineDownbeat: {
        width: 2,
        backgroundColor: colors.active,
    },
    playhead: {
        position: 'absolute',
        width: 2,
        height: '100%',
        backgroundColor: colors.capture,
        top: 0,
    },
    sectionPill: {
        position: 'absolute',
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: colors.inactive,
        borderRadius: 4,
        top: 4,
        maxWidth: 80,
    },
    sectionPillText: {
        fontSize: 10,
        color: colors.chrome,
    },
    controls: {
        marginBottom: 16,
    },
    playBtn: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: colors.active,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: spacing.radiusMd,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    playBtnText: {
        color: colors.chrome,
        fontWeight: '600',
    },
    tapBtn: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: spacing.radiusMd,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    tapBtnText: {
        color: colors.active,
        fontSize: 14,
    },
    sliderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sliderLabel: {
        color: colors.muted,
        fontSize: 14,
        minWidth: 70,
    },
    slider: {
        flex: 1,
        height: 32,
    },
    sliderValue: {
        color: colors.active,
        fontSize: 14,
        minWidth: 40,
    },
    sectionsBlock: {
        marginBottom: 16,
    },
    sectionsTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.muted,
        marginBottom: 8,
    },
    sectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    sectionLabel: {
        color: colors.active,
        fontSize: 14,
        flex: 1,
    },
    sectionInput: {
        flex: 1,
        height: 32,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 4,
        paddingHorizontal: 8,
        color: colors.active,
    },
    removeBtn: {
        color: colors.muted,
        fontSize: 16,
        paddingLeft: 8,
    },
    addSectionBtn: {
        paddingVertical: 8,
        marginTop: 4,
    },
    addSectionText: {
        color: colors.muted,
        fontSize: 14,
    },
    saveRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    saveBtn: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: colors.active,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: spacing.radiusMd,
    },
    saveBtnText: {
        color: colors.chrome,
        fontWeight: '600',
    },
    savedLabel: {
        color: colors.mine,
        fontSize: 14,
    },
});
//# sourceMappingURL=beat-grid.js.map