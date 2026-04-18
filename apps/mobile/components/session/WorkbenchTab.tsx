import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { apiRequest, ApiRequestError } from '../../lib/api';
import { theme } from '../../lib/theme';
import { useTheme, type ThemePalette } from '../../lib/contexts/ThemeContext';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { useSession } from '../../lib/hooks/useSession';
import { useDrillSequence } from '../../lib/hooks/useDrillSequence';
import { VoiceNoteRow } from './VoiceNoteRow';
import { useTranslation } from '../../lib/i18n';
import type { DrillSequenceItem } from '@roam/types';

const spacing = theme.spacing;

// Visible timeline span when no audio is loaded (75 s)
const FALLBACK_DURATION_MS = 75_000;
const WAVEFORM_BAR_COUNT = 80;
const WAVEFORM_BAR_GAP = 2;
const WAVEFORM_HORIZONTAL_PADDING = 16;

function formatTimecode(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, '0');
  return `${m}:${ss}`;
}

function isReferenceClip(clip: {
  label?: string | null;
  move_name?: string | null;
  notes?: string | null;
  clip_type?: 'MINE' | 'REF' | 'voice_memo' | null;
}): boolean {
  // First check explicit clip_type
  if (clip.clip_type === 'REF') return true;
  if (clip.clip_type === 'voice_memo') return false;
  
  // Fall back to text heuristics for legacy data
  const haystack = `${clip.label ?? ''} ${clip.move_name ?? ''} ${clip.notes ?? ''}`.toLowerCase();
  return haystack.includes('ref') || haystack.includes('reference');
}

