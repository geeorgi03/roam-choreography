import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  PanResponder,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Video, AVPlaybackStatus, ResizeMode } from 'expo-av';
import Slider from '@react-native-community/slider';
import Toast from 'react-native-toast-message';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import { WebView } from 'react-native-webview';
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
import { useTranslation } from '../../../lib/i18n';
import { MMKV } from 'react-native-mmkv';

// Loupe persistence — key: YouTube clips use loupe:${source_url}, others use loupe:${mux_playback_id ?? clip_id ?? source_url} -> { x, y, zoom }
const loupeStorage = new MMKV({ id: 'loupe-state' });

// Loupe constants
const LOUPE_DIAMETER = 140;
const LOUPE_MIN_ZOOM = 1.6;
const LOUPE_MAX_ZOOM = 3.8;
const LOUPE_ACTIVATE_SCALE_THRESHOLD = 1.35;
const YOUTUBE_CAPTURE_ACTIVE_MS = 130;
const YOUTUBE_CAPTURE_IDLE_MS = 220;
const YOUTUBE_CAPTURE_HIGH_ZOOM_MS = 90;
const AB_LOOP_HANDLE_TOUCH_SIZE = 44;
const AB_LOOP_HANDLE_HALF = 22;
const AB_LOOP_CLEAR_THRESHOLD_MS = 1;

// YouTube video ID extraction
function extractVideoId(sourceUrl: string | null): string | null {
  if (!sourceUrl) return null;
  const m = sourceUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  return m ? m[1]! : null;
}

// Custom WebView HTML for YouTube with frame capture capability
const CAPTURE_WEBVIEW_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background: #000; }
    #player { width: 100%; height: 100%; }
    #canvas { display: none; }
  </style>
</head>
<body>
  <div id="player"></div>
  <canvas id="canvas"></canvas>
  <script>
    let player;
    let canvas = document.getElementById('canvas');
    let ctx = canvas.getContext('2d');
    
    function onYouTubeIframeAPIReady() {
      player = new YT.Player('player', {
        videoId: 'VIDEO_ID_PLACEHOLDER',
        playerVars: {
          autoplay: 1,
          controls: 0,
          rel: 0,
          showinfo: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          fs: 0
        },
        events: {
          onReady: function(event) {
            // Make player globally accessible for injected commands
            window.player = player;
            window.ReactNativeWebView.postMessage(JSON.stringify({type: 'ready'}));
            // Poll duration once when ready
            if (window.player && window.player.getDuration) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'durationUpdate',
                duration: window.player.getDuration()
              }));
            }
          },
          onStateChange: function(event) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'stateChange',
              state: event.data
            }));
          }
        }
      });
    }
    
    window.captureFrame = function() {
      if (!player) return null;
      
      try {
        const videoElement = player.getIframe().querySelector('video');
        if (!videoElement) return null;
        
        canvas.width = videoElement.videoWidth || 640;
        canvas.height = videoElement.videoHeight || 360;
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        // Crop to loupe region (140px diameter at current focal point)
        const loupeSize = 140;
        const videoRect = videoElement.getBoundingClientRect();
        const scaleX = canvas.width / videoRect.width;
        const scaleY = canvas.height / videoRect.height;
        
        // For now, return full frame - loupe cropping will be done in React Native
        return canvas.toDataURL('image/jpeg', 0.95);
      } catch (e) {
        console.error('Frame capture error:', e);
        return null;
      }
    };
    
    // Load YouTube API
    var tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  </script>
