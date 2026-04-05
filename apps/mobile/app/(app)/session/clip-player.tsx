import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Video, AVPlaybackStatus, ResizeMode } from 'expo-av';
import Slider from '@react-native-community/slider';
import Toast from 'react-native-toast-message';
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
import { useClips } from '../../../lib/hooks/useClips';
import { useSession } from '../../../lib/hooks/useSession';
import { TagSheet } from '../../../components/TagSheet';
import BottomSheet from '@gorhom/bottom-sheet';
import { supabase } from '../../../lib/supabase';
import type { ClipRow } from '../../../lib/database';
import type { ClipComment, ClipAnnotation, AnnotationType } from '@roam/types';
import { AnnotationOverlay } from '../../../components/AnnotationOverlay';
import type { VideoContentRect } from '../../../components/AnnotationOverlay';

import { API_BASE } from '../../../lib/api';

// Loupe constants
const LOUPE_DIAMETER = 140;

type SessionParams = {
  sessionId?: string;
  clipIndex?: string;
};

type LibraryParams = {
  clipId?: string;
  mux_playback_id?: string;
  move_name?: string;
  style?: string;
  energy?: string;
  difficulty?: string;
  bpm?: string;
  notes?: string;
  section_label?: string;
};

type PlayerParams = SessionParams & LibraryParams;

