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
exports.WorkbenchTab = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const react_native_toast_message_1 = __importDefault(require("react-native-toast-message"));
const theme_1 = require("../../lib/theme");
const SessionContext_1 = require("../../lib/contexts/SessionContext");
const VoiceNoteRow_1 = require("./VoiceNoteRow");
const colors = theme_1.theme.light;
const spacing = theme_1.theme.spacing;
// Visible timeline span when no audio is loaded (75 s)
const FALLBACK_DURATION_MS = 75000;
const WAVEFORM_BAR_COUNT = 80;
const WAVEFORM_BAR_GAP = 2;
const WAVEFORM_HORIZONTAL_PADDING = 16;
function formatTimecode(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(s / 60);
    const ss = String(s % 60).padStart(2, '0');
    return `${m}:${ss}`;
}
function isReferenceClip(clip) {
    // First check explicit clip_type
    if (clip.clip_type === 'REF')
        return true;
    if (clip.clip_type === 'voice_memo')
        return false;
    // Fall back to text heuristics for legacy data
    const haystack = `${clip.label ?? ''} ${clip.move_name ?? ''} ${clip.notes ?? ''}`.toLowerCase();
    return haystack.includes('ref') || haystack.includes('reference');
}
function WorkbenchTab() {
    const router = (0, expo_router_1.useRouter)();
    const { sessionId, activeSection, activeMoment, jumpToSongMap, setActiveSection, playheadMs, durationMs, musicUrl, loopRegion, clips, musicTrack, isAnalysing, notes, createNote, deleteNote, inboxCount, sectionClips, retryClip, soundRef, handlePlayPause, handleSeekBack, handleSeekForward, handleLoopToggle, activeSheetId, openSheet, closeSheet, selectedClipForSheet, setSelectedClipForSheet, openClipSheet, refreshCount, sessionMode, setSessionMode, } = (0, SessionContext_1.useSessionContext)();
    // ── Session metadata ─────────────────────────────────────────────────────
    const [showSectionSwipeHint, setShowSectionSwipeHint] = (0, react_1.useState)(true);
    const [workspaceTab, setWorkspaceTab] = (0, react_1.useState)('ideas');
    const { height: windowHeight } = (0, react_native_1.useWindowDimensions)();
    const waveformWidth = (0, react_1.useRef)(0);
    const [waveformWidthPx, setWaveformWidthPx] = (0, react_1.useState)(0);
    const [notePinTimecodeMs, setNotePinTimecodeMs] = (0, react_1.useState)(null);
    const [activeVoiceNoteId, setActiveVoiceNoteId] = (0, react_1.useState)(null);
    const handleVoiceNotePlaybackEnded = (0, react_1.useCallback)((noteId) => {
        setActiveVoiceNoteId((current) => (current === noteId ? null : current));
    }, []);
    // ── Derived values ───────────────────────────────────────────────────────
    const timelineDurationMs = durationMs > 0 ? durationMs : FALLBACK_DURATION_MS;
    const waveformBars = (0, react_1.useMemo)(() => Array.from({ length: WAVEFORM_BAR_COUNT }, (_v, i) => ({
        index: i,
        height: 20 + Math.abs(Math.sin(i * 0.4 + i * 0.07) * 40),
    })), []);
    const waveformBarWidth = (0, react_1.useMemo)(() => {
        if (waveformWidthPx <= 0)
            return 0;
        return Math.max(0.5, (waveformWidthPx - WAVEFORM_BAR_GAP * (WAVEFORM_BAR_COUNT - 1)) /
            WAVEFORM_BAR_COUNT);
    }, [waveformWidthPx]);
    const waveformContentWidth = (0, react_1.useMemo)(() => waveformBarWidth > 0
        ? waveformBarWidth * WAVEFORM_BAR_COUNT +
            WAVEFORM_BAR_GAP * (WAVEFORM_BAR_COUNT - 1)
        : 0, [waveformBarWidth]);
    const playheadBarIndex = Math.floor((playheadMs / timelineDurationMs) * WAVEFORM_BAR_COUNT);
    const playheadX = Math.max(0, Math.min(waveformContentWidth, (Math.max(0, Math.min(playheadBarIndex, WAVEFORM_BAR_COUNT)) / WAVEFORM_BAR_COUNT) *
        waveformContentWidth));
    const loopStartX = loopRegion && timelineDurationMs > 0
        ? (loopRegion.start / timelineDurationMs) * waveformContentWidth
        : 0;
    const loopEndX = loopRegion && timelineDurationMs > 0
        ? (loopRegion.end / timelineDurationMs) * waveformContentWidth
        : 0;
    // ── Effects ───────────────────────────────────────────────────────────
    (0, react_1.useEffect)(() => {
        refreshCount().catch(() => { });
    }, [refreshCount]);
    (0, react_1.useEffect)(() => {
        const sections = musicTrack?.sections ?? [];
        if (!sections.length)
            return;
        if (!sections.some((section) => section.label === activeSection)) {
            setActiveSection(sections[0].label);
        }
    }, [musicTrack?.sections, activeSection, setActiveSection]);
    (0, react_1.useEffect)(() => {
        if (workspaceTab !== 'notes') {
            setActiveVoiceNoteId(null);
        }
    }, [workspaceTab]);
    // ── Section chip handler ─────────────────────────────────────────────────
    const handleSectionPress = (0, react_1.useCallback)(async (section) => {
        setActiveSection(section.label);
        const sound = soundRef.current;
        if (sound) {
            try {
                await sound.setPositionAsync(section.start_ms);
            }
            catch {
                // ignore seek failure
            }
        }
    }, [setActiveSection, soundRef]);
    const handleSectionSwipe = (0, react_1.useCallback)((direction) => {
        const sections = musicTrack?.sections ?? [];
        if (sections.length < 2)
            return;
        const currIdx = sections.findIndex((s) => s.label === activeSection);
        if (currIdx < 0)
            return;
        const delta = direction === 'next' ? 1 : -1;
        const nextIdx = (currIdx + delta + sections.length) % sections.length;
        handleSectionPress(sections[nextIdx]);
        setShowSectionSwipeHint(false);
    }, [musicTrack?.sections, activeSection, handleSectionPress]);
    const sectionPillListMaxHeight = (0, react_1.useMemo)(() => Math.max(200, Math.round(windowHeight * 0.4)), [windowHeight]);
    const sectionSwipePan = (0, react_1.useMemo)(() => react_native_1.PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gestureState) => Math.abs(gestureState.dx) > 12 && Math.abs(gestureState.dy) < 18,
        onPanResponderRelease: (_evt, gestureState) => {
            if (gestureState.dx < -35) {
                handleSectionSwipe('next');
            }
            else if (gestureState.dx > 35) {
                handleSectionSwipe('prev');
            }
        },
    }), [handleSectionSwipe]);
    // ── Note handlers ────────────────────────────────────────────────────────
    const handleWaveformTap = (0, react_1.useCallback)((event) => {
        const width = waveformWidth.current;
        if (width <= 0 || timelineDurationMs <= 0)
            return;
        const fraction = Math.max(0, Math.min(1, event.nativeEvent.locationX / width));
        const targetMs = fraction * timelineDurationMs;
        setNotePinTimecodeMs(targetMs);
        soundRef.current?.setPositionAsync(targetMs).catch(() => { });
    }, [timelineDurationMs, soundRef]);
    const handleOpenNotePin = (0, react_1.useCallback)((timecodeMs = playheadMs) => {
        setNotePinTimecodeMs(timecodeMs);
        openSheet('note-pin');
    }, [playheadMs, openSheet]);
    const handleDeleteNote = (0, react_1.useCallback)(async (noteId) => {
        if (activeVoiceNoteId === noteId) {
            setActiveVoiceNoteId(null);
        }
        const ok = await deleteNote(noteId);
        if (ok)
            react_native_toast_message_1.default.show({ type: 'success', text1: 'Note deleted' });
    }, [activeVoiceNoteId, deleteNote]);
    // ── Clip filtering by active section ────────────────────────────────────
    const hasActiveMusicSection = (0, react_1.useMemo)(() => musicTrack?.sections?.some((s) => s.label === activeSection) ?? false, [musicTrack?.sections, activeSection]);
    const displayClips = (0, react_1.useMemo)(() => {
        if (!hasActiveMusicSection || sectionClips.length === 0)
            return clips;
        const sectionIds = new Set(sectionClips
            .filter((sc) => sc.section_label === activeSection)
            .map((sc) => sc.clip_id));
        return clips.filter((c) => !c.server_id || sectionIds.has(c.server_id));
    }, [clips, sectionClips, activeSection, hasActiveMusicSection]);
    const sectionClipCounts = (0, react_1.useMemo)(() => {
        const counts = new Map();
        for (const sc of sectionClips) {
            counts.set(sc.section_label, (counts.get(sc.section_label) ?? 0) + 1);
        }
        return counts;
    }, [sectionClips]);
    const isFullyEmpty = sectionClips.length === 0 && musicTrack === null;
    return (<react_native_1.Pressable style={styles.container} onPress={!sessionMode ? () => setSessionMode(true) : undefined}>
      {!isFullyEmpty && (<>
        {musicTrack ? (<react_native_1.ScrollView horizontal={false} style={styles.waveformContainer} contentContainerStyle={styles.waveformContainerContent} showsVerticalScrollIndicator={false} scrollEnabled={false}>
            <react_native_1.View style={styles.waveformTrack} onLayout={(event) => {
                    const measuredWidth = Math.max(0, event.nativeEvent.layout.width - WAVEFORM_HORIZONTAL_PADDING * 2);
                    waveformWidth.current = measuredWidth;
                    setWaveformWidthPx(measuredWidth);
                }}>
              <react_native_1.TouchableOpacity style={styles.waveformTapArea} activeOpacity={1} onPress={handleWaveformTap}>
                <react_native_1.View style={[styles.waveformBarsRow, { width: waveformContentWidth }]}>
                  {waveformBars.map((bar) => {
                    const barFraction = bar.index / WAVEFORM_BAR_COUNT;
                    const isActive = loopRegion
                        ? barFraction >= loopRegion.start / timelineDurationMs &&
                            barFraction <= loopRegion.end / timelineDurationMs
                        : false;
                    return (<react_native_1.View key={bar.index} style={[
                            styles.waveformBar,
                            {
                                width: waveformBarWidth,
                                height: bar.height,
                                backgroundColor: isActive ? 'rgba(125,185,168,0.6)' : '#e8e3dc',
                            },
                        ]}/>);
                })}
                </react_native_1.View>
              </react_native_1.TouchableOpacity>
              {loopRegion ? (<>
                  <react_native_1.View style={[
                        styles.waveformLoopEdge,
                        { left: WAVEFORM_HORIZONTAL_PADDING + loopStartX },
                    ]}/>
                  <react_native_1.View style={[
                        styles.waveformLoopEdge,
                        { left: WAVEFORM_HORIZONTAL_PADDING + loopEndX },
                    ]}/>
                </>) : null}
              <react_native_1.View style={[
                    styles.waveformPlayhead,
                    { left: WAVEFORM_HORIZONTAL_PADDING + playheadX },
                ]}>
                <react_native_1.View style={styles.waveformPlayheadDot}/>
              </react_native_1.View>
            </react_native_1.View>
          </react_native_1.ScrollView>) : (<react_native_1.TouchableOpacity style={styles.addMusicPrompt} activeOpacity={0.8} onPress={() => router.push({ pathname: './music-setup', params: { sessionId } })}>
            <react_native_1.Text style={styles.addMusicPromptText}>Add music →</react_native_1.Text>
          </react_native_1.TouchableOpacity>)}

        {sessionMode && (<react_native_1.TouchableOpacity style={styles.sessionModeRow} onPress={() => setSessionMode(false)} activeOpacity={0.75}>
            <react_native_1.Text style={styles.sessionModeRowLabel}>{activeSection}</react_native_1.Text>
            <react_native_1.Text style={styles.sessionModeRowCount}>
              {sectionClipCounts.get(activeSection) ?? 0}
            </react_native_1.Text>
          </react_native_1.TouchableOpacity>)}

        {!sessionMode && (<>
            {musicTrack ? (<>
                <react_native_1.View style={styles.toggleRow}>
                  <react_native_1.TouchableOpacity style={[styles.toggleChip, styles.toggleChipActive]} activeOpacity={0.8}>
                    <react_native_1.Text style={[styles.toggleChipText, styles.toggleChipTextActive]}>
                      Counts
                    </react_native_1.Text>
                  </react_native_1.TouchableOpacity>
                  <react_native_1.View style={[styles.toggleChip, { opacity: 0.45 }]}>
                    <react_native_1.Text style={styles.toggleChipText}>Partition</react_native_1.Text>
                  </react_native_1.View>
                </react_native_1.View>
                <react_native_1.Text style={styles.partitionHint}>read-only in V3</react_native_1.Text>
              </>) : null}
          </>)}

        <react_native_1.View style={styles.sectionStripWrapper}>
          {/* Section pill zone — absorbs touches to prevent bubbling */}
          {musicTrack?.sections && musicTrack.sections.length > 0 && !sessionMode ? (<react_native_1.View style={styles.sectionPillZone} onStartShouldSetResponder={() => true}>
              <react_native_1.View style={styles.sectionPillListWrap}>
                <react_native_1.ScrollView style={[styles.sectionPillList, { maxHeight: sectionPillListMaxHeight }]} contentContainerStyle={styles.sectionPillListContent} showsVerticalScrollIndicator={false}>
                  {musicTrack.sections.map((s) => {
                    const pillContent = (<>
                        <react_native_1.Text style={[
                            styles.sectionPillText,
                            s.label === activeSection && styles.sectionPillTextActive,
                        ]}>
                          {s.label}
                        </react_native_1.Text>
                        <react_native_1.Text style={styles.sectionPillCount}>
                          {sectionClipCounts.get(s.label) ?? 0}
                        </react_native_1.Text>
                      </>);
                    return (<react_native_1.TouchableOpacity key={s.label} style={[
                            styles.sectionPill,
                            s.label === activeSection && styles.sectionPillActive,
                        ]} onPress={() => handleSectionPress(s)} activeOpacity={0.75}>
                        {pillContent}
                      </react_native_1.TouchableOpacity>);
                })}
                </react_native_1.ScrollView>
              </react_native_1.View>
              {showSectionSwipeHint ? (<react_native_1.Text style={styles.sectionSwipeHint}>← swipe to change section →</react_native_1.Text>) : null}
            </react_native_1.View>) : null}

          {/* Workspace zone — allows touches to bubble to outer Pressable */}
          {!sessionMode && (<react_native_1.View style={styles.workspaceZone}>
              <react_native_1.View style={styles.workspaceHeader}>
                <react_native_1.View {...sectionSwipePan.panHandlers} style={styles.workspaceSectionGesture}>
                  <react_native_1.Text style={styles.workspaceTitle}>{activeSection}</react_native_1.Text>
                </react_native_1.View>
                <react_native_1.Text style={styles.workspaceMeta}>{formatTimecode(playheadMs)} · …</react_native_1.Text>
                <react_native_1.TouchableOpacity style={styles.mapJumpBtn} onPress={jumpToSongMap} testID={`map-jump-${activeMoment}`} activeOpacity={0.8}>
                  <react_native_1.Text style={styles.mapJumpBtnText}>→ Map</react_native_1.Text>
                </react_native_1.TouchableOpacity>
              </react_native_1.View>

              <react_native_1.View style={styles.workspaceTabs}>
                <react_native_1.TouchableOpacity style={[
                    styles.workspaceTab,
                    workspaceTab === 'ideas' && styles.workspaceTabActive,
                ]} onPress={() => setWorkspaceTab('ideas')}>
                  <react_native_1.Text style={[
                    styles.workspaceTabText,
                    workspaceTab === 'ideas' && styles.workspaceTabTextActive,
                ]}>
                    Ideas
                  </react_native_1.Text>
                </react_native_1.TouchableOpacity>
                <react_native_1.TouchableOpacity style={[
                    styles.workspaceTab,
                    workspaceTab === 'notes' && styles.workspaceTabActive,
                ]} onPress={() => setWorkspaceTab('notes')}>
                  <react_native_1.Text style={[
                    styles.workspaceTabText,
                    workspaceTab === 'notes' && styles.workspaceTabTextActive,
                ]}>
                    Notes
                  </react_native_1.Text>
                </react_native_1.TouchableOpacity>
              </react_native_1.View>
              <react_native_1.TouchableOpacity style={styles.pinNoteBtn} onPress={() => handleOpenNotePin(playheadMs)} activeOpacity={0.85}>
                <react_native_1.Text style={styles.pinNoteBtnText}>
                  Pin note @ {formatTimecode(notePinTimecodeMs ?? playheadMs)}
                </react_native_1.Text>
              </react_native_1.TouchableOpacity>

              {workspaceTab === 'ideas' ? (<react_native_1.FlatList data={displayClips} keyExtractor={(c) => c.local_id} numColumns={2} columnWrapperStyle={{ gap: 10 }} contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 40 }} renderItem={({ item }) => (<react_native_1.View style={styles.clipCell}>
                      <react_native_1.TouchableOpacity style={[
                            styles.clipThumb,
                            item.clip_type === 'voice_memo'
                                ? styles.clipThumbVoiceMemo
                                : isReferenceClip(item)
                                    ? styles.clipThumbRef
                                    : styles.clipThumbMine,
                        ]} onPress={() => openClipSheet(item)} activeOpacity={0.85}>
                        {item.clip_type === 'voice_memo' ? (<react_native_1.View style={styles.voiceMemoIndicator}>
                            <react_native_1.Text style={styles.voiceMemoIcon}>🎤</react_native_1.Text>
                            <react_native_1.Text style={styles.voiceMemoLabel}>Voice Memo</react_native_1.Text>
                          </react_native_1.View>) : item.mux_playback_id ? (<react_native_1.Image source={{
                                uri: `https://image.mux.com/${item.mux_playback_id}/thumbnail.jpg?time=0`,
                            }} style={styles.clipThumbImage}/>) : null}
                        <react_native_1.View style={[
                            styles.clipTypeBadge,
                            item.clip_type === 'voice_memo'
                                ? styles.clipTypeBadgeVoiceMemo
                                : isReferenceClip(item)
                                    ? styles.clipTypeBadgeRef
                                    : styles.clipTypeBadgeMine,
                        ]}>
                          <react_native_1.Text style={[
                            styles.clipTypeBadgeText,
                            item.clip_type === 'voice_memo'
                                ? styles.clipTypeBadgeTextVoiceMemo
                                : isReferenceClip(item)
                                    ? styles.clipTypeBadgeTextRef
                                    : styles.clipTypeBadgeTextMine,
                        ]}>
                            {item.clip_type === 'voice_memo'
                            ? 'VOICE'
                            : isReferenceClip(item)
                                ? 'REF'
                                : 'MINE'}
                          </react_native_1.Text>
                        </react_native_1.View>
                        {item.upload_status === 'failed' ? (<react_native_1.TouchableOpacity style={styles.retryPill} onPress={() => retryClip(item.local_id)}>
                            <react_native_1.Text style={styles.retryPillText}>Retry</react_native_1.Text>
                          </react_native_1.TouchableOpacity>) : null}
                      </react_native_1.TouchableOpacity>
                      <react_native_1.TouchableOpacity style={[
                            styles.clipShareIcon,
                            item.upload_status !== 'ready' && styles.clipShareIconDisabled,
                        ]} onPress={() => {
                            if (item.upload_status !== 'ready' || !item.server_id) {
                                react_native_toast_message_1.default.show({
                                    type: 'info',
                                    text1: 'Available once clip is ready.',
                                });
                                return;
                            }
                            setSelectedClipForSheet(item);
                            openSheet('clip-share');
                        }}>
                        <react_native_1.Text style={styles.clipShareIconText}>⎘</react_native_1.Text>
                      </react_native_1.TouchableOpacity>
                    </react_native_1.View>)}/>) : (<react_native_1.View style={styles.notesContent}>
                  {notes.map((note) => (<react_native_1.View key={note.id} style={[
                            styles.noteItem,
                            activeVoiceNoteId === note.id && styles.noteItemActivePlayback,
                        ]}>
                      <react_native_1.Text style={styles.noteTime}>{formatTimecode(note.timecode_ms)}</react_native_1.Text>
                      {note.audio_storage_path ? (<VoiceNoteRow_1.VoiceNoteRow noteId={note.id} audioStoragePath={note.audio_storage_path} isActive={activeVoiceNoteId === note.id} onRequestPlay={setActiveVoiceNoteId} onPlaybackEnded={handleVoiceNotePlaybackEnded}/>) : null}
                      <react_native_1.Text style={styles.noteText}>{note.text}</react_native_1.Text>
                      <react_native_1.TouchableOpacity style={styles.noteDelete} onPress={() => handleDeleteNote(note.id)}>
                        <react_native_1.Text style={styles.noteDeleteText}>✕</react_native_1.Text>
                      </react_native_1.TouchableOpacity>
                    </react_native_1.View>))}
                </react_native_1.View>)}
            </react_native_1.View>)}
        </react_native_1.View>
        </>)}

      {isFullyEmpty && (<react_native_1.View style={styles.emptyState}>
          <react_native_1.Text style={styles.emptyStatePrompt}>Add a reference video or start recording.</react_native_1.Text>
          <react_native_1.View style={styles.emptyStateActions}>
            <react_native_1.TouchableOpacity style={styles.emptyVideoBtn} onPress={() => router.push({ pathname: './youtube-player', params: { sessionId } })}>
              <react_native_1.Text style={styles.emptyVideoBtnText}>Add video →</react_native_1.Text>
            </react_native_1.TouchableOpacity>
            <react_native_1.TouchableOpacity style={styles.emptyRecordBtn} onPress={() => router.push({
                pathname: './camera',
                params: { id: sessionId, sectionName: activeSection },
            })}>
              <react_native_1.View style={styles.recordFabInner}/>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>
        </react_native_1.View>)}

      {!isFullyEmpty && (<react_native_1.TouchableOpacity style={styles.recordFab} activeOpacity={0.85} onPress={() => router.push({
                pathname: './camera',
                params: { id: sessionId, sectionName: activeSection },
            })}>
          <react_native_1.View style={styles.recordFabInner}/>
        </react_native_1.TouchableOpacity>)}
    </react_native_1.Pressable>);
}
exports.WorkbenchTab = WorkbenchTab;
const styles = react_native_1.StyleSheet.create({
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
        fontFamily: theme_1.theme.typography.monoFamily,
        fontSize: 11,
        color: colors.muted,
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
        fontFamily: theme_1.theme.typography.monoFamily,
        fontSize: 9,
        color: colors.muted,
    },
    toggleChipTextActive: {
        color: '#ffffff',
    },
    partitionHint: {
        fontFamily: theme_1.theme.typography.monoFamily,
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
        fontFamily: theme_1.theme.typography.monoFamily,
        fontSize: 11,
        color: '#b8b0a5',
    },
    sectionPillTextActive: {
        color: '#3a342d',
    },
    sectionPillCount: {
        fontFamily: theme_1.theme.typography.monoFamily,
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
        fontFamily: theme_1.theme.typography.monoFamily,
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
        fontFamily: theme_1.theme.typography.monoFamily,
        fontSize: 11,
        color: '#3a342d',
        fontWeight: '700',
    },
    sessionModeRowCount: {
        fontFamily: theme_1.theme.typography.monoFamily,
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
});
//# sourceMappingURL=WorkbenchTab.js.map