</body>
</html>
`;

type SessionParams = {
  sessionId?: string;
  clipIndex?: string;
};

type LibraryParams = {
  clipId?: string;
  mux_playback_id?: string;
  source_url?: string;
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
    source_url,
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
  const { t } = useTranslation();

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
  const [mirrorActive, setMirrorActive] = useState(false);
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
  const webViewRef = useRef<WebView>(null);
  
  // A/B Loop state
  const [loopStartMs, setLoopStartMs] = useState<number | null>(null);
  const [loopEndMs, setLoopEndMs] = useState<number | null>(null);
  const [abBarWidth, setAbBarWidth] = useState(0);
  const loopSeekingRef = useRef<boolean>(false);
  const barOriginXRef = useRef<number>(0);
  
  const clip = hasSessionContext ? clips[currentIndex] ?? null : null;
  
  // YouTube detection - prioritize route source_url first, then session clip fallback
  const clipYouTubeId = source_url 
    ? extractVideoId(source_url) 
    : (clip?.source_url ? extractVideoId(clip.source_url) : null);
  const isClipYouTube = !!clipYouTubeId;
  
  // Legacy compatibility flags (to be removed in future refactor)
  const hasLibraryClip = !hasSessionContext && (!!mux_playback_id || !!source_url);
  const isYouTubeLibraryClip = !hasSessionContext && isClipYouTube;
  const isSessionClipYouTube = hasSessionContext && isClipYouTube;
  const sessionClipYouTubeId = clipYouTubeId;
  const youtubeVideoId = clipYouTubeId;
  const isYouTubeContent = isClipYouTube;
  
  const [youtubePlayerState, setYoutubePlayerState] = useState<string>('unstarted');
  const [youtubeCurrentTime, setYoutubeCurrentTime] = useState(0);
  const [capturedFrameDataUrl, setCapturedFrameDataUrl] = useState<string | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const youtubeCaptureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const youtubeCaptureInFlightRef = useRef(false);
  const lastCapturedFrameRef = useRef<string | null>(null);
  const loupePerfRef = useRef({
    captureCount: 0,
    totalIntervalMs: 0,
    lastCaptureAt: 0,
  });
  
  // Loupe state
  const [loupeActive, setLoupeActive] = useState(false);
  const [loupeZoom, setLoupeZoom] = useState(2.5);
  const loupeX = useSharedValue(0);
  const loupeY = useSharedValue(0);
  const loupeActiveShared = useSharedValue(0); // 0 = inactive, 1 = active
  const loupeZoomShared = useSharedValue(2.5);
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

  // Animated style for loupe video transform
  const loupeVideoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: loupeZoomShared.value },
      {
        translateX:
          (loupeX.value - LOUPE_DIAMETER / 2) *
          (loupeZoomShared.value - 1) *
          (mirrorActive ? -1 : 1),
      },
      { translateY: -(loupeY.value - LOUPE_DIAMETER / 2) * (loupeZoomShared.value - 1) },
      { scaleX: mirrorActive ? -1 : 1 },
    ],
  }));

  const sourceUrl = source_url || clip?.source_url;
  const loupePersistKey = sourceUrl ? `loupe:${sourceUrl}` : null;

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
    lastCapturedFrameRef.current = null;
    youtubeCaptureInFlightRef.current = false;
    if (youtubeCaptureTimerRef.current) {
      clearTimeout(youtubeCaptureTimerRef.current);
      youtubeCaptureTimerRef.current = null;
    }
    setCapturedFrameDataUrl(null);
  }, [currentIndex]);

  // Reset mirror on unmount
  useEffect(() => {
    return () => {
      setMirrorActive(false);
    };
  }, []);

  const nextCaptureDelayMs = useCallback(() => {
    if (!playing) return YOUTUBE_CAPTURE_IDLE_MS;
    if (loupeZoom >= 3.2) return YOUTUBE_CAPTURE_HIGH_ZOOM_MS;
    return YOUTUBE_CAPTURE_ACTIVE_MS;
  }, [loupeZoom, playing]);

  const recordCaptureTick = useCallback(() => {
    const now = Date.now();
    const last = loupePerfRef.current.lastCaptureAt;
    if (last > 0) {
      loupePerfRef.current.totalIntervalMs += now - last;
    }
    loupePerfRef.current.captureCount += 1;
    loupePerfRef.current.lastCaptureAt = now;
    if (loupePerfRef.current.captureCount % 30 === 0) {
      const avg =
        loupePerfRef.current.captureCount > 1
          ? Math.round(
              loupePerfRef.current.totalIntervalMs / (loupePerfRef.current.captureCount - 1)
            )
          : 0;
      console.log('[loupe-perf]', { captures: loupePerfRef.current.captureCount, avgIntervalMs: avg });
    }
  }, []);

  // Continuous frame capture for YouTube when loupe is active.
  // Uses single-flight scheduling to avoid WebView command pileups.
  const requestYouTubeFrameCapture = useCallback(
    (delayMs: number = 0) => {
      if (!loupeActive || !isYouTubeContent || !webViewRef.current) return;
      if (youtubeCaptureTimerRef.current) {
        clearTimeout(youtubeCaptureTimerRef.current);
      }
      youtubeCaptureTimerRef.current = setTimeout(() => {
        if (!loupeActive || !isYouTubeContent || !webViewRef.current) return;
        if (youtubeCaptureInFlightRef.current) {
          requestYouTubeFrameCapture(nextCaptureDelayMs());
          return;
        }
        youtubeCaptureInFlightRef.current = true;
        webViewRef.current.injectJavaScript(`
          try {
            if (window.player && window.captureFrame) {
              const frameDataUrl = window.captureFrame();
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'frameCapture',
                dataUrl: frameDataUrl || null
              }));
            } else {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'frameCapture', dataUrl: null }));
            }
          } catch (_e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'frameCapture', dataUrl: null }));
          }
        `);
      }, Math.max(0, delayMs));
    },
    [isYouTubeContent, loupeActive, nextCaptureDelayMs]
  );

  useEffect(() => {
    if (!loupeActive || !isYouTubeContent) {
      if (youtubeCaptureTimerRef.current) {
        clearTimeout(youtubeCaptureTimerRef.current);
        youtubeCaptureTimerRef.current = null;
      }
      youtubeCaptureInFlightRef.current = false;
      return;
    }
    requestYouTubeFrameCapture(0);
    return () => {
      if (youtubeCaptureTimerRef.current) {
        clearTimeout(youtubeCaptureTimerRef.current);
        youtubeCaptureTimerRef.current = null;
      }
      youtubeCaptureInFlightRef.current = false;
    };
  }, [isYouTubeContent, loupeActive, requestYouTubeFrameCapture]);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setPositionMillis(status.positionMillis);
    if (status.durationMillis) setDurationMillis(status.durationMillis);
    setPlaying(status.isPlaying);
    
    // A/B Loop enforcement for expo-av
    if (loopStartMs !== null && loopEndMs !== null && status.positionMillis >= loopEndMs && !loopSeekingRef.current) {
      loopSeekingRef.current = true;
      videoRef.current?.setStatusAsync({ positionMillis: loopStartMs }).then(() => {
        loopSeekingRef.current = false;
      }).catch(() => {
        loopSeekingRef.current = false;
      });
    }
    
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
    if (isYouTubeContent && webViewRef.current) {
      // YouTube WebView control
      const command = playing ? 'pauseVideo()' : 'playVideo()';
      webViewRef.current.injectJavaScript(`
        if (window.player) {
          window.player.${command};
        }
      `);
    } else if (videoRef.current) {
      // Regular Video control
      if (playing) await videoRef.current.pauseAsync();
      else await videoRef.current.playAsync();
    }
  };

  const handleSeekBack = async () => {
    const newPos = Math.max(0, positionMillis - 5000);
    
    if (isYouTubeContent && webViewRef.current) {
      // YouTube WebView seek
      webViewRef.current.injectJavaScript(`
        if (window.player) {
          window.player.seekTo(${newPos / 1000});
        }
      `);
      setPositionMillis(newPos);
    } else if (videoRef.current) {
      // Regular Video seek
      await videoRef.current.setPositionAsync(newPos);
    }
  };


  const handleSliderComplete = async (value: number) => {
    if (isYouTubeContent && webViewRef.current) {
      // YouTube WebView seek
      webViewRef.current.injectJavaScript(`
        if (window.player) {
          window.player.seekTo(${value / 1000});
        }
      `);
      setPositionMillis(value);
    } else if (videoRef.current) {
      // Regular Video seek
      await videoRef.current.setPositionAsync(value);
    }
  };

  const handleSpeedChange = async (value: number) => {
    if (isYouTubeContent && webViewRef.current) {
      // YouTube WebView speed control
      setRate(value);
      webViewRef.current?.injectJavaScript(`
        if (window.player) {
          window.player.setPlaybackRate(${value});
        }
      `);
    } else if (videoRef.current) {
      // Regular Video speed control
      setRate(value);
      await videoRef.current.setRateAsync(value, true);
    }
  };

  // Handle WebView messages for YouTube player
  const handleYouTubeWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'ready':
          console.log('YouTube WebView player ready');
          break;
        case 'stateChange':
          setYoutubePlayerState(message.state);
          // Map numeric YouTube state codes to string states
          const stateCode = parseInt(message.state, 10);
          let stateString: string;
          switch (stateCode) {
            case -1: stateString = 'unstarted'; break;
            case 0: stateString = 'ended'; break;
            case 1: stateString = 'playing'; break;
            case 2: stateString = 'paused'; break;
            case 3: stateString = 'buffering'; break;
            case 5: stateString = 'video cued'; break;
            default: stateString = 'unknown'; break;
          }
          
          // Map YouTube state to shared playing state
          if (stateString === 'playing') {
            setPlaying(true);
            // Poll current time when playing
            const pollCurrentTime = async () => {
              if (webViewRef.current) {
                webViewRef.current.injectJavaScript(`
                  if (window.player && window.player.getCurrentTime) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'timeUpdate',
                      currentTime: window.player.getCurrentTime()
                    }));
                  }
                `);
              }
            };
            // Start polling
            const interval = setInterval(pollCurrentTime, 500);
            pollIntervalRef.current = interval;
          } else if (stateString === 'paused' || stateString === 'ended') {
            setPlaying(false);
            // Stop polling when not playing
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
          }
          break;
        case 'timeUpdate':
          setYoutubeCurrentTime(message.currentTime);
          // Update shared position state from YouTube current time
          setPositionMillis(message.currentTime * 1000);
          
          // A/B Loop enforcement for YouTube
          if (loopStartMs !== null && loopEndMs !== null && message.currentTime * 1000 >= loopEndMs && !loopSeekingRef.current) {
            loopSeekingRef.current = true;
            webViewRef.current?.injectJavaScript(`
              if (window.player) {
                window.player.seekTo(${loopStartMs / 1000});
              }
            `);
            setTimeout(() => {
              loopSeekingRef.current = false;
            }, 100);
          }
          break;
        case 'frameCapture':
          youtubeCaptureInFlightRef.current = false;
          recordCaptureTick();
          if (message.dataUrl && typeof message.dataUrl === 'string') {
            if (lastCapturedFrameRef.current !== message.dataUrl) {
              lastCapturedFrameRef.current = message.dataUrl;
              setCapturedFrameDataUrl(message.dataUrl);
            }
          }
          if (loupeActive && isYouTubeContent) {
            requestYouTubeFrameCapture(nextCaptureDelayMs());
          }
          break;
        case 'durationUpdate':
          // Update shared duration state from YouTube duration
          if (message.duration) {
            setDurationMillis(message.duration * 1000);
          }
          break;
      }
    } catch (error) {
      console.warn('Failed to parse WebView message:', error);
    }
  };

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

  // Restore saved loupe state on clip open - single restore effect
  useEffect(() => {
    if (!loupePersistKey) return;
    
    try {
      const savedStateString = loupeStorage.getString(loupePersistKey);
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
          savedState.zoom >= LOUPE_MIN_ZOOM &&
          savedState.zoom <= LOUPE_MAX_ZOOM
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

  // JS-thread helpers for gesture callbacks
  const activateLoupe = runOnJS((zoom: number, x: number, y: number) => {
    setLoupeZoom(zoom);
    loupeZoomShared.value = zoom;
    setLoupeActive(true);
    loupeLastZoom.current = zoom;
    loupeLastX.current = x;
    loupeLastY.current = y;
    
    // Capture frame for YouTube content when loupe activates
    if (isYouTubeContent && webViewRef.current) {
      // Clear previous frame and request fresh capture immediately
      setCapturedFrameDataUrl(null);
      lastCapturedFrameRef.current = null;
      youtubeCaptureInFlightRef.current = false;
      requestYouTubeFrameCapture(0);
    }
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

  // Rename existing panGesture to singleFingerPan
  const singleFingerPan = Gesture.Pan().onEnd((e: GestureEvent) => {
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
    .onUpdate((e: GestureEvent) => {
      const clamped = Math.min(LOUPE_MAX_ZOOM, Math.max(LOUPE_MIN_ZOOM, e.scale ?? 1));
      if (loupeActiveShared.value !== 1) {
        // When loupe is inactive and pinch scale reaches threshold, activate loupe
        if (e.scale && e.scale >= LOUPE_ACTIVATE_SCALE_THRESHOLD) {
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

  // Compose navigation gesture (single finger only)
  const composedGesture = Gesture.Simultaneous(
    singleFingerPan
  );

  // Compose loupe gestures (pinch and two-finger pan)
  const loupeGesture = Gesture.Simultaneous(pinchGesture, twoFingerPan);

  // A/B Loop PanResponder factory
  const makeHandlePanResponder = useCallback((which: 'start' | 'end') => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (abBarWidth <= 0 || durationMillis <= 0) return;
        
        const ratio = Math.max(0, Math.min(1, (gestureState.moveX - barOriginXRef.current) / abBarWidth));
        const newVal = ratio * durationMillis;
        
        if (which === 'start') {
          if (loopEndMs !== null && Math.abs(newVal - loopEndMs) <= AB_LOOP_CLEAR_THRESHOLD_MS) {
            setLoopStartMs(null);
            setLoopEndMs(null);
            return;
          }
          setLoopStartMs(newVal);
        } else {
          if (loopStartMs !== null && Math.abs(newVal - loopStartMs) <= AB_LOOP_CLEAR_THRESHOLD_MS) {
            setLoopStartMs(null);
            setLoopEndMs(null);
            return;
          }
          setLoopEndMs(newVal);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (abBarWidth <= 0 || durationMillis <= 0) return;
        
        const ratio = Math.max(0, Math.min(1, (gestureState.moveX - barOriginXRef.current) / abBarWidth));
        const newVal = ratio * durationMillis;
        
        if (which === 'start') {
          if (loopEndMs !== null && Math.abs(newVal - loopEndMs) <= AB_LOOP_CLEAR_THRESHOLD_MS) {
            setLoopStartMs(null);
            setLoopEndMs(null);
            return;
          }
          setLoopStartMs(newVal);
        } else {
          if (loopStartMs !== null && Math.abs(newVal - loopStartMs) <= AB_LOOP_CLEAR_THRESHOLD_MS) {
            setLoopStartMs(null);
            setLoopEndMs(null);
            return;
          }
          setLoopEndMs(newVal);
        }
      },
    });
  }, [abBarWidth, durationMillis, loopStartMs, loopEndMs]);

  const startHandlePR = useMemo(() => makeHandlePanResponder('start'), [makeHandlePanResponder]);
  const endHandlePR = useMemo(() => makeHandlePanResponder('end'), [makeHandlePanResponder]);

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

  const handleTrimCurrentLoop = useCallback(async () => {
    if (!hasSessionContext || !sessionId || !clipServerId || !session?.access_token) return;
    if (loopStartMs === null || loopEndMs === null) return;
    if (loopEndMs <= loopStartMs) {
      Toast.show({ type: 'error', text1: 'Set a valid A/B range first' });
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/clips/${clipServerId}/trim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          start_ms: Math.round(loopStartMs),
          end_ms: Math.round(loopEndMs),
          section_label: section_label ?? null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as { error?: string }));
        throw new Error(err.error ?? 'Trim failed');
      }
      Toast.show({ type: 'success', text1: 'Trim clip created' });
      router.back();
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: e instanceof Error ? e.message : 'Could not create trim clip',
      });
    }
  }, [
    hasSessionContext,
    sessionId,
    clipServerId,
    session?.access_token,
    loopStartMs,
    loopEndMs,
    section_label,
    router,
  ]);

  if (!hasSessionContext && !hasLibraryClip) {
    return (
      <View style={styles.container}>
        <Text style={styles.placeholderText}>{t('clipPlayer.noClip')}</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (hasSessionContext && !clip) {
    return (
      <View style={styles.container}>
        <Text style={styles.placeholderText}>{t('clipPlayer.noClip')}</Text>
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
            <Text style={styles.placeholderText}>{t('clipPlayer.processing')}</Text>
            <Text style={styles.placeholderLabel}>{clip!.label ?? t('clipPlayer.clipFallback')}</Text>
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
            <View style={StyleSheet.absoluteFill}
              onLayout={(e) => {
                const { width, height } = e.nativeEvent.layout;
                setFrameSize((prev) =>
                  prev.width !== width || prev.height !== height ? { width, height } : prev
                );
              }}>
              {isYouTubeContent && youtubeVideoId ? (
                <WebView
                  ref={webViewRef}
                  source={{ html: CAPTURE_WEBVIEW_HTML.replace(/VIDEO_ID_PLACEHOLDER/g, youtubeVideoId) }}
                  style={StyleSheet.absoluteFill}
                  onMessage={handleYouTubeWebViewMessage}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  allowsInlineMediaPlayback={true}
                  mediaPlaybackRequiresUserAction={false}
                />
              ) : (
                <View style={[StyleSheet.absoluteFill, { transform: [{ scaleX: mirrorActive ? -1 : 1 }] }]}>
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
                </View>
              )}
            {loupeActive && (
              <Animated.View style={[styles.loupeContainer, loupeAnimatedStyle]} pointerEvents="none">
                <View style={styles.loupeMask}>
                  {isYouTubeContent ? (
                    <>
                      {capturedFrameDataUrl ? (
                        <Animated.Image 
                          source={{ uri: capturedFrameDataUrl }} 
                          style={[styles.loupeVideo, loupeVideoAnimatedStyle]} 
                          resizeMode="cover"
                          fadeDuration={0}
                          resizeMethod="resize"
                        />
                      ) : (
                        <Animated.View style={[styles.loupeOverlay, loupeVideoAnimatedStyle]}>
                          <Text style={styles.loupeOverlayText}>{t('clipPlayer.capturingFrame')}</Text>
                        </Animated.View>
                      )}
                    </>
                  ) : (
                    <Video
                      source={{ uri: `https://stream.mux.com/${mux_playback_id}.m3u8` }}
                      style={[styles.loupeVideo, loupeVideoAnimatedStyle]}
                      useNativeControls={false}
                      resizeMode={ResizeMode.COVER}
                      shouldPlay={playing}
                      isMuted
                      ref={loupeVideoRef}
                      onPlaybackStatusUpdate={undefined}
                    />
                  )}
                  {/* Duplicate Video for magnification — no true pixel sampling with expo-av; upgrade to Skia in a future wave if @shopify/react-native-skia is added */}
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

          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.controls}>
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
            {loopStartMs !== null && loopEndMs !== null && abBarWidth > 0 && durationMillis > 0 && (
              <View 
                style={[
                  styles.abLoopRegion,
                  {
                    left: (loopStartMs / durationMillis) * abBarWidth + 12, // SLIDER_INSET
                    width: ((loopEndMs - loopStartMs) / durationMillis) * abBarWidth,
                  }
                ]}
                pointerEvents="none"
              />
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
            
            {/* A/B Loop handles */}
            {loopStartMs !== null && abBarWidth > 0 && durationMillis > 0 && (
              <View
                style={[
                  styles.abLoopHandle,
                  styles.abLoopHandleStart,
                  {
                    left:
                      (loopStartMs / durationMillis) * abBarWidth +
                      12 -
                      AB_LOOP_HANDLE_HALF, // SLIDER_INSET - HANDLE_HALF_WIDTH
                  }
                ]}
                {...startHandlePR.panHandlers}
              />
            )}
            
            {loopEndMs !== null && abBarWidth > 0 && durationMillis > 0 && (
              <View
                style={[
                  styles.abLoopHandle,
                  styles.abLoopHandleEnd,
                  {
                    left:
                      (loopEndMs / durationMillis) * abBarWidth +
                      12 -
                      AB_LOOP_HANDLE_HALF, // SLIDER_INSET - HANDLE_HALF_WIDTH
                  }
                ]}
                {...endHandlePR.panHandlers}
              />
            )}
          </View>
          <View style={styles.controlsRow}>
            <TouchableOpacity onPress={handleSeekBack} style={styles.controlBtn}>
              <Text style={styles.controlBtnText}>{t('clipPlayer.seekBack')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePlayPause}
              style={styles.controlBtn}
            >
              <Text style={styles.controlBtnText}>
                {playing ? t('clipPlayer.pause') : t('clipPlayer.play')}
              </Text>
            </TouchableOpacity>
            <View style={styles.speedRow}>
              <Slider
                minimumValue={0.25}
                maximumValue={2}
                step={0}
                value={rate}
                onValueChange={handleSpeedChange}
                minimumTrackTintColor={theme.accent}
                maximumTrackTintColor={theme.textSecondary}
                thumbTintColor={theme.accent}
                style={styles.speedSlider}
              />
              <Text style={styles.speedLabel}>{rate.toFixed(2)}×</Text>
            </View>
            <TouchableOpacity
              onPress={() => setMirrorActive((v) => !v)}
              style={[styles.controlBtn, mirrorActive && styles.mirrorBtnActive]}
            >
              <Text style={styles.mirrorBtnText}>↔</Text>
            </TouchableOpacity>
            
            {/* A/B Loop controls */}
            <TouchableOpacity 
              onPress={() => setLoopStartMs(positionMillis)} 
              style={styles.controlBtn}
            >
              <Text style={styles.controlBtnText}>{t('clipPlayer.setA')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setLoopEndMs(positionMillis)} 
              style={styles.controlBtn}
            >
              <Text style={styles.controlBtnText}>{t('clipPlayer.setB')}</Text>
            </TouchableOpacity>
          </View>
          
          {/* A/B Loop clear button */}
          {(loopStartMs !== null || loopEndMs !== null) && (
            <View style={styles.abLoopActionRow}>
              {loopStartMs !== null &&
              loopEndMs !== null &&
              hasSessionContext &&
              clipServerId &&
              sessionId ? (
                <TouchableOpacity onPress={handleTrimCurrentLoop} style={styles.abLoopTrimBtn}>
                  <Text style={styles.abLoopTrimBtnText}>{t('clipPlayer.trimToAB')}</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                onPress={() => {
                  setLoopStartMs(null);
                  setLoopEndMs(null);
                }}
                style={styles.abLoopClearBtn}
              >
                <Text style={styles.abLoopClearBtnText}>{t('clipPlayer.clearLoop')}</Text>
              </TouchableOpacity>
            </View>
          )}
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
                    <Text style={styles.tagPillText}>{libraryBpm} {t('clipPlayer.bpmSuffix')}</Text>
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
            {isYouTubeContent && youtubeVideoId ? (
              <WebView
                ref={webViewRef}
                source={{ html: CAPTURE_WEBVIEW_HTML.replace(/VIDEO_ID_PLACEHOLDER/g, youtubeVideoId) }}
                style={StyleSheet.absoluteFill}
                onMessage={handleYouTubeWebViewMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, { transform: [{ scaleX: mirrorActive ? -1 : 1 }] }]}>
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
              </View>
            )}
          {loupeActive && (
            <Animated.View style={[styles.loupeContainer, loupeAnimatedStyle]} pointerEvents="none">
              <View style={styles.loupeMask}>
                {isYouTubeContent ? (
                  <>
                    {capturedFrameDataUrl ? (
                      <Animated.Image 
                        source={{ uri: capturedFrameDataUrl }} 
                        style={[styles.loupeVideo, loupeVideoAnimatedStyle]} 
                        resizeMode="cover"
                        fadeDuration={0}
                        resizeMethod="resize"
                      />
                    ) : (
                      <Animated.View style={[styles.loupeOverlay, loupeVideoAnimatedStyle]}>
                        <Text style={styles.loupeOverlayText}>{t('clipPlayer.capturingFrame')}</Text>
                      </Animated.View>
                    )}
                  </>
                ) : (
                  <Video
                    source={{ uri: `https://stream.mux.com/${clip!.mux_playback_id}.m3u8` }}
                    style={[styles.loupeVideo, loupeVideoAnimatedStyle]}
                    useNativeControls={false}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={playing}
                    isMuted
                    ref={loupeVideoRef}
                    onPlaybackStatusUpdate={undefined}
                  />
                )}
                {/* Duplicate Video for magnification — no true pixel sampling with expo-av; upgrade to Skia in a future wave if @shopify/react-native-skia is added */}
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

        {hasSessionContext && clip ? (
          <View style={styles.reviewHintBar} pointerEvents="none">
            <Text style={styles.reviewHintText}>{t('review.sessionHint')}</Text>
          </View>
        ) : null}

        {feedbackOpen ? (
          <TouchableOpacity
            style={styles.feedbackBadge}
            onPress={handleCloseFeedback}
          >
            <Text style={styles.feedbackBadgeText}>{t('clipPlayer.feedbackOpen')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.requestFeedbackBtn}
            onPress={handleRequestFeedback}
          >
            <Text style={styles.requestFeedbackText}>{t('clipPlayer.requestFeedback')}</Text>
          </TouchableOpacity>
        )}

        {!playing && (
          <TouchableOpacity
            style={styles.annotateBtn}
            onPress={handleAnnotatePress}
          >
            <Text style={styles.annotateBtnText}>{t('clipPlayer.annotate')}</Text>
          </TouchableOpacity>
        )}

        {annotationMode && (
          <View style={styles.annotationToolbar}>
            <TouchableOpacity
              style={[styles.toolBtn, activeTool === 'text' && styles.toolBtnActive]}
              onPress={() => setActiveTool('text')}
            >
              <Text style={styles.toolBtnText}>{t('clipPlayer.toolText')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toolBtn, activeTool === 'arrow' && styles.toolBtnActive]}
              onPress={() => setActiveTool('arrow')}
            >
              <Text style={styles.toolBtnText}>{t('clipPlayer.toolArrow')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toolBtn, activeTool === 'circle' && styles.toolBtnActive]}
              onPress={() => setActiveTool('circle')}
            >
              <Text style={styles.toolBtnText}>{t('clipPlayer.toolCircle')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={handleAnnotationDone}
            >
              <Text style={styles.doneBtnText}>{t('clipPlayer.done')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.controls}>
          <View 
            style={styles.sliderWrap}
            onLayout={(e) => {
              e.currentTarget.measureInWindow((x, _y, width) => {
                barOriginXRef.current = x;
                setAbBarWidth(width - 24); // Subtract 12px margin on each side
              });
            }}
          >
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
            
            {/* A/B Loop region band */}
            {loopStartMs !== null && loopEndMs !== null && abBarWidth > 0 && durationMillis > 0 && (
              <View 
                style={[
                  styles.abLoopRegion,
                  {
                    left: (loopStartMs / durationMillis) * abBarWidth + 12, // SLIDER_INSET
                    width: ((loopEndMs - loopStartMs) / durationMillis) * abBarWidth,
                  }
                ]}
                pointerEvents="none"
              />
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
            
            {/* A/B Loop handles */}
            {loopStartMs !== null && abBarWidth > 0 && durationMillis > 0 && (
              <View
                style={[
                  styles.abLoopHandle,
                  styles.abLoopHandleStart,
                  {
                    left:
                      (loopStartMs / durationMillis) * abBarWidth +
                      12 -
                      AB_LOOP_HANDLE_HALF, // SLIDER_INSET - HANDLE_HALF_WIDTH
                  }
                ]}
                {...startHandlePR.panHandlers}
              />
            )}
            
            {loopEndMs !== null && abBarWidth > 0 && durationMillis > 0 && (
              <View
                style={[
                  styles.abLoopHandle,
                  styles.abLoopHandleEnd,
                  {
                    left:
                      (loopEndMs / durationMillis) * abBarWidth +
                      12 -
                      AB_LOOP_HANDLE_HALF, // SLIDER_INSET - HANDLE_HALF_WIDTH
                  }
                ]}
                {...endHandlePR.panHandlers}
              />
            )}
          </View>
          <View style={styles.controlsRow}>
            <TouchableOpacity onPress={handleSeekBack} style={styles.controlBtn}>
              <Text style={styles.controlBtnText}>{t('clipPlayer.seekBack')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePlayPause} style={styles.controlBtn}>
              <Text style={styles.controlBtnText}>
                {playing ? t('clipPlayer.pause') : t('clipPlayer.play')}
              </Text>
            </TouchableOpacity>
            <View style={styles.speedRow}>
              <Slider
                minimumValue={0.25}
                maximumValue={2}
                step={0}
                value={rate}
                onValueChange={handleSpeedChange}
                minimumTrackTintColor={theme.accent}
                maximumTrackTintColor={theme.textSecondary}
                thumbTintColor={theme.accent}
                style={styles.speedSlider}
              />
              <Text style={styles.speedLabel}>{rate.toFixed(2)}×</Text>
            </View>
            <TouchableOpacity
              onPress={() => setMirrorActive((v) => !v)}
              style={[styles.controlBtn, mirrorActive && styles.mirrorBtnActive]}
            >
              <Text style={styles.mirrorBtnText}>↔</Text>
            </TouchableOpacity>
            
            {/* A/B Loop controls */}
            {!annotationMode && (
              <>
                <TouchableOpacity 
                  onPress={() => setLoopStartMs(positionMillis)} 
                  style={styles.controlBtn}
                >
                  <Text style={styles.controlBtnText}>{t('clipPlayer.setA')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setLoopEndMs(positionMillis)} 
                  style={styles.controlBtn}
                >
                  <Text style={styles.controlBtnText}>{t('clipPlayer.setB')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          
          {/* A/B Loop clear button */}
          {(loopStartMs !== null || loopEndMs !== null) && (
            <View style={styles.abLoopActionRow}>
              {loopStartMs !== null &&
              loopEndMs !== null &&
              hasSessionContext &&
              clipServerId &&
              sessionId ? (
                <TouchableOpacity onPress={handleTrimCurrentLoop} style={styles.abLoopTrimBtn}>
                  <Text style={styles.abLoopTrimBtnText}>{t('clipPlayer.trimToAB')}</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                onPress={() => {
                  setLoopStartMs(null);
                  setLoopEndMs(null);
                }}
                style={styles.abLoopClearBtn}
              >
                <Text style={styles.abLoopClearBtnText}>{t('clipPlayer.clearLoop')}</Text>
              </TouchableOpacity>
            </View>
          )}
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
                  <Text style={styles.tagPillText}>{displayClip!.bpm} {t('clipPlayer.bpmSuffix')}</Text>
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
              <Text style={styles.addTagsText}>{t('clipPlayer.addTags')}</Text>
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
  reviewHintBar: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 72,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 8,
  },
  reviewHintText: {
    color: '#ffffff',
    fontSize: 12,
    lineHeight: 16,
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
    alignItems: 'center',
    gap: 24,
    marginTop: 8,
  },
  controlBtn: {
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlBtnText: {
    color: theme.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  mirrorBtnActive: {
    backgroundColor: theme.light.mine,
    borderRadius: theme.borderRadius,
  },
  mirrorBtnText: {
    color: theme.light.active,
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
  loupeOverlay: {
    width: 140,
    height: 140,
    backgroundColor: 'rgba(125,185,168,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loupeOverlayText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
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
  speedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  speedSlider: {
    flex: 1,
    height: 40,
  },
  speedLabel: {
    color: theme.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  // A/B Loop styles
  abLoopRegion: {
    position: 'absolute',
    top: 16,
    height: 4,
    backgroundColor: theme.light.mine + '4D', // ~30% opacity
    borderRadius: 2,
    pointerEvents: 'none',
  },
  abLoopHandle: {
    position: 'absolute',
    top: -2,
    width: AB_LOOP_HANDLE_TOUCH_SIZE,
    height: AB_LOOP_HANDLE_TOUCH_SIZE,
    borderRadius: AB_LOOP_HANDLE_HALF,
    backgroundColor: theme.light.amber,
    zIndex: 5,
  },
  abLoopHandleStart: {
    // Start handle specific styles if needed
  },
  abLoopHandleEnd: {
    // End handle specific styles if needed
  },
  abLoopActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  abLoopTrimBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.light.mine,
    backgroundColor: theme.light.mineBg,
  },
  abLoopTrimBtnText: {
    color: theme.light.mine,
    fontSize: 12,
    fontWeight: '600',
  },
  abLoopClearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  abLoopClearBtnText: {
    color: theme.light.amber,
    fontSize: 12,
    fontWeight: '600',
  },
});