export function WorkbenchTab() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createWorkbenchStyles(colors), [colors]);
  const router = useRouter();
  const { session } = useSession();
  const {
    sessionId,
    activeSection,
    activeMoment,
    jumpToSongMap,
    setActiveSection,
    playheadMs,
    durationMs,
    musicUrl,
    loopRegion,
    setLoopRegion,
    setLoopOpenAt,
    clips,
    musicTrack,
    isAnalysing,
    notes,
    createNote,
    deleteNote,
    inboxCount,
    sectionClips,
    retryClip,
    soundRef,
    handlePlayPause,
    handleSeekBack,
    handleSeekForward,
    handleLoopToggle,
    activeSheetId,
    openSheet,
    closeSheet,
    selectedClipForSheet,
    setSelectedClipForSheet,
    openClipSheet,
    refreshCount,
    sessionMode,
    setSessionMode,
  } = useSessionContext();

  // ── Session metadata ─────────────────────────────────────────────────────
  const [showSectionSwipeHint, setShowSectionSwipeHint] = useState(true);
  const [workspaceTab, setWorkspaceTab] = useState<'ideas' | 'notes'>('ideas');
  const { height: windowHeight } = useWindowDimensions();
  const waveformWidth = useRef(0);
  const [waveformWidthPx, setWaveformWidthPx] = useState(0);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragCurrentX, setDragCurrentX] = useState<number | null>(null);
  const dragStartXRef = useRef<number | null>(null);
  const dragCurrentXRef = useRef<number | null>(null);
  const [notePinTimecodeMs, setNotePinTimecodeMs] = useState<number | null>(null);
  const [activeVoiceNoteId, setActiveVoiceNoteId] = useState<string | null>(null);
  const [drillActiveIndex, setDrillActiveIndex] = useState<number | null>(null);
  const [drillPlayMode, setDrillPlayMode] = useState(false);
  const [drillExpanded, setDrillExpanded] = useState(false);
  const [musicInfoMode, setMusicInfoMode] = useState<'counts' | 'partition' | 'lyrics'>('counts');
  const [lyricsQuery, setLyricsQuery] = useState('');
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsError, setLyricsError] = useState<string | null>(null);
  const [lyricsResult, setLyricsResult] = useState<{
    artist: string;
    title: string;
    lyrics: string;
  } | null>(null);
  const [isStalled, setIsStalled] = useState(false);
  const [stallResetKey, setStallResetKey] = useState(0);
  const analysisLabelOpacity = useRef(new Animated.Value(1)).current;

  const {
    drillSequence,
    drillLoading,
    replaceDrillSequence,
    appendDrillSequenceItem,
  } = useDrillSequence({ sessionId, accessToken: session?.access_token });

  const handleVoiceNotePlaybackEnded = useCallback((noteId: string) => {
    setActiveVoiceNoteId((current) => (current === noteId ? null : current));
  }, []);

  const handleMusicSetupRemoved = useCallback(() => {
    router.push({
      pathname: './music-setup',
      params: { sessionId },
    });
  }, [router, sessionId]);

  // ── Derived values ───────────────────────────────────────────────────────
  const timelineDurationMs = durationMs > 0 ? durationMs : FALLBACK_DURATION_MS;
  const waveformBars = useMemo(
    () =>
      Array.from({ length: WAVEFORM_BAR_COUNT }, (_v, i) => ({
        index: i,
        height: 20 + Math.abs(Math.sin(i * 0.4 + i * 0.07) * 40),
      })),
    []
  );
  const waveformBarWidth = useMemo(() => {
    if (waveformWidthPx <= 0) return 0;
    return Math.max(
      0.5,
      (waveformWidthPx - WAVEFORM_BAR_GAP * (WAVEFORM_BAR_COUNT - 1)) /
        WAVEFORM_BAR_COUNT
    );
  }, [waveformWidthPx]);
  const waveformContentWidth = useMemo(
    () =>
      waveformBarWidth > 0
        ? waveformBarWidth * WAVEFORM_BAR_COUNT +
          WAVEFORM_BAR_GAP * (WAVEFORM_BAR_COUNT - 1)
        : 0,
    [waveformBarWidth]
  );
  const playheadBarIndex = Math.floor((playheadMs / timelineDurationMs) * WAVEFORM_BAR_COUNT);
  const playheadX = Math.max(
    0,
    Math.min(
      waveformContentWidth,
      (Math.max(0, Math.min(playheadBarIndex, WAVEFORM_BAR_COUNT)) / WAVEFORM_BAR_COUNT) *
        waveformContentWidth
    )
  );
  const loopStartX =
    loopRegion && timelineDurationMs > 0
      ? (loopRegion.start / timelineDurationMs) * waveformContentWidth
      : 0;
  const loopEndX =
    loopRegion && timelineDurationMs > 0
      ? (loopRegion.end / timelineDurationMs) * waveformContentWidth
      : 0;
  const timelineClipPositions = useMemo(() => {
    if (clips.length === 0 || waveformContentWidth <= 0) return [];
    if (clips.length === 1) return [{ clip: clips[0], x: waveformContentWidth / 2 }];
    return clips.map((clip, index) => ({
      clip,
      x: (index / (clips.length - 1)) * waveformContentWidth,
    }));
  }, [clips, waveformContentWidth]);

  // ── Effects ───────────────────────────────────────────────────────────
  useEffect(() => {
    refreshCount().catch(() => {});
  }, [refreshCount]);

  useEffect(() => {
    const sections = musicTrack?.sections ?? [];
    if (!sections.length) return;
    if (!sections.some((section) => section.label === activeSection)) {
      setActiveSection(sections[0].label);
    }
  }, [musicTrack?.sections, activeSection, setActiveSection]);

  useEffect(() => {
    if (workspaceTab !== 'notes') {
      setActiveVoiceNoteId(null);
    }
  }, [workspaceTab]);

  useEffect(() => {
    if (!drillPlayMode || drillActiveIndex === null || drillSequence.length === 0) return;
    const active = drillSequence[drillActiveIndex];
    if (!active) return;
    if (playheadMs < active.end_ms - 80) return;
    const nextIndex = drillActiveIndex + 1;
    if (nextIndex >= drillSequence.length) {
      setDrillPlayMode(false);
      setDrillActiveIndex(null);
      setLoopRegion(null);
      return;
    }
    const next = drillSequence[nextIndex];
    setDrillActiveIndex(nextIndex);
    setLoopRegion({ start: next.start_ms, end: next.end_ms });
    soundRef.current?.setPositionAsync(next.start_ms).catch(() => {});
  }, [drillPlayMode, drillActiveIndex, drillSequence, playheadMs, setLoopRegion, soundRef]);

  useEffect(() => {
    if (!isAnalysing) {
      setIsStalled(false);
      return;
    }
    setIsStalled(false);
    const id = setTimeout(() => setIsStalled(true), 30_000);
    return () => clearTimeout(id);
  }, [isAnalysing, stallResetKey]);

  useEffect(() => {
    if (!isAnalysing || isStalled) {
      analysisLabelOpacity.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(analysisLabelOpacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(analysisLabelOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isAnalysing, isStalled, analysisLabelOpacity]);

  const handleRetryAnalysis = useCallback(async () => {
    if (
      !sessionId ||
      !session?.access_token ||
      musicTrack?.source_type !== 'youtube' ||
      !musicTrack?.source_url
    ) {
      return;
    }
    try {
      const res = await apiRequest(`/sessions/${sessionId}/music`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ youtube_url: musicTrack.source_url }),
        timeoutMs: 12_000,
        retries: 2,
      });
      if (res.ok) {
        setStallResetKey((k) => k + 1);
      } else {
        Toast.show({
          type: 'error',
          text1: t('workbench.analysisRetryFailed'),
        });
      }
    } catch {
      Toast.show({
        type: 'error',
        text1: t('workbench.analysisRetryFailed'),
      });
    }
  }, [sessionId, session?.access_token, musicTrack?.source_type, musicTrack?.source_url, t]);

  const handleFetchLyrics = useCallback(async () => {
    if (!sessionId || !session?.access_token) return;
    const query = lyricsQuery.trim();
    if (!query) {
      setLyricsError(t('workbench.lyricsNeedQuery'));
      return;
    }
    setLyricsLoading(true);
    setLyricsError(null);
    try {
      const res = await apiRequest(
        `/sessions/${sessionId}/music/lyrics?query=${encodeURIComponent(query)}`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
          retries: 1,
          timeoutMs: 8_000,
          shouldRetry: ({ error }) => error.reason !== 'http',
        }
      );
      const data = (await res.json()) as {
        artist?: string;
        title?: string;
        lyrics?: string;
        error?: string;
      };
      if (!res.ok) {
        setLyricsResult(null);
        setLyricsError(data.error ?? t('workbench.lyricsLookupFailed'));
        return;
      }
      if (!data.lyrics || !data.artist || !data.title) {
        setLyricsResult(null);
        setLyricsError(t('workbench.lyricsNotFound'));
        return;
      }
      setLyricsResult({
        artist: data.artist,
        title: data.title,
        lyrics: data.lyrics,
      });
    } catch (error) {
      setLyricsResult(null);
      if (error instanceof ApiRequestError && error.reason === 'timeout') {
        setLyricsError(t('workbench.lyricsLookupTimeout'));
      } else {
        setLyricsError(t('workbench.lyricsLookupFailed'));
      }
    } finally {
      setLyricsLoading(false);
    }
  }, [lyricsQuery, sessionId, session?.access_token, t]);

  const handleAddCurrentLoopToDrill = useCallback(async () => {
    if (!loopRegion || !session?.access_token || !sessionId) return;
    const nextItem: DrillSequenceItem = {
      id: `drill-${Date.now()}`,
      label: `${activeSection} ${formatTimecode(loopRegion.start)}-${formatTimecode(loopRegion.end)}`,
      start_ms: Math.round(loopRegion.start),
      end_ms: Math.round(loopRegion.end),
    };
    await appendDrillSequenceItem(nextItem);
  }, [loopRegion, session?.access_token, sessionId, activeSection, appendDrillSequenceItem]);

  const handleRemoveDrillItem = useCallback(async (id: string) => {
    const nextItems = drillSequence.filter((item) => item.id !== id);
    const ok = await replaceDrillSequence(nextItems);
    if (!ok) return;
    setDrillActiveIndex((curr) => (curr !== null && curr >= nextItems.length ? null : curr));
  }, [drillSequence, replaceDrillSequence]);

  const handleMoveDrillItem = useCallback(async (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= drillSequence.length) return;
    const reordered = [...drillSequence];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(nextIndex, 0, moved);
    const ok = await replaceDrillSequence(reordered);
    if (!ok) return;
  }, [drillSequence, replaceDrillSequence]);

  const handleToggleDrillPlayMode = useCallback(() => {
    if (drillSequence.length === 0) return;
    if (drillPlayMode) {
      setDrillPlayMode(false);
      setDrillActiveIndex(null);
      setLoopRegion(null);
      return;
    }
    const first = drillSequence[0];
    setDrillPlayMode(true);
    setDrillActiveIndex(0);
    setLoopRegion({ start: first.start_ms, end: first.end_ms });
    soundRef.current?.setPositionAsync(first.start_ms).catch(() => {});
  }, [drillSequence, drillPlayMode, setLoopRegion, soundRef]);

  // ── Section chip handler ─────────────────────────────────────────────────
  const handleSectionPress = useCallback(
    async (section: { label: string; start_ms: number }) => {
      setActiveSection(section.label);
      const sound = soundRef.current;
      if (sound) {
        try {
          await sound.setPositionAsync(section.start_ms);
        } catch {
          // ignore seek failure
        }
      }
    },
    [setActiveSection, soundRef]
  );

  const handleSectionSwipe = useCallback(
    (direction: 'next' | 'prev') => {
      const sections = musicTrack?.sections ?? [];
      if (sections.length < 2) return;
      const currIdx = sections.findIndex((s) => s.label === activeSection);
      if (currIdx < 0) return;
      const delta = direction === 'next' ? 1 : -1;
      const nextIdx = (currIdx + delta + sections.length) % sections.length;
      handleSectionPress(sections[nextIdx]);
      setShowSectionSwipeHint(false);
    },
    [musicTrack?.sections, activeSection, handleSectionPress]
  );

  const sectionPillListMaxHeight = useMemo(
    () => Math.max(200, Math.round(windowHeight * 0.4)),
    [windowHeight]
  );

  const sectionSwipePan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gestureState) =>
          Math.abs(gestureState.dx) > 12 && Math.abs(gestureState.dy) < 18,
        onPanResponderRelease: (_evt, gestureState) => {
          if (gestureState.dx < -35) {
            handleSectionSwipe('next');
          } else if (gestureState.dx > 35) {
            handleSectionSwipe('prev');
          }
        },
      }),
    [handleSectionSwipe]
  );

  const waveformDragPan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const x = evt.nativeEvent.locationX;
          dragStartXRef.current = x;
          dragCurrentXRef.current = x;
          setDragStartX(x);
          setDragCurrentX(x);
        },
        onPanResponderMove: (evt) => {
          const x = evt.nativeEvent.locationX;
          dragCurrentXRef.current = x;
          setDragCurrentX(x);
        },
        onPanResponderRelease: (evt) => {
          const releaseX = evt.nativeEvent.locationX;
          if (Number.isFinite(releaseX)) {
            dragCurrentXRef.current = releaseX;
            setDragCurrentX(releaseX);
          }
          const startX = dragStartXRef.current;
          const currentX = dragCurrentXRef.current;
          if (
            startX === null ||
            currentX === null ||
            waveformWidthPx <= 0 ||
            timelineDurationMs <= 0
          ) {
            dragStartXRef.current = null;
            dragCurrentXRef.current = null;
            setDragStartX(null);
            setDragCurrentX(null);
            return;
          }

          const distance = Math.abs(currentX - startX);
          const threshold = waveformWidthPx * 0.1;

          if (distance < threshold) {
            const fraction = Math.max(0, Math.min(1, startX / waveformWidthPx));
            const targetMs = fraction * timelineDurationMs;
            setNotePinTimecodeMs(targetMs);
            soundRef.current?.setPositionAsync(targetMs).catch(() => {});
            dragStartXRef.current = null;
            dragCurrentXRef.current = null;
            setDragStartX(null);
            setDragCurrentX(null);
            return;
          }

          const startFrac = Math.max(
            0,
            Math.min(1, Math.min(startX, currentX) / waveformWidthPx)
          );
          const endFrac = Math.max(
            0,
            Math.min(1, Math.max(startX, currentX) / waveformWidthPx)
          );
          setLoopRegion({
            start: startFrac * timelineDurationMs,
            end: endFrac * timelineDurationMs,
          });
          setLoopOpenAt(null);
          dragStartXRef.current = null;
          dragCurrentXRef.current = null;
          setDragStartX(null);
          setDragCurrentX(null);
        },
        onPanResponderTerminate: () => {
          dragStartXRef.current = null;
          dragCurrentXRef.current = null;
          setDragStartX(null);
          setDragCurrentX(null);
        },
      }),
    [
      waveformWidthPx,
      timelineDurationMs,
      setLoopRegion,
      setLoopOpenAt,
      soundRef,
    ]
  );

  // ── Note handlers ────────────────────────────────────────────────────────
  const handleOpenNotePin = useCallback(
    (timecodeMs: number = playheadMs) => {
      setNotePinTimecodeMs(timecodeMs);
      openSheet('note-pin');
    },
    [playheadMs, openSheet]
  );

  const handleDeleteNote = useCallback(async (noteId: string) => {
    if (activeVoiceNoteId === noteId) {
      setActiveVoiceNoteId(null);
    }
    const ok = await deleteNote(noteId);
    if (ok) Toast.show({ type: 'success', text1: t('workbench.noteDeleted') });
  }, [activeVoiceNoteId, deleteNote]);

  // ── Clip filtering by active section ────────────────────────────────────
  const hasActiveMusicSection = useMemo(
    () => musicTrack?.sections?.some((s) => s.label === activeSection) ?? false,
    [musicTrack?.sections, activeSection]
  );

  const displayClips = useMemo(() => {
    if (!hasActiveMusicSection || sectionClips.length === 0) return clips;
    const sectionIds = new Set(
      sectionClips
        .filter((sc) => sc.section_label === activeSection)
        .map((sc) => sc.clip_id)
    );
    return clips.filter((c) => !c.server_id || sectionIds.has(c.server_id));
  }, [clips, sectionClips, activeSection, hasActiveMusicSection]);

  const sectionClipCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const sc of sectionClips) {
      counts.set(sc.section_label, (counts.get(sc.section_label) ?? 0) + 1);
    }
    return counts;
  }, [sectionClips]);

  const isFullyEmpty = sectionClips.length === 0 && musicTrack === null;

  return (
    <Pressable
      style={styles.container}
      onPress={!sessionMode ? () => setSessionMode(true) : undefined}
    >
      {!isFullyEmpty && (
        <>
        {musicTrack ? (
          <View
            style={styles.waveformContainer}
            onLayout={(event) => {
              const measuredWidth = Math.max(
                0,
                event.nativeEvent.layout.width - WAVEFORM_HORIZONTAL_PADDING * 2
              );
              waveformWidth.current = measuredWidth;
              setWaveformWidthPx(measuredWidth);
            }}
          >
            <ScrollView
              horizontal={true}
              style={styles.timelineScrollView}
              contentContainerStyle={styles.timelineScrollContent}
              showsHorizontalScrollIndicator={false}
              scrollEnabled={waveformContentWidth > 0}
            >
              <View
                style={[
                  styles.timelineScrollContent,
                  { width: waveformContentWidth + WAVEFORM_HORIZONTAL_PADDING * 2 },
                ]}
              >
                <View style={styles.waveformTrack}>
                  {isAnalysing ? (
                    <View style={styles.analysisIndicatorContainer}>
                      {isStalled ? (
                        musicTrack?.source_type === 'youtube' && musicTrack?.source_url ? (
                          <TouchableOpacity
                            onPress={handleRetryAnalysis}
                            activeOpacity={0.75}
                            style={styles.analysisRetryTouchable}
                          >
                            <Text style={styles.analysisRetryText}>
                              {t('workbench.analysisStalledRetry')}
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={styles.analysisIndicatorText}>
                            {t('workbench.analysisStalledNoRetry')}
                          </Text>
                        )
                      ) : (
                        <View style={styles.analysisIndicatorRow}>
                          <ActivityIndicator color={colors.muted} />
                          <Animated.Text
                            style={[
                              styles.analysisIndicatorText,
                              { opacity: analysisLabelOpacity },
                            ]}
                          >
                            {t('workbench.analysing')}
                          </Animated.Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <>
                      <View
                        style={styles.waveformTapArea}
                        {...waveformDragPan.panHandlers}
                      >
                        <View style={[styles.waveformBarsRow, { width: waveformContentWidth }]}>
                          {waveformBars.map((bar) => {
                            const barFraction = bar.index / WAVEFORM_BAR_COUNT;
                            const isActive = loopRegion
                              ? barFraction >= loopRegion.start / timelineDurationMs &&
                                barFraction <= loopRegion.end / timelineDurationMs
                              : false;
                            return (
                              <View
                                key={bar.index}
                                style={[
                                  styles.waveformBar,
                                  {
                                    width: waveformBarWidth,
                                    height: bar.height,
                                    backgroundColor: isActive ? 'rgba(125,185,168,0.6)' : '#e8e3dc',
                                  },
                                ]}
                              />
                            );
                          })}
                        </View>
                        {dragStartX !== null && dragCurrentX !== null ? (
                          <View
                            style={[
                              styles.waveformDragBand,
                              {
                                left: Math.min(dragStartX, dragCurrentX),
                                width: Math.abs(dragCurrentX - dragStartX),
                                backgroundColor: 'rgba(232, 168, 124, 0.30)',
                              },
                            ]}
                          />
                        ) : null}
                      </View>
                      {loopRegion ? (
                        <>
                          <View
                            style={[
                              styles.waveformLoopEdge,
                              { left: WAVEFORM_HORIZONTAL_PADDING + loopStartX },
                            ]}
                          />
                          <View
                            style={[
                              styles.waveformLoopEdge,
                              { left: WAVEFORM_HORIZONTAL_PADDING + loopEndX },
                            ]}
                          />
                        </>
                      ) : null}
                      <View
                        style={[
                          styles.waveformPlayhead,
                          { left: WAVEFORM_HORIZONTAL_PADDING + playheadX },
                        ]}
                      >
                        <View style={styles.waveformPlayheadDot} />
                      </View>
                    </>
                  )}
                </View>
                <View style={[styles.loopRegionsRow, { width: waveformContentWidth }]}>
                  {loopRegion ? (
                    <View
                      style={[
                        styles.loopRegionBand,
                        {
                          left: loopStartX,
                          width: Math.max(0, loopEndX - loopStartX),
                        },
                      ]}
                    />
                  ) : null}
                </View>
                <View style={[styles.notePinsRow, { width: waveformContentWidth }]}>
                  {waveformContentWidth > 0 && timelineDurationMs > 0
                    ? notes.map((note) => {
                        const pinX = (note.timecode_ms / timelineDurationMs) * waveformContentWidth;
                        return (
                          <TouchableOpacity
                            key={note.id}
                            style={[styles.notePinTouchable, { left: pinX - 3 }]}
                            onPress={() => {
                              soundRef.current?.setPositionAsync(note.timecode_ms).catch(() => {});
                            }}
                            activeOpacity={0.75}
                          >
                            <View style={styles.notePinDot} />
                          </TouchableOpacity>
                        );
                      })
                    : null}
                </View>
                <View style={[styles.clipsRow, { width: waveformContentWidth }]}>
                  {waveformContentWidth > 0
                    ? timelineClipPositions.map(({ clip, x }) => {
                        const clipLabel =
                          clip.clip_type === 'REF'
                            ? 'R'
                            : clip.clip_type === 'voice_memo'
                              ? 'V'
                              : 'M';
                        const clipColor =
                          clip.clip_type === 'REF'
                            ? colors.warm
                            : clip.clip_type === 'voice_memo'
                              ? colors.capture
                              : colors.mine;
                        return (
                          <TouchableOpacity
                            key={clip.local_id}
                            style={[styles.clipChip, { left: x, backgroundColor: clipColor }]}
                            onPress={() => openClipSheet(clip)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.clipChipText}>{clipLabel}</Text>
                          </TouchableOpacity>
                        );
                      })
                    : null}
                </View>
              </View>
            </ScrollView>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addMusicPrompt}
            activeOpacity={0.8}
            onPress={handleMusicSetupRemoved}
          >
            <Text style={styles.addMusicPromptText}>{t('workbench.addMusic')}</Text>
          </TouchableOpacity>
        )}

        {musicTrack && loopRegion && !sessionMode && sessionId ? (
          <View style={styles.microCycleRow}>
            <Text style={styles.microCycleRowText}>{t('microCycle.loopReady')}</Text>
            <TouchableOpacity
              style={styles.microCycleRowBtn}
              onPress={() =>
                router.push({
                  pathname: './camera',
                  params: { id: sessionId, sectionName: activeSection },
                })
              }
              activeOpacity={0.8}
            >
              <Text style={styles.microCycleRowBtnText}>{t('microCycle.record')}</Text>
            </TouchableOpacity>
            <Text style={styles.microCycleRowHint}>{t('microCycle.thenTag')}</Text>
          </View>
        ) : null}

        {sessionMode && (
          <TouchableOpacity
            style={styles.sessionModeRow}
            onPress={() => setSessionMode(false)}
            activeOpacity={0.75}
          >
            <Text style={styles.sessionModeRowLabel}>{activeSection}</Text>
            <Text style={styles.sessionModeRowCount}>
              {sectionClipCounts.get(activeSection) ?? 0}
            </Text>
          </TouchableOpacity>
        )}

        {!sessionMode && (
          <View style={styles.drillCard}>
            <View style={styles.drillHeader}>
              <TouchableOpacity
                style={styles.drillTitleToggle}
                onPress={() => setDrillExpanded((prev) => !prev)}
                activeOpacity={0.75}
              >
                <Text style={styles.drillChevron}>{drillExpanded ? '▼' : '▶'}</Text>
                <Text style={styles.drillTitle}>{t('workbench.drillTitle')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.drillPlayBtn, drillPlayMode && styles.drillPlayBtnActive]}
                onPress={handleToggleDrillPlayMode}
              >
                <Text style={[styles.drillPlayBtnText, drillPlayMode && styles.drillPlayBtnTextActive]}>
                  {drillPlayMode ? t('workbench.drillStop') : t('workbench.drillPlay')}
                </Text>
              </TouchableOpacity>
            </View>
            {drillExpanded && (
              <>
                <TouchableOpacity
                  style={[styles.drillAddBtn, !loopRegion && styles.drillAddBtnDisabled]}
                  disabled={!loopRegion}
                  onPress={handleAddCurrentLoopToDrill}
                >
                  <Text style={styles.drillAddBtnText}>{t('workbench.drillAddLoop')}</Text>
                </TouchableOpacity>
                {drillLoading ? (
                  <Text style={styles.drillHintText}>{t('workbench.drillLoading')}</Text>
                ) : drillSequence.length === 0 ? (
                  <Text style={styles.drillHintText}>{t('workbench.drillEmpty')}</Text>
                ) : (
                  drillSequence.map((item, index) => (
                    <View
                      key={item.id}
                      style={[styles.drillItemRow, drillActiveIndex === index && styles.drillItemRowActive]}
                    >
                      <View style={styles.drillItemTextWrap}>
                        <Text style={styles.drillItemLabel}>{item.label}</Text>
                        <Text style={styles.drillItemRange}>
                          {formatTimecode(item.start_ms)} - {formatTimecode(item.end_ms)}
                        </Text>
                      </View>
                      <View style={styles.drillItemActions}>
                        <TouchableOpacity onPress={() => handleMoveDrillItem(index, -1)}>
                          <Text style={styles.drillActionText}>↑</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleMoveDrillItem(index, 1)}>
                          <Text style={styles.drillActionText}>↓</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleRemoveDrillItem(item.id)}>
                          <Text style={styles.drillActionText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </>
            )}
          </View>
        )}

        {!sessionMode && (
          <>
            {musicTrack ? (
              <>
                <View style={styles.toggleRow}>
                  <TouchableOpacity
                    style={[styles.toggleChip, musicInfoMode === 'counts' && styles.toggleChipActive]}
                    onPress={() => setMusicInfoMode('counts')}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.toggleChipText,
                        musicInfoMode === 'counts' && styles.toggleChipTextActive,
                      ]}
                    >
                      {t('workbench.counts')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggleChip, musicInfoMode === 'partition' && styles.toggleChipActive]}
                    onPress={() => setMusicInfoMode('partition')}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.toggleChipText,
                        musicInfoMode === 'partition' && styles.toggleChipTextActive,
                      ]}
                    >
                      {t('workbench.partition')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggleChip, musicInfoMode === 'lyrics' && styles.toggleChipActive]}
                    onPress={() => setMusicInfoMode('lyrics')}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.toggleChipText,
                        musicInfoMode === 'lyrics' && styles.toggleChipTextActive,
                      ]}
                    >
                      {t('workbench.lyrics')}
                    </Text>
                  </TouchableOpacity>
                </View>
                {musicInfoMode === 'partition' ? (
                  <Text style={styles.partitionHint}>{t('workbench.partitionHint')}</Text>
                ) : null}
                {musicInfoMode === 'lyrics' ? (
                  <View style={styles.lyricsPanel}>
                    <Text style={styles.lyricsHint}>{t('workbench.lyricsHint')}</Text>
                    <View style={styles.lyricsSearchRow}>
                      <TextInput
                        style={styles.lyricsInput}
                        placeholder={t('workbench.lyricsPlaceholder')}
                        placeholderTextColor={colors.muted}
                        value={lyricsQuery}
                        onChangeText={setLyricsQuery}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <TouchableOpacity
                        style={styles.lyricsSearchBtn}
                        onPress={handleFetchLyrics}
                        disabled={lyricsLoading}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.lyricsSearchBtnText}>
                          {lyricsLoading ? t('workbench.loadingLyrics') : t('workbench.findLyrics')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {lyricsError ? <Text style={styles.lyricsErrorText}>{lyricsError}</Text> : null}
                    {lyricsResult ? (
                      <View style={styles.lyricsResultWrap}>
                        <Text style={styles.lyricsResultTitle}>
                          {lyricsResult.artist} - {lyricsResult.title}
                        </Text>
                        <ScrollView style={styles.lyricsScroll} nestedScrollEnabled={true}>
                          <Text style={styles.lyricsBody}>{lyricsResult.lyrics}</Text>
                        </ScrollView>
                      </View>
                    ) : !lyricsLoading && !lyricsError ? (
                      <Text style={styles.lyricsEmpty}>{t('workbench.noLyricsYet')}</Text>
                    ) : null}
                  </View>
                ) : null}
              </>
            ) : null}
          </>
        )}

        <View style={styles.sectionStripWrapper}>
          {/* Section pill zone — absorbs touches to prevent bubbling */}
          {musicTrack?.sections && musicTrack.sections.length > 0 && !sessionMode ? (
            <View style={styles.sectionPillZone} onStartShouldSetResponder={() => true}>
              <View style={styles.sectionPillListWrap}>
                <ScrollView
                  style={[styles.sectionPillList, { maxHeight: sectionPillListMaxHeight }]}
                  contentContainerStyle={styles.sectionPillListContent}
                  showsVerticalScrollIndicator={false}
                >
                  {musicTrack.sections.map((s) => {
                    const pillContent = (
                      <>
                        <Text
                          style={[
                            styles.sectionPillText,
                            s.label === activeSection && styles.sectionPillTextActive,
                          ]}
                        >
                          {s.label}
                        </Text>
                        <Text style={styles.sectionPillCount}>
                          {sectionClipCounts.get(s.label) ?? 0}
                        </Text>
                      </>
                    );

                    return (
                      <TouchableOpacity
                        key={s.label}
                        style={[
                          styles.sectionPill,
                          s.label === activeSection && styles.sectionPillActive,
                        ]}
                        onPress={() => handleSectionPress(s)}
                        activeOpacity={0.75}
                      >
                        {pillContent}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
              {showSectionSwipeHint ? (
                <Text style={styles.sectionSwipeHint}>{t('workbench.sectionSwipeHint')}</Text>
              ) : null}
            </View>
          ) : null}

          {/* Workspace zone — allows touches to bubble to outer Pressable */}
          {!sessionMode && (
            <View style={styles.workspaceZone}>
              <View style={styles.workspaceHeader}>
                <View {...sectionSwipePan.panHandlers} style={styles.workspaceSectionGesture}>
                  <Text style={styles.workspaceTitle}>{activeSection}</Text>
                </View>
                <Text style={styles.workspaceMeta}>{formatTimecode(playheadMs)} · …</Text>
                <TouchableOpacity
                  style={styles.mapJumpBtn}
                  onPress={jumpToSongMap}
                  testID={`map-jump-${activeMoment}`}
                  activeOpacity={0.8}
                >
                  <Text style={styles.mapJumpBtnText}>{t('workbench.mapJump')}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.workspaceTabs}>
                <TouchableOpacity
                  style={[
                    styles.workspaceTab,
                    workspaceTab === 'ideas' && styles.workspaceTabActive,
                  ]}
                  onPress={() => setWorkspaceTab('ideas')}
                >
                  <Text
                    style={[
                      styles.workspaceTabText,
                      workspaceTab === 'ideas' && styles.workspaceTabTextActive,
                    ]}
                  >
                    {t('workbench.tabIdeas')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.workspaceTab,
                    workspaceTab === 'notes' && styles.workspaceTabActive,
                  ]}
                  onPress={() => setWorkspaceTab('notes')}
                >
                  <Text
                    style={[
                      styles.workspaceTabText,
                      workspaceTab === 'notes' && styles.workspaceTabTextActive,
                    ]}
                  >
                    {t('workbench.tabNotes')}
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.pinNoteBtn}
                onPress={() => handleOpenNotePin(playheadMs)}
                activeOpacity={0.85}
              >
                <Text style={styles.pinNoteBtnText}>
                  {t('workbench.pinNote')}
                  {formatTimecode(notePinTimecodeMs ?? playheadMs)}
                </Text>
              </TouchableOpacity>

              {workspaceTab === 'ideas' ? (
                <FlatList
                  data={displayClips}
                  keyExtractor={(c) => c.local_id}
                  numColumns={2}
                  columnWrapperStyle={{ gap: 10 }}
                  contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 40 }}
                  renderItem={({ item }) => (
                    <View style={styles.clipCell}>
                      <TouchableOpacity
                        style={[
                          styles.clipThumb,
                          item.clip_type === 'voice_memo'
                            ? styles.clipThumbVoiceMemo
                            : isReferenceClip(item)
                              ? styles.clipThumbRef
                              : styles.clipThumbMine,
                        ]}
                        onPress={() => openClipSheet(item)}
                        activeOpacity={0.85}
                      >
                        {item.clip_type === 'voice_memo' ? (
                          <View style={styles.voiceMemoIndicator}>
                            <Text style={styles.voiceMemoIcon}>🎤</Text>
                            <Text style={styles.voiceMemoLabel}>{t('workbench.voiceMemoLabel')}</Text>
                          </View>
                        ) : item.mux_playback_id ? (
                          <Image
                            source={{
                              uri: `https://image.mux.com/${item.mux_playback_id}/thumbnail.jpg?time=0`,
                            }}
                            style={styles.clipThumbImage}
                          />
                        ) : null}
                        <View
                          style={[
                            styles.clipTypeBadge,
                            item.clip_type === 'voice_memo'
                              ? styles.clipTypeBadgeVoiceMemo
                              : isReferenceClip(item)
                                ? styles.clipTypeBadgeRef
                                : styles.clipTypeBadgeMine,
                          ]}
                        >
                          <Text
                            style={[
                              styles.clipTypeBadgeText,
                              item.clip_type === 'voice_memo'
                                ? styles.clipTypeBadgeTextVoiceMemo
                                : isReferenceClip(item)
                                  ? styles.clipTypeBadgeTextRef
                                  : styles.clipTypeBadgeTextMine,
                            ]}
                          >
                            {item.clip_type === 'voice_memo'
                              ? t('workbench.clipBadgeVoice')
                              : isReferenceClip(item)
                                ? t('workbench.clipBadgeRef')
                                : t('workbench.clipBadgeMine')}
                          </Text>
                        </View>
                        {item.upload_status === 'failed' ? (
                          <TouchableOpacity
                            style={styles.retryPill}
                            onPress={() => retryClip(item.local_id)}
                          >
                            <Text style={styles.retryPillText}>{t('workbench.retry')}</Text>
                          </TouchableOpacity>
                        ) : null}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.clipShareIcon,
                          item.upload_status !== 'ready' && styles.clipShareIconDisabled,
                        ]}
                        onPress={() => {
                          if (item.upload_status !== 'ready' || !item.server_id) {
                            Toast.show({
                              type: 'info',
                              text1: t('workbench.clipAvailableOnce'),
                            });
                            return;
                          }
                          setSelectedClipForSheet(item);
                          openSheet('clip-share');
                        }}
                      >
                        <Text style={styles.clipShareIconText}>⎘</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                />
              ) : (
                <View style={styles.notesContent}>
                  {notes.map((note) => (
                    <View
                      key={note.id}
                      style={[
                        styles.noteItem,
                        activeVoiceNoteId === note.id && styles.noteItemActivePlayback,
                      ]}
                    >
                      <Text style={styles.noteTime}>{formatTimecode(note.timecode_ms)}</Text>
                      {note.audio_storage_path ? (
                        <VoiceNoteRow
                          noteId={note.id}
                          audioStoragePath={note.audio_storage_path}
                          isActive={activeVoiceNoteId === note.id}
                          onRequestPlay={setActiveVoiceNoteId}
                          onPlaybackEnded={handleVoiceNotePlaybackEnded}
                        />
                      ) : null}
                      <Text style={styles.noteText}>{note.text}</Text>
                      <TouchableOpacity
                        style={styles.noteDelete}
                        onPress={() => handleDeleteNote(note.id)}
                      >
                        <Text style={styles.noteDeleteText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
        </>
      )}

      {isFullyEmpty && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStatePrompt}>{t('workbench.emptyPrompt')}</Text>
          <View style={styles.emptyStateActions}>
            <TouchableOpacity
              style={styles.emptyVideoBtn}
              onPress={handleMusicSetupRemoved}
            >
              <Text style={styles.emptyVideoBtnText}>{t('workbench.addVideo')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.emptyRecordBtn}
              onPress={() =>
                router.push({
                  pathname: './camera',
                  params: { id: sessionId, sectionName: activeSection },
                })
              }
            >
              <View style={styles.recordFabInner} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!isFullyEmpty && (
        <TouchableOpacity
          style={styles.recordFab}
          activeOpacity={0.85}
          onPress={() =>
            router.push({
              pathname: './camera',
              params: { id: sessionId, sectionName: activeSection },
            })
          }
        >
          <View style={styles.recordFabInner} />
        </TouchableOpacity>
      )}
    </Pressable>
  );
}

function createWorkbenchStyles(colors: ThemePalette) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ground,
    position: 'relative',
  },
  waveformContainer: {
    height: 124,
  },
  timelineScrollView: {
    height: 124,
  },
  timelineScrollContent: {
    flexDirection: 'column',
  },
  loopRegionsRow: {
    height: 12,
    position: 'relative',
    marginHorizontal: WAVEFORM_HORIZONTAL_PADDING,
  },
  loopRegionBand: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(232, 168, 124, 0.4)',
  },
  notePinsRow: {
    height: 12,
    position: 'relative',
    marginHorizontal: WAVEFORM_HORIZONTAL_PADDING,
  },
  notePinTouchable: {
    position: 'absolute',
    top: 3,
  },
  notePinDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.mine,
  },
  clipsRow: {
    height: 20,
    position: 'relative',
    marginHorizontal: WAVEFORM_HORIZONTAL_PADDING,
  },
  clipChip: {
    position: 'absolute',
    top: 2,
    width: 16,
    height: 16,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clipChipText: {
    fontSize: 7,
    color: '#fff',
    textAlign: 'center',
  },
  addMusicPrompt: {
    height: 80,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.chrome,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  addMusicPromptText: {
    fontFamily: theme.typography.monoFamily,
    fontSize: 11,
    color: colors.muted,
  },
  analysisIndicatorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  analysisIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  analysisIndicatorText: {
    fontFamily: theme.typography.monoFamily,
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
  },
  analysisRetryTouchable: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  analysisRetryText: {
    fontFamily: theme.typography.monoFamily,
    fontSize: 11,
    color: colors.warm,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  waveformTrack: {
    height: 80,
    position: 'relative',
    justifyContent: 'center',
  },
  waveformTapArea: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: WAVEFORM_HORIZONTAL_PADDING,
    right: WAVEFORM_HORIZONTAL_PADDING,
    justifyContent: 'center',
  },
  waveformBarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: WAVEFORM_BAR_GAP,
    height: '100%',
  },
  waveformDragBand: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  waveformBar: {
    borderRadius: 2,
    alignSelf: 'center',
  },
  waveformLoopEdge: {
    position: 'absolute',
    width: 2,
    top: 0,
    bottom: 0,
    backgroundColor: '#7db9a8',
  },
  waveformPlayhead: {
    position: 'absolute',
    width: 1.5,
    top: 0,
    bottom: 0,
    backgroundColor: '#3a342d',
  },
  waveformPlayheadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#3a342d',
    position: 'absolute',
    top: 0,
    left: -2.75,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  toggleChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  toggleChipActive: {
    backgroundColor: colors.active,
    borderColor: colors.active,
  },
  toggleChipText: {
    fontFamily: theme.typography.monoFamily,
    fontSize: 9,
    color: colors.muted,
  },
  toggleChipTextActive: {
    color: '#ffffff',
  },
  partitionHint: {
    fontFamily: theme.typography.monoFamily,
    fontSize: 9,
    color: colors.muted,
    paddingHorizontal: 16,
  },
  lyricsPanel: {
    marginHorizontal: 16,
    marginTop: 6,
    padding: 10,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.chrome,
    gap: 8,
  },
  lyricsHint: {
    color: colors.muted,
    fontSize: 11,
  },
  lyricsSearchRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  lyricsInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.radiusSm,
    backgroundColor: colors.ground,
    color: colors.active,
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  lyricsSearchBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: spacing.radiusSm,
    backgroundColor: colors.active,
  },
  lyricsSearchBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  lyricsErrorText: {
    color: colors.capture,
    fontSize: 11,
  },
  lyricsEmpty: {
    color: colors.muted,
    fontSize: 11,
  },
  lyricsResultWrap: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  lyricsResultTitle: {
    color: colors.active,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  lyricsScroll: {
    maxHeight: 140,
  },
  lyricsBody: {
    color: colors.active,
    fontSize: 12,
    lineHeight: 18,
  },
  sectionPillListWrap: {
    maxHeight: '40%',
  },
  sectionPillList: {
    maxHeight: 200,
  },
  sectionPillListContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sectionPill: {
    height: 36,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    justifyContent: 'space-between',
    marginBottom: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  sectionPillActive: {
    borderColor: '#7db9a8',
    backgroundColor: 'rgba(125,185,168,0.12)',
  },
  sectionPillText: {
    fontFamily: theme.typography.monoFamily,
    fontSize: 11,
    color: '#b8b0a5',
  },
  sectionPillTextActive: {
    color: '#3a342d',
  },
  sectionPillCount: {
    fontFamily: theme.typography.monoFamily,
    fontSize: 10,
    color: colors.muted,
  },
  sectionSwipeHint: {
    color: colors.muted,
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 4,
  },
  workspace: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  workspaceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  workspaceSectionGesture: {
    flex: 1,
  },
  workspaceTitle: {
    color: colors.active,
    fontSize: 16,
    fontWeight: '700',
  },
  sessionModeLabel: {
    color: colors.active,
    fontSize: 16,
    fontWeight: '700',
  },
  workspaceMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  workspaceBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.active,
    borderRadius: 4,
  },
  workspaceBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  mapJumpBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: spacing.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.chrome,
  },
  mapJumpBtnText: {
    fontFamily: theme.typography.monoFamily,
    fontSize: 11,
    color: colors.muted,
  },
  workspaceTabs: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  pinNoteBtn: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: spacing.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.chrome,
  },
  pinNoteBtnText: {
    color: colors.active,
    fontSize: 11,
    fontWeight: '600',
  },
  workspaceTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: spacing.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.chrome,
  },
  workspaceTabActive: {
    backgroundColor: colors.active,
    borderColor: colors.active,
  },
  workspaceTabText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  workspaceTabTextActive: {
    color: '#ffffff',
  },
  clipCell: {
    flex: 1,
    gap: 6,
  },
  clipThumb: {
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  clipThumbRef: {
    backgroundColor: colors.warm,
  },
  clipThumbMine: {
    backgroundColor: colors.mine,
  },
  clipThumbVoiceMemo: {
    backgroundColor: colors.capture,
  },
  clipThumbImage: {
    width: '100%',
    height: '100%',
  },
  clipTypeBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  clipTypeBadgeRef: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  clipTypeBadgeMine: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  clipTypeBadgeVoiceMemo: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  clipTypeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  clipTypeBadgeTextRef: {
    color: colors.warm,
  },
  clipTypeBadgeTextMine: {
    color: colors.mine,
  },
  clipTypeBadgeTextVoiceMemo: {
    color: colors.capture,
  },
  retryPill: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 4,
  },
  retryPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.active,
  },
  clipShareIcon: {
    alignSelf: 'flex-end',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.chrome,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clipShareIconDisabled: {
    opacity: 0.4,
  },
  clipShareIconText: {
    color: colors.muted,
    fontSize: 12,
  },
  voiceMemoIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  voiceMemoIcon: {
    fontSize: 32,
  },
  voiceMemoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  notesContent: {
    gap: 8,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  noteItemActivePlayback: {
    borderLeftWidth: 2,
    borderLeftColor: colors.mine,
  },
  noteTime: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
    width: 40,
  },
  noteText: {
    flex: 1,
    color: colors.active,
    fontSize: 13,
  },
  noteDelete: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.chrome,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteDeleteText: {
    color: colors.muted,
    fontSize: 10,
  },
  recordFab: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.capture,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordFabInner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
  },
  sessionModeRow: {
    height: 40,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  sessionModeRowLabel: {
    fontFamily: theme.typography.monoFamily,
    fontSize: 11,
    color: colors.active,
    fontWeight: '700',
  },
  sessionModeRowCount: {
    fontFamily: theme.typography.monoFamily,
    fontSize: 10,
    color: colors.muted,
  },
  sectionStripWrapper: {
    flex: 1,
  },
  sectionPillZone: {
    // No special layout needed - semantic wrapper only
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingHorizontal: 32,
  },
  emptyStatePrompt: {
    color: colors.muted,
    fontSize: 15,
    textAlign: 'center',
  },
  emptyStateActions: {
    flexDirection: 'row',
    gap: 16,
  },
  emptyVideoBtn: {
    backgroundColor: colors.active,
    borderRadius: spacing.pill,
  },
  emptyVideoBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyRecordBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.capture,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workspaceZone: {
    flex: 1,
  },
  microCycleRow: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.chrome,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  microCycleRowText: {
    color: colors.active,
    fontSize: 12,
    fontWeight: '600',
  },
  microCycleRowBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: spacing.pill,
    backgroundColor: colors.capture,
  },
  microCycleRowBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  microCycleRowHint: {
    color: colors.muted,
    fontSize: 11,
    flex: 1,
    minWidth: 100,
  },
  drillCard: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 12,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.chrome,
    gap: 8,
  },
  drillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drillTitleToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  drillChevron: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  drillTitle: {
    fontFamily: theme.typography.monoFamily,
    fontSize: 11,
    color: colors.active,
  },
  drillPlayBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: colors.ground,
  },
  drillPlayBtnActive: {
    borderColor: colors.mine,
    backgroundColor: colors.mineBg,
  },
  drillPlayBtnText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  drillPlayBtnTextActive: {
    color: colors.mine,
  },
  drillAddBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.pill,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: colors.ground,
  },
  drillAddBtnDisabled: {
    opacity: 0.4,
  },
  drillAddBtnText: {
    color: colors.active,
    fontSize: 12,
    fontWeight: '600',
  },
  drillHintText: {
    color: colors.muted,
    fontSize: 12,
  },
  drillItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.radiusSm,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  drillItemRowActive: {
    borderColor: colors.mine,
    backgroundColor: colors.mineBg,
  },
  drillItemTextWrap: {
    flex: 1,
  },
  drillItemLabel: {
    color: colors.active,
    fontSize: 12,
    fontWeight: '600',
  },
  drillItemRange: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  drillItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 8,
  },
  drillActionText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
  },
});
}
