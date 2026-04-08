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
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const expo_camera_1 = require("expo-camera");
const expo_av_1 = require("expo-av");
const react_native_gesture_handler_1 = require("react-native-gesture-handler");
const theme_1 = require("../../../lib/theme");
const QuickSaveSheet_1 = require("../../../components/QuickSaveSheet");
const useSession_1 = require("../../../lib/hooks/useSession");
const saveClip_1 = require("../../../lib/saveClip");
const supabase_1 = require("../../../lib/supabase");
const colors = theme_1.theme.light;
const spacing = theme_1.theme.spacing;
function CameraScreen() {
    const { id: sessionId, sectionName } = (0, expo_router_1.useLocalSearchParams)();
    const router = (0, expo_router_1.useRouter)();
    const { session } = (0, useSession_1.useSession)();
    const cameraRef = (0, react_1.useRef)(null);
    const [cameraPermission, requestCameraPermission] = (0, expo_camera_1.useCameraPermissions)();
    const [micPermission, requestMicPermission] = (0, expo_camera_1.useMicrophonePermissions)();
    const [isRecording, setIsRecording] = (0, react_1.useState)(false);
    const [isVoiceMemoRecording, setIsVoiceMemoRecording] = (0, react_1.useState)(false);
    const [recordedUri, setRecordedUri] = (0, react_1.useState)(null);
    const [frontRecordedUri, setFrontRecordedUri] = (0, react_1.useState)(null);
    const [dualPairId, setDualPairId] = (0, react_1.useState)(undefined);
    const [dualEnabled, setDualEnabled] = (0, react_1.useState)(false);
    const [showFallbackNotice, setShowFallbackNotice] = (0, react_1.useState)(false);
    const [showRecordErrorNotice, setShowRecordErrorNotice] = (0, react_1.useState)(false);
    const [voiceMemoNotice, setVoiceMemoNotice] = (0, react_1.useState)(false);
    const [facing, setFacing] = (0, react_1.useState)('back');
    const [flashMode, setFlashMode] = (0, react_1.useState)('off');
    const [sessionName, setSessionName] = (0, react_1.useState)(null);
    const recordingPromiseRef = (0, react_1.useRef)(null);
    const frontRecordingPromiseRef = (0, react_1.useRef)(null);
    const audioRecordingRef = (0, react_1.useRef)(null);
    const pulseAnimationRef = (0, react_1.useRef)(null);
    const didConsumeLongPressRef = (0, react_1.useRef)(false);
    const pulseAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(1)).current;
    const quickSaveRef = (0, react_1.useRef)(null);
    const frontCameraRef = (0, react_1.useRef)(null);
    const fpsFramesRef = (0, react_1.useRef)([]);
    const lowFpsStartRef = (0, react_1.useRef)(null);
    const rafRef = (0, react_1.useRef)(null);
    const fallbackTimerRef = (0, react_1.useRef)(null);
    const voiceMemoTimerRef = (0, react_1.useRef)(null);
    const recordErrorTimerRef = (0, react_1.useRef)(null);
    const autoOpenQuickSaveRef = (0, react_1.useRef)(false);
    const dualRequestedAtStartRef = (0, react_1.useRef)(false);
    const didAutoFallbackRef = (0, react_1.useRef)(false);
    (0, react_1.useEffect)(() => {
        if (!cameraPermission?.granted)
            requestCameraPermission();
        if (!micPermission?.granted)
            requestMicPermission();
    }, [cameraPermission?.granted, micPermission?.granted, requestCameraPermission, requestMicPermission]);
    (0, react_1.useEffect)(() => {
        const id = typeof sessionId === 'string' ? sessionId : null;
        if (!id) {
            setSessionName(null);
            return;
        }
        let cancelled = false;
        void (async () => {
            try {
                if (!supabase_1.supabase)
                    return;
                const { data } = await supabase_1.supabase
                    .from('sessions')
                    .select('name')
                    .eq('id', id)
                    .single();
                const name = data?.name?.trim() ?? null;
                if (!cancelled) {
                    setSessionName(name);
                }
            }
            catch {
                if (!cancelled)
                    setSessionName(null);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [sessionId]);
    (0, react_1.useEffect)(() => {
        if (dualEnabled && facing !== 'back') {
            setFacing('back');
        }
    }, [dualEnabled, facing]);
    const stopFpsMonitor = (0, react_1.useCallback)(() => {
        if (rafRef.current != null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        fpsFramesRef.current = [];
        lowFpsStartRef.current = null;
    }, []);
    const triggerFallback = (0, react_1.useCallback)(() => {
        stopFpsMonitor();
        if (isRecording && dualEnabled) {
            if (frontRecordingPromiseRef.current && frontCameraRef.current) {
                try {
                    frontCameraRef.current.stopRecording();
                }
                catch {
                    // idempotent: repeated fallback triggers can occur while dual is winding down
                }
            }
            frontRecordingPromiseRef.current = null;
        }
        didAutoFallbackRef.current = true;
        dualRequestedAtStartRef.current = false;
        setDualEnabled(false);
        setShowFallbackNotice(true);
        if (fallbackTimerRef.current)
            clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = setTimeout(() => {
            setShowFallbackNotice(false);
            fallbackTimerRef.current = null;
        }, 4000);
    }, [dualEnabled, isRecording, stopFpsMonitor]);
    (0, react_1.useEffect)(() => {
        if (!dualEnabled || !isRecording) {
            stopFpsMonitor();
            return;
        }
        const tick = () => {
            const now = Date.now();
            fpsFramesRef.current.push(now);
            fpsFramesRef.current = fpsFramesRef.current.filter((ts) => now - ts <= 1000);
            const fps = fpsFramesRef.current.length;
            if (fps < 20) {
                if (lowFpsStartRef.current == null) {
                    lowFpsStartRef.current = now;
                }
                else if (now - lowFpsStartRef.current > 2000) {
                    triggerFallback();
                    return;
                }
            }
            else {
                lowFpsStartRef.current = null;
            }
            rafRef.current = requestAnimationFrame(tick);
        };
        stopFpsMonitor();
        rafRef.current = requestAnimationFrame(tick);
        return () => {
            stopFpsMonitor();
        };
    }, [dualEnabled, isRecording, stopFpsMonitor, triggerFallback]);
    (0, react_1.useEffect)(() => {
        if (recordedUri && autoOpenQuickSaveRef.current) {
            requestAnimationFrame(() => {
                quickSaveRef.current?.snapToIndex(0);
            });
            autoOpenQuickSaveRef.current = false;
        }
    }, [recordedUri]);
    (0, react_1.useEffect)(() => {
        return () => {
            stopFpsMonitor();
            if (fallbackTimerRef.current)
                clearTimeout(fallbackTimerRef.current);
            if (recordErrorTimerRef.current)
                clearTimeout(recordErrorTimerRef.current);
            if (voiceMemoTimerRef.current)
                clearTimeout(voiceMemoTimerRef.current);
            pulseAnimationRef.current?.stop();
            pulseAnimationRef.current = null;
            pulseAnim.setValue(1);
            // Cleanup audio recording on unmount
            if (audioRecordingRef.current) {
                audioRecordingRef.current.stopAndUnloadAsync().catch(() => { });
                audioRecordingRef.current = null;
            }
        };
    }, [stopFpsMonitor]);
    const handleRecordPress = async () => {
        if (didConsumeLongPressRef.current) {
            didConsumeLongPressRef.current = false;
            return;
        }
        if (!cameraRef.current)
            return;
        if (!isRecording) {
            const shouldAttemptDual = dualEnabled && !!frontCameraRef.current;
            dualRequestedAtStartRef.current = shouldAttemptDual;
            didAutoFallbackRef.current = false;
            setFrontRecordedUri(null);
            setDualPairId(undefined);
            try {
                recordingPromiseRef.current = cameraRef.current.recordAsync();
                frontRecordingPromiseRef.current = null;
                if (shouldAttemptDual) {
                    try {
                        frontRecordingPromiseRef.current = frontCameraRef.current?.recordAsync() ?? null;
                    }
                    catch {
                        triggerFallback();
                    }
                }
                setIsRecording(true);
            }
            catch {
                recordingPromiseRef.current = null;
                frontRecordingPromiseRef.current = null;
                dualRequestedAtStartRef.current = false;
                setIsRecording(false);
            }
        }
        else {
            if (cameraRef.current.stopRecording && recordingPromiseRef.current) {
                const mainPromise = recordingPromiseRef.current;
                const frontPromise = frontRecordingPromiseRef.current;
                const dualRequestedAtStart = dualRequestedAtStartRef.current;
                let mainResult;
                let frontResult;
                let canSaveMain = false;
                try {
                    cameraRef.current.stopRecording();
                    if (frontPromise) {
                        try {
                            frontCameraRef.current?.stopRecording?.();
                        }
                        catch {
                            // best effort: front stop can race with fallback stop
                        }
                    }
                    [mainResult, frontResult] = await Promise.all([
                        mainPromise,
                        frontPromise ?? Promise.resolve(undefined),
                    ]);
                    canSaveMain = !!mainResult?.uri;
                }
                catch {
                    if (frontPromise) {
                        didAutoFallbackRef.current = true;
                        try {
                            mainResult = await mainPromise;
                            canSaveMain = !!mainResult?.uri;
                        }
                        catch {
                            canSaveMain = false;
                        }
                    }
                    if (!canSaveMain) {
                        setShowRecordErrorNotice(true);
                        if (recordErrorTimerRef.current)
                            clearTimeout(recordErrorTimerRef.current);
                        recordErrorTimerRef.current = setTimeout(() => {
                            setShowRecordErrorNotice(false);
                            recordErrorTimerRef.current = null;
                        }, 4000);
                    }
                    frontResult = undefined;
                }
                finally {
                    await Promise.allSettled([frontPromise ?? Promise.resolve(undefined)]);
                    setIsRecording(false);
                    recordingPromiseRef.current = null;
                    frontRecordingPromiseRef.current = null;
                    dualRequestedAtStartRef.current = false;
                }
                if (mainResult?.uri) {
                    const dualHealthy = dualRequestedAtStart &&
                        !didAutoFallbackRef.current &&
                        !!frontResult?.uri;
                    if (dualHealthy) {
                        const nextDualPairId = crypto.randomUUID();
                        setDualPairId(nextDualPairId);
                        setFrontRecordedUri(frontResult.uri);
                    }
                    else {
                        setDualPairId(undefined);
                        setFrontRecordedUri(null);
                    }
                    autoOpenQuickSaveRef.current = true;
                    setRecordedUri(mainResult.uri);
                }
                else {
                    setDualPairId(undefined);
                    setFrontRecordedUri(null);
                }
            }
        }
    };
    const handleSave = () => {
        if (!recordedUri)
            return;
        quickSaveRef.current?.snapToIndex(0);
    };
    const handleRetake = () => {
        setRecordedUri(null);
        setFrontRecordedUri(null);
        setDualPairId(undefined);
        didAutoFallbackRef.current = false;
        dualRequestedAtStartRef.current = false;
    };
    const handleFlipPress = () => {
        if (dualEnabled || isRecording)
            return;
        setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
    };
    const handleFlashPress = () => {
        setFlashMode((prev) => {
            if (prev === 'off')
                return 'on';
            if (prev === 'on')
                return 'auto';
            return 'off';
        });
    };
    const showVoiceMemoNotice = () => {
        setVoiceMemoNotice(true);
        if (voiceMemoTimerRef.current)
            clearTimeout(voiceMemoTimerRef.current);
        voiceMemoTimerRef.current = setTimeout(() => {
            setVoiceMemoNotice(false);
            voiceMemoTimerRef.current = null;
        }, 2000);
    };
    const isFlipDisabled = dualEnabled || isRecording;
    const handleLongPressStateChange = async (event) => {
        if (isRecording)
            return; // Guard against video recording conflicts
        if (event.nativeEvent.state === react_native_gesture_handler_1.State.ACTIVE) {
            try {
                const { status } = await expo_av_1.Audio.requestPermissionsAsync();
                if (status !== 'granted')
                    return;
                await expo_av_1.Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                });
                const { recording } = await expo_av_1.Audio.Recording.createAsync(expo_av_1.Audio.RecordingOptionsPresets.HIGH_QUALITY);
                audioRecordingRef.current = recording;
                setIsVoiceMemoRecording(true);
                didConsumeLongPressRef.current = true;
                // Start pulsing animation
                pulseAnimationRef.current?.stop();
                pulseAnimationRef.current = react_native_1.Animated.loop(react_native_1.Animated.sequence([
                    react_native_1.Animated.timing(pulseAnim, {
                        toValue: 0.3,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    react_native_1.Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                ]));
                pulseAnimationRef.current.start();
            }
            catch (error) {
                console.error('Failed to start voice memo recording:', error);
            }
        }
        else if (event.nativeEvent.state === react_native_gesture_handler_1.State.END ||
            event.nativeEvent.state === react_native_gesture_handler_1.State.CANCELLED ||
            event.nativeEvent.state === react_native_gesture_handler_1.State.FAILED) {
            pulseAnimationRef.current?.stop();
            pulseAnimationRef.current = null;
            pulseAnim.setValue(1);
            if (audioRecordingRef.current) {
                try {
                    const recording = audioRecordingRef.current;
                    await recording.stopAndUnloadAsync();
                    const uri = recording.getURI();
                    if (uri && session?.access_token && sessionId) {
                        await (0, saveClip_1.saveClip)(sessionId, uri, 'Voice Memo', session.access_token, sectionName ?? undefined, undefined, 'voice_memo');
                        showVoiceMemoNotice();
                    }
                }
                catch (error) {
                    console.error('Failed to save voice memo:', error);
                }
                finally {
                    audioRecordingRef.current = null;
                    setIsVoiceMemoRecording(false);
                }
            }
        }
    };
    if (!cameraPermission?.granted) {
        return (<react_native_1.View style={styles.container}>
        <react_native_1.Text style={styles.placeholderText}>Camera permission required</react_native_1.Text>
        <react_native_1.TouchableOpacity style={styles.button} onPress={requestCameraPermission}>
          <react_native_1.Text style={styles.outlineButtonText}>Grant permission</react_native_1.Text>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>);
    }
    if (recordedUri) {
        return (<react_native_1.View style={styles.container}>
        <expo_av_1.Video source={{ uri: recordedUri }} style={react_native_1.StyleSheet.absoluteFill} useNativeControls={false} shouldPlay isLooping resizeMode={expo_av_1.ResizeMode.CONTAIN}/>
        <react_native_1.View style={styles.previewControls}>
          <react_native_1.TouchableOpacity style={styles.outlineButton} onPress={handleRetake}>
            <react_native_1.Text style={styles.outlineButtonText}>Retake</react_native_1.Text>
          </react_native_1.TouchableOpacity>
          <react_native_1.TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
            <react_native_1.Text style={styles.primaryButtonText}>Save</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>
        <QuickSaveSheet_1.QuickSaveSheet bottomSheetRef={quickSaveRef} videoUri={recordedUri} secondaryVideoUri={frontRecordedUri} dualPairId={dualPairId} sessionId={typeof sessionId === 'string' ? sessionId : null} sectionName={typeof sectionName === 'string' ? sectionName : null} onDone={(next) => {
                if (next?.navigateTo) {
                    router.replace(next.navigateTo);
                }
                else {
                    router.back();
                }
            }}/>
      </react_native_1.View>);
    }
    return (<react_native_1.View style={styles.container}>
      <react_native_1.View style={styles.topBar}>
        <react_native_1.TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <react_native_1.Text style={styles.backButtonText}>Back</react_native_1.Text>
        </react_native_1.TouchableOpacity>
        <react_native_1.View style={styles.sessionLabelWrap}>
          <react_native_1.Text style={styles.sessionLabel}>{sessionName ?? (sessionId ? '…' : 'Session')}</react_native_1.Text>
          {sectionName ? <react_native_1.Text style={styles.sectionLabel}>{sectionName}</react_native_1.Text> : null}
        </react_native_1.View>
        <react_native_1.TouchableOpacity style={[styles.dualChip, dualEnabled && styles.dualChipActive]} onPress={() => {
            if (dualEnabled && isRecording)
                stopFpsMonitor();
            setDualEnabled((prev) => {
                const nextDualEnabled = !prev;
                if (nextDualEnabled)
                    setFacing('back');
                return nextDualEnabled;
            });
        }} activeOpacity={0.85}>
          <react_native_1.Text style={[styles.dualChipText, dualEnabled && styles.dualChipTextActive]}>
            dual-screen
          </react_native_1.Text>
          <react_native_1.Text style={styles.betaBadge}>beta</react_native_1.Text>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>
      <expo_camera_1.CameraView ref={cameraRef} style={react_native_1.StyleSheet.absoluteFill} mode="video" facing={dualEnabled ? 'back' : facing} flash={flashMode}/>
      {dualEnabled ? (<react_native_1.View style={styles.pipContainer}>
          <expo_camera_1.CameraView ref={frontCameraRef} style={react_native_1.StyleSheet.absoluteFill} mode="video" facing="front"/>
        </react_native_1.View>) : null}
      {showRecordErrorNotice ? (<react_native_1.View style={styles.fallbackNotice}>
          <react_native_1.Text style={styles.fallbackNoticeText}>could not save this take - please retry</react_native_1.Text>
        </react_native_1.View>) : null}
      {showFallbackNotice ? (<react_native_1.View style={styles.fallbackNotice}>
          <react_native_1.Text style={styles.fallbackNoticeText}>⚠ performance low - using single capture</react_native_1.Text>
        </react_native_1.View>) : null}
      {voiceMemoNotice ? (<react_native_1.View style={styles.fallbackNotice}>
          <react_native_1.Text style={styles.fallbackNoticeText}>🎤 Voice memo saved</react_native_1.Text>
        </react_native_1.View>) : null}
      <react_native_1.View style={styles.controlsRow}>
        <react_native_1.TouchableOpacity style={[styles.controlBtn, isFlipDisabled && styles.controlBtnDisabled]} onPress={handleFlipPress} activeOpacity={isFlipDisabled ? 1 : 0.85} disabled={isFlipDisabled}>
          <react_native_1.Text style={[styles.controlBtnIcon, isFlipDisabled && styles.controlBtnIconDisabled]}>🔄</react_native_1.Text>
        </react_native_1.TouchableOpacity>
        <react_native_1.TouchableOpacity style={styles.controlBtn} onPress={handleFlashPress} activeOpacity={0.85}>
          <react_native_1.Text style={styles.controlBtnIcon}>⚡</react_native_1.Text>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>
      <react_native_1.View style={styles.controls}>
        {isVoiceMemoRecording && (<react_native_1.Animated.View style={[styles.voiceMemoIndicator, { opacity: pulseAnim }]}>
            <react_native_1.View style={styles.voiceMemoDot}/>
            <react_native_1.Text style={styles.voiceMemoLabel}>🎤 Recording...</react_native_1.Text>
          </react_native_1.Animated.View>)}
        <react_native_gesture_handler_1.LongPressGestureHandler onHandlerStateChange={handleLongPressStateChange} minDurationMs={500}>
          <react_native_1.TouchableOpacity style={[styles.recordButton, isRecording && styles.recordButtonActive]} onPress={handleRecordPress} activeOpacity={0.8}>
            <react_native_1.View style={isRecording ? styles.recordButtonStopIcon : styles.recordButtonIcon}/>
          </react_native_1.TouchableOpacity>
        </react_native_gesture_handler_1.LongPressGestureHandler>
      </react_native_1.View>
    </react_native_1.View>);
}
exports.default = CameraScreen;
const t = theme_1.theme.light;
const overlayDark = 'rgba(58,52,45,0.82)';
const overlayDarkSoft = 'rgba(58,52,45,0.75)';
const RECORD_RING = 'rgba(255,255,255,0.5)';
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: t.ground,
    },
    placeholderText: {
        fontSize: 16,
        color: colors.muted,
        textAlign: 'center',
        marginBottom: 16,
    },
    button: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        backgroundColor: colors.chrome,
        borderRadius: spacing.radiusMd,
        alignSelf: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    primaryButton: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        backgroundColor: t.capture,
        borderRadius: spacing.radiusMd,
        borderWidth: 1,
        borderColor: t.capture,
    },
    outlineButton: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        backgroundColor: 'transparent',
        borderRadius: spacing.radiusMd,
        borderWidth: 1,
        borderColor: colors.border,
    },
    outlineButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: t.active,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: t.chrome,
    },
    controls: {
        position: 'absolute',
        bottom: 48,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        backgroundColor: t.ground,
        zIndex: 10,
    },
    backButton: {
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    backButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.active,
    },
    sessionLabelWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.sm,
    },
    sessionLabel: {
        color: t.active,
        fontSize: theme_1.theme.typography.sizes.sm,
        fontWeight: '600',
        textAlign: 'center',
    },
    sectionLabel: {
        color: t.muted,
        fontSize: theme_1.theme.typography.sizes.xs,
        textAlign: 'center',
    },
    dualChip: {
        borderWidth: 0.5,
        borderColor: colors.inactive,
        borderRadius: spacing.pill,
        paddingVertical: 4,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    dualChipActive: {
        borderColor: colors.mine,
        backgroundColor: colors.mineBg,
    },
    dualChipText: {
        fontSize: 10,
        color: colors.inactive,
    },
    dualChipTextActive: {
        color: colors.mine,
    },
    betaBadge: {
        fontSize: 8,
        backgroundColor: colors.mineBg,
        color: colors.mine,
        paddingVertical: 1,
        paddingHorizontal: 4,
        borderRadius: 3,
    },
    pipContainer: {
        position: 'absolute',
        top: 60,
        right: 12,
        width: 80,
        height: 106,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: colors.mine,
        overflow: 'hidden',
    },
    fallbackNotice: {
        position: 'absolute',
        bottom: 110,
        alignSelf: 'center',
        backgroundColor: overlayDark,
        borderWidth: 0.5,
        borderColor: colors.border,
        borderRadius: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    fallbackNoticeText: {
        fontSize: 10,
        color: colors.inactive,
    },
    recordButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: t.capture,
        borderWidth: 4,
        borderColor: RECORD_RING,
        alignItems: 'center',
        justifyContent: 'center',
    },
    recordButtonActive: {
        backgroundColor: t.capture,
        borderColor: t.active,
        borderWidth: 2,
    },
    recordButtonIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: t.chrome,
    },
    recordButtonStopIcon: {
        width: 22,
        height: 22,
        borderRadius: 4,
        backgroundColor: t.chrome,
    },
    controlsRow: {
        position: 'absolute',
        bottom: 130,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 32,
    },
    controlBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: t.chrome,
        borderWidth: 1,
        borderColor: t.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    controlBtnDisabled: {
        opacity: 0.45,
    },
    controlBtnIcon: {
        fontSize: 18,
        color: t.active,
    },
    controlBtnIconDisabled: {
        color: t.inactive,
    },
    previewControls: {
        position: 'absolute',
        bottom: 48,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
    },
    voiceMemoIndicator: {
        position: 'absolute',
        bottom: 130,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xxs,
        backgroundColor: overlayDarkSoft,
        borderRadius: spacing.pill,
        paddingVertical: spacing.xxs,
        paddingHorizontal: spacing.xs,
    },
    voiceMemoDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.capture,
    },
    voiceMemoLabel: {
        fontSize: theme_1.theme.typography.sizes.xs,
        color: colors.chrome,
        fontWeight: '600',
    },
});
//# sourceMappingURL=camera.js.map