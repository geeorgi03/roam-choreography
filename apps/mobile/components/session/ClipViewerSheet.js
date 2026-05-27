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
exports.ClipViewerSheet = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const bottom_sheet_1 = __importDefault(require("@gorhom/bottom-sheet"));
const expo_av_1 = require("expo-av");
const SessionContext_1 = require("../../lib/contexts/SessionContext");
const useSession_1 = require("../../lib/hooks/useSession");
const theme_1 = require("../../lib/theme");
const api_1 = require("../../lib/api");
const react_native_toast_message_1 = __importDefault(require("react-native-toast-message"));
const LoopChipRow_1 = __importDefault(require("./LoopChipRow"));
const FeedbackSheet_1 = require("../FeedbackSheet");
const colors = theme_1.theme.light;
const nightColors = theme_1.theme.night;
exports.ClipViewerSheet = react_1.default.forwardRef(function ClipViewerSheet({ onClose }, ref) {
    const { selectedClipForSheet, activeSheetId, loopRegion, activeSection, sectionClips, setSectionClips, sessionId, jumpToSongMap, setQualityTarget, clips, notes, openClipSheet, setSelectedClipForSheet, } = (0, SessionContext_1.useSessionContext)();
    const { session } = (0, useSession_1.useSession)();
    const videoRef = (0, react_1.useRef)(null);
    const feedbackSheetRef = (0, react_1.useRef)(null);
    const feedbackSheetHandleRef = (0, react_1.useRef)(null);
    const positionMsRef = (0, react_1.useRef)(0);
    const [clipSpeed, setClipSpeed] = (0, react_1.useState)(1);
    const [playheadFraction, setPlayheadFraction] = (0, react_1.useState)(0);
    const [durationMs, setDurationMs] = (0, react_1.useState)(0);
    const [activeLoop, setActiveLoop] = (0, react_1.useState)(null);
    // Trim state
    const [trimStart, setTrimStart] = (0, react_1.useState)(null);
    const [trimEnd, setTrimEnd] = (0, react_1.useState)(null);
    const [isSavingSegment, setIsSavingSegment] = (0, react_1.useState)(false);
    const [isSavingMoment, setIsSavingMoment] = (0, react_1.useState)(false);
    const [progressBarWidth, setProgressBarWidth] = (0, react_1.useState)(0);
    const [saveSuccess, setSaveSuccess] = (0, react_1.useState)(false);
    // Coordinator useEffect
    (0, react_1.useEffect)(() => {
        if (activeSheetId !== 'clip-viewer') {
            ref?.current?.close();
        }
    }, [activeSheetId, ref]);
    (0, react_1.useEffect)(() => {
        positionMsRef.current = 0;
        setPlayheadFraction(0);
    }, [selectedClipForSheet?.local_id]);
    if (!selectedClipForSheet) {
        return null;
    }
    const selectedParentClipId = selectedClipForSheet.parent_clip_id ?? null;
    const selectedTriggeredByNoteId = selectedClipForSheet.triggered_by_note_id ?? null;
    const parentClip = selectedParentClipId
        ? clips.find((clip) => clip.server_id === selectedParentClipId) ?? null
        : null;
    const inspiredNote = selectedTriggeredByNoteId
        ? notes.find((note) => note.id === selectedTriggeredByNoteId) ?? null
        : null;
    const handleOpenParentClip = () => {
        if (!parentClip)
            return;
        if (activeSheetId === 'clip-viewer') {
            setSelectedClipForSheet(parentClip);
            return;
        }
        openClipSheet(parentClip);
    };
    const handleSkipBack = () => {
        if (videoRef.current) {
            videoRef.current.setPositionAsync(Math.max(0, positionMsRef.current - 5000));
        }
    };
    const handleSkipForward = () => {
        if (videoRef.current) {
            videoRef.current.setPositionAsync(positionMsRef.current + 5000);
        }
    };
    const handleSpeedToggle = () => {
        setClipSpeed(prev => prev === 1 ? 0.5 : 1);
    };
    const handleSetMoment = async () => {
        if (!selectedClipForSheet?.mux_playback_id || !selectedClipForSheet.server_id || !session?.access_token)
            return;
        setIsSavingMoment(true);
        try {
            const clip_url = selectedClipForSheet.mux_playback_id;
            const timestamp_ms = positionMsRef.current;
            const source_clip_id = selectedClipForSheet.server_id;
            const response = await fetch(`${api_1.API_BASE}/sessions/${sessionId}/quality-target`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ clip_url, timestamp_ms, source_clip_id }),
            });
            if (response.ok) {
                const data = await response.json();
                setQualityTarget(data.quality_target);
                react_native_toast_message_1.default.show({
                    type: 'success',
                    text1: 'Saved as your moment',
                    visibilityTime: 2000,
                });
                onClose();
            }
            else {
                react_native_1.Alert.alert('Save failed', await response.text());
            }
        }
        catch (error) {
            react_native_1.Alert.alert('Save failed', 'Clip must be synced first.');
            console.error('Failed to set quality target:', error);
        }
        finally {
            setIsSavingMoment(false);
        }
    };
    const handleLoopChipPress = (start) => {
        if (videoRef.current) {
            videoRef.current.setPositionAsync(start);
        }
    };
    const handleFeedbackSheetClose = () => {
        feedbackSheetRef.current?.close();
    };
    const handleClipViewerClose = () => {
        feedbackSheetHandleRef.current?.reset();
        feedbackSheetRef.current?.close();
        onClose();
    };
    const isClipInSession = selectedClipForSheet.server_id &&
        sectionClips.some(sc => sc.clip_id === selectedClipForSheet.server_id && sc.section_label === activeSection);
    const canGiveFeedback = Boolean(selectedClipForSheet.server_id) &&
        (selectedClipForSheet.clip_type === 'REF' || selectedClipForSheet.clip_type === 'MINE');
    // Determine if this is a MINE clip (can trim)
    const isMineClip = (selectedClipForSheet.clip_type === 'MINE' || selectedClipForSheet.clip_type == null) && selectedClipForSheet.mux_playback_id;
    const handleSaveToSession = async () => {
        if (!selectedClipForSheet.server_id || !session?.access_token)
            return;
        try {
            const response = await fetch(`${api_1.API_BASE}/sessions/${sessionId}/assembly/section-clip`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clip_id: selectedClipForSheet.server_id,
                    section_label: activeSection,
                }),
            });
            if (response.ok) {
                const newSectionClip = (await response.json());
                setSectionClips([...sectionClips, newSectionClip]);
                console.log('Clip saved to session');
            }
        }
        catch (error) {
            console.error('Error saving clip to session:', error);
        }
    };
    const handleSaveSegment = async () => {
        if (!selectedClipForSheet.server_id || !session?.access_token || trimStart === null || trimEnd === null)
            return;
        setIsSavingSegment(true);
        try {
            const startMs = Math.round(trimStart * durationMs);
            const endMs = Math.round(trimEnd * durationMs);
            const response = await fetch(`${api_1.API_BASE}/sessions/${sessionId}/clips/${selectedClipForSheet.server_id}/trim`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    start_ms: startMs,
                    end_ms: endMs,
                    section_label: activeSection,
                }),
            });
            if (response.ok) {
                const result = await response.json();
                const newSectionClip = result.sectionClip;
                // Update section clips if association was created
                if (newSectionClip) {
                    setSectionClips([...sectionClips, newSectionClip]);
                }
                setTrimStart(null);
                setTrimEnd(null);
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 2000);
                console.log('Segment saved successfully');
            }
            else {
                console.error('Failed to save segment:', await response.text());
            }
        }
        catch (error) {
            console.error('Error saving segment:', error);
        }
        finally {
            setIsSavingSegment(false);
        }
    };
    const handleInitializeTrim = () => {
        setTrimStart(0.1);
        setTrimEnd(0.9);
    };
    const createPanResponder = (isLeft) => {
        return react_native_1.PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => { },
            onPanResponderMove: (_, gestureState) => {
                if (progressBarWidth === 0)
                    return;
                const newFraction = (isLeft ? trimStart : trimEnd) + (gestureState.dx / progressBarWidth);
                const clampedFraction = Math.max(0, Math.min(1, newFraction));
                if (isLeft) {
                    setTrimStart(Math.min(clampedFraction, trimEnd || 1));
                }
                else {
                    setTrimEnd(Math.max(clampedFraction, trimStart || 0));
                }
            },
            onPanResponderRelease: () => { },
        });
    };
    const leftPanResponder = createPanResponder(true);
    const rightPanResponder = createPanResponder(false);
    const videoSource = selectedClipForSheet.mux_playback_id
        ? { uri: `https://stream.mux.com/${selectedClipForSheet.mux_playback_id}.m3u8` }
        : null;
    const handlePlaybackStatusUpdate = (status) => {
        if (!status.isLoaded) {
            positionMsRef.current = 0;
            setPlayheadFraction(0);
            setDurationMs(0);
            return;
        }
        positionMsRef.current = status.positionMillis;
        setDurationMs(status.durationMillis || 0);
        setPlayheadFraction(status.durationMillis ? status.positionMillis / status.durationMillis : 0);
    };
    const clipTypeBadge = selectedClipForSheet.clip_type === 'REF'
        ? { label: 'REF', backgroundColor: '#7db9a8' }
        : selectedClipForSheet.clip_type === 'MINE'
            ? { label: 'MINE', backgroundColor: '#e8a87c' }
            : null;
    return (<>
      <bottom_sheet_1.default ref={ref} index={-1} snapPoints={['50%', '85%']} enablePanDownToClose onClose={handleClipViewerClose}>
      {/* Dark zone */}
      <react_native_1.View style={styles.darkZone}>
        {/* Header */}
        <react_native_1.View style={styles.header}>
          <react_native_1.Text style={styles.clipLabel}>{selectedClipForSheet.label || 'Untitled Clip'}</react_native_1.Text>
          {clipTypeBadge && (<react_native_1.View style={[styles.typeBadge, { backgroundColor: clipTypeBadge.backgroundColor }]}>
              <react_native_1.Text style={styles.typeBadgeText}>{clipTypeBadge.label}</react_native_1.Text>
            </react_native_1.View>)}
          <react_native_1.View style={styles.mirrorPill}>
            <react_native_1.Text style={styles.mirrorPillText}>mirror</react_native_1.Text>
          </react_native_1.View>
        </react_native_1.View>

        {/* Video */}
        <react_native_1.View style={styles.videoContainer}>
          {videoSource ? (<expo_av_1.Video ref={videoRef} source={videoSource} style={styles.video} useNativeControls resizeMode="contain" shouldPlay={false} rate={clipSpeed} onPlaybackStatusUpdate={handlePlaybackStatusUpdate}/>) : (<react_native_1.View style={styles.processingPlaceholder}>
              <react_native_1.Text style={styles.processingText}>processing...</react_native_1.Text>
            </react_native_1.View>)}
        </react_native_1.View>

        {/* Progress bar with trim handles */}
        <react_native_1.View style={styles.progressBar} onLayout={(e) => setProgressBarWidth(e.nativeEvent.layout.width)}>
          {/* Loop region overlay */}
          {activeLoop && durationMs > 0 && (<react_native_1.View style={[
                styles.loopRegion,
                {
                    left: `${(activeLoop.start_ms / durationMs) * 100}%`,
                    width: `${((activeLoop.end_ms - activeLoop.start_ms) / durationMs) * 100}%`,
                    backgroundColor: activeLoop.color + '59', // 35% opacity
                },
            ]}>
              {/* Edge lines */}
              <react_native_1.View style={[styles.loopEdgeLine, { backgroundColor: activeLoop.color, left: 0 }]}/>
              <react_native_1.View style={[styles.loopEdgeLine, { backgroundColor: activeLoop.color, right: 0 }]}/>
            </react_native_1.View>)}
          
          {/* Trim region overlay */}
          {isMineClip && trimStart !== null && trimEnd !== null && (<react_native_1.View style={[
                styles.trimRegion,
                {
                    left: `${trimStart * 100}%`,
                    width: `${(trimEnd - trimStart) * 100}%`,
                },
            ]}/>)}
          
          {/* Trim handles */}
          {isMineClip && trimStart !== null && trimEnd !== null && (<>
              <react_native_1.View style={[
                styles.trimHandle,
                { left: `${trimStart * 100}%` },
            ]} {...leftPanResponder.panHandlers}/>
              <react_native_1.View style={[
                styles.trimHandle,
                { right: `${(1 - trimEnd) * 100}%` },
            ]} {...rightPanResponder.panHandlers}/>
            </>)}
          
          <react_native_1.View style={[styles.progressFill, { width: `${playheadFraction * 100}%` }]}/>
        </react_native_1.View>

        {/* Skip row */}
        <react_native_1.View style={styles.skipRow}>
          <react_native_1.TouchableOpacity style={styles.skipButton} onPress={handleSkipBack}>
            <react_native_1.Text style={styles.skipButtonText}>-5s</react_native_1.Text>
          </react_native_1.TouchableOpacity>
          <react_native_1.TouchableOpacity style={styles.speedButton} onPress={handleSpeedToggle}>
            <react_native_1.Text style={styles.speedButtonText}>{clipSpeed}×</react_native_1.Text>
          </react_native_1.TouchableOpacity>
          <react_native_1.TouchableOpacity style={styles.skipButton} onPress={handleSkipForward}>
            <react_native_1.Text style={styles.skipButtonText}>+5s</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>
      </react_native_1.View>

      {/* Light zone */}
        <react_native_1.View style={styles.lightZone}>
        {(parentClip || inspiredNote) && (<react_native_1.View style={styles.lineageContainer}>
            {parentClip && (<react_native_1.TouchableOpacity style={styles.parentClipRow} onPress={handleOpenParentClip}>
                <react_native_1.Text style={styles.parentClipText}>
                  From: <react_native_1.Text style={styles.parentClipLabel}>{parentClip.label || 'Untitled Clip'}</react_native_1.Text> {'\u2192'}
                </react_native_1.Text>
              </react_native_1.TouchableOpacity>)}
            {inspiredNote && (<react_native_1.View style={styles.inspiredNoteRow}>
                <react_native_1.Text style={styles.inspiredNoteText}>
                  Inspired by note: {inspiredNote.text}
                </react_native_1.Text>
              </react_native_1.View>)}
          </react_native_1.View>)}
        {/* Loop chips */}
        <LoopChipRow_1.default sessionId={sessionId} sourceUrl={selectedClipForSheet?.mux_playback_id ? `https://stream.mux.com/${selectedClipForSheet.mux_playback_id}` : null} currentPositionMs={positionMsRef.current} onSeek={handleLoopChipPress} onActiveLoopChange={setActiveLoop}/>

        {/* Save row */}
          <react_native_1.View style={styles.saveRow}>
          <react_native_1.TouchableOpacity style={[
            styles.saveButton,
            isClipInSession && styles.saveButtonDisabled
        ]} onPress={handleSaveToSession} disabled={isClipInSession}>
            <react_native_1.Text style={[
            styles.saveButtonText,
            isClipInSession && styles.saveButtonTextDisabled
        ]}>
              {isClipInSession ? 'already in session' : 'save to session'}
            </react_native_1.Text>
          </react_native_1.TouchableOpacity>

          <react_native_1.TouchableOpacity style={[
            styles.momentButton,
            (!selectedClipForSheet?.server_id || isSavingMoment) && styles.momentButtonDisabled
        ]} onPress={handleSetMoment} disabled={!selectedClipForSheet?.server_id || isSavingMoment}>
            <react_native_1.Text style={styles.momentButtonText}>{isSavingMoment ? 'saving...' : 'the moment →'}</react_native_1.Text>
          </react_native_1.TouchableOpacity>
          
          {/* Trim controls */}
            {isMineClip && (<>
                {trimStart === null && trimEnd === null ? (<react_native_1.TouchableOpacity style={styles.setTrimButton} onPress={handleInitializeTrim}>
                    <react_native_1.Text style={styles.setTrimButtonText}>set trim</react_native_1.Text>
                  </react_native_1.TouchableOpacity>) : (<react_native_1.TouchableOpacity style={[
                    styles.saveSegmentButton,
                    isSavingSegment && styles.saveSegmentButtonDisabled
                ]} onPress={handleSaveSegment} disabled={isSavingSegment}>
                    <react_native_1.Text style={styles.saveSegmentButtonText}>
                      {saveSuccess ? 'saved ✓' : (isSavingSegment ? 'saving...' : 'save segment')}
                    </react_native_1.Text>
                  </react_native_1.TouchableOpacity>)}
              </>)}

            {canGiveFeedback && (<react_native_1.TouchableOpacity style={styles.feedbackButton} onPress={() => feedbackSheetRef.current?.expand()}>
                <react_native_1.Text style={styles.feedbackButtonText}>Give feedback</react_native_1.Text>
              </react_native_1.TouchableOpacity>)}
          </react_native_1.View>
        </react_native_1.View>
      </bottom_sheet_1.default>
      <FeedbackSheet_1.FeedbackSheet ref={feedbackSheetHandleRef} bottomSheetRef={feedbackSheetRef} sessionId={sessionId} clipId={selectedClipForSheet.server_id ?? ''} onClose={handleFeedbackSheetClose}/>
    </>);
});
const styles = react_native_1.StyleSheet.create({
    darkZone: {
        backgroundColor: nightColors.ground,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 16,
        paddingBottom: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    clipLabel: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
    },
    mirrorPill: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    mirrorPillText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
    },
    typeBadge: {
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 6,
    },
    typeBadgeText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '700',
        fontFamily: theme_1.theme.typography.monoFamily,
    },
    videoContainer: {
        height: 200,
        backgroundColor: '#000',
        borderRadius: 8,
        marginBottom: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    video: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    processingPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    processingText: {
        color: '#ffffff',
        fontSize: 14,
        opacity: 0.7,
    },
    progressBar: {
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 1,
        marginBottom: 16,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#7DB9A8',
        borderRadius: 1,
    },
    loopRegion: {
        position: 'absolute',
        top: 0,
        height: '100%',
        borderRadius: 1,
    },
    loopEdgeLine: {
        position: 'absolute',
        top: -3,
        width: 3,
        height: 8,
        borderRadius: 1,
    },
    skipRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    skipButton: {
        width: 50,
        height: 32,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    skipButtonText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
    },
    speedButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 16,
    },
    speedButtonText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
    },
    lightZone: {
        backgroundColor: colors.ground,
        padding: 16,
        paddingTop: 8,
    },
    lineageContainer: {
        borderTopWidth: 0.5,
        borderTopColor: '#e8e3dc',
        paddingTop: 10,
        marginBottom: 12,
        gap: 8,
    },
    parentClipRow: {
        paddingVertical: 2,
    },
    parentClipText: {
        color: colors.muted,
        fontSize: 13,
    },
    parentClipLabel: {
        color: colors.active,
        fontWeight: '700',
    },
    inspiredNoteRow: {
        paddingVertical: 2,
    },
    inspiredNoteText: {
        color: colors.muted,
        fontSize: 13,
        fontStyle: 'italic',
    },
    loopChipsContainer: {
        marginBottom: 16,
    },
    loopChip: {
        backgroundColor: colors.mineBg,
        borderWidth: 1,
        borderColor: colors.mine,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
    },
    loopChipText: {
        color: colors.mine,
        fontSize: 12,
        fontWeight: '600',
    },
    saveRow: {
        gap: 12,
    },
    saveButton: {
        backgroundColor: '#7DB9A8',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: colors.chrome,
        opacity: 0.5,
    },
    saveButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
    saveButtonTextDisabled: {
        color: colors.muted,
    },
    momentButton: {
        borderWidth: 1,
        borderColor: colors.amber,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    momentButtonDisabled: {
        opacity: 0.5,
    },
    momentButtonText: {
        color: colors.amber,
        fontSize: 14,
        fontStyle: 'italic',
        fontWeight: '600',
    },
    feedbackButton: {
        borderWidth: 1,
        borderColor: colors.mine,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    feedbackButtonText: {
        color: colors.mine,
        fontSize: 14,
        fontWeight: '600',
    },
    trimHandle: {
        position: 'absolute',
        top: -11,
        width: 12,
        height: 24,
        backgroundColor: colors.amber,
        borderRadius: 6,
        zIndex: 10,
    },
    trimRegion: {
        position: 'absolute',
        top: 0,
        height: '100%',
        backgroundColor: colors.amber + '40', // 25% opacity
        borderRadius: 1,
    },
    setTrimButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.amber,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    setTrimButtonText: {
        color: colors.amber,
        fontSize: 14,
        fontWeight: '600',
    },
    saveSegmentButton: {
        backgroundColor: colors.amber,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveSegmentButtonDisabled: {
        opacity: 0.5,
    },
    saveSegmentButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
});
//# sourceMappingURL=ClipViewerSheet.js.map