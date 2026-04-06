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
const react_native_1 = require("react-native");
const slider_1 = __importDefault(require("@react-native-community/slider"));
const expo_router_1 = require("expo-router");
const react_1 = require("react");
const react_native_youtube_iframe_1 = __importDefault(require("react-native-youtube-iframe"));
const react_native_reanimated_1 = __importStar(require("react-native-reanimated"));
// Lazy require: a native-module init failure must not prevent route discovery
let GestureDetector = ({ children }) => <>{children}</>;
const createChainableGesture = () => {
    const gesture = {
        onStart: () => gesture,
        onUpdate: () => gesture,
        onEnd: () => gesture,
        minPointers: () => gesture,
    };
    return gesture;
};
let Gesture = {
    Pan: createChainableGesture,
    Pinch: createChainableGesture,
    Simultaneous: (..._) => createChainableGesture(),
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
const useSession_1 = require("../../../lib/hooks/useSession");
const supabase_1 = require("../../../lib/supabase");
const react_native_mmkv_1 = require("react-native-mmkv");
const api_1 = require("../../../lib/api");
// Loupe persistence — key: loupe:${videoId} -> { x, y, zoom }
const loupeStorage = new react_native_mmkv_1.MMKV({ id: 'loupe-state' });
// Loupe constants
const LOUPE_DIAMETER = 140;
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
// Frame capture infrastructure for future WebView integration
// Note: react-native-youtube-iframe doesn't expose injectJavaScript currently
// This infrastructure will be useful when upgrading to a WebView-based approach
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
    const [mirrorActive, setMirrorActive] = (0, react_1.useState)(false);
    const playerRef = (0, react_1.useRef)(null);
    const pollIntervalRef = (0, react_1.useRef)(null);
    const [frameSize, setFrameSize] = (0, react_1.useState)({ width: 0, height: 0 });
    // A/B Loop state
    const [loopStartSec, setLoopStartSec] = (0, react_1.useState)(null);
    const [loopEndSec, setLoopEndSec] = (0, react_1.useState)(null);
    const [abBarWidth, setAbBarWidth] = (0, react_1.useState)(0);
    const [durationSec, setDurationSec] = (0, react_1.useState)(0);
    const barOriginXRef = (0, react_1.useRef)(0);
    const loopSeekingRef = (0, react_1.useRef)(false);
    const [speed, setSpeed] = (0, react_1.useState)(1);
    // Loupe state
    const [loupeActive, setLoupeActive] = (0, react_1.useState)(false);
    const [loupeZoom, setLoupeZoom] = (0, react_1.useState)(2.5);
    const [capturedFrame, setCapturedFrame] = (0, react_1.useState)(null);
    const loupeX = (0, react_native_reanimated_1.useSharedValue)(0);
    const loupeY = (0, react_native_reanimated_1.useSharedValue)(0);
    const loupeActiveShared = (0, react_native_reanimated_1.useSharedValue)(0); // 0 = inactive, 1 = active
    const loupeZoomShared = (0, react_native_reanimated_1.useSharedValue)(2.5);
    const loupeLastX = (0, react_1.useRef)(0);
    const loupeLastY = (0, react_1.useRef)(0);
    const loupeLastZoom = (0, react_1.useRef)(0);
    // Capture frame when loupe becomes active - simplified approach
    const captureCurrentFrame = async () => {
        // Since injectJavaScript is not available in react-native-youtube-iframe,
        // we'll set a flag to attempt capture via other means in future iterations
        // For now, this serves as a placeholder for the capture functionality
        console.log('Frame capture requested for YouTube loupe');
    };
    // Animated style for loupe positioning
    const loupeAnimatedStyle = (0, react_native_reanimated_1.useAnimatedStyle)(() => ({
        transform: [
            { translateX: loupeX.value - LOUPE_DIAMETER / 2 },
            { translateY: loupeY.value - LOUPE_DIAMETER / 2 },
        ],
    }));
    // Animated style for loupe overlay transform
    const loupeOverlayAnimatedStyle = (0, react_native_reanimated_1.useAnimatedStyle)(() => ({
        transform: [
            { scale: loupeZoomShared.value },
            { translateX: -(loupeX.value - LOUPE_DIAMETER / 2) * (loupeZoomShared.value - 1) },
            { translateY: -(loupeY.value - LOUPE_DIAMETER / 2) * (loupeZoomShared.value - 1) },
        ],
    }));
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
                if (typeof sec === 'number') {
                    setPlaybackPositionSec(sec);
                    // A/B Loop enforcement for YouTube
                    if (loopStartSec !== null && loopEndSec !== null && sec >= loopEndSec && !loopSeekingRef.current) {
                        loopSeekingRef.current = true;
                        playerRef.current?.seekTo(loopStartSec);
                        setTimeout(() => {
                            loopSeekingRef.current = false;
                        }, 100);
                    }
                }
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
    const loupePersistKey = musicTrack?.source_url ? `loupe:${musicTrack.source_url}` : null;
    // Restore saved loupe state on video load
    (0, react_1.useEffect)(() => {
        if (!loupePersistKey)
            return;
        try {
            let savedStateString = loupeStorage.getString(loupePersistKey);
            // One-time backward compatibility: check legacy videoId key if new key not found
            if (!savedStateString && videoId) {
                const legacyKey = `loupe:${videoId}`;
                const legacyState = loupeStorage.getString(legacyKey);
                if (legacyState) {
                    // Migrate to new key and delete legacy
                    savedStateString = legacyState;
                    loupeStorage.set(loupePersistKey, legacyState);
                    loupeStorage.delete(legacyKey);
                }
            }
            if (savedStateString) {
                const savedState = JSON.parse(savedStateString);
                // Validate shape and numeric finiteness before applying values
                if (savedState &&
                    typeof savedState.x === 'number' &&
                    typeof savedState.y === 'number' &&
                    typeof savedState.zoom === 'number' &&
                    Number.isFinite(savedState.x) &&
                    Number.isFinite(savedState.y) &&
                    Number.isFinite(savedState.zoom) &&
                    savedState.zoom >= 2 &&
                    savedState.zoom <= 3) {
                    loupeLastX.current = savedState.x;
                    loupeLastY.current = savedState.y;
                    loupeLastZoom.current = savedState.zoom;
                    loupeX.value = savedState.x;
                    loupeY.value = savedState.y;
                    loupeZoomShared.value = savedState.zoom;
                }
                else {
                    // Malformed data - clear the key so restore falls back to default centering
                    loupeStorage.delete(loupePersistKey);
                }
            }
        }
        catch {
            // Silently ignore malformed data
        }
    }, [loupePersistKey]);
    // Reset loupe on videoId change
    (0, react_1.useEffect)(() => {
        setLoupeActive(false);
        loupeActiveShared.value = 0;
        loupeLastZoom.current = 0;
        loupeLastX.current = 0;
        loupeLastY.current = 0;
    }, [videoId]);
    // Reset mirror on unmount
    (0, react_1.useEffect)(() => {
        return () => {
            setMirrorActive(false);
        };
    }, []);
    // Initialize loupe position to center of video container only if no saved state exists
    (0, react_1.useEffect)(() => {
        if (frameSize.width > 0 && frameSize.height > 0) {
            // Only center-initialize if no saved state exists for the current loupePersistKey
            if (!loupePersistKey || !loupeStorage.getString(loupePersistKey)) {
                loupeX.value = frameSize.width / 2;
                loupeY.value = frameSize.height / 2;
                loupeLastX.current = frameSize.width / 2;
                loupeLastY.current = frameSize.height / 2;
            }
        }
    }, [frameSize, loupePersistKey]);
    // Capture duration when player becomes ready
    (0, react_1.useEffect)(() => {
        if (playerState === 'playing' && durationSec === 0) {
            const getDuration = async () => {
                try {
                    const duration = await playerRef.current?.getDuration();
                    if (typeof duration === 'number') {
                        setDurationSec(duration);
                    }
                }
                catch {
                    // ignore
                }
            };
            getDuration();
        }
    }, [playerState, durationSec]);
    // A/B Loop PanResponder factory
    const makeHandlePanResponder = useCallback((which) => {
        return react_native_1.PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                if (abBarWidth <= 0 || durationSec <= 0)
                    return;
                const ratio = Math.max(0, Math.min(1, (gestureState.moveX - barOriginXRef.current) / abBarWidth));
                const sec = ratio * durationSec;
                if (which === 'start') {
                    setLoopStartSec(prev => {
                        const newVal = sec;
                        // Enforce start < end
                        if (loopEndSec !== null && newVal >= loopEndSec) {
                            return Math.max(0, loopEndSec - 0.1);
                        }
                        return newVal;
                    });
                }
                else {
                    setLoopEndSec(prev => {
                        const newVal = sec;
                        // Enforce end > start
                        if (loopStartSec !== null && newVal <= loopStartSec) {
                            return Math.min(durationSec, loopStartSec + 0.1);
                        }
                        return newVal;
                    });
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (abBarWidth <= 0 || durationSec <= 0)
                    return;
                const ratio = Math.max(0, Math.min(1, (gestureState.moveX - barOriginXRef.current) / abBarWidth));
                const sec = ratio * durationSec;
                if (which === 'start') {
                    setLoopStartSec(prev => {
                        const newVal = sec;
                        if (loopEndSec !== null && newVal >= loopEndSec) {
                            return Math.max(0, loopEndSec - 0.1);
                        }
                        return newVal;
                    });
                }
                else {
                    setLoopEndSec(prev => {
                        const newVal = sec;
                        if (loopStartSec !== null && newVal <= loopStartSec) {
                            return Math.min(durationSec, loopStartSec + 0.1);
                        }
                        return newVal;
                    });
                }
            },
        });
    }, [abBarWidth, durationSec, loopStartSec, loopEndSec]);
    const startHandlePR = useMemo(() => makeHandlePanResponder('start'), [makeHandlePanResponder]);
    const endHandlePR = useMemo(() => makeHandlePanResponder('end'), [makeHandlePanResponder]);
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
    const handleSpeedChange = (value) => {
        playerRef.current?.setPlaybackRate(value);
        setSpeed(value);
    };
    // JS-thread helpers for gesture callbacks
    const activateLoupe = (0, react_native_reanimated_1.runOnJS)((zoom, x, y) => {
        setLoupeZoom(zoom);
        loupeZoomShared.value = zoom;
        setLoupeActive(true);
        loupeLastZoom.current = zoom;
        loupeLastX.current = x;
        loupeLastY.current = y;
        // Attempt frame capture when loupe activates
        captureCurrentFrame();
    });
    const updateLoupeZoom = (0, react_native_reanimated_1.runOnJS)((zoom) => {
        setLoupeZoom(zoom);
        loupeZoomShared.value = zoom;
        loupeLastZoom.current = zoom;
    });
    const saveLoupeState = (0, react_native_reanimated_1.runOnJS)((x, y) => {
        if (loupePersistKey) {
            loupeStorage.set(loupePersistKey, JSON.stringify({ x, y, zoom: loupeLastZoom.current }));
        }
    });
    const pinchGesture = Gesture.Pinch()
        .onUpdate((e) => {
        const clamped = Math.min(3, Math.max(2, e.scale ?? 1));
        if (loupeActiveShared.value !== 1) {
            // When loupe is inactive and pinch scale reaches threshold, activate loupe
            if (e.scale && e.scale >= 2) {
                loupeX.value = e.focalX ?? loupeX.value;
                loupeY.value = e.focalY ?? loupeY.value;
                activateLoupe(clamped, e.focalX ?? 0, e.focalY ?? 0);
                loupeActiveShared.value = 1;
            }
        }
        else {
            // When loupe is already active, update zoom
            updateLoupeZoom(clamped);
        }
    })
        .onEnd(() => {
        // No persistence on pinch end - only save on drag end and dismiss
    });
    const twoFingerPan = Gesture.Pan().minPointers(2)
        .onUpdate((e) => {
        if (loupeActiveShared.value !== 1)
            return;
        loupeX.value = loupeLastX.current + e.translationX;
        loupeY.value = loupeLastY.current + e.translationY;
    })
        .onEnd((e) => {
        if (loupeActiveShared.value !== 1)
            return;
        loupeLastX.current = loupeX.value;
        loupeLastY.current = loupeY.value;
        saveLoupeState(loupeX.value, loupeY.value);
    });
    // Compose loupe gestures (pinch and two-finger pan)
    const loupeGesture = Gesture.Simultaneous(pinchGesture, twoFingerPan);
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
      <GestureDetector gesture={loupeGesture}>
        <react_native_1.View style={styles.videoContainer} onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setFrameSize((prev) => (prev.width !== width || prev.height !== height ? { width, height } : prev));
        }}>
          <react_native_1.View style={[react_native_1.StyleSheet.absoluteFill, { transform: [{ scaleX: mirrorActive ? -1 : 1 }] }]}>
            <react_native_youtube_iframe_1.default ref={playerRef} height={220} videoId={videoId} onChangeState={(state) => {
            setPlayerState(state);
        }}/>
          </react_native_1.View>
          {loupeActive && (<react_native_reanimated_1.default.View style={[styles.loupeContainer, loupeAnimatedStyle]} pointerEvents="none">
              <react_native_1.View style={styles.loupeMask}>
                {capturedFrame ? (<react_native_1.View style={[styles.loupeOverlay, loupeOverlayAnimatedStyle]}>
                    {/* Render captured frame when available */}
                    <react_native_1.View style={styles.capturedFrameContainer}>
                      <react_native_1.Text style={styles.capturedFramePlaceholder}>Frame captured</react_native_1.Text>
                    </react_native_1.View>
                  </react_native_1.View>) : (<react_native_1.View style={[styles.loupeOverlay, loupeOverlayAnimatedStyle]}>
                    {/* Static region overlay fallback when capture unavailable */}
                    <react_native_1.Text style={styles.loupeOverlayText}>Magnification</react_native_1.Text>
                  </react_native_1.View>)}
              </react_native_1.View>
            </react_native_reanimated_1.default.View>)}
          {loupeActive && (<react_native_1.TouchableOpacity style={styles.loupeDismissBtn} onPress={() => {
                loupeLastX.current = loupeX.value;
                loupeLastY.current = loupeY.value;
                loupeLastZoom.current = loupeZoom;
                saveLoupeState(loupeX.value, loupeY.value);
                setLoupeActive(false);
                loupeActiveShared.value = 0;
            }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <react_native_1.Text style={styles.loupeDismissBtnText}>✕</react_native_1.Text>
            </react_native_1.TouchableOpacity>)}
          {!loupeActive && loupeLastZoom.current > 0 && (<react_native_1.TouchableOpacity style={styles.loupeRestoreBtn} onPress={() => {
                loupeX.value = loupeLastX.current;
                loupeY.value = loupeLastY.current;
                setLoupeZoom(loupeLastZoom.current);
                loupeZoomShared.value = loupeLastZoom.current;
                setLoupeActive(true);
                loupeActiveShared.value = 1;
            }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <react_native_1.Text style={styles.loupeRestoreBtnText}>⊕</react_native_1.Text>
            </react_native_1.TouchableOpacity>)}
        </react_native_1.View>
      </GestureDetector>

      {/* A/B Loop Progress Bar */}
      <react_native_1.View style={styles.abProgressBar} onLayout={(e) => {
            e.currentTarget.measureInWindow((x, _y, width) => {
                barOriginXRef.current = x;
                setAbBarWidth(width);
            });
        }}>
        {/* Progress fill */}
        <react_native_1.View style={[
            styles.abProgressFill,
            {
                width: durationSec > 0 ? (playbackPositionSec / durationSec) * 100 : 0,
            }
        ]}/>
        
        {/* A/B Loop region band */}
        {loopStartSec !== null && loopEndSec !== null && abBarWidth > 0 && durationSec > 0 && (<react_native_1.View style={[
                styles.abLoopRegion,
                {
                    left: (loopStartSec / durationSec) * abBarWidth,
                    width: ((loopEndSec - loopStartSec) / durationSec) * abBarWidth,
                }
            ]} pointerEvents="none"/>)}
        
        {/* A/B Loop handles */}
        {loopStartSec !== null && abBarWidth > 0 && durationSec > 0 && (<react_native_1.View style={[
                styles.abLoopHandle,
                styles.abLoopHandleStart,
                {
                    left: (loopStartSec / durationSec) * abBarWidth - 6, // HANDLE_HALF_WIDTH
                }
            ]} {...startHandlePR.panHandlers}/>)}
        
        {loopEndSec !== null && abBarWidth > 0 && durationSec > 0 && (<react_native_1.View style={[
                styles.abLoopHandle,
                styles.abLoopHandleEnd,
                {
                    left: (loopEndSec / durationSec) * abBarWidth - 6, // HANDLE_HALF_WIDTH
                }
            ]} {...endHandlePR.panHandlers}/>)}
      </react_native_1.View>

      {/* A/B Loop controls */}
      <react_native_1.View style={styles.abLoopControls}>
        <react_native_1.TouchableOpacity onPress={() => setLoopStartSec(playbackPositionSec)} style={styles.controlBtn}>
          <react_native_1.Text style={styles.controlBtnText}>Set A</react_native_1.Text>
        </react_native_1.TouchableOpacity>
        <react_native_1.TouchableOpacity onPress={() => setLoopEndSec(playbackPositionSec)} style={styles.controlBtn}>
          <react_native_1.Text style={styles.controlBtnText}>Set B</react_native_1.Text>
        </react_native_1.TouchableOpacity>
        {(loopStartSec !== null || loopEndSec !== null) && (<react_native_1.TouchableOpacity onPress={() => {
                setLoopStartSec(null);
                setLoopEndSec(null);
            }} style={styles.abLoopClearBtn}>
            <react_native_1.Text style={styles.abLoopClearBtnText}>✕ Loop</react_native_1.Text>
          </react_native_1.TouchableOpacity>)}
      </react_native_1.View>

      <react_native_1.View style={styles.speedRow}>
        <slider_1.default minimumValue={0.25} maximumValue={2} step={0} value={speed} onValueChange={handleSpeedChange} minimumTrackTintColor={theme_1.theme.accent} maximumTrackTintColor={theme_1.theme.textSecondary} thumbTintColor={theme_1.theme.accent} style={styles.speedSlider}/>
        <react_native_1.Text style={styles.speedLabel}>{speed.toFixed(2)}×</react_native_1.Text>
      </react_native_1.View>

      {/* A/B Loop Progress Bar */}
      <react_native_1.View style={styles.sliderWrap} onLayout={(e) => {
            e.currentTarget.measureInWindow((x, _y, width) => {
                barOriginXRef.current = x;
                setAbBarWidth(width - 24); // Subtract 12px margin on each side
            });
        }}>
        {/* A/B Loop region band */}
        {loopStartSec !== null && loopEndSec !== null && abBarWidth > 0 && musicTrack && (<react_native_1.View style={[
                styles.abLoopRegion,
                {
                    left: (loopStartSec / (musicTrack.duration_ms / 1000)) * abBarWidth + 12, // SLIDER_INSET
                    width: ((loopEndSec - loopStartSec) / (musicTrack.duration_ms / 1000)) * abBarWidth,
                }
            ]} pointerEvents="none"/>)}
        
        <slider_1.default style={styles.slider} minimumValue={0} maximumValue={musicTrack ? musicTrack.duration_ms / 1000 : 1} value={playbackPositionSec} onSlidingComplete={(value) => {
            playerRef.current?.seekTo(value);
            setPlaybackPositionSec(value);
        }} minimumTrackTintColor={theme_1.theme.textPrimary} maximumTrackTintColor={theme_1.theme.textSecondary} thumbTintColor={theme_1.theme.textPrimary}/>
        
        {/* A/B Loop handles */}
        {loopStartSec !== null && abBarWidth > 0 && musicTrack && (<react_native_1.View style={[
                styles.abLoopHandle,
                styles.abLoopHandleStart,
                {
                    left: (loopStartSec / (musicTrack.duration_ms / 1000)) * abBarWidth + 12 - 6, // SLIDER_INSET - HANDLE_HALF_WIDTH
                }
            ]}/>)}
        
        {loopEndSec !== null && abBarWidth > 0 && musicTrack && (<react_native_1.View style={[
                styles.abLoopHandle,
                styles.abLoopHandleEnd,
                {
                    left: (loopEndSec / (musicTrack.duration_ms / 1000)) * abBarWidth + 12 - 6, // SLIDER_INSET - HANDLE_HALF_WIDTH
                }
            ]}/>)}
      </react_native_1.View>

      <react_native_1.View style={styles.videoControlsRow}>
        <react_native_1.TouchableOpacity onPress={() => setMirrorActive((v) => !v)} style={[styles.videoControlBtn, mirrorActive && styles.mirrorBtnActive]}>
          <react_native_1.Text style={styles.videoControlBtnText}>↔</react_native_1.Text>
        </react_native_1.TouchableOpacity>
        
        {/* A/B Loop controls */}
        <react_native_1.TouchableOpacity onPress={() => setLoopStartSec(playbackPositionSec)} style={styles.videoControlBtn}>
          <react_native_1.Text style={styles.videoControlBtnText}>Set A</react_native_1.Text>
        </react_native_1.TouchableOpacity>
        <react_native_1.TouchableOpacity onPress={() => setLoopEndSec(playbackPositionSec)} style={styles.videoControlBtn}>
          <react_native_1.Text style={styles.videoControlBtnText}>Set B</react_native_1.Text>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>
      
      {/* A/B Loop clear button */}
      {(loopStartSec !== null || loopEndSec !== null) && (<react_native_1.TouchableOpacity onPress={() => {
                setLoopStartSec(null);
                setLoopEndSec(null);
            }} style={styles.abLoopClearBtn}>
          <react_native_1.Text style={styles.abLoopClearBtnText}>✕ Loop</react_native_1.Text>
        </react_native_1.TouchableOpacity>)}

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
    videoContainer: {
        position: 'relative',
    },
    loupeContainer: {
        position: 'absolute',
        width: 140,
        height: 140,
        top: 0,
        left: 0,
        zIndex: 10,
    },
    loupeMask: {
        width: 140,
        height: 140,
        borderRadius: 70,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    loupeOverlay: {
        width: 140,
        height: 140,
        backgroundColor: 'rgba(125,185,168,0.15)',
    },
    loupeOverlayText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 60,
    },
    capturedFrameContainer: {
        width: 140,
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
    },
    capturedFramePlaceholder: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 10,
        textAlign: 'center',
    },
    loupeDismissBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loupeDismissBtnText: {
        color: '#fff',
        fontSize: 16,
    },
    loupeRestoreBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(125,185,168,0.3)',
        zIndex: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loupeRestoreBtnText: {
        color: '#fff',
        fontSize: 20,
    },
    videoControlsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
        marginTop: 8,
        marginBottom: 4,
    },
    videoControlBtn: {
        minWidth: 44,
        minHeight: 44,
        paddingVertical: 11,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    videoControlBtnText: {
        color: theme_1.theme.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
    mirrorBtnActive: {
        backgroundColor: theme_1.theme.accent,
        borderRadius: theme_1.theme.borderRadius,
    },
    speedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 4,
    },
    speedSlider: {
        flex: 1,
        height: 40,
    },
    speedLabel: {
        color: theme_1.theme.textPrimary,
        fontSize: 13,
        fontWeight: '600',
        minWidth: 44,
        textAlign: 'right',
    },
    sliderWrap: {
        width: '100%',
        position: 'relative',
        marginTop: 8,
        marginBottom: 8,
    },
    abLoopRegion: {
        position: 'absolute',
        top: 15,
        height: 10,
        backgroundColor: 'rgba(125,185,168,0.3)',
        borderRadius: 2,
    },
    abLoopHandle: {
        position: 'absolute',
        top: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        zIndex: 10,
    },
    abLoopHandleStart: {
        backgroundColor: theme_1.theme.accent,
    },
    abLoopHandleEnd: {
        backgroundColor: theme_1.theme.accent,
    },
    abLoopClearBtn: {
        alignSelf: 'flex-start',
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginTop: 8,
        backgroundColor: 'rgba(231,76,60,0.2)',
        borderRadius: theme_1.theme.borderRadius,
        borderWidth: 1,
        borderColor: 'rgba(231,76,60,0.5)',
    },
    abLoopClearBtnText: {
        color: '#e74c3c',
        fontSize: 14,
        fontWeight: '600',
    },
});
//# sourceMappingURL=youtube-player.js.map