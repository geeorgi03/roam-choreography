import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Video, ResizeMode } from 'expo-av';
import { theme } from '../../../lib/theme';
import BottomSheet from '@gorhom/bottom-sheet';
import { QuickSaveSheet } from '../../../components/QuickSaveSheet';

const colors = theme.light;
const spacing = theme.spacing;

export default function CameraScreen() {
  const { id: sessionId, sectionName } = useLocalSearchParams<{ id?: string; sectionName?: string }>();
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [frontRecordedUri, setFrontRecordedUri] = useState<string | null>(null);
  const [dualPairId, setDualPairId] = useState<string | undefined>(undefined);
  const [dualEnabled, setDualEnabled] = useState(false);
  const [showFallbackNotice, setShowFallbackNotice] = useState(false);
  const recordingPromiseRef = useRef<Promise<{ uri: string } | undefined> | null>(null);
  const quickSaveRef = useRef<BottomSheet | null>(null);
  const frontCameraRef = useRef<CameraView>(null);
  const fpsFramesRef = useRef<number[]>([]);
  const lowFpsStartRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoOpenQuickSaveRef = useRef(false);

  useEffect(() => {
    if (!cameraPermission?.granted) requestCameraPermission();
    if (!micPermission?.granted) requestMicPermission();
  }, [cameraPermission?.granted, micPermission?.granted, requestCameraPermission, requestMicPermission]);

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
    setDualEnabled(false);
    setShowFallbackNotice(true);
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    fallbackTimerRef.current = setTimeout(() => {
      setShowFallbackNotice(false);
      fallbackTimerRef.current = null;
    }, 4000);
  }, [stopFpsMonitor]);

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
    };
  }, [stopFpsMonitor]);

  const handleRecordPress = async () => {
    if (!cameraRef.current) return;
    if (!isRecording) {
      try {
        const promise = cameraRef.current.recordAsync();
        recordingPromiseRef.current = promise;
        setIsRecording(true);
      } catch (e) {
        setIsRecording(false);
      }
    } else {
      if (cameraRef.current.stopRecording && recordingPromiseRef.current) {
        cameraRef.current.stopRecording();
        const result = await recordingPromiseRef.current;
        if (result?.uri) {
          if (dualEnabled) {
            const nextDualPairId = crypto.randomUUID();
            setDualPairId(nextDualPairId);
            // TODO: dual recording (front + back) once expo-camera supports simultaneous capture.
            setFrontRecordedUri(null);
            autoOpenQuickSaveRef.current = true;
          } else {
            setDualPairId(undefined);
            setFrontRecordedUri(null);
          }
          setRecordedUri(result.uri);
        }
        recordingPromiseRef.current = null;
      }
      setIsRecording(false);
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
  };

  if (!cameraPermission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.placeholderText}>Camera permission required</Text>
        <TouchableOpacity style={styles.button} onPress={requestCameraPermission}>
          <Text style={styles.buttonText}>Grant permission</Text>
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
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
            <Text style={styles.buttonText}>Save</Text>
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
        <TouchableOpacity
          style={[styles.dualChip, dualEnabled && styles.dualChipActive]}
          onPress={() => {
            if (dualEnabled && isRecording) stopFpsMonitor();
            setDualEnabled((prev) => !prev);
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
        facing="back"
      />
      {dualEnabled ? (
        <View style={styles.pipContainer}>
          <CameraView ref={frontCameraRef} style={StyleSheet.absoluteFill} facing="front" />
        </View>
      ) : null}
      {showFallbackNotice ? (
        <View style={styles.fallbackNotice}>
          <Text style={styles.fallbackNoticeText}>⚠ performance low - using single capture</Text>
        </View>
      ) : null}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.recordButton, isRecording && styles.recordButtonActive]}
          onPress={handleRecordPress}
          activeOpacity={0.8}
        />
      </View>
    </View>
  );
}

const t = theme.light;

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
    backgroundColor: colors.active,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outlineButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.active,
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
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
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
    backgroundColor: 'rgba(0,0,0,0.7)',
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
    backgroundColor: colors.chrome,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  recordButtonActive: {
    backgroundColor: colors.capture,
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
});
