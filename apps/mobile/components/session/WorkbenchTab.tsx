import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FlatList,
  Image,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Audio, type AVPlaybackStatus } from 'expo-av';
import Toast from 'react-native-toast-message';
import { theme } from '../../lib/theme';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { useNotePins } from '../../lib/hooks/useNotePins';
import { supabase } from '../../lib/supabase';
import { API_BASE } from '../../lib/api';
import { ShareSheet } from '../../ShareSheet';
import { CaptureSheet } from '../../CaptureSheet';
import { ClipShareSheet } from '../../ClipShareSheet';
import { NotePinSheet } from '../../NotePinSheet';
import { TransportBar } from './TransportBar';
import type { SectionClip } from '@roam/types';

const colors = theme.light;
const spacing = theme.spacing;

// Visible timeline span when no audio is loaded (75 s)
const FALLBACK_DURATION_MS = 75_000;

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
}): boolean {
  const haystack = `${clip.label ?? ''} ${clip.move_name ?? ''} ${clip.notes ?? ''}`.toLowerCase();
  return haystack.includes('ref') || haystack.includes('reference');
}

export function WorkbenchTab() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const {
    sessionId,
    sessionName,
    activeSection,
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
  } = useSessionContext();

  // Layout constants for playhead positioning
  const TRACK_HEADER_W = 16 + 44 + 1; // timeline leftPad + header + separator
  const trackBodyWidth = Math.max(1, screenWidth - TRACK_HEADER_W - 16);

  // ── Bottom-sheet refs ────────────────────────────────────────────────────
  const shareSheetRef = useRef<any>(null);
  const captureSheetRef = useRef<any>(null);
  const clipShareSheetRef = useRef<any>(null);
  const notePinSheetRef = useRef<any>(null);

  // ── Data hooks ───────────────────────────────────────────────────────────
  const { refreshCount } = useNotePins(sessionId);

  // ── Session metadata ─────────────────────────────────────────────────────
  const [showSectionSwipeHint, setShowSectionSwipeHint] = useState(true);
  const [workspaceTab, setWorkspaceTab] = useState<'ideas' | 'notes'>('ideas');

  // ── Selected items for sheets ────────────────────────────────────────────
  const [selectedNote, setSelectedNote] = useState<{
    id: string;
    timecode_ms: number;
    text: string | null;
    audio_storage_path: string | null;
  } | null>(null);

  // ── Derived values ───────────────────────────────────────────────────────
  const effectiveDuration = Math.max(durationMs, FALLBACK_DURATION_MS);
  const playheadLeft =
    TRACK_HEADER_W +
    Math.min(
      (playheadMs / effectiveDuration) * trackBodyWidth,
      trackBodyWidth - 2
    );

  // ── Effects ───────────────────────────────────────────────────────────
  useEffect(() => {
    refreshCount().catch(() => {});
  }, [refreshCount]);

  // ── Section chip handler ─────────────────────────────────────────────────
  const handleSectionPress = useCallback(
    async (section: { label: string; start_ms: number }) => {
      const sound = soundRef.current;
      if (sound) {
        try {
          await sound.setPositionAsync(section.start_ms);
        } catch {
          // ignore seek failure
        }
      }
    },
    []
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
  const openNoteAt = (timecodeMs: number, note?: typeof selectedNote) => {
    setSelectedNote(note ?? null);
    openSheet('note-pin');
  };

  const handleSaveNote = useCallback(
    async (data: { text?: string; audioUri?: string }) => {
      const created = await createNote({
        timecode_ms: playheadMs,
        text: data.text ?? null,
        audio_storage_path: data.audioUri ?? null,
      });
      if (created) Toast.show({ type: 'success', text1: 'Note pinned' });
    },
    [createNote, playheadMs]
  );

  const handleDeleteSelectedNote = useCallback(async () => {
    if (!selectedNote) return;
    const ok = await deleteNote(selectedNote.id);
    if (ok) Toast.show({ type: 'success', text1: 'Note deleted' });
  }, [deleteNote, selectedNote]);

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

  // ── Time ruler markers ───────────────────────────────────────────────────
  const timeMarkers = useMemo(() => ['0:00', '0:15', '0:30', '0:45', '1:00', '1:15'], []);

  const openClipPlayer = (index: number) => {
    router.push({
      pathname: './clip-player',
      params: { sessionId, clipIndex: String(index) },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sessionTitle} numberOfLines={1}>
          {sessionName}
        </Text>
      </View>

      {/* Time ruler */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.ruler}
      >
        {timeMarkers.map((t) => (
          <Text key={t} style={styles.rulerTick}>
            {t}
          </Text>
        ))}
      </ScrollView>

      {/* Section chips — shown when music analysis has produced sections */}
      {musicTrack?.sections && musicTrack.sections.length > 0 ? (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sectionChips}
          >
            {musicTrack.sections.map((s) => (
              <TouchableOpacity
                key={s.label}
                style={[
                  styles.sectionChip,
                  s.label === activeSection && styles.sectionChipActive,
                ]}
                onPress={() => handleSectionPress(s)}
                activeOpacity={0.75}
              >
                <View style={styles.sectionChipInner}>
                  <Text
                    style={[
                      styles.sectionChipText,
                      s.label === activeSection && styles.sectionChipTextActive,
                    ]}
                  >
                    {s.label}
                  </Text>
                  <Text
                    style={[
                      styles.sectionChipCount,
                      s.label === activeSection && styles.sectionChipTextActive,
                    ]}
                  >
                    {sectionClipCounts.get(s.label) ?? 0}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {showSectionSwipeHint ? (
            <Text style={styles.sectionSwipeHint}>← swipe to change section →</Text>
          ) : null}
        </>
      ) : null}

      {/* Track timeline */}
      <View style={styles.timeline}>
        {/* Music track */}
        <View style={styles.track}>
          <View style={styles.trackHeader}>
            <Text style={styles.trackIcon}>♪</Text>
          </View>
          <View style={[styles.trackBody, styles.waveformRow]}>
            {musicTrack ? (
              isAnalysing || musicTrack.analysis_status === 'pending' ? (
                <Text style={styles.trackHint}>Analysing…</Text>
              ) : (
                <>
                  <Text style={styles.trackHint} numberOfLines={1}>
                    {musicTrack.bpm ? `${Math.round(musicTrack.bpm)} BPM` : 'Music'}
                    {durationMs > 0 ? ` · ${formatTimecode(durationMs)}` : ''}
                  </Text>
                  {/* Section boundary lines */}
                  {musicTrack.sections?.map((s) => {
                    const x =
                      effectiveDuration > 0
                        ? (s.start_ms / effectiveDuration) * trackBodyWidth
                        : 0;
                    return (
                      <View
                        key={s.label}
                        style={[styles.sectionMarker, { left: x }]}
                      />
                    );
                  })}
                </>
              )
            ) : (
              <TouchableOpacity
                style={styles.dashedInline}
                onPress={() =>
                  router.push({ pathname: './music-setup', params: { sessionId } })
                }
                activeOpacity={0.85}
              >
                <Text style={styles.dashedText}>Add music</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Note-pin track */}
        <View style={styles.track}>
          <View style={styles.trackHeader}>
            <Text style={styles.trackIcon}>📍</Text>
          </View>
          <TouchableOpacity
            style={styles.trackBody}
            activeOpacity={1}
            onPress={() => openNoteAt(playheadMs)}
          >
            <View style={styles.pinsRow}>
              {notes.slice(0, 18).map((n) => (
                <TouchableOpacity
                  key={n.id}
                  style={[
                    styles.pinDot,
                    { backgroundColor: n.color ?? '#4ECDC4' },
                  ]}
                  onPress={() =>
                    openNoteAt(n.timecode_ms, {
                      id: n.id,
                      timecode_ms: n.timecode_ms,
                      text: n.text,
                      audio_storage_path: n.audio_storage_path,
                    })
                  }
                />
              ))}
            </View>
          </TouchableOpacity>
        </View>

        {/* Clips track */}
        <View style={styles.track}>
          <View style={styles.trackHeader}>
            <Text style={styles.trackIcon}>🎬</Text>
          </View>
          <View style={[styles.trackBody, styles.clipsRow]}>
            {clips.length === 0 ? (
              <Text style={styles.trackHint}>No clips</Text>
            ) : (
              <>
                <Text style={styles.trackHint}>{clips.length} clips</Text>
                {clips.slice(0, 20).map((clip, i) => {
                  const sc = sectionClips.find((x) => x.clip_id === clip.server_id);
                  const frac =
                    sc && effectiveDuration > 0
                      ? sc.section_start_ms / effectiveDuration
                      : (i / Math.max(clips.length, 1)) * 0.85;
                  return (
                    <View
                      key={clip.local_id}
                      style={[
                        styles.clipBlock,
                        {
                          left: frac * trackBodyWidth,
                          backgroundColor:
                            clip.upload_status === 'ready' ? colors.warm : colors.mine,
                        },
                      ]}
                    />
                  );
                })}
              </>
            )}
          </View>
        </View>

        {/* Loop track */}
        <View style={styles.track}>
          <View style={styles.trackHeader}>
            <Text style={styles.trackIcon}>🔁</Text>
          </View>
          <View style={[styles.trackBody, styles.loopRow]}>
            {loopRegion ? (
              <>
                <View
                  style={[
                    styles.loopBlock,
                    {
                      left:
                        effectiveDuration > 0
                          ? (loopRegion.start / effectiveDuration) * trackBodyWidth
                          : 0,
                      width:
                        effectiveDuration > 0
                          ? ((loopRegion.end - loopRegion.start) /
                              effectiveDuration) *
                            trackBodyWidth
                          : 40,
                    },
                  ]}
                />
                <TouchableOpacity
                  style={styles.loopClearBtn}
                  onPress={handleLoopToggle}
                >
                  <Text style={styles.trackHint}>✕ Loop</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={handleLoopToggle}>
                <Text style={styles.trackHint}>Set loop</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Playhead */}
        <View
          style={[styles.playhead, { left: playheadLeft }]}
          pointerEvents="none"
        />
      </View>

      {/* Section workspace */}
      <View style={styles.workspace}>
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
                    isReferenceClip(item) ? styles.clipThumbRef : styles.clipThumbMine,
                  ]}
                  onPress={() => openClipPlayer(index)}
                  activeOpacity={0.85}
                >
                  {item.mux_playback_id ? (
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
                      isReferenceClip(item) ? styles.clipTypeBadgeRef : styles.clipTypeBadgeMine,
                    ]}
                  >
                    <Text
                      style={[
                        styles.clipTypeBadgeText,
                        isReferenceClip(item)
                          ? styles.clipTypeBadgeTextRef
                          : styles.clipTypeBadgeTextMine,
                      ]}
                    >
                      {isReferenceClip(item) ? 'REF' : 'MINE'}
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
                  onPress={() => handleDeleteSelectedNote()}
                >
                  <Text style={styles.noteDeleteText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Sheets */}
      <ShareSheet
        ref={shareSheetRef}
        sessionId={sessionId}
        onClose={() => closeSheet()}
      />
      <CaptureSheet
        ref={captureSheetRef}
        sessionId={sessionId}
        sectionName={activeSection}
        inboxCount={inboxCount}
        onRecord={() =>
          router.push({ pathname: './camera', params: { sessionId, sectionName: activeSection } })
        }
        onInbox={() =>
          router.push({
            pathname: '/inbox',
            params: { sessionId, sectionName: activeSection },
          })
        }
        onClose={() => closeSheet()}
      />
      <ClipShareSheet
        ref={clipShareSheetRef}
        clip={selectedClipForSheet}
        onClose={() => closeSheet()}
      />
      <NotePinSheet
        ref={notePinSheetRef}
        note={selectedNote}
        onSave={handleSaveNote}
        onClose={() => closeSheet()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ground,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sessionTitle: {
    color: colors.active,
    fontSize: 18,
    fontWeight: '700',
  },
  ruler: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 24,
  },
  rulerTick: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '600',
    width: 40,
  },
  sectionChips: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  sectionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: spacing.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.chrome,
  },
  sectionChipActive: {
    backgroundColor: colors.active,
    borderColor: colors.active,
  },
  sectionChipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionChipText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionChipTextActive: {
    color: '#ffffff',
  },
  sectionChipCount: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '600',
  },
  sectionSwipeHint: {
    color: colors.muted,
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 4,
  },
  timeline: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  track: {
    flexDirection: 'row',
    height: 32,
    gap: 8,
  },
  trackHeader: {
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackIcon: {
    color: colors.muted,
    fontSize: 14,
  },
  trackBody: {
    flex: 1,
    backgroundColor: colors.chrome,
    borderRadius: 6,
    paddingHorizontal: 8,
    justifyContent: 'center',
    position: 'relative',
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trackHint: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  sectionMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: colors.mine,
  },
  dashedInline: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dashedText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  pinsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  pinDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  clipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clipBlock: {
    width: 8,
    height: 16,
    borderRadius: 2,
  },
  loopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loopBlock: {
    height: 16,
    backgroundColor: colors.mine,
    borderRadius: 2,
  },
  loopClearBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.chrome,
    borderRadius: 4,
  },
  playhead: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.warm,
    borderRadius: 1,
  },
  workspace: {
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
  workspaceTabs: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
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
});