export default function ClipPlayerScreen() {
  const {
    sessionId,
    clipIndex,
    mux_playback_id,
    move_name,
    style,
    energy,
    difficulty,
    bpm,
    notes,
    section_label,
  } =
    useLocalSearchParams<PlayerParams>();
  const router = useRouter();

  const hasSessionContext = !!sessionId && !!clipIndex;

  const { clips } = useClips(hasSessionContext ? (sessionId as string) : null);
  const { session } = useSession();

  const parsedIndex = parseInt((clipIndex as string) ?? '0', 10);
  const [currentIndex, setCurrentIndex] = useState(
    isNaN(parsedIndex) ? 0 : parsedIndex
  );
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [rate, setRate] = useState(1);
  const [displayClip, setDisplayClip] = useState<ClipRow | null>(null);
  const [comments, setComments] = useState<ClipComment[]>([]);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [commentOverlay, setCommentOverlay] = useState<ClipComment | null>(null);
  const [annotations, setAnnotations] = useState<ClipAnnotation[]>([]);
  const [annotationMode, setAnnotationMode] = useState(false);
  const [activeTool, setActiveTool] = useState<AnnotationType>('text');
  const [pendingAnnotations, setPendingAnnotations] = useState<
    Array<{ type: AnnotationType; timecode_ms: number; payload: unknown }>
  >([]);
  const [frozenTimecode, setFrozenTimecode] = useState<number | null>(null);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const [videoNaturalSize, setVideoNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const videoRef = useRef<Video>(null);
  const tagSheetRef = useRef<BottomSheet | null>(null);
  
  // Loupe state
  const [loupeActive, setLoupeActive] = useState(false);
  const [loupeZoom, setLoupeZoom] = useState(2.5);
  const loupeX = useSharedValue(0);
  const loupeY = useSharedValue(0);
  const loupeZoomShared = useSharedValue(2.5);
  const loupeActiveShared = useSharedValue(0); // 0 = inactive, 1 = active
  const loupeLastX = useRef(0);
  const loupeLastY = useRef(0);
  const loupeLastZoom = useRef(0);
  const loupeVideoRef = useRef<Video>(null);
  
  // Animated style for loupe positioning
  const loupeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: loupeX.value - LOUPE_DIAMETER / 2 },
      { translateY: loupeY.value - LOUPE_DIAMETER / 2 },
    ],
  }));

  const clip = hasSessionContext ? clips[currentIndex] ?? null : null;

  useEffect(() => {
    if (!hasSessionContext) return;
    const safeIndex = Math.min(
      Math.max(0, isNaN(parsedIndex) ? 0 : parsedIndex),
      Math.max(0, clips.length - 1)
    );
    setCurrentIndex(safeIndex);
  }, [hasSessionContext, parsedIndex, clips.length]);

  useEffect(() => {
    if (!hasSessionContext) return;
    setDisplayClip(clip);
  }, [hasSessionContext, clip]);

  const clipServerId = clip?.server_id ?? null;

  useEffect(() => {
    if (!clipServerId || !session?.access_token) return;
    let mounted = true;
    (async () => {
      try {
        const [commentsRes, feedbackRes] = await Promise.all([
          fetch(`${API_BASE}/clips/${clipServerId}/comments`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
          fetch(`${API_BASE}/clips/${clipServerId}/feedback-requests`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
        ]);
        if (!mounted) return;
        if (commentsRes.ok) {
          const data = await commentsRes.json();
          setComments(data as ClipComment[]);
        }
        if (feedbackRes.ok) {
          const data = await feedbackRes.json();
          setFeedbackOpen((data as { status?: string }).status === 'open');
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, [clipServerId, session?.access_token]);

  useEffect(() => {
    if (!clipServerId) return;
    if (!supabase) return;
    let mounted = true;
    const channel = supabase
      .channel(`clip_comments:clip_id=eq.${clipServerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'clip_comments',
          filter: `clip_id=eq.${clipServerId}`,
        },
        (payload) => {
          if (!mounted) return;
          const row = payload.new as Record<string, unknown>;
          setComments((prev) => [
            ...prev,
            {
              id: row.id as string,
              clip_id: row.clip_id as string,
              session_id: row.session_id as string,
              timecode_ms: row.timecode_ms as number,
              text: row.text as string,
              commenter_name: row.commenter_name as string | null,
              created_at: row.created_at as string,
            },
          ]);
        }
      )
      .subscribe();
    return () => {
      mounted = false;
      supabase?.removeChannel(channel);
    };
  }, [clipServerId]);

  useEffect(() => {
    if (!clipServerId || !session?.access_token) return;
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/clips/${clipServerId}/annotations`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (mounted && res.ok) {
          const data = await res.json();
          setAnnotations(data as ClipAnnotation[]);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, [clipServerId, session?.access_token]);

  const handleRequestFeedback = useCallback(async () => {
    if (!clipServerId || !session?.access_token) return;
    try {
      const res = await fetch(`${API_BASE}/clips/${clipServerId}/feedback-requests`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) setFeedbackOpen(true);
    } catch {
      // ignore
    }
  }, [clipServerId, session?.access_token]);

  const handleCloseFeedback = useCallback(async () => {
    if (!clipServerId || !session?.access_token) return;
    try {
      const res = await fetch(`${API_BASE}/clips/${clipServerId}/feedback-requests`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) setFeedbackOpen(false);
    } catch {
      // ignore
    }
  }, [clipServerId, session?.access_token]);

  // Reset loupe on clip change
  useEffect(() => {
    setLoupeActive(false);
    loupeActiveShared.value = 0;
    loupeLastZoom.current = 0;
    loupeLastX.current = 0;
    loupeLastY.current = 0;
  }, [currentIndex]);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setPositionMillis(status.positionMillis);
    if (status.durationMillis) setDurationMillis(status.durationMillis);
    setPlaying(status.isPlaying);
    
    // Sync loupe video with main video
    if (loupeVideoRef.current && status.isLoaded) {
      loupeVideoRef.current.setPositionAsync(status.positionMillis).catch(() => {});
    }
  };

  const videoRect: VideoContentRect = React.useMemo(() => {
    const cw = frameSize.width;
    const ch = frameSize.height;
    if (cw <= 0 || ch <= 0) return { x: 0, y: 0, width: 0, height: 0 };
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
    if (!videoRef.current) return;
    if (playing) await videoRef.current.pauseAsync();
    else await videoRef.current.playAsync();
  };

  const handleSeekBack = async () => {
    if (!videoRef.current) return;
    const newPos = Math.max(0, positionMillis - 5000);
    await videoRef.current.setPositionAsync(newPos);
  };

  const handleSpeedToggle = async () => {
    if (!videoRef.current) return;
    const newRate = rate === 1 ? 0.5 : 1;
    setRate(newRate);
    await videoRef.current.setRateAsync(newRate, true);
  };

  const handleSliderComplete = async (value: number) => {
    if (!videoRef.current) return;
    await videoRef.current.setPositionAsync(value);
  };

  // Initialize loupe position to center of video container
  useEffect(() => {
    if (frameSize.width > 0 && frameSize.height > 0) {
      loupeX.value = frameSize.width / 2;
      loupeY.value = frameSize.height / 2;
      loupeLastX.current = frameSize.width / 2;
      loupeLastY.current = frameSize.height / 2;
    }
  }, [frameSize]);

  // JS-thread helpers for gesture callbacks
  const activateLoupe = runOnJS((zoom: number, x: number, y: number) => {
    setLoupeZoom(zoom);
    setLoupeActive(true);
    loupeLastZoom.current = zoom;
    loupeLastX.current = x;
    loupeLastY.current = y;
  });
  const updateLoupeZoom = runOnJS((zoom: number) => {
    setLoupeZoom(zoom);
    loupeLastZoom.current = zoom;
  });

  // Rename existing panGesture to singleFingerPan
  const singleFingerPan = Gesture.Pan().onEnd((e) => {
    const { translationX, translationY } = e;
    if (Math.abs(translationY) > 80 && translationY > 0) {
      router.back();
      return;
    }
    if (!hasSessionContext) return;
    if (Math.abs(translationX) > 60) {
      if (translationX > 0 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
        setPositionMillis(0);
      } else if (translationX < 0 && currentIndex < clips.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setPositionMillis(0);
      }
    }
  });

  const pinchGesture = Gesture.Pinch()
    .onStart((e) => {
      // Initialize position but don't activate yet
      loupeX.value = e.focalX;
      loupeY.value = e.focalY;
      loupeLastX.current = e.focalX;
      loupeLastY.current = e.focalY;
    })
    .onUpdate((e) => {
      if (!loupeActive && e.scale >= 2) {
        // Activate loupe when threshold is reached
        const clamped = Math.min(3, Math.max(2, e.scale));
        activateLoupe(clamped, e.focalX, e.focalY);
        loupeActiveShared.value = 1;
      } else if (loupeActive) {
        // Update zoom if already active
        const newZoom = Math.min(3, Math.max(2, e.scale));
        updateLoupeZoom(newZoom);
      }
    });

  const twoFingerPan = Gesture.Pan().minPointers(2)
    .onUpdate((e) => {
      loupeX.value = loupeLastX.current + e.translationX;
      loupeY.value = loupeLastY.current + e.translationY;
    })
    .onEnd(() => {
      loupeLastX.current = loupeX.value;
      loupeLastY.current = loupeY.value;
    });

  // Compose navigation gesture (single finger only)
  const composedGesture = Gesture.Simultaneous(
    singleFingerPan
  );

  // Compose loupe gestures (pinch and two-finger pan)
  const loupeGesture = Gesture.Simultaneous(pinchGesture, twoFingerPan);

  const handleTagSaved = (updatedClip: ClipRow) => {
    setDisplayClip(updatedClip);
  };

  const handleAnnotatePress = useCallback(async () => {
    if (videoRef.current) await videoRef.current.pauseAsync();
    setPlaying(false);
    setAnnotationMode(true);
    setFrozenTimecode(positionMillis);
  }, [positionMillis]);

  const handlePlaceText = useCallback(
    (x: number, y: number, text: string) => {
      setPendingAnnotations((prev) => [
        ...prev,
        { type: 'text', timecode_ms: positionMillis, payload: { x, y, text } },
      ]);
    },
    [positionMillis]
  );

  const handlePlaceArrow = useCallback(
    (x1: number, y1: number, x2: number, y2: number) => {
      setPendingAnnotations((prev) => [
        ...prev,
        { type: 'arrow', timecode_ms: positionMillis, payload: { x1, y1, x2, y2 } },
      ]);
    },
    [positionMillis]
  );

  const handlePlaceCircle = useCallback(
    (x: number, y: number, r: number) => {
      setPendingAnnotations((prev) => [
        ...prev,
        { type: 'circle', timecode_ms: positionMillis, payload: { cx: x, cy: y, r } },
      ]);
    },
    [positionMillis]
  );

  const handleAnnotationDone = useCallback(async () => {
    if (pendingAnnotations.length === 0) {
      setAnnotationMode(false);
      setFrozenTimecode(null);
      return;
    }
    if (!clipServerId || !session?.access_token) {
      Toast.show({ type: 'error', text1: 'Unable to save', text2: 'Please sign in and try again.' });
      return;
    }

    const created: ClipAnnotation[] = [];
    const failed: Array<{ type: AnnotationType; timecode_ms: number; payload: unknown }> = [];
    let needsRefresh = false;

    for (const p of pendingAnnotations) {
      try {
        const res = await fetch(`${API_BASE}/clips/${clipServerId}/annotations`, {
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
          const data = (await res.json()) as unknown;
          if (data && typeof data === 'object' && 'id' in (data as Record<string, unknown>)) {
            created.push(data as ClipAnnotation);
          } else {
            needsRefresh = true;
          }
        } catch {
          needsRefresh = true;
        }
      } catch {
        failed.push(p);
      }
    }

    if (created.length > 0) {
      setAnnotations((prev) => [...prev, ...created]);
    }

    if (needsRefresh) {
      try {
        const res = await fetch(`${API_BASE}/clips/${clipServerId}/annotations`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAnnotations(data as ClipAnnotation[]);
        }
      } catch {
        // ignore
      }
    }

    if (failed.length > 0) {
      Toast.show({ type: 'error', text1: 'Some annotations failed to save' });
      setPendingAnnotations(failed);
      return;
    }

    setPendingAnnotations([]);
    setAnnotationMode(false);
    setFrozenTimecode(null);
  }, [clipServerId, session?.access_token, pendingAnnotations]);

  const handleAnnotationMarkerPress = useCallback(
    async (tc: number) => {
      if (videoRef.current) {
        await videoRef.current.pauseAsync();
        setPlaying(false);
        await videoRef.current.setPositionAsync(tc);
        setPositionMillis(tc);
      }
      setFrozenTimecode(tc);
      setAnnotationMode(true);
    },
    []
  );

  const hasLibraryClip = !hasSessionContext && !!mux_playback_id;

  if (!hasSessionContext && !hasLibraryClip) {
    return (
      <View style={styles.container}>
        <Text style={styles.placeholderText}>No clip</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (hasSessionContext && !clip) {
    return (
      <View style={styles.container}>
        <Text style={styles.placeholderText}>No clip</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (hasSessionContext && clip!.upload_status !== 'ready') {
    return (
      <GestureDetector gesture={composedGesture}>
        <View style={styles.container}>
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Processing…</Text>
            <Text style={styles.placeholderLabel}>{clip!.label ?? 'Clip'}</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      </GestureDetector>
    );
  }

  if (!hasSessionContext && hasLibraryClip) {
    const libraryMoveName = move_name ?? null;
    const libraryStyle = style ?? null;
    const libraryEnergy = energy ?? null;
    const libraryDifficulty = difficulty ?? null;
    const libraryBpm = bpm && String(bpm).trim() ? String(bpm).trim() : null;
    const libraryNotes = notes ?? null;
    const librarySection = section_label ?? null;
    const showLibraryTags =
      !!libraryMoveName ||
      !!libraryStyle ||
      !!libraryEnergy ||
      !!libraryDifficulty ||
      !!libraryBpm ||
      !!libraryNotes;

    return (
      <GestureDetector gesture={composedGesture}>
        <View style={styles.container}>
          <GestureDetector gesture={loupeGesture}>
            <View style={StyleSheet.absoluteFill}>
              <Video
                key={mux_playback_id}
                ref={videoRef}
                source={{ uri: `https://stream.mux.com/${mux_playback_id}.m3u8` }}
                style={StyleSheet.absoluteFill}
                useNativeControls={false}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={playing}
                onPlaybackStatusUpdate={onPlaybackStatusUpdate}
              />
            {loupeActive && (
              <Animated.View style={[styles.loupeContainer, loupeAnimatedStyle]} pointerEvents="none">
                <View style={styles.loupeMask}>
                  <Video
                    source={{ uri: `https://stream.mux.com/${mux_playback_id}.m3u8` }}
                    style={[
                      styles.loupeVideo, 
                      { transform: [{ scale: loupeZoom }] }
                    ]}
                    useNativeControls={false}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={playing}
                    isMuted
                    ref={loupeVideoRef}
                    onPlaybackStatusUpdate={undefined}
                  />
                  {/* Duplicate Video for magnification — no true pixel sampling with expo-av; upgrade to Skia in a future wave if @shopify/react-native-skia is added */}
                </View>
              </Animated.View>
            )}
            {loupeActive && (
              <TouchableOpacity style={styles.loupeDismissBtn} onPress={() => { loupeLastX.current = loupeX.value; loupeLastY.current = loupeY.value; loupeLastZoom.current = loupeZoom; setLoupeActive(false); loupeActiveShared.value = 0; }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.loupeDismissBtnText}>✕</Text>
              </TouchableOpacity>
            )}
            {!loupeActive && loupeLastZoom.current > 0 && (
              <TouchableOpacity style={styles.loupeRestoreBtn} onPress={() => { loupeX.value = loupeLastX.current; loupeY.value = loupeLastY.current; setLoupeZoom(loupeLastZoom.current); setLoupeActive(true); loupeActiveShared.value = 1; }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.loupeRestoreBtnText}>⊕</Text>
              </TouchableOpacity>
            )}
          </View>
          </GestureDetector>

          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.controls}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={durationMillis || 1}
              value={positionMillis}
              onSlidingComplete={handleSliderComplete}
              minimumTrackTintColor={theme.textPrimary}
              maximumTrackTintColor={theme.textSecondary}
              thumbTintColor={theme.textPrimary}
            />
            <View style={styles.controlsRow}>
              <TouchableOpacity onPress={handleSeekBack} style={styles.controlBtn}>
                <Text style={styles.controlBtnText}>−5s</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePlayPause}
                style={styles.controlBtn}
              >
                <Text style={styles.controlBtnText}>
                  {playing ? 'Pause' : 'Play'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSpeedToggle}
                style={styles.controlBtn}
              >
                <Text style={styles.controlBtnText}>{rate}×</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.tagsRow}>
            {librarySection ? (
              <View style={styles.contextPill}>
                <Text style={styles.contextPillText}>{librarySection}</Text>
              </View>
            ) : null}
            {showLibraryTags ? (
              <>
                {libraryMoveName ? (
                  <View style={styles.tagPill}>
                    <Text style={styles.tagPillText}>{libraryMoveName}</Text>
                  </View>
                ) : null}
                {libraryStyle ? (
                  <View style={styles.tagPill}>
                    <Text style={styles.tagPillText}>{libraryStyle}</Text>
                  </View>
                ) : null}
                {libraryEnergy ? (
                  <View style={styles.tagPill}>
                    <Text style={styles.tagPillText}>{libraryEnergy}</Text>
                  </View>
                ) : null}
                {libraryDifficulty ? (
                  <View style={styles.tagPill}>
                    <Text style={styles.tagPillText}>{libraryDifficulty}</Text>
                  </View>
                ) : null}
                {libraryBpm ? (
                  <View style={styles.tagPill}>
                    <Text style={styles.tagPillText}>{libraryBpm} BPM</Text>
                  </View>
                ) : null}
                {libraryNotes ? (
                  <View style={styles.tagPill}>
                    <Text style={styles.tagPillText} numberOfLines={2}>
                      {libraryNotes}
                    </Text>
                  </View>
                ) : null}
              </>
            ) : null}
          </View>
        </View>
      </GestureDetector>
    );
  }

  const showTags =
    !!displayClip &&
    (displayClip.move_name ||
      displayClip.style ||
      displayClip.energy ||
      displayClip.difficulty ||
      displayClip.bpm != null ||
      displayClip.notes);
  const sectionLabel = section_label ?? null;

  return (
    <GestureDetector gesture={composedGesture}>
      <View style={styles.container}>
        <GestureDetector gesture={loupeGesture}>
          <View
            style={StyleSheet.absoluteFill}
            onLayout={(e) => {
              const { width, height } = e.nativeEvent.layout;
              setFrameSize((prev) => (prev.width !== width || prev.height !== height ? { width, height } : prev));
            }}
          >
          <Video
            key={clip!.local_id}
            ref={videoRef}
            source={{ uri: `https://stream.mux.com/${clip!.mux_playback_id}.m3u8` }}
            style={StyleSheet.absoluteFill}
            useNativeControls={false}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={playing}
            onPlaybackStatusUpdate={onPlaybackStatusUpdate}
            onReadyForDisplay={(e) => {
              const ns = e?.naturalSize;
              if (!ns?.width || !ns?.height) return;
              setVideoNaturalSize((prev) =>
                prev?.width === ns.width && prev?.height === ns.height ? prev : { width: ns.width, height: ns.height }
              );
            }}
          />
          {loupeActive && (
            <Animated.View style={[styles.loupeContainer, loupeAnimatedStyle]} pointerEvents="none">
              <View style={styles.loupeMask}>
                <Video
                  source={{ uri: `https://stream.mux.com/${clip!.mux_playback_id}.m3u8` }}
                  style={[
                    styles.loupeVideo, 
                    { transform: [{ scale: loupeZoom }] }
                  ]}
                  useNativeControls={false}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={playing}
                  isMuted
                  ref={loupeVideoRef}
                  onPlaybackStatusUpdate={undefined}
                />
                {/* Duplicate Video for magnification — no true pixel sampling with expo-av; upgrade to Skia in a future wave if @shopify/react-native-skia is added */}
              </View>
            </Animated.View>
          )}
          {loupeActive && (
            <TouchableOpacity style={styles.loupeDismissBtn} onPress={() => { loupeLastX.current = loupeX.value; loupeLastY.current = loupeY.value; loupeLastZoom.current = loupeZoom; setLoupeActive(false); loupeActiveShared.value = 0; }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.loupeDismissBtnText}>✕</Text>
            </TouchableOpacity>
          )}
          {!loupeActive && loupeLastZoom.current > 0 && (
            <TouchableOpacity style={styles.loupeRestoreBtn} onPress={() => { loupeX.value = loupeLastX.current; loupeY.value = loupeLastY.current; setLoupeZoom(loupeLastZoom.current); setLoupeActive(true); loupeActiveShared.value = 1; }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.loupeRestoreBtnText}>⊕</Text>
            </TouchableOpacity>
          )}
          {annotationMode && frameSize.width > 0 && frameSize.height > 0 && (
            <AnnotationOverlay
              annotations={
                frozenTimecode !== null
                  ? [
                      ...annotations.filter((a) => a.timecode_ms === frozenTimecode),
                      ...pendingAnnotations
                        .filter((p) => p.timecode_ms === frozenTimecode)
                        .map((p, i) => ({
                          id: `pending-${i}`,
                          clip_id: clipServerId!,
                          timecode_ms: p.timecode_ms,
                          type: p.type,
                          payload: p.payload as ClipAnnotation['payload'],
                          created_at: '',
                        })),
                    ]
                  : [
                      ...annotations,
                      ...pendingAnnotations.map((p, i) => ({
                        id: `pending-${i}`,
                        clip_id: clipServerId!,
                        timecode_ms: p.timecode_ms,
                        type: p.type,
                        payload: p.payload as ClipAnnotation['payload'],
                        created_at: '',
                      })),
                    ]
              }
              containerWidth={frameSize.width}
              containerHeight={frameSize.height}
              videoRect={videoRect}
              activeTool={activeTool}
              onPlaceText={handlePlaceText}
              onPlaceArrow={handlePlaceArrow}
              onPlaceCircle={handlePlaceCircle}
            />
          )}
        </View>
        </GestureDetector>

        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>

        {feedbackOpen ? (
          <TouchableOpacity
            style={styles.feedbackBadge}
            onPress={handleCloseFeedback}
          >
            <Text style={styles.feedbackBadgeText}>Feedback Open</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.requestFeedbackBtn}
            onPress={handleRequestFeedback}
          >
            <Text style={styles.requestFeedbackText}>Request Feedback</Text>
          </TouchableOpacity>
        )}

        {!playing && (
          <TouchableOpacity
            style={styles.annotateBtn}
            onPress={handleAnnotatePress}
          >
            <Text style={styles.annotateBtnText}>Annotate</Text>
          </TouchableOpacity>
        )}

        {annotationMode && (
          <View style={styles.annotationToolbar}>
            <TouchableOpacity
              style={[styles.toolBtn, activeTool === 'text' && styles.toolBtnActive]}
              onPress={() => setActiveTool('text')}
            >
              <Text style={styles.toolBtnText}>Text</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toolBtn, activeTool === 'arrow' && styles.toolBtnActive]}
              onPress={() => setActiveTool('arrow')}
            >
              <Text style={styles.toolBtnText}>Arrow</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toolBtn, activeTool === 'circle' && styles.toolBtnActive]}
              onPress={() => setActiveTool('circle')}
            >
              <Text style={styles.toolBtnText}>Circle</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={handleAnnotationDone}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.controls}>
          <View style={styles.sliderWrap}>
            {(comments.length > 0 || annotations.length > 0) && durationMillis > 0 && (
              <View style={styles.commentMarkers} pointerEvents="box-none">
                {comments.map((c) => {
                  const ratio = c.timecode_ms / durationMillis;
                  return (
                    <TouchableOpacity
                      key={`c-${c.id}`}
                      style={[
                        styles.commentMarker,
                        { left: `${Math.min(1, Math.max(0, ratio)) * 100}%` },
                      ]}
                      onPress={() => setCommentOverlay(c)}
                    />
                  );
                })}
                {annotations.map((a) => {
                  const ratio = a.timecode_ms / durationMillis;
                  return (
                    <TouchableOpacity
                      key={`a-${a.id}`}
                      style={[
                        styles.annotationMarker,
                        { left: `${Math.min(1, Math.max(0, ratio)) * 100}%` },
                      ]}
                      onPress={() => handleAnnotationMarkerPress(a.timecode_ms)}
                    />
                  );
                })}
              </View>
            )}
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={durationMillis || 1}
              value={positionMillis}
              onSlidingComplete={handleSliderComplete}
              minimumTrackTintColor={theme.textPrimary}
              maximumTrackTintColor={theme.textSecondary}
              thumbTintColor={theme.textPrimary}
            />
          </View>
          <View style={styles.controlsRow}>
            <TouchableOpacity onPress={handleSeekBack} style={styles.controlBtn}>
              <Text style={styles.controlBtnText}>−5s</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePlayPause} style={styles.controlBtn}>
              <Text style={styles.controlBtnText}>
                {playing ? 'Pause' : 'Play'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSpeedToggle}
              style={styles.controlBtn}
            >
              <Text style={styles.controlBtnText}>{rate}×</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tagsRow}>
          {sectionLabel ? (
            <View style={styles.contextPill}>
              <Text style={styles.contextPillText}>{sectionLabel}</Text>
            </View>
          ) : null}
          {showTags ? (
            <>
              {displayClip!.move_name ? (
                <View style={styles.tagPill}>
                  <Text style={styles.tagPillText}>{displayClip!.move_name}</Text>
                </View>
              ) : null}
              {displayClip!.style ? (
                <View style={styles.tagPill}>
                  <Text style={styles.tagPillText}>{displayClip!.style}</Text>
                </View>
              ) : null}
              {displayClip!.energy ? (
                <View style={styles.tagPill}>
                  <Text style={styles.tagPillText}>{displayClip!.energy}</Text>
                </View>
              ) : null}
              {displayClip!.difficulty ? (
                <View style={styles.tagPill}>
                  <Text style={styles.tagPillText}>{displayClip!.difficulty}</Text>
                </View>
              ) : null}
              {displayClip!.bpm != null ? (
                <View style={styles.tagPill}>
                  <Text style={styles.tagPillText}>{displayClip!.bpm} BPM</Text>
                </View>
              ) : null}
              {displayClip!.notes ? (
                <View style={styles.tagPill}>
                  <Text style={styles.tagPillText} numberOfLines={2}>
                    {displayClip!.notes}
                  </Text>
                </View>
              ) : null}
            </>
          ) : (
            <TouchableOpacity onPress={() => tagSheetRef.current?.snapToIndex(0)}>
              <Text style={styles.addTagsText}>Add tags →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <TagSheet
        clip={displayClip}
        bottomSheetRef={tagSheetRef}
        onSaved={handleTagSaved}
        musicTrackBpm={undefined}
      />

      <Modal
        visible={!!commentOverlay}
        transparent
        animationType="fade"
        onRequestClose={() => setCommentOverlay(null)}
      >
        <TouchableOpacity
          style={styles.commentOverlayBackdrop}
          activeOpacity={1}
          onPress={() => setCommentOverlay(null)}
        >
          {commentOverlay && (
            <View style={styles.commentOverlay} onStartShouldSetResponder={() => true}>
              <Text style={styles.commentOverlayName}>
                {commentOverlay.commenter_name || 'Anonymous'}
              </Text>
              <Text style={styles.commentOverlayText}>{commentOverlay.text}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Modal>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
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
    color: theme.textSecondary,
    marginBottom: 8,
  },
  placeholderLabel: {
    fontSize: 14,
    color: theme.textPrimary,
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
    color: theme.textPrimary,
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
    borderRadius: theme.borderRadius,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tagPillText: {
    color: theme.textPrimary,
    fontSize: 14,
  },
  contextPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius,
    backgroundColor: 'rgba(184, 134, 11, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 11, 0.6)',
  },
  contextPillText: {
    color: theme.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  addTagsText: {
    color: theme.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  requestFeedbackBtn: {
    position: 'absolute',
    top: 48,
    left: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius,
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
    borderRadius: theme.borderRadius,
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
    borderRadius: theme.borderRadius,
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
    borderRadius: theme.borderRadius,
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
    borderRadius: theme.borderRadius,
    padding: 16,
    maxWidth: 320,
  },
  commentOverlayName: {
    color: theme.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  commentOverlayText: {
    color: theme.textSecondary,
    fontSize: 14,
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
  loupeVideo: {
    width: 140,
    height: 140,
  },
  loupeDismissBtn: {
    position: 'absolute',
    top: 8,
    right: 72,
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
    right: 72,
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
});
