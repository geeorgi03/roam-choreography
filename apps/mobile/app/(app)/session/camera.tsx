import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Video, ResizeMode, Audio } from 'expo-av';
import { LongPressGestureHandler, State, type HandlerStateChangeEvent, type LongPressGestureHandlerEventPayload } from 'react-native-gesture-handler';
import { theme } from '../../../lib/theme';
import BottomSheet from '@gorhom/bottom-sheet';
import { QuickSaveSheet } from '../../../components/QuickSaveSheet';
import { useSession } from '../../../lib/hooks/useSession';
import { saveClip } from '../../../lib/saveClip';
import { supabase } from '../../../lib/supabase';

const colors = theme.light;
const spacing = theme.spacing;

export default function CameraScreen() {
  const { id: sessionId, sectionName } = useLocalSearchParams<{ id?: string; sectionName?: string }>();
  const router = useRouter();
  const { session } = useSession();
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceMemoRecording, setIsVoiceMemoRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [frontRecordedUri, setFrontRecordedUri] = useState<string | null>(null);
  const [dualPairId, setDualPairId] = useState<string | undefined>(undefined);
  const [dualEnabled, setDualEnabled] = useState(false);
  const [showFallbackNotice, setShowFallbackNotice] = useState(false);
  const [showRecordErrorNotice, setShowRecordErrorNotice] = useState(false);
  const [voiceMemoNotice, setVoiceMemoNotice] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('off');
  const [sessionName, setSessionName] = useState<string | null>(null);
  const recordingPromiseRef = useRef<Promise<{ uri: string } | undefined> | null>(null);
  const frontRecordingPromiseRef = useRef<Promise<{ uri: string } | undefined> | null>(null);
  const audioRecordingRef = useRef<Audio.Recording | null>(null);
  const pulseAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const didConsumeLongPressRef = useRef(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const quickSaveRef = useRef<BottomSheet | null>(null);
  const frontCameraRef = useRef<CameraView>(null);
  const fpsFramesRef = useRef<number[]>([]);
  const lowFpsStartRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceMemoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoOpenQuickSaveRef = useRef(false);
  const dualRequestedAtStartRef = useRef(false);
  const didAutoFallbackRef = useRef(false);

  useEffect(() => {
    if (!cameraPermission?.granted) requestCameraPermission();
    if (!micPermission?.granted) requestMicPermission();
  }, [cameraPermission?.granted, micPermission?.granted, requestCameraPermission, requestMicPermission]);

  useEffect(() => {
    const id = typeof sessionId === 'string' ? sessionId : null;
    if (!id) {
      setSessionName(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        if (!supabase) return;
        const { data } = await supabase
          .from('sessions')
          .select('name')
          .eq('id', id)
          .single<{ name: string | null }>();
        const name = data?.name?.trim() ?? null;
        if (!cancelled) {
          setSessionName(name);
        }
      } catch {
        if (!cancelled) setSessionName(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    if (dualEnabled && facing !== 'back') {
      setFacing('back');
    }
  }, [dualEnabled, facing]);

  const stopFpsMonitor = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    fpsFramesRef.current = [];
    lowFpsStartRef.current = null;
  }, []);

  const triggerFallback = useCallback(() => {
    stopFpsMonitor();
    if (isRecording && dualEnabled) {
      if (frontRecordingPromiseRef.current && frontCameraRef.current) {
        try {
          frontCameraRef.current.stopRecording();
        } catch {
          // idempotent: repeated fallback triggers can occur while dual is winding down
        }
      }
      frontRecordingPromiseRef.current = null;
    }
    didAutoFallbackRef.current = true;
    dualRequestedAtStartRef.current = false;
    setDualEnabled(false);
    setShowFallbackNotice(true);
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    fallbackTimerRef.current = setTimeout(() => {
      setShowFallbackNotice(false);
      fallbackTimerRef.current = null;
    }, 4000);
  }, [dualEnabled, isRecording, stopFpsMonitor]);

  useEffect(() => {
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
        } else if (now - lowFpsStartRef.current > 2000) {
          triggerFallback();
          return;
        }
      } else {
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

  useEffect(() => {
    if (recordedUri && autoOpenQuickSaveRef.current) {
      requestAnimationFrame(() => {
        quickSaveRef.current?.snapToIndex(0);
      });
      autoOpenQuickSaveRef.current = false;
    }
  }, [recordedUri]);

  useEffect(() => {
    return () => {
      stopFpsMonitor();
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      if (recordErrorTimerRef.current) clearTimeout(recordErrorTimerRef.current);
      if (voiceMemoTimerRef.current) clearTimeout(voiceMemoTimerRef.current);
      pulseAnimationRef.current?.stop();
      pulseAnimationRef.current = null;
      pulseAnim.setValue(1);
      // Cleanup audio recording on unmount
      if (audioRecordingRef.current) {
        audioRecordingRef.current.stopAndUnloadAsync().catch(() => {});
        audioRecordingRef.current = null;
      }
    };
  }, [stopFpsMonitor]);

  const handleRecordPress = async () => {
    if (didConsumeLongPressRef.current) {
      didConsumeLongPressRef.current = false;
      return;
    }
    if (!cameraRef.current) return;
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
          } catch {
            triggerFallback();
          }
        }
        setIsRecording(true);
      } catch {
        recordingPromiseRef.current = null;
        frontRecordingPromiseRef.current = null;
        dualRequestedAtStartRef.current = false;
        setIsRecording(false);
      }
    } else {
      if (cameraRef.current.stopRecording && recordingPromiseRef.current) {
        const mainPromise = recordingPromiseRef.current;
        const frontPromise = frontRecordingPromiseRef.current;
        const dualRequestedAtStart = dualRequestedAtStartRef.current;
        let mainResult: { uri: string } | undefined;
        let frontResult: { uri: string } | undefined;
        let canSaveMain = false;
        try {
          cameraRef.current.stopRecording();
          if (frontPromise) {
            try {
              frontCameraRef.current?.stopRecording?.();
            } catch {
              // best effort: front stop can race with fallback stop
            }
          }
          [mainResult, frontResult] = await Promise.all([
            mainPromise,
            frontPromise ?? Promise.resolve(undefined),
          ]);
          canSaveMain = !!mainResult?.uri;
        } catch {
          if (frontPromise) {
            didAutoFallbackRef.current = true;
            try {
              mainResult = await mainPromise;
              canSaveMain = !!mainResult?.uri;
            } catch {
              canSaveMain = false;
            }
          }
          if (!canSaveMain) {
            setShowRecordErrorNotice(true);
            if (recordErrorTimerRef.current) clearTimeout(recordErrorTimerRef.current);
            recordErrorTimerRef.current = setTimeout(() => {
              setShowRecordErrorNotice(false);
              recordErrorTimerRef.current = null;
            }, 4000);
          }
          frontResult = undefined;
        } finally {
          await Promise.allSettled([frontPromise ?? Promise.resolve(undefined)]);
          setIsRecording(false);
          recordingPromiseRef.current = null;
          frontRecordingPromiseRef.current = null;
          dualRequestedAtStartRef.current = false;
        }

        if (mainResult?.uri) {
          const dualHealthy =
            dualRequestedAtStart &&
            !didAutoFallbackRef.current &&
            !!frontResult?.uri;
          if (dualHealthy) {
            const nextDualPairId = crypto.randomUUID();
            setDualPairId(nextDualPairId);
            setFrontRecordedUri(frontResult.uri);
          } else {
            setDualPairId(undefined);
            setFrontRecordedUri(null);
          }
          autoOpenQuickSaveRef.current = true;
          setRecordedUri(mainResult.uri);
        } else {
          setDualPairId(undefined);
          setFrontRecordedUri(null);
        }
      }
    }
  };

  const handleSave = () => {
    if (!recordedUri) return;
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
    if (dualEnabled || isRecording) return;
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  const handleFlashPress = () => {
    setFlashMode((prev) => {
      if (prev === 'off') return 'on';
      if (prev === 'on') return 'auto';
      return 'off';
    });
  };

  const showVoiceMemoNotice = () => {
    setVoiceMemoNotice(true);
    if (voiceMemoTimerRef.current) clearTimeout(voiceMemoTimerRef.current);
    voiceMemoTimerRef.current = setTimeout(() => {
      setVoiceMemoNotice(false);
      voiceMemoTimerRef.current = null;
    }, 2000);
  };

  const isFlipDisabled = dualEnabled || isRecording;

  const handleLongPressStateChange = async (event: HandlerStateChangeEvent<LongPressGestureHandlerEventPayload>) => {
    if (isRecording) return; // Guard against video recording conflicts
    
    if (event.nativeEvent.state === State.ACTIVE) {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') return;

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        audioRecordingRef.current = recording;
        setIsVoiceMemoRecording(true);
        didConsumeLongPressRef.current = true;
        
        // Start pulsing animation
        pulseAnimationRef.current?.stop();
        pulseAnimationRef.current = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 0.3,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        );
        pulseAnimationRef.current.start();
      } catch (error) {
        console.error('Failed to start voice memo recording:', error);
      }
    } else if (
      event.nativeEvent.state === State.END ||
      event.nativeEvent.state === State.CANCELLED ||
      event.nativeEvent.state === State.FAILED
    ) {
      pulseAnimationRef.current?.stop();
      pulseAnimationRef.current = null;
      pulseAnim.setValue(1);
      if (audioRecordingRef.current) {
        try {
          const recording = audioRecordingRef.current;
          await recording.stopAndUnloadAsync();
          const uri = recording.getURI();
          
          if (uri && session?.access_token && sessionId) {
            await saveClip(
              sessionId,
              uri,
              'Voice Memo',
              session.access_token,
              sectionName ?? undefined,
              undefined,
              'voice_memo'
            );
            
            showVoiceMemoNotice();
          }
        } catch (error) {
          console.error('Failed to save voice memo:', error);
        } finally {
          audioRecordingRef.current = null;
          setIsVoiceMemoRecording(false);
        }
      }
    }
  };

  if (!cameraPermission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.placeholderText}>Camera permission required</Text>
        <TouchableOpacity style={styles.button} onPress={requestCameraPermission}>
          <Text style={styles.outlineButtonText}>Grant permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (recordedUri) {
    return (
      <View style={styles.container}>
        <Video
          source={{ uri: recordedUri }}
          style={StyleSheet.absoluteFill}
          useNativeControls={false}
          shouldPlay
          isLooping
          resizeMode={ResizeMode.CONTAIN}
        />
        <View style={styles.previewControls}>
          <TouchableOpacity style={styles.outlineButton} onPress={handleRetake}>
            <Text style={styles.outlineButtonText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
            <Text style={styles.primaryButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
        <QuickSaveSheet
          bottomSheetRef={quickSaveRef}
          videoUri={recordedUri}
          secondaryVideoUri={frontRecordedUri}
          dualPairId={dualPairId}
          sessionId={typeof sessionId === 'string' ? sessionId : null}
          sectionName={typeof sectionName === 'string' ? sectionName : null}
          onDone={(next) => {
            if (next?.navigateTo) {
              router.replace(next.navigateTo);
            } else {
              router.back();
            }
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.sessionLabelWrap}>
          <Text style={styles.sessionLabel}>{sessionName ?? (sessionId ? '…' : 'Session')}</Text>
          {sectionName ? <Text style={styles.sectionLabel}>{sectionName}</Text> : null}
        </View>
        <TouchableOpacity
          style={[styles.dualChip, dualEnabled && styles.dualChipActive]}
          onPress={() => {
            if (dualEnabled && isRecording) stopFpsMonitor();
            setDualEnabled((prev) => {
              const nextDualEnabled = !prev;
              if (nextDualEnabled) setFacing('back');
              return nextDualEnabled;
            });
          }}
          activeOpacity={0.85}
        >
          <Text style={[styles.dualChipText, dualEnabled && styles.dualChipTextActive]}>
            dual-screen
          </Text>
          <Text style={styles.betaBadge}>beta</Text>
        </TouchableOpacity>
      </View>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        mode="video"
        facing={dualEnabled ? 'back' : facing}
        flash={flashMode}
      />
      {dualEnabled ? (
        <View style={styles.pipContainer}>
          <CameraView ref={frontCameraRef} style={StyleSheet.absoluteFill} mode="video" facing="front" />
        </View>
      ) : null}
      {showRecordErrorNotice ? (
        <View style={styles.fallbackNotice}>
          <Text style={styles.fallbackNoticeText}>could not save this take - please retry</Text>
        </View>
      ) : null}
      {showFallbackNotice ? (
        <View style={styles.fallbackNotice}>
          <Text style={styles.fallbackNoticeText}>⚠ performance low - using single capture</Text>
        </View>
      ) : null}
      {voiceMemoNotice ? (
        <View style={styles.fallbackNotice}>
          <Text style={styles.fallbackNoticeText}>🎤 Voice memo saved</Text>
        </View>
      ) : null}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.controlBtn, isFlipDisabled && styles.controlBtnDisabled]}
          onPress={handleFlipPress}
          activeOpacity={isFlipDisabled ? 1 : 0.85}
          disabled={isFlipDisabled}
        >
          <Text style={[styles.controlBtnIcon, isFlipDisabled && styles.controlBtnIconDisabled]}>🔄</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={handleFlashPress} activeOpacity={0.85}>
          <Text style={styles.controlBtnIcon}>⚡</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.controls}>
        {isVoiceMemoRecording && (
          <Animated.View style={[styles.voiceMemoIndicator, { opacity: pulseAnim }]}>
            <View style={styles.voiceMemoDot} />
            <Text style={styles.voiceMemoLabel}>🎤 Recording...</Text>
          </Animated.View>
        )}
        <LongPressGestureHandler onHandlerStateChange={handleLongPressStateChange} minDurationMs={500}>
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordButtonActive]}
            onPress={handleRecordPress}
            activeOpacity={0.8}
          >
            <View style={isRecording ? styles.recordButtonStopIcon : styles.recordButtonIcon} />
          </TouchableOpacity>
        </LongPressGestureHandler>
      </View>
    </View>
  );
}

const t = theme.light;
const overlayDark = 'rgba(58,52,45,0.82)' as const;
const overlayDarkSoft = 'rgba(58,52,45,0.75)' as const;
const RECORD_RING = 'rgba(255,255,255,0.5)' as const;

const styles = StyleSheet.create({
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
    fontSize: theme.typography.sizes.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionLabel: {
    color: t.muted,
    fontSize: theme.typography.sizes.xs,
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
    fontSize: theme.typography.sizes.xs,
    color: colors.chrome,
    fontWeight: '600',
  },
});
