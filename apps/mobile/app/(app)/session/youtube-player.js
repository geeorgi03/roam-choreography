"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const react_1 = require("react");
const react_native_youtube_iframe_1 = __importDefault(require("react-native-youtube-iframe"));
const theme_1 = require("../../../lib/theme");
const useSession_1 = require("../../../lib/hooks/useSession");
const supabase_1 = require("../../../lib/supabase");
const api_1 = require("../../../lib/api");
function formatMs(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
}
function extractVideoId(sourceUrl) {
    if (!sourceUrl)
        return null;
    const m = sourceUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    return m ? m[1] : null;
}
function YoutubePlayerScreen() {
    const { sessionId, musicTrackId } = (0, expo_router_1.useLocalSearchParams)();
    const router = (0, expo_router_1.useRouter)();
    const { session } = (0, useSession_1.useSession)();
    const [musicTrack, setMusicTrack] = (0, react_1.useState)(null);
    const [sections, setSections] = (0, react_1.useState)([]);
    const [playbackPositionSec, setPlaybackPositionSec] = (0, react_1.useState)(0);
    const [editingSection, setEditingSection] = (0, react_1.useState)(null);
    const [saving, setSaving] = (0, react_1.useState)(false);
    const [playerState, setPlayerState] = (0, react_1.useState)('unstarted');
    const playerRef = (0, react_1.useRef)(null);
    const pollIntervalRef = (0, react_1.useRef)(null);
    // Poll current time while playing; stop when paused/stopped/unmounted
    (0, react_1.useEffect)(() => {
        if (playerState !== 'playing') {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
            return;
        }
        const poll = async () => {
            try {
                const sec = await playerRef.current?.getCurrentTime();
                if (typeof sec === 'number')
                    setPlaybackPositionSec(sec);
            }
            catch {
                // ignore
            }
        };
        poll();
        pollIntervalRef.current = setInterval(poll, 500);
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        };
    }, [playerState]);
    (0, react_1.useEffect)(() => {
        if (!sessionId || !musicTrackId)
            return;
        if (!supabase_1.supabase)
            return;
        (async () => {
            const { data } = await supabase_1.supabase
                .from('music_tracks')
                .select('*')
                .eq('id', musicTrackId)
                .eq('session_id', sessionId)
                .single();
            setMusicTrack(data ?? null);
        })();
    }, [sessionId, musicTrackId]);
    (0, react_1.useEffect)(() => {
        if (!musicTrack)
            return;
        setSections(musicTrack.sections ?? []);
    }, [musicTrack]);
    const videoId = musicTrack ? extractVideoId(musicTrack.source_url) : null;
    const addSectionAtPlayhead = () => {
        const start_ms = playbackPositionSec * 1000;
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
    const handleSaveSections = async () => {
        if (!sessionId || !session?.access_token)
            return;
        setSaving(true);
        try {
            const res = await fetch(`${api_1.API_BASE}/sessions/${sessionId}/music`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ sections }),
            });
            if (!res.ok)
                throw new Error('Save failed');
            router.back();
        }
        catch (e) {
            if (__DEV__)
                console.warn(e);
            setSaving(false);
        }
    };
    if (!musicTrack) {
        return (<react_native_1.View style={styles.container}>
        <react_native_1.ActivityIndicator size="large" color={theme_1.theme.textPrimary}/>
        <react_native_1.Text style={styles.loadingText}>Loading…</react_native_1.Text>
      </react_native_1.View>);
    }
    if (!videoId) {
        return (<react_native_1.View style={styles.container}>
        <react_native_1.Text style={styles.error}>Invalid YouTube track.</react_native_1.Text>
      </react_native_1.View>);
    }
    return (<react_native_1.View style={styles.container}>
      <react_native_youtube_iframe_1.default ref={playerRef} height={220} videoId={videoId} onChangeState={(state) => {
            setPlayerState(state);
        }}/>

      <react_native_1.View style={styles.sectionsBlock}>
        <react_native_1.Text style={styles.sectionsTitle}>SECTIONS</react_native_1.Text>
        {sections.map((sec, i) => (<react_native_1.View key={i} style={styles.sectionRow}>
            {editingSection?.index === i ? (<react_native_1.TextInput style={styles.sectionInput} value={editingSection.label} onChangeText={(label) => setEditingSection({ index: i, label })} onBlur={() => {
                    updateSectionLabel(i, editingSection.label);
                    setEditingSection(null);
                }} autoFocus placeholderTextColor={theme_1.theme.textSecondary}/>) : (<react_native_1.Text style={styles.sectionLabel} onPress={() => setEditingSection({ index: i, label: sec.label })}>
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

      <react_native_1.TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSaveSections} disabled={saving} activeOpacity={0.8}>
        <react_native_1.Text style={styles.saveBtnText}>
          {saving ? 'Saving…' : 'Save sections'}
        </react_native_1.Text>
      </react_native_1.TouchableOpacity>
    </react_native_1.View>);
}
exports.default = YoutubePlayerScreen;
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme_1.theme.background,
        padding: 16,
    },
    loadingText: {
        color: theme_1.theme.textSecondary,
        marginTop: 12,
    },
    error: {
        color: '#e74c3c',
        fontSize: 16,
    },
    sectionsBlock: {
        marginTop: 16,
        marginBottom: 16,
    },
    sectionsTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: theme_1.theme.textSecondary,
        marginBottom: 8,
    },
    sectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    sectionLabel: {
        color: theme_1.theme.textPrimary,
        fontSize: 14,
        flex: 1,
    },
    sectionInput: {
        flex: 1,
        height: 32,
        borderWidth: 1,
        borderColor: theme_1.theme.textSecondary,
        borderRadius: 4,
        paddingHorizontal: 8,
        color: theme_1.theme.textPrimary,
    },
    removeBtn: {
        color: theme_1.theme.textSecondary,
        fontSize: 16,
        paddingLeft: 8,
    },
    addSectionBtn: {
        paddingVertical: 8,
        marginTop: 4,
    },
    addSectionText: {
        color: theme_1.theme.textSecondary,
        fontSize: 14,
    },
    saveBtn: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: theme_1.theme.accent,
        borderWidth: 1,
        borderColor: theme_1.theme.textSecondary,
        borderRadius: theme_1.theme.borderRadius,
        alignSelf: 'flex-start',
    },
    saveBtnDisabled: {
        opacity: 0.6,
    },
    saveBtnText: {
        color: theme_1.theme.textPrimary,
        fontWeight: '600',
    },
});
//# sourceMappingURL=youtube-player.js.map