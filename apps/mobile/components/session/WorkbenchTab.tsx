import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FlatList,
  GestureResponderEvent,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { theme } from '../../lib/theme';
import { useSessionContext } from '../../lib/contexts/SessionContext';

const colors = theme.light;
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
  const router = useRouter();
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
  const [notePinTimecodeMs, setNotePinTimecodeMs] = useState<number | null>(null);

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

  // ── Note handlers ────────────────────────────────────────────────────────
  const handleWaveformTap = useCallback(
    (event: GestureResponderEvent) => {
      const width = waveformWidth.current;
      if (width <= 0 || timelineDurationMs <= 0) return;
      const fraction = Math.max(0, Math.min(1, event.nativeEvent.locationX / width));
      const targetMs = fraction * timelineDurationMs;
      setNotePinTimecodeMs(targetMs);
      soundRef.current?.setPositionAsync(targetMs).catch(() => {});
    },
    [timelineDurationMs, soundRef]
  );
  const handleOpenNotePin = useCallback(
    (timecodeMs: number = playheadMs) => {
      setNotePinTimecodeMs(timecodeMs);
      openSheet('note-pin');
    },
    [playheadMs, openSheet]
  );

  const handleDeleteNote = useCallback(async (noteId: string) => {
    const ok = await deleteNote(noteId);
    if (ok) Toast.show({ type: 'success', text1: 'Note deleted' });
  }, [deleteNote]);

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

  return (
    <Pressable
      style={styles.container}
      onPress={!sessionMode ? () => setSessionMode(true) : undefined}
    >
      <ScrollView
        horizontal={false}
        style={styles.waveformContainer}
        contentContainerStyle={styles.waveformContainerContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      >
        <View
          style={styles.waveformTrack}
          onLayout={(event) => {
            const measuredWidth = Math.max(
              0,
              event.nativeEvent.layout.width - WAVEFORM_HORIZONTAL_PADDING * 2
            );
            waveformWidth.current = measuredWidth;
            setWaveformWidthPx(measuredWidth);
          }}
        >
          <TouchableOpacity
            style={styles.waveformTapArea}
            activeOpacity={1}
            onPress={handleWaveformTap}
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
          </TouchableOpacity>
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
        </View>
      </ScrollView>

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
        <>
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleChip, styles.toggleChipActive]}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.toggleChipText,
              styles.toggleChipTextActive,
            ]}
          >
            Counts
          </Text>
        </TouchableOpacity>
        <View style={[styles.toggleChip, { opacity: 0.45 }]}>
          <Text
            style={styles.toggleChipText}
          >
            Partition
          </Text>
        </View>
      </View>
      <Text style={styles.partitionHint}>read-only in V3</Text>
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
              <Text style={styles.sectionSwipeHint}>← swipe to change section →</Text>
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
          <Text style={styles.workspaceMeta}>
            {formatTimecode(playheadMs)} · …
          </Text>
          {!musicTrack ? (
            <TouchableOpacity
              style={styles.workspaceBtn}
              onPress={() =>
                router.push({ pathname: './music-setup', params: { sessionId } })
              }
            >
              <Text style={styles.workspaceBtnText}>Add music</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={styles.mapJumpBtn}
            onPress={jumpToSongMap}
            testID={`map-jump-${activeMoment}`}
            activeOpacity={0.8}
          >
            <Text style={styles.mapJumpBtnText}>→ Map</Text>
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
              Ideas
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
              Notes
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.pinNoteBtn}
          onPress={() => handleOpenNotePin(playheadMs)}
          activeOpacity={0.85}
        >
          <Text style={styles.pinNoteBtnText}>
            Pin note @ {formatTimecode(notePinTimecodeMs ?? playheadMs)}
          </Text>
        </TouchableOpacity>

        {workspaceTab === 'ideas' ? (
          <FlatList
            data={displayClips}
            keyExtractor={(c) => c.local_id}
            numColumns={2}
            columnWrapperStyle={{ gap: 10 }}
            contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 40 }}
            renderItem={({ item, index }) => (
              <View style={styles.clipCell}>
                <TouchableOpacity
                  style={[
                    styles.clipThumb,
                    item.clip_type === 'voice_memo' ? styles.clipThumbVoiceMemo :
                    isReferenceClip(item) ? styles.clipThumbRef : styles.clipThumbMine,
                  ]}
                  onPress={() => openClipSheet(item)}
                  activeOpacity={0.85}
                >
                  {item.clip_type === 'voice_memo' ? (
                    <View style={styles.voiceMemoIndicator}>
                      <Text style={styles.voiceMemoIcon}>🎤</Text>
                      <Text style={styles.voiceMemoLabel}>Voice Memo</Text>
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
                      item.clip_type === 'voice_memo' ? styles.clipTypeBadgeVoiceMemo :
                      isReferenceClip(item) ? styles.clipTypeBadgeRef : styles.clipTypeBadgeMine,
                    ]}
                  >
                    <Text
                      style={[
                        styles.clipTypeBadgeText,
                        item.clip_type === 'voice_memo' ? styles.clipTypeBadgeTextVoiceMemo :
                        isReferenceClip(item)
                          ? styles.clipTypeBadgeTextRef
                          : styles.clipTypeBadgeTextMine,
                      ]}
                    >
                      {item.clip_type === 'voice_memo' ? 'VOICE' :
                       isReferenceClip(item) ? 'REF' : 'MINE'}
                    </Text>
                  </View>
                  {item.upload_status === 'failed' ? (
                    <TouchableOpacity
                      style={styles.retryPill}
                      onPress={() => retryClip(item.local_id)}
                    >
                      <Text style={styles.retryPillText}>Retry</Text>
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
                        text1: 'Available once clip is ready.',
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
              <View key={note.id} style={styles.noteItem}>
                <Text style={styles.noteTime}>{formatTimecode(note.timecode_ms)}</Text>
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
        </View>
        )}
      </View>
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
      
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ground,
    position: 'relative',
  },
  waveformContainer: {
    height: 80,
  },
  waveformContainerContent: {
    height: 80,
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
    color: '#3a342d',
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
  workspaceZone: {
    flex: 1,
  },
});
