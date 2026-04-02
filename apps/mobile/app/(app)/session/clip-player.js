"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const expo_av_1 = require("expo-av");
const slider_1 = __importDefault(require("@react-native-community/slider"));
const react_native_toast_message_1 = __importDefault(require("react-native-toast-message"));
// Lazy require: a native-module init failure must not prevent route discovery
let GestureDetector = ({ children }) => <>{children}</>;
let Gesture = {
    Pan: () => ({ onEnd: () => ({}) }),
};
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const gh = require('react-native-gesture-handler');
    GestureDetector = gh.GestureDetector;
    Gesture = gh.Gesture;
}
catch (_) {
    // gesture handler unavailable in this environment — swipe gestures disabled
}
const theme_1 = require("../../../lib/theme");
const useClips_1 = require("../../../lib/hooks/useClips");
const useSession_1 = require("../../../lib/hooks/useSession");
const TagSheet_1 = require("../../../components/TagSheet");
const supabase_1 = require("../../../lib/supabase");
const AnnotationOverlay_1 = require("../../../components/AnnotationOverlay");
const api_1 = require("../../../lib/api");
function ClipPlayerScreen() {
    const { sessionId, clipIndex, mux_playback_id, move_name, style, energy, difficulty, bpm, notes, section_label, } = (0, expo_router_1.useLocalSearchParams)();
    const router = (0, expo_router_1.useRouter)();
    const hasSessionContext = !!sessionId && !!clipIndex;
    const { clips } = (0, useClips_1.useClips)(hasSessionContext ? sessionId : null);
    const { session } = (0, useSession_1.useSession)();
    const parsedIndex = parseInt(clipIndex ?? '0', 10);
    const [currentIndex, setCurrentIndex] = (0, react_1.useState)(isNaN(parsedIndex) ? 0 : parsedIndex);
    const [positionMillis, setPositionMillis] = (0, react_1.useState)(0);
    const [durationMillis, setDurationMillis] = (0, react_1.useState)(0);
    const [playing, setPlaying] = (0, react_1.useState)(true);
    const [rate, setRate] = (0, react_1.useState)(1);
    const [displayClip, setDisplayClip] = (0, react_1.useState)(null);
    const [comments, setComments] = (0, react_1.useState)([]);
    const [feedbackOpen, setFeedbackOpen] = (0, react_1.useState)(false);
    const [commentOverlay, setCommentOverlay] = (0, react_1.useState)(null);
    const [annotations, setAnnotations] = (0, react_1.useState)([]);
    const [annotationMode, setAnnotationMode] = (0, react_1.useState)(false);
    const [activeTool, setActiveTool] = (0, react_1.useState)('text');
    const [pendingAnnotations, setPendingAnnotations] = (0, react_1.useState)([]);
    const [frozenTimecode, setFrozenTimecode] = (0, react_1.useState)(null);
    const [frameSize, setFrameSize] = (0, react_1.useState)({ width: 0, height: 0 });
    const [videoNaturalSize, setVideoNaturalSize] = (0, react_1.useState)(null);
    const videoRef = (0, react_1.useRef)(null);
    const tagSheetRef = (0, react_1.useRef)(null);
    const clip = hasSessionContext ? clips[currentIndex] ?? null : null;
    (0, react_1.useEffect)(() => {
        if (!hasSessionContext)
            return;
        const safeIndex = Math.min(Math.max(0, isNaN(parsedIndex) ? 0 : parsedIndex), Math.max(0, clips.length - 1));
        setCurrentIndex(safeIndex);
    }, [hasSessionContext, parsedIndex, clips.length]);
    (0, react_1.useEffect)(() => {
        if (!hasSessionContext)
            return;
        setDisplayClip(clip);
    }, [hasSessionContext, clip]);
    const clipServerId = clip?.server_id ?? null;
    (0, react_1.useEffect)(() => {
        if (!clipServerId || !session?.access_token)
            return;
        let mounted = true;
        (async () => {
            try {
                const [commentsRes, feedbackRes] = await Promise.all([
                    fetch(`${api_1.API_BASE}/clips/${clipServerId}/comments`, {
                        headers: { Authorization: `Bearer ${session.access_token}` },
                    }),
                    fetch(`${api_1.API_BASE}/clips/${clipServerId}/feedback-requests`, {
                        headers: { Authorization: `Bearer ${session.access_token}` },
                    }),
                ]);
                if (!mounted)
                    return;
                if (commentsRes.ok) {
                    const data = await commentsRes.json();
                    setComments(data);
                }
                if (feedbackRes.ok) {
                    const data = await feedbackRes.json();
                    setFeedbackOpen(data.status === 'open');
                }
            }
            catch {
                // ignore
            }
        })();
        return () => {
            mounted = false;
        };
    }, [clipServerId, session?.access_token]);
    (0, react_1.useEffect)(() => {
        if (!clipServerId)
            return;
        if (!supabase_1.supabase)
            return;
        let mounted = true;
        const channel = supabase_1.supabase
            .channel(`clip_comments:clip_id=eq.${clipServerId}`)
            .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'clip_comments',
            filter: `clip_id=eq.${clipServerId}`,
        }, (payload) => {
            if (!mounted)
                return;
            const row = payload.new;
            setComments((prev) => [
                ...prev,
                {
                    id: row.id,
                    clip_id: row.clip_id,
                    session_id: row.session_id,
                    timecode_ms: row.timecode_ms,
                    text: row.text,
                    commenter_name: row.commenter_name,
                    created_at: row.created_at,
                },
            ]);
        })
            .subscribe();
        return () => {
            mounted = false;
            supabase_1.supabase?.removeChannel(channel);
        };
    }, [clipServerId]);
    (0, react_1.useEffect)(() => {
        if (!clipServerId || !session?.access_token)
            return;
        let mounted = true;
        (async () => {
            try {
                const res = await fetch(`${api_1.API_BASE}/clips/${clipServerId}/annotations`, {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                });
                if (mounted && res.ok) {
                    const data = await res.json();
                    setAnnotations(data);
                }
            }
            catch {
                // ignore
            }
        })();
        return () => {
            mounted = false;
        };
    }, [clipServerId, session?.access_token]);
    const handleRequestFeedback = (0, react_1.useCallback)(async () => {
        if (!clipServerId || !session?.access_token)
            return;
        try {
            const res = await fetch(`${api_1.API_BASE}/clips/${clipServerId}/feedback-requests`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (res.ok)
                setFeedbackOpen(true);
        }
        catch {
            // ignore
        }
    }, [clipServerId, session?.access_token]);
    const handleCloseFeedback = (0, react_1.useCallback)(async () => {
        if (!clipServerId || !session?.access_token)
            return;
        try {
            const res = await fetch(`${api_1.API_BASE}/clips/${clipServerId}/feedback-requests`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (res.ok)
                setFeedbackOpen(false);
        }
        catch {
            // ignore
        }
    }, [clipServerId, session?.access_token]);
    const onPlaybackStatusUpdate = (status) => {
        if (!status.isLoaded)
            return;
        setPositionMillis(status.positionMillis);
        if (status.durationMillis)
            setDurationMillis(status.durationMillis);
        setPlaying(status.isPlaying);
    };
    const videoRect = react_1.default.useMemo(() => {
        const cw = frameSize.width;
        const ch = frameSize.height;
        if (cw <= 0 || ch <= 0)
            return { x: 0, y: 0, width: 0, height: 0 };
        if (!videoNaturalSize?.width || !videoNaturalSize?.height) {
            return { x: 0, y: 0, width: cw, height: ch };
        }
        const vw = videoNaturalSize.width;
        const vh = videoNaturalSize.height;
        const scale = Math.min(cw / vw, ch / vh);
        const w = vw * scale;
        const h = vh * scale;
        const x = (cw - w) / 2;
        const y = (ch - h) / 2;
        return { x, y, width: w, height: h };
    }, [frameSize.width, frameSize.height, videoNaturalSize?.width, videoNaturalSize?.height]);
    const handlePlayPause = async () => {
        if (!videoRef.current)
            return;
        if (playing)
            await videoRef.current.pauseAsync();
        else
            await videoRef.current.playAsync();
    };
    const handleSeekBack = async () => {
        if (!videoRef.current)
            return;
        const newPos = Math.max(0, positionMillis - 5000);
        await videoRef.current.setPositionAsync(newPos);
    };
    const handleSpeedToggle = async () => {
        if (!videoRef.current)
            return;
        const newRate = rate === 1 ? 0.5 : 1;
        setRate(newRate);
        await videoRef.current.setRateAsync(newRate, true);
    };
    const handleSliderComplete = async (value) => {
        if (!videoRef.current)
            return;
        await videoRef.current.setPositionAsync(value);
    };
    const panGesture = Gesture.Pan().onEnd((e) => {
        const { translationX, translationY } = e;
        if (Math.abs(translationY) > 80 && translationY > 0) {
            router.back();
            return;
        }
        if (!hasSessionContext)
            return;
        if (Math.abs(translationX) > 60) {
            if (translationX > 0 && currentIndex > 0) {
                setCurrentIndex(currentIndex - 1);
                setPositionMillis(0);
            }
            else if (translationX < 0 && currentIndex < clips.length - 1) {
                setCurrentIndex(currentIndex + 1);
                setPositionMillis(0);
            }
        }
    });
    const handleTagSaved = (updatedClip) => {
        setDisplayClip(updatedClip);
    };
    const handleAnnotatePress = (0, react_1.useCallback)(async () => {
        if (videoRef.current)
            await videoRef.current.pauseAsync();
        setPlaying(false);
        setAnnotationMode(true);
        setFrozenTimecode(positionMillis);
    }, [positionMillis]);
    const handlePlaceText = (0, react_1.useCallback)((x, y, text) => {
        setPendingAnnotations((prev) => [
            ...prev,
            { type: 'text', timecode_ms: positionMillis, payload: { x, y, text } },
        ]);
    }, [positionMillis]);
    const handlePlaceArrow = (0, react_1.useCallback)((x1, y1, x2, y2) => {
        setPendingAnnotations((prev) => [
            ...prev,
            { type: 'arrow', timecode_ms: positionMillis, payload: { x1, y1, x2, y2 } },
        ]);
    }, [positionMillis]);
    const handlePlaceCircle = (0, react_1.useCallback)((x, y, r) => {
        setPendingAnnotations((prev) => [
            ...prev,
            { type: 'circle', timecode_ms: positionMillis, payload: { cx: x, cy: y, r } },
        ]);
    }, [positionMillis]);
    const handleAnnotationDone = (0, react_1.useCallback)(async () => {
        if (pendingAnnotations.length === 0) {
            setAnnotationMode(false);
            setFrozenTimecode(null);
            return;
        }
        if (!clipServerId || !session?.access_token) {
            react_native_toast_message_1.default.show({ type: 'error', text1: 'Unable to save', text2: 'Please sign in and try again.' });
            return;
        }
        const created = [];
        const failed = [];
        let needsRefresh = false;
        for (const p of pendingAnnotations) {
            try {
                const res = await fetch(`${api_1.API_BASE}/clips/${clipServerId}/annotations`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                        type: p.type,
                        timecode_ms: p.timecode_ms,
                        payload: p.payload,
                    }),
                });
                if (!res.ok) {
                    failed.push(p);
                    continue;
                }
                try {
                    const data = (await res.json());
                    if (data && typeof data === 'object' && 'id' in data) {
                        created.push(data);
                    }
                    else {
                        needsRefresh = true;
                    }
                }
                catch {
                    needsRefresh = true;
                }
            }
            catch {
                failed.push(p);
            }
        }
        if (created.length > 0) {
            setAnnotations((prev) => [...prev, ...created]);
        }
        if (needsRefresh) {
            try {
                const res = await fetch(`${api_1.API_BASE}/clips/${clipServerId}/annotations`, {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setAnnotations(data);
                }
            }
            catch {
                // ignore
            }
        }
        if (failed.length > 0) {
            react_native_toast_message_1.default.show({ type: 'error', text1: 'Some annotations failed to save' });
            setPendingAnnotations(failed);
            return;
        }
        setPendingAnnotations([]);
        setAnnotationMode(false);
        setFrozenTimecode(null);
    }, [clipServerId, session?.access_token, pendingAnnotations]);
    const handleAnnotationMarkerPress = (0, react_1.useCallback)(async (tc) => {
        if (videoRef.current) {
            await videoRef.current.pauseAsync();
            setPlaying(false);
            await videoRef.current.setPositionAsync(tc);
            setPositionMillis(tc);
        }
        setFrozenTimecode(tc);
        setAnnotationMode(true);
    }, []);
    const hasLibraryClip = !hasSessionContext && !!mux_playback_id;
    if (!hasSessionContext && !hasLibraryClip) {
        return (<react_native_1.View style={styles.container}>
        <react_native_1.Text style={styles.placeholderText}>No clip</react_native_1.Text>
        <react_native_1.TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <react_native_1.Text style={styles.closeBtnText}>✕</react_native_1.Text>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>);
    }
    if (hasSessionContext && !clip) {
        return (<react_native_1.View style={styles.container}>
        <react_native_1.Text style={styles.placeholderText}>No clip</react_native_1.Text>
        <react_native_1.TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <react_native_1.Text style={styles.closeBtnText}>✕</react_native_1.Text>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>);
    }
    if (hasSessionContext && clip.upload_status !== 'ready') {
        return (<GestureDetector gesture={panGesture}>
        <react_native_1.View style={styles.container}>
          <react_native_1.View style={styles.placeholder}>
            <react_native_1.Text style={styles.placeholderText}>Processing…</react_native_1.Text>
            <react_native_1.Text style={styles.placeholderLabel}>{clip.label ?? 'Clip'}</react_native_1.Text>
          </react_native_1.View>
          <react_native_1.TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <react_native_1.Text style={styles.closeBtnText}>✕</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>
      </GestureDetector>);
    }
    if (!hasSessionContext && hasLibraryClip) {
        const libraryMoveName = move_name ?? null;
        const libraryStyle = style ?? null;
        const libraryEnergy = energy ?? null;
        const libraryDifficulty = difficulty ?? null;
        const libraryBpm = bpm && String(bpm).trim() ? String(bpm).trim() : null;
        const libraryNotes = notes ?? null;
        const librarySection = section_label ?? null;
        const showLibraryTags = !!libraryMoveName ||
            !!libraryStyle ||
            !!libraryEnergy ||
            !!libraryDifficulty ||
            !!libraryBpm ||
            !!libraryNotes;
        return (<GestureDetector gesture={panGesture}>
        <react_native_1.View style={styles.container}>
          <expo_av_1.Video key={mux_playback_id} ref={videoRef} source={{ uri: `https://stream.mux.com/${mux_playback_id}.m3u8` }} style={react_native_1.StyleSheet.absoluteFill} useNativeControls={false} resizeMode={expo_av_1.ResizeMode.CONTAIN} shouldPlay={playing} onPlaybackStatusUpdate={onPlaybackStatusUpdate}/>

          <react_native_1.TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <react_native_1.Text style={styles.closeBtnText}>✕</react_native_1.Text>
          </react_native_1.TouchableOpacity>

          <react_native_1.View style={styles.controls}>
            <slider_1.default style={styles.slider} minimumValue={0} maximumValue={durationMillis || 1} value={positionMillis} onSlidingComplete={handleSliderComplete} minimumTrackTintColor={theme_1.theme.textPrimary} maximumTrackTintColor={theme_1.theme.textSecondary} thumbTintColor={theme_1.theme.textPrimary}/>
            <react_native_1.View style={styles.controlsRow}>
              <react_native_1.TouchableOpacity onPress={handleSeekBack} style={styles.controlBtn}>
                <react_native_1.Text style={styles.controlBtnText}>−5s</react_native_1.Text>
              </react_native_1.TouchableOpacity>
              <react_native_1.TouchableOpacity onPress={handlePlayPause} style={styles.controlBtn}>
                <react_native_1.Text style={styles.controlBtnText}>
                  {playing ? 'Pause' : 'Play'}
                </react_native_1.Text>
              </react_native_1.TouchableOpacity>
              <react_native_1.TouchableOpacity onPress={handleSpeedToggle} style={styles.controlBtn}>
                <react_native_1.Text style={styles.controlBtnText}>{rate}×</react_native_1.Text>
              </react_native_1.TouchableOpacity>
            </react_native_1.View>
          </react_native_1.View>

          <react_native_1.View style={styles.tagsRow}>
            {librarySection ? (<react_native_1.View style={styles.contextPill}>
                <react_native_1.Text style={styles.contextPillText}>{librarySection}</react_native_1.Text>
              </react_native_1.View>) : null}
            {showLibraryTags ? (<>
                {libraryMoveName ? (<react_native_1.View style={styles.tagPill}>
                    <react_native_1.Text style={styles.tagPillText}>{libraryMoveName}</react_native_1.Text>
                  </react_native_1.View>) : null}
                {libraryStyle ? (<react_native_1.View style={styles.tagPill}>
                    <react_native_1.Text style={styles.tagPillText}>{libraryStyle}</react_native_1.Text>
                  </react_native_1.View>) : null}
                {libraryEnergy ? (<react_native_1.View style={styles.tagPill}>
                    <react_native_1.Text style={styles.tagPillText}>{libraryEnergy}</react_native_1.Text>
                  </react_native_1.View>) : null}
                {libraryDifficulty ? (<react_native_1.View style={styles.tagPill}>
                    <react_native_1.Text style={styles.tagPillText}>{libraryDifficulty}</react_native_1.Text>
                  </react_native_1.View>) : null}
                {libraryBpm ? (<react_native_1.View style={styles.tagPill}>
                    <react_native_1.Text style={styles.tagPillText}>{libraryBpm} BPM</react_native_1.Text>
                  </react_native_1.View>) : null}
                {libraryNotes ? (<react_native_1.View style={styles.tagPill}>
                    <react_native_1.Text style={styles.tagPillText} numberOfLines={2}>
                      {libraryNotes}
                    </react_native_1.Text>
                  </react_native_1.View>) : null}
              </>) : null}
          </react_native_1.View>
        </react_native_1.View>
      </GestureDetector>);
    }
    const showTags = !!displayClip &&
        (displayClip.move_name ||
            displayClip.style ||
            displayClip.energy ||
            displayClip.difficulty ||
            displayClip.bpm != null ||
            displayClip.notes);
    const sectionLabel = section_label ?? null;
    return (<GestureDetector gesture={panGesture}>
      <react_native_1.View style={styles.container}>
        <react_native_1.View style={react_native_1.StyleSheet.absoluteFill} onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setFrameSize((prev) => (prev.width !== width || prev.height !== height ? { width, height } : prev));
        }}>
          <expo_av_1.Video key={clip.local_id} ref={videoRef} source={{ uri: `https://stream.mux.com/${clip.mux_playback_id}.m3u8` }} style={react_native_1.StyleSheet.absoluteFill} useNativeControls={false} resizeMode={expo_av_1.ResizeMode.CONTAIN} shouldPlay={playing} onPlaybackStatusUpdate={onPlaybackStatusUpdate} onReadyForDisplay={(e) => {
            const ns = e?.naturalSize;
            if (!ns?.width || !ns?.height)
                return;
            setVideoNaturalSize((prev) => prev?.width === ns.width && prev?.height === ns.height ? prev : { width: ns.width, height: ns.height });
        }}/>
          {annotationMode && frameSize.width > 0 && frameSize.height > 0 && (<AnnotationOverlay_1.AnnotationOverlay annotations={frozenTimecode !== null
                ? [
                    ...annotations.filter((a) => a.timecode_ms === frozenTimecode),
                    ...pendingAnnotations
                        .filter((p) => p.timecode_ms === frozenTimecode)
                        .map((p, i) => ({
                        id: `pending-${i}`,
                        clip_id: clipServerId,
                        timecode_ms: p.timecode_ms,
                        type: p.type,
                        payload: p.payload,
                        created_at: '',
                    })),
                ]
                : [
                    ...annotations,
                    ...pendingAnnotations.map((p, i) => ({
                        id: `pending-${i}`,
                        clip_id: clipServerId,
                        timecode_ms: p.timecode_ms,
                        type: p.type,
                        payload: p.payload,
                        created_at: '',
                    })),
                ]} containerWidth={frameSize.width} containerHeight={frameSize.height} videoRect={videoRect} activeTool={activeTool} onPlaceText={handlePlaceText} onPlaceArrow={handlePlaceArrow} onPlaceCircle={handlePlaceCircle}/>)}
        </react_native_1.View>

        <react_native_1.TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <react_native_1.Text style={styles.closeBtnText}>✕</react_native_1.Text>
        </react_native_1.TouchableOpacity>

        {feedbackOpen ? (<react_native_1.TouchableOpacity style={styles.feedbackBadge} onPress={handleCloseFeedback}>
            <react_native_1.Text style={styles.feedbackBadgeText}>Feedback Open</react_native_1.Text>
          </react_native_1.TouchableOpacity>) : (<react_native_1.TouchableOpacity style={styles.requestFeedbackBtn} onPress={handleRequestFeedback}>
            <react_native_1.Text style={styles.requestFeedbackText}>Request Feedback</react_native_1.Text>
          </react_native_1.TouchableOpacity>)}

        {!playing && (<react_native_1.TouchableOpacity style={styles.annotateBtn} onPress={handleAnnotatePress}>
            <react_native_1.Text style={styles.annotateBtnText}>Annotate</react_native_1.Text>
          </react_native_1.TouchableOpacity>)}

        {annotationMode && (<react_native_1.View style={styles.annotationToolbar}>
            <react_native_1.TouchableOpacity style={[styles.toolBtn, activeTool === 'text' && styles.toolBtnActive]} onPress={() => setActiveTool('text')}>
              <react_native_1.Text style={styles.toolBtnText}>Text</react_native_1.Text>
            </react_native_1.TouchableOpacity>
            <react_native_1.TouchableOpacity style={[styles.toolBtn, activeTool === 'arrow' && styles.toolBtnActive]} onPress={() => setActiveTool('arrow')}>
              <react_native_1.Text style={styles.toolBtnText}>Arrow</react_native_1.Text>
            </react_native_1.TouchableOpacity>
            <react_native_1.TouchableOpacity style={[styles.toolBtn, activeTool === 'circle' && styles.toolBtnActive]} onPress={() => setActiveTool('circle')}>
              <react_native_1.Text style={styles.toolBtnText}>Circle</react_native_1.Text>
            </react_native_1.TouchableOpacity>
            <react_native_1.TouchableOpacity style={styles.doneBtn} onPress={handleAnnotationDone}>
              <react_native_1.Text style={styles.doneBtnText}>Done</react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>)}

        <react_native_1.View style={styles.controls}>
          <react_native_1.View style={styles.sliderWrap}>
            {(comments.length > 0 || annotations.length > 0) && durationMillis > 0 && (<react_native_1.View style={styles.commentMarkers} pointerEvents="box-none">
                {comments.map((c) => {
                const ratio = c.timecode_ms / durationMillis;
                return (<react_native_1.TouchableOpacity key={`c-${c.id}`} style={[
                        styles.commentMarker,
                        { left: `${Math.min(1, Math.max(0, ratio)) * 100}%` },
                    ]} onPress={() => setCommentOverlay(c)}/>);
            })}
                {annotations.map((a) => {
                const ratio = a.timecode_ms / durationMillis;
                return (<react_native_1.TouchableOpacity key={`a-${a.id}`} style={[
                        styles.annotationMarker,
                        { left: `${Math.min(1, Math.max(0, ratio)) * 100}%` },
                    ]} onPress={() => handleAnnotationMarkerPress(a.timecode_ms)}/>);
            })}
              </react_native_1.View>)}
            <slider_1.default style={styles.slider} minimumValue={0} maximumValue={durationMillis || 1} value={positionMillis} onSlidingComplete={handleSliderComplete} minimumTrackTintColor={theme_1.theme.textPrimary} maximumTrackTintColor={theme_1.theme.textSecondary} thumbTintColor={theme_1.theme.textPrimary}/>
          </react_native_1.View>
          <react_native_1.View style={styles.controlsRow}>
            <react_native_1.TouchableOpacity onPress={handleSeekBack} style={styles.controlBtn}>
              <react_native_1.Text style={styles.controlBtnText}>−5s</react_native_1.Text>
            </react_native_1.TouchableOpacity>
            <react_native_1.TouchableOpacity onPress={handlePlayPause} style={styles.controlBtn}>
              <react_native_1.Text style={styles.controlBtnText}>
                {playing ? 'Pause' : 'Play'}
              </react_native_1.Text>
            </react_native_1.TouchableOpacity>
            <react_native_1.TouchableOpacity onPress={handleSpeedToggle} style={styles.controlBtn}>
              <react_native_1.Text style={styles.controlBtnText}>{rate}×</react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>
        </react_native_1.View>

        <react_native_1.View style={styles.tagsRow}>
          {sectionLabel ? (<react_native_1.View style={styles.contextPill}>
              <react_native_1.Text style={styles.contextPillText}>{sectionLabel}</react_native_1.Text>
            </react_native_1.View>) : null}
          {showTags ? (<>
              {displayClip.move_name ? (<react_native_1.View style={styles.tagPill}>
                  <react_native_1.Text style={styles.tagPillText}>{displayClip.move_name}</react_native_1.Text>
                </react_native_1.View>) : null}
              {displayClip.style ? (<react_native_1.View style={styles.tagPill}>
                  <react_native_1.Text style={styles.tagPillText}>{displayClip.style}</react_native_1.Text>
                </react_native_1.View>) : null}
              {displayClip.energy ? (<react_native_1.View style={styles.tagPill}>
                  <react_native_1.Text style={styles.tagPillText}>{displayClip.energy}</react_native_1.Text>
                </react_native_1.View>) : null}
              {displayClip.difficulty ? (<react_native_1.View style={styles.tagPill}>
                  <react_native_1.Text style={styles.tagPillText}>{displayClip.difficulty}</react_native_1.Text>
                </react_native_1.View>) : null}
              {displayClip.bpm != null ? (<react_native_1.View style={styles.tagPill}>
                  <react_native_1.Text style={styles.tagPillText}>{displayClip.bpm} BPM</react_native_1.Text>
                </react_native_1.View>) : null}
              {displayClip.notes ? (<react_native_1.View style={styles.tagPill}>
                  <react_native_1.Text style={styles.tagPillText} numberOfLines={2}>
                    {displayClip.notes}
                  </react_native_1.Text>
                </react_native_1.View>) : null}
            </>) : (<react_native_1.TouchableOpacity onPress={() => tagSheetRef.current?.snapToIndex(0)}>
              <react_native_1.Text style={styles.addTagsText}>Add tags →</react_native_1.Text>
            </react_native_1.TouchableOpacity>)}
        </react_native_1.View>
      </react_native_1.View>

      <TagSheet_1.TagSheet clip={displayClip} bottomSheetRef={tagSheetRef} onSaved={handleTagSaved} musicTrackBpm={undefined}/>

      <react_native_1.Modal visible={!!commentOverlay} transparent animationType="fade" onRequestClose={() => setCommentOverlay(null)}>
        <react_native_1.TouchableOpacity style={styles.commentOverlayBackdrop} activeOpacity={1} onPress={() => setCommentOverlay(null)}>
          {commentOverlay && (<react_native_1.View style={styles.commentOverlay} onStartShouldSetResponder={() => true}>
              <react_native_1.Text style={styles.commentOverlayName}>
                {commentOverlay.commenter_name || 'Anonymous'}
              </react_native_1.Text>
              <react_native_1.Text style={styles.commentOverlayText}>{commentOverlay.text}</react_native_1.Text>
            </react_native_1.View>)}
        </react_native_1.TouchableOpacity>
      </react_native_1.Modal>
    </GestureDetector>);
}
exports.default = ClipPlayerScreen;
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 18,
        color: theme_1.theme.textSecondary,
        marginBottom: 8,
    },
    placeholderLabel: {
        fontSize: 14,
        color: theme_1.theme.textPrimary,
    },
    closeBtn: {
        position: 'absolute',
        top: 48,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeBtnText: {
        color: '#fff',
        fontSize: 20,
    },
    controls: {
        position: 'absolute',
        bottom: 100,
        left: 16,
        right: 16,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    controlsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
        marginTop: 8,
    },
    controlBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    controlBtnText: {
        color: theme_1.theme.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
    tagsRow: {
        position: 'absolute',
        bottom: 24,
        left: 16,
        right: 16,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        alignItems: 'center',
    },
    tagPill: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: theme_1.theme.borderRadius,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    tagPillText: {
        color: theme_1.theme.textPrimary,
        fontSize: 14,
    },
    contextPill: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: theme_1.theme.borderRadius,
        backgroundColor: 'rgba(184, 134, 11, 0.25)',
        borderWidth: 1,
        borderColor: 'rgba(184, 134, 11, 0.6)',
    },
    contextPillText: {
        color: theme_1.theme.textPrimary,
        fontSize: 13,
        fontWeight: '600',
    },
    addTagsText: {
        color: theme_1.theme.untaggedText,
        fontSize: 14,
        fontWeight: '600',
    },
    requestFeedbackBtn: {
        position: 'absolute',
        top: 48,
        left: 16,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: theme_1.theme.borderRadius,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    requestFeedbackText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    feedbackBadge: {
        position: 'absolute',
        top: 48,
        left: 16,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: theme_1.theme.borderRadius,
        backgroundColor: 'rgba(184, 134, 11, 0.8)',
    },
    feedbackBadgeText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    sliderWrap: {
        width: '100%',
        position: 'relative',
    },
    commentMarkers: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 24,
        marginLeft: 12,
        marginRight: 12,
    },
    commentMarker: {
        position: 'absolute',
        top: 0,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#b8860b',
        marginLeft: -5,
    },
    annotationMarker: {
        position: 'absolute',
        top: 2,
        width: 8,
        height: 8,
        marginLeft: -4,
        backgroundColor: '#6b8e23',
        transform: [{ rotate: '45deg' }],
    },
    annotateBtn: {
        position: 'absolute',
        top: 48,
        right: 64,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: theme_1.theme.borderRadius,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    annotateBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    annotationToolbar: {
        position: 'absolute',
        bottom: 100,
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: theme_1.theme.borderRadius,
    },
    toolBtn: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 8,
        backgroundColor: '#333',
    },
    toolBtnActive: {
        backgroundColor: '#b8860b',
    },
    toolBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    doneBtn: {
        marginLeft: 'auto',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#6b8e23',
    },
    doneBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    commentOverlayBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    commentOverlay: {
        backgroundColor: '#222',
        borderRadius: theme_1.theme.borderRadius,
        padding: 16,
        maxWidth: 320,
    },
    commentOverlayName: {
        color: theme_1.theme.textPrimary,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    commentOverlayText: {
        color: theme_1.theme.textSecondary,
        fontSize: 14,
    },
});
//# sourceMappingURL=clip-player.js.map