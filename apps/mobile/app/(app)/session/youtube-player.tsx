import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  PanResponder,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import YoutubeIframe, { type YoutubeIframeRef } from 'react-native-youtube-iframe';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
// Lazy require: a native-module init failure must not prevent route discovery
let GestureDetector: React.ComponentType<{ gesture: unknown; children: React.ReactNode }> =
  ({ children }) => <>{children}</>;

// Create chainable gesture stub with proper typing
interface GestureEvent {
  scale?: number;
  focalX?: number;
  focalY?: number;
  translationX: number;
  translationY: number;
}

interface ChainableGesture {
  onStart: (callback?: (event: GestureEvent) => void) => ChainableGesture;
  onUpdate: (callback?: (event: GestureEvent) => void) => ChainableGesture;
  onEnd: (callback?: (event: GestureEvent) => void) => ChainableGesture;
  minPointers: (value?: number) => ChainableGesture;
}

const createChainableGesture = (): ChainableGesture => {
  const gesture: ChainableGesture = {
    onStart: () => gesture,
    onUpdate: () => gesture,
    onEnd: () => gesture,
    minPointers: () => gesture,
  };
  return gesture;
};

let Gesture: { 
  Pan: () => ChainableGesture;
  Pinch: () => ChainableGesture;
  Simultaneous: (..._: unknown[]) => ChainableGesture;
} = {
  Pan: createChainableGesture,
  Pinch: createChainableGesture,
  Simultaneous: (..._: unknown[]) => createChainableGesture(),
};
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const gh = require('react-native-gesture-handler') as typeof import('react-native-gesture-handler');
  GestureDetector = gh.GestureDetector as unknown as typeof GestureDetector;
  Gesture = gh.Gesture as unknown as typeof Gesture;
} catch (_) {
  // gesture handler unavailable in this environment — swipe gestures disabled
}
import { theme } from '../../../lib/theme';
import { useSession } from '../../../lib/hooks/useSession';
import { supabase } from '../../../lib/supabase';
import type { MusicTrack, SectionEntry } from '@roam/types';
import { MMKV } from 'react-native-mmkv';

import { API_BASE } from '../../../lib/api';

// Loupe persistence — key: loupe:${videoId} -> { x, y, zoom }
const loupeStorage = new MMKV({ id: 'loupe-state' });

// Loupe constants
const LOUPE_DIAMETER = 140;

function formatMs(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

function extractVideoId(sourceUrl: string | null): string | null {
  if (!sourceUrl) return null;
  const m = sourceUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  return m ? m[1]! : null;
}

// Frame capture infrastructure for future WebView integration
// Note: react-native-youtube-iframe doesn't expose injectJavaScript currently
// This infrastructure will be useful when upgrading to a WebView-based approach

export default function YoutubePlayerScreen() {
  const { sessionId, musicTrackId } = useLocalSearchParams<{
    sessionId: string;
    musicTrackId: string;
  }>();
  const router = useRouter();
  const { session } = useSession();
  const [musicTrack, setMusicTrack] = useState<MusicTrack | null>(null);
  const [sections, setSections] = useState<SectionEntry[]>([]);
  const [playbackPositionSec, setPlaybackPositionSec] = useState(0);
  const [editingSection, setEditingSection] = useState<{ index: number; label: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [playerState, setPlayerState] = useState<string>('unstarted');
  const [mirrorActive, setMirrorActive] = useState(false);
  const playerRef = useRef<YoutubeIframeRef | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  
  // A/B Loop state
  const [loopStartSec, setLoopStartSec] = useState<number | null>(null);
  const [loopEndSec, setLoopEndSec] = useState<number | null>(null);
  const [abBarWidth, setAbBarWidth] = useState(0);
  const barOriginXRef = useRef<number>(0);
  const loopSeekingRef = useRef<boolean>(false);
  const [speed, setSpeed] = useState(1);
  const [durationSec, setDurationSec] = useState(0);

  // Loupe state
  const [loupeActive, setLoupeActive] = useState(false);
  const [loupeZoom, setLoupeZoom] = useState(2.5);
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);
  const loupeX = useSharedValue(0);
  const loupeY = useSharedValue(0);
  const loupeActiveShared = useSharedValue(0); // 0 = inactive, 1 = active
  const loupeZoomShared = useSharedValue(2.5);
  const loupeLastX = useRef(0);
  const loupeLastY = useRef(0);
  const loupeLastZoom = useRef(0);

  // Capture frame when loupe becomes active - simplified approach
  const captureCurrentFrame = async () => {
    // Since injectJavaScript is not available in react-native-youtube-iframe,
    // we'll set a flag to attempt capture via other means in future iterations
    // For now, this serves as a placeholder for the capture functionality
    console.log('Frame capture requested for YouTube loupe');
  };

  // Animated style for loupe positioning
  const loupeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: loupeX.value - LOUPE_DIAMETER / 2 },
      { translateY: loupeY.value - LOUPE_DIAMETER / 2 },
    ],
  }));

  // Animated style for loupe overlay transform
  const loupeOverlayAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: loupeZoomShared.value },
      { translateX: -(loupeX.value - LOUPE_DIAMETER / 2) * (loupeZoomShared.value - 1) },
      { translateY: -(loupeY.value - LOUPE_DIAMETER / 2) * (loupeZoomShared.value - 1) },
    ],
  }));

  // Poll current time while playing; stop when paused/stopped/unmounted
  useEffect(() => {
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
        const duration = await playerRef.current?.getDuration();
        if (typeof sec === 'number') {
          setPlaybackPositionSec(sec);
          
          // Capture duration when available
          if (typeof duration === 'number' && duration > 0) {
            setDurationSec(duration);
          }
          
          // A/B Loop enforcement for YouTube
          if (loopStartSec !== null && loopEndSec !== null && sec >= loopEndSec && !loopSeekingRef.current) {
            loopSeekingRef.current = true;
            playerRef.current?.seekTo(loopStartSec, true);
            setTimeout(() => {
              loopSeekingRef.current = false;
            }, 100);
          }
        }
      } catch {
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
  }, [playerState, loopStartSec, loopEndSec]);

  useEffect(() => {
    if (!sessionId || !musicTrackId) return;
    if (!supabase) return;
    (async () => {
      const { data } = await supabase
        .from('music_tracks')
        .select('*')
        .eq('id', musicTrackId)
        .eq('session_id', sessionId)
        .single();
      setMusicTrack((data as MusicTrack | null) ?? null);
    })();
  }, [sessionId, musicTrackId]);

  useEffect(() => {
    if (!musicTrack) return;
    setSections(musicTrack.sections ?? []);
  }, [musicTrack]);

  const videoId = musicTrack ? extractVideoId(musicTrack.source_url) : null;
  const loupePersistKey = musicTrack?.source_url ? `loupe:${musicTrack.source_url}` : null;

  // Restore saved loupe state on video load
  useEffect(() => {
    if (!loupePersistKey) return;
    
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
        if (
          savedState &&
          typeof savedState.x === 'number' &&
          typeof savedState.y === 'number' &&
          typeof savedState.zoom === 'number' &&
          Number.isFinite(savedState.x) &&
          Number.isFinite(savedState.y) &&
          Number.isFinite(savedState.zoom) &&
          savedState.zoom >= 2 &&
          savedState.zoom <= 3
        ) {
          loupeLastX.current = savedState.x;
          loupeLastY.current = savedState.y;
          loupeLastZoom.current = savedState.zoom;
          loupeX.value = savedState.x;
          loupeY.value = savedState.y;
          loupeZoomShared.value = savedState.zoom;
        } else {
          // Malformed data - clear the key so restore falls back to default centering
          loupeStorage.delete(loupePersistKey);
        }
      }
    } catch {
      // Silently ignore malformed data
    }
  }, [loupePersistKey]);

  // Reset loupe on videoId change
  useEffect(() => {
    setLoupeActive(false);
    loupeActiveShared.value = 0;
    loupeLastZoom.current = 0;
    loupeLastX.current = 0;
    loupeLastY.current = 0;
  }, [videoId]);

  // Reset mirror on unmount
  useEffect(() => {
    return () => {
      setMirrorActive(false);
    };
  }, []);

  // Initialize loupe position to center of video container only if no saved state exists
  useEffect(() => {
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
  useEffect(() => {
    if (playerState === 'playing' && durationSec === 0) {
      const getDuration = async () => {
        try {
          const duration = await playerRef.current?.getDuration();
          if (typeof duration === 'number') {
            setDurationSec(duration);
          }
        } catch {
          // ignore
        }
      };
      getDuration();
    }
  }, [playerState, durationSec]);

  // A/B Loop PanResponder factory
  const makeHandlePanResponder = useCallback((which: 'start' | 'end') => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (abBarWidth <= 0 || durationSec <= 0) return;
        
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
        } else {
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
        if (abBarWidth <= 0 || durationSec <= 0) return;
        
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
        } else {
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

  const updateSectionLabel = (index: number, label: string) => {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, label } : s))
    );
    setEditingSection((e) => (e?.index === index ? { index, label } : e));
  };

  const removeSection = (index: number) => {
    setSections((prev) => prev.filter((_, i) => i !== index));
    setEditingSection(null);
  };

  const handleSaveSections = async () => {
    if (!sessionId || !session?.access_token) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/music`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ sections }),
      });
      if (!res.ok) throw new Error('Save failed');
      router.back();
    } catch (e) {
      if (__DEV__) console.warn(e);
      setSaving(false);
    }
  };

  const handleSpeedChange = (value: number) => {
    playerRef.current?.setPlaybackRate(value);
    setSpeed(value);
  };

  // JS-thread helpers for gesture callbacks
  const activateLoupe = runOnJS((zoom: number, x: number, y: number) => {
    setLoupeZoom(zoom);
    loupeZoomShared.value = zoom;
    setLoupeActive(true);
    loupeLastZoom.current = zoom;
    loupeLastX.current = x;
    loupeLastY.current = y;
    // Attempt frame capture when loupe activates
    captureCurrentFrame();
  });
  const updateLoupeZoom = runOnJS((zoom: number) => {
    setLoupeZoom(zoom);
    loupeZoomShared.value = zoom;
    loupeLastZoom.current = zoom;
  });
  const saveLoupeState = runOnJS((x: number, y: number) => {
    if (loupePersistKey) {
      loupeStorage.set(loupePersistKey, JSON.stringify({ x, y, zoom: loupeLastZoom.current }));
    }
  });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e: GestureEvent) => {
      const clamped = Math.min(3, Math.max(2, e.scale ?? 1));
      if (loupeActiveShared.value !== 1) {
        // When loupe is inactive and pinch scale reaches threshold, activate loupe
        if (e.scale && e.scale >= 2) {
          loupeX.value = e.focalX ?? loupeX.value;
          loupeY.value = e.focalY ?? loupeY.value;
          activateLoupe(clamped, e.focalX ?? 0, e.focalY ?? 0);
          loupeActiveShared.value = 1;
        }
      } else {
        // When loupe is already active, update zoom
        updateLoupeZoom(clamped);
      }
    })
    .onEnd(() => {
      // No persistence on pinch end - only save on drag end and dismiss
    });

  const twoFingerPan = Gesture.Pan().minPointers(2)
    .onUpdate((e: GestureEvent) => {
      if (loupeActiveShared.value !== 1) return;
      loupeX.value = loupeLastX.current + e.translationX;
      loupeY.value = loupeLastY.current + e.translationY;
    })
    .onEnd((e: GestureEvent) => {
      if (loupeActiveShared.value !== 1) return;
      loupeLastX.current = loupeX.value;
      loupeLastY.current = loupeY.value;
      saveLoupeState(loupeX.value, loupeY.value);
    });

  // Compose loupe gestures (pinch and two-finger pan)
  const loupeGesture = Gesture.Simultaneous(pinchGesture, twoFingerPan);

  if (!musicTrack) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.textPrimary} />
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  if (!videoId) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Invalid YouTube track.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GestureDetector gesture={loupeGesture}>
        <View
          style={styles.videoContainer}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setFrameSize((prev) => (prev.width !== width || prev.height !== height ? { width, height } : prev));
          }}
        >
          <View style={[StyleSheet.absoluteFill, { transform: [{ scaleX: mirrorActive ? -1 : 1 }] }]}>
            <YoutubeIframe
              ref={playerRef}
              height={220}
              videoId={videoId}
              onChangeState={(state) => {
                setPlayerState(state);
              }}
            />
          </View>
          {loupeActive && (
            <Animated.View style={[styles.loupeContainer, loupeAnimatedStyle]} pointerEvents="none">
              <View style={styles.loupeMask}>
                {capturedFrame ? (
                  <View style={[styles.loupeOverlay, loupeOverlayAnimatedStyle]}>
                    {/* Render captured frame when available */}
                    <View style={styles.capturedFrameContainer}>
                      <Text style={styles.capturedFramePlaceholder}>Frame captured</Text>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.loupeOverlay, loupeOverlayAnimatedStyle]}>
                    {/* Static region overlay fallback when capture unavailable */}
                    <Text style={styles.loupeOverlayText}>Magnification</Text>
                  </View>
                )}
              </View>
            </Animated.View>
          )}
          {loupeActive && (
            <TouchableOpacity style={styles.loupeDismissBtn} onPress={() => { 
              loupeLastX.current = loupeX.value; 
              loupeLastY.current = loupeY.value; 
              loupeLastZoom.current = loupeZoom; 
              saveLoupeState(loupeX.value, loupeY.value); 
              setLoupeActive(false); 
              loupeActiveShared.value = 0; 
            }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.loupeDismissBtnText}>✕</Text>
            </TouchableOpacity>
          )}
          {!loupeActive && loupeLastZoom.current > 0 && (
            <TouchableOpacity style={styles.loupeRestoreBtn} onPress={() => { 
              loupeX.value = loupeLastX.current; 
              loupeY.value = loupeLastY.current; 
              setLoupeZoom(loupeLastZoom.current); 
              loupeZoomShared.value = loupeLastZoom.current; 
              setLoupeActive(true); 
              loupeActiveShared.value = 1; 
            }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.loupeRestoreBtnText}>⊕</Text>
            </TouchableOpacity>
          )}
        </View>
      </GestureDetector>

      {/* A/B Loop Progress Bar */}
      <View 
        style={styles.abProgressBar}
        onLayout={(e) => {
          e.currentTarget.measureInWindow((x, _y, width) => {
            barOriginXRef.current = x;
            setAbBarWidth(width);
          });
        }}
      >
        {/* Progress fill */}
        <View 
          style={[
            styles.abProgressFill,
            {
              width: durationSec > 0 ? (playbackPositionSec / durationSec) * 100 : 0,
            }
          ]}
        />
        
        {/* A/B Loop region band */}
        {loopStartSec !== null && loopEndSec !== null && abBarWidth > 0 && durationSec > 0 && (
          <View 
            style={[
              styles.abLoopRegion,
              {
                left: (loopStartSec / durationSec) * abBarWidth,
                width: ((loopEndSec - loopStartSec) / durationSec) * abBarWidth,
              }
            ]}
            pointerEvents="none"
          />
        )}
        
        {/* A/B Loop handles */}
        {loopStartSec !== null && abBarWidth > 0 && durationSec > 0 && (
          <View
            style={[
              styles.abLoopHandle,
              styles.abLoopHandleStart,
              {
                left: (loopStartSec / durationSec) * abBarWidth - 6, // HANDLE_HALF_WIDTH
                width: 12,
                height: 20,
                borderRadius: 2,
              }
            ]}
            {...startHandlePR.panHandlers}
          />
        )}
        
        {loopEndSec !== null && abBarWidth > 0 && durationSec > 0 && (
          <View
            style={[
              styles.abLoopHandle,
              styles.abLoopHandleEnd,
              {
                left: (loopEndSec / durationSec) * abBarWidth - 6, // HANDLE_HALF_WIDTH
                width: 12,
                height: 20,
                borderRadius: 2,
              }
            ]}
            {...endHandlePR.panHandlers}
          />
        )}
      </View>

      {/* A/B Loop controls */}
      <View style={styles.abLoopControls}>
        <TouchableOpacity 
          onPress={() => setLoopStartSec(playbackPositionSec)} 
          style={styles.controlBtn}
        >
          <Text style={styles.controlBtnText}>Set A</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setLoopEndSec(playbackPositionSec)} 
          style={styles.controlBtn}
        >
          <Text style={styles.controlBtnText}>Set B</Text>
        </TouchableOpacity>
        {(loopStartSec !== null || loopEndSec !== null) && (
          <TouchableOpacity 
            onPress={() => {
              setLoopStartSec(null);
              setLoopEndSec(null);
            }} 
            style={styles.abLoopClearBtn}
          >
            <Text style={styles.abLoopClearBtnText}>✕ Loop</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.speedRow}>
        <Slider
          minimumValue={0.25}
          maximumValue={2}
          step={0}
          value={speed}
          onValueChange={handleSpeedChange}
          minimumTrackTintColor={theme.accent}
          maximumTrackTintColor={theme.textSecondary}
          thumbTintColor={theme.accent}
          style={styles.speedSlider}
        />
        <Text style={styles.speedLabel}>{speed.toFixed(2)}×</Text>
        <TouchableOpacity
          onPress={() => setMirrorActive((v) => !v)}
          style={[styles.videoControlBtn, mirrorActive && styles.mirrorBtnActive]}
        >
          <Text style={styles.videoControlBtnText}>↔</Text>
        </TouchableOpacity>
      </View>

      {/* A/B Loop Progress Bar */}
      <View 
        style={styles.sliderWrap}
        onLayout={(e) => {
          e.currentTarget.measureInWindow((x, _y, width) => {
            barOriginXRef.current = x;
            setAbBarWidth(width - 24); // Subtract 12px margin on each side
          });
        }}
      >
        {/* A/B Loop region band */}
        {loopStartSec !== null && loopEndSec !== null && abBarWidth > 0 && durationSec > 0 && (
          <View 
            style={[
              styles.abLoopRegion,
              {
                left: (loopStartSec / durationSec) * abBarWidth + 12, // SLIDER_INSET
                width: ((loopEndSec - loopStartSec) / durationSec) * abBarWidth,
              }
            ]}
            pointerEvents="none"
          />
        )}
        
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={durationSec || 1}
          value={playbackPositionSec}
          onSlidingComplete={(value) => {
            playerRef.current?.seekTo(value);
            setPlaybackPositionSec(value);
          }}
          minimumTrackTintColor={theme.textPrimary}
          maximumTrackTintColor={theme.textSecondary}
          thumbTintColor={theme.textPrimary}
        />
        
        {/* A/B Loop handles */}
        {loopStartSec !== null && abBarWidth > 0 && durationSec > 0 && (
          <View
            style={[
              styles.abLoopHandle,
              styles.abLoopHandleStart,
              {
                left: (loopStartSec / durationSec) * abBarWidth + 12 - 5, // SLIDER_INSET - HANDLE_HALF_WIDTH
                width: 12,
                height: 20,
                borderRadius: 2,
              }
            ]}
          />
        )}
        
        {loopEndSec !== null && abBarWidth > 0 && durationSec > 0 && (
          <View
            style={[
              styles.abLoopHandle,
              styles.abLoopHandleEnd,
              {
                left: (loopEndSec / durationSec) * abBarWidth + 12 - 5, // SLIDER_INSET - HANDLE_HALF_WIDTH
                width: 12,
                height: 20,
                borderRadius: 2,
              }
            ]}
          />
        )}
      </View>

      <View style={styles.videoControlsRow}>
        {/* A/B Loop controls */}
        <TouchableOpacity 
          onPress={() => setLoopStartSec(playbackPositionSec)} 
          style={styles.videoControlBtn}
        >
          <Text style={styles.videoControlBtnText}>Set A</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setLoopEndSec(playbackPositionSec)} 
          style={styles.videoControlBtn}
        >
          <Text style={styles.videoControlBtnText}>Set B</Text>
        </TouchableOpacity>
      </View>
      
      {/* A/B Loop clear button */}
      {(loopStartSec !== null || loopEndSec !== null) && (
        <TouchableOpacity 
          onPress={() => {
            setLoopStartSec(null);
            setLoopEndSec(null);
          }} 
          style={styles.abLoopClearBtn}
        >
          <Text style={styles.abLoopClearBtnText}>✕ Loop</Text>
        </TouchableOpacity>
      )}

      <View style={styles.sectionsBlock}>
        <Text style={styles.sectionsTitle}>SECTIONS</Text>
        {sections.map((sec, i) => (
          <View key={i} style={styles.sectionRow}>
            {editingSection?.index === i ? (
              <TextInput
                style={styles.sectionInput}
                value={editingSection.label}
                onChangeText={(label) => setEditingSection({ index: i, label })}
                onBlur={() => {
                  updateSectionLabel(i, editingSection.label);
                  setEditingSection(null);
                }}
                autoFocus
                placeholderTextColor={theme.textSecondary}
              />
            ) : (
              <Text
                style={styles.sectionLabel}
                onPress={() => setEditingSection({ index: i, label: sec.label })}
              >
                • {sec.label} {formatMs(sec.start_ms)}
              </Text>
            )}
            <TouchableOpacity onPress={() => removeSection(i)} hitSlop={8}>
              <Text style={styles.removeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addSectionBtn} onPress={addSectionAtPlayhead} activeOpacity={0.8}>
          <Text style={styles.addSectionText}>＋ Add section at playhead</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSaveSections}
        disabled={saving}
        activeOpacity={0.8}
      >
        <Text style={styles.saveBtnText}>
          {saving ? 'Saving…' : 'Save sections'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    padding: 16,
  },
  loadingText: {
    color: theme.textSecondary,
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
    color: theme.textSecondary,
    marginBottom: 8,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  sectionLabel: {
    color: theme.textPrimary,
    fontSize: 14,
    flex: 1,
  },
  sectionInput: {
    flex: 1,
    height: 32,
    borderWidth: 1,
    borderColor: theme.textSecondary,
    borderRadius: 4,
    paddingHorizontal: 8,
    color: theme.textPrimary,
  },
  removeBtn: {
    color: theme.textSecondary,
    fontSize: 16,
    paddingLeft: 8,
  },
  addSectionBtn: {
    paddingVertical: 8,
    marginTop: 4,
  },
  addSectionText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
  saveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: theme.accent,
    borderWidth: 1,
    borderColor: theme.textSecondary,
    borderRadius: theme.borderRadius,
    alignSelf: 'flex-start',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: theme.textPrimary,
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
    color: theme.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  mirrorBtnActive: {
    backgroundColor: theme.accent,
    borderRadius: theme.borderRadius,
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
    color: theme.textPrimary,
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
    backgroundColor: theme.light.amber + '60',
    borderRadius: 2,
  },
  abLoopHandle: {
    position: 'absolute',
    top: 10,
    width: 12,
    height: 20,
    borderRadius: 6,
    zIndex: 10,
  },
  abLoopHandleStart: {
    backgroundColor: theme.light.amber,
  },
  abLoopHandleEnd: {
    backgroundColor: theme.light.amber,
  },
  abLoopClearBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 8,
    backgroundColor: 'rgba(231,76,60,0.2)',
    borderRadius: theme.borderRadius,
    borderWidth: 1,
    borderColor: 'rgba(231,76,60,0.5)',
  },
  abLoopClearBtnText: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: '600',
  },
  abProgressBar: {
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    marginHorizontal: 12,
    marginVertical: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  abProgressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    backgroundColor: theme.light.amber,
    borderRadius: 20,
  },
  abLoopControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  controlBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.borderRadius,
    borderWidth: 1,
    borderColor: theme.light.amber,
  },
  controlBtnText: {
    color: theme.light.amber,
    fontSize: 14,
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    height: 40,
  },
});
