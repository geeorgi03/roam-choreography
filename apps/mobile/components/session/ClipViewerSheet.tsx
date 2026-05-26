import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, PanResponder, Alert } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { Video, AVPlaybackStatus, ResizeMode } from 'expo-av';
import { SectionClip, Loop } from '@roam/types';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { useSession } from '../../lib/hooks/useSession';
import type { NotePin } from '../../lib/hooks/useNotePins';
import { theme } from '../../lib/theme';
import { useTheme, type ThemePalette } from '../../lib/contexts/ThemeContext';
import { PremiumClipActionBar } from '../premium-workbench/PremiumClipActionBar';
import { PremiumOtherTakesRow } from '../premium-workbench/PremiumOtherTakesRow';
import { supabase } from '../../lib/supabase';
import { apiRequest } from '../../lib/api';
import Toast from 'react-native-toast-message';
import LoopChipRow from './LoopChipRow';
import { FeedbackSheet, type FeedbackSheetHandle } from '../FeedbackSheet';
import { TagSheet } from '../TagSheet';
import { TagHistorySheet } from '../../components/TagHistorySheet';
import type { ClipRow } from '../../lib/database';

const nightColors = theme.night;
const staticLight = theme.light;

interface ClipViewerSheetProps {
  onClose: () => void;
}

export const ClipViewerSheet = React.forwardRef<BottomSheet, ClipViewerSheetProps>(function ClipViewerSheet({ onClose }, ref) {
  const {
    selectedClipForSheet,
    activeSheetId,
    loopRegion,
    activeSection,
    sectionClips,
    setSectionClips,
    sessionId,
    jumpToSongMap,
    setQualityTarget,
    clips,
    notes,
    openClipSheet,
    setSelectedClipForSheet,
    refreshCount,
    openSheet,
  } = useSessionContext();
  const { colors } = useTheme();
  const lightStyles = useMemo(() => createLightStyles(colors), [colors]);
  const { session } = useSession();
  const videoRef = useRef<Video>(null);
  const feedbackSheetRef = useRef<BottomSheet>(null);
  const feedbackSheetHandleRef = useRef<FeedbackSheetHandle>(null);
  const tagSheetRef = useRef<BottomSheet | null>(null);
  const tagHistorySheetRef = useRef<BottomSheet | null>(null);
  const positionMsRef = useRef<number>(0);
  const [clipSpeed, setClipSpeed] = useState(1);
  const [playheadFraction, setPlayheadFraction] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [activeLoop, setActiveLoop] = useState<Loop | null>(null);
  
  // Trim state
  const [trimStart, setTrimStart] = useState<number | null>(null);
  const [trimEnd, setTrimEnd] = useState<number | null>(null);
  const [isSavingSegment, setIsSavingSegment] = useState(false);
  const [isSavingMoment, setIsSavingMoment] = useState(false);
  const [progressBarWidth, setProgressBarWidth] = useState(0);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Coordinator useEffect
  useEffect(() => {
    if (activeSheetId !== 'clip-viewer') {
      (ref as React.RefObject<BottomSheet | null>)?.current?.close();
    }
  }, [activeSheetId, ref]);

  useEffect(() => {
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
    ? (notes as NotePin[]).find((note) => note.id === selectedTriggeredByNoteId) ?? null
    : null;
  const handleOpenParentClip = () => {
    if (!parentClip) return;
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
    if (!selectedClipForSheet?.mux_playback_id || !selectedClipForSheet.server_id || !session?.access_token) return;
    
    setIsSavingMoment(true);
    
    try {
      const clip_url = selectedClipForSheet.mux_playback_id;
      const timestamp_ms = positionMsRef.current;
      const source_clip_id = selectedClipForSheet.server_id;
      
      const response = await apiRequest(`/sessions/${sessionId}/quality-target`, {
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
        Toast.show({
          type: 'success',
          text1: 'Saved as your moment',
          visibilityTime: 2000,
        });
        onClose();
      } else {
        Alert.alert('Save failed', await response.text());
      }
    } catch (error) {
      Alert.alert('Save failed', 'Clip must be synced first.');
      console.error('Failed to set quality target:', error);
    } finally {
      setIsSavingMoment(false);
    }
  };

  const handleLoopChipPress = (start: number) => {
    if (videoRef.current) {
      videoRef.current.setPositionAsync(start);
    }
  };

  const handleFeedbackSheetClose = () => {
    feedbackSheetRef.current?.close();
    // Reconcile any new feedback/comments after submit to keep sheet state fresh.
    refreshCount().catch(() => {});
  };

  const handleClipViewerClose = () => {
    feedbackSheetHandleRef.current?.reset();
    feedbackSheetRef.current?.close();
    onClose();
  };

  const isClipInSession = Boolean(
    selectedClipForSheet.server_id &&
      sectionClips.some(
        (sc) => sc.clip_id === selectedClipForSheet.server_id && sc.section_label === activeSection
      )
  );
  const canGiveFeedback =
    Boolean(selectedClipForSheet.server_id) &&
    (selectedClipForSheet.clip_type === 'REF' || selectedClipForSheet.clip_type === 'MINE');
  
  // Determine if this is a MINE clip (can trim)
  const isMineClip = (selectedClipForSheet.clip_type === 'MINE' || selectedClipForSheet.clip_type == null) && selectedClipForSheet.mux_playback_id;

  const sectionTakeClips = useMemo(() => {
    const ids = new Set(
      sectionClips
        .filter((sc) => sc.section_label === activeSection)
        .map((sc) => sc.clip_id)
    );
    return clips.filter((c) => c.server_id && ids.has(c.server_id));
  }, [clips, sectionClips, activeSection]);

  const takeIndex = Math.max(
    0,
    sectionTakeClips.findIndex(
      (c) =>
        c.local_id === selectedClipForSheet.local_id ||
        c.server_id === selectedClipForSheet.server_id
    )
  );

  const handleLoopAction = () => {
    if (activeLoop && videoRef.current) {
      void videoRef.current.setPositionAsync(activeLoop.start_ms);
      return;
    }
    if (loopRegion && videoRef.current) {
      void videoRef.current.setPositionAsync(loopRegion.start);
    }
  };

  const handleSaveToSession = async () => {
    if (!selectedClipForSheet.server_id || !session?.access_token) return;
    
    try {
      const response = await apiRequest(`/sessions/${sessionId}/assembly/section-clip`, {
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
        const newSectionClip = (await response.json()) as SectionClip;
        setSectionClips([...sectionClips, newSectionClip]);
        console.log('Clip saved to session');
      }
    } catch (error) {
      console.error('Error saving clip to session:', error);
    }
  };

  const handleSaveSegment = async () => {
    if (!selectedClipForSheet.server_id || !session?.access_token || trimStart === null || trimEnd === null) return;
    
    setIsSavingSegment(true);
    try {
      const startMs = Math.round(trimStart * durationMs);
      const endMs = Math.round(trimEnd * durationMs);
      
      const response = await apiRequest(`/sessions/${sessionId}/clips/${selectedClipForSheet.server_id}/trim`, {
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
      } else {
        console.error('Failed to save segment:', await response.text());
      }
    } catch (error) {
      console.error('Error saving segment:', error);
    } finally {
      setIsSavingSegment(false);
    }
  };

  const handleInitializeTrim = () => {
    setTrimStart(0.1);
    setTrimEnd(0.9);
  };

  const createPanResponder = (isLeft: boolean) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {},
      onPanResponderMove: (_, gestureState) => {
        if (progressBarWidth === 0) return;
        
        const currentEdge = isLeft ? (trimStart ?? 0) : (trimEnd ?? 1);
        const newFraction = currentEdge + (gestureState.dx / progressBarWidth);
        const clampedFraction = Math.max(0, Math.min(1, newFraction));
        
        if (isLeft) {
          setTrimStart(Math.min(clampedFraction, trimEnd || 1));
        } else {
          setTrimEnd(Math.max(clampedFraction, trimStart || 0));
        }
      },
      onPanResponderRelease: () => {},
    });
  };

  const leftPanResponder = createPanResponder(true);
  const rightPanResponder = createPanResponder(false);

  const videoSource = selectedClipForSheet.mux_playback_id
    ? { uri: `https://stream.mux.com/${selectedClipForSheet.mux_playback_id}.m3u8` }
    : null;

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
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

  const clipTypeBadge =
    selectedClipForSheet.clip_type === 'REF'
      ? { label: 'REF', backgroundColor: '#7db9a8' }
      : selectedClipForSheet.clip_type === 'MINE'
        ? { label: 'MINE', backgroundColor: '#e8a87c' }
        : null;

  return (
    <>
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={['50%', '85%']}
        enablePanDownToClose
        onClose={handleClipViewerClose}
      >
      {/* Dark zone */}
      <View style={styles.darkZone}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.takeMeta}>
              Take {String(takeIndex + 1).padStart(2, '0')} · {activeSection}
            </Text>
            <Text style={styles.clipLabel}>
              {selectedClipForSheet.label || activeSection}
            </Text>
          </View>
          {clipTypeBadge && (
            <View style={[styles.typeBadge, { backgroundColor: clipTypeBadge.backgroundColor }]}>
              <Text style={styles.typeBadgeText}>{clipTypeBadge.label}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.historyIconButton}
            onPress={() => tagHistorySheetRef.current?.snapToIndex(0)}
          >
            <Text style={styles.historyIconText}>🕘</Text>
          </TouchableOpacity>
        </View>

        {/* Video */}
        <View style={styles.videoContainer}>
          {videoSource ? (
            <Video
              ref={videoRef}
              source={videoSource}
              style={styles.video}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={false}
              rate={clipSpeed}
              onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            />
          ) : (
            <View style={styles.processingPlaceholder}>
              <Text style={styles.processingText}>processing...</Text>
            </View>
          )}
        </View>

        {/* Progress bar with trim handles */}
        <View 
          style={styles.progressBar}
          onLayout={(e) => setProgressBarWidth(e.nativeEvent.layout.width)}
        >
          {/* Loop region overlay */}
          {activeLoop && durationMs > 0 && (
            <View
              style={[
                styles.loopRegion,
                {
                  left: `${(activeLoop.start_ms / durationMs) * 100}%`,
                  width: `${((activeLoop.end_ms - activeLoop.start_ms) / durationMs) * 100}%`,
                  backgroundColor: activeLoop.color + '59', // 35% opacity
                },
              ]}
            >
              {/* Edge lines */}
              <View style={[styles.loopEdgeLine, { backgroundColor: activeLoop.color, left: 0 }]} />
              <View style={[styles.loopEdgeLine, { backgroundColor: activeLoop.color, right: 0 }]} />
            </View>
          )}
          
          {/* Trim region overlay */}
          {isMineClip && trimStart !== null && trimEnd !== null && (
            <View
              style={[
                styles.trimRegion,
                {
                  left: `${trimStart * 100}%`,
                  width: `${(trimEnd - trimStart) * 100}%`,
                },
              ]}
            />
          )}
          
          {/* Trim handles */}
          {isMineClip && trimStart !== null && trimEnd !== null && (
            <>
              <View
                style={[
                  styles.trimHandle,
                  { left: `${trimStart * 100}%` },
                ]}
                {...leftPanResponder.panHandlers}
              />
              <View
                style={[
                  styles.trimHandle,
                  { right: `${(1 - trimEnd) * 100}%` },
                ]}
                {...rightPanResponder.panHandlers}
              />
            </>
          )}
          
          <View 
            style={[styles.progressFill, { width: `${playheadFraction * 100}%` }]}
          />
        </View>

        {/* Skip row */}
        <View style={styles.skipRow}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkipBack}>
            <Text style={styles.skipButtonText}>-5s</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.speedButton} onPress={handleSpeedToggle}>
            <Text style={styles.speedButtonText}>{clipSpeed}×</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkipForward}>
            <Text style={styles.skipButtonText}>+5s</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Light zone */}
        <View style={lightStyles.lightZone}>
        <PremiumClipActionBar
          actions={[
            { key: 'loop', label: 'Loop', onPress: handleLoopAction },
            {
              key: 'trim',
              label: 'Trim',
              onPress: isMineClip
                ? trimStart === null
                  ? handleInitializeTrim
                  : handleSaveSegment
                : undefined,
              disabled: !isMineClip,
            },
            {
              key: 'share',
              label: 'Share',
              onPress: selectedClipForSheet.server_id
                ? () => openSheet('clip-share')
                : undefined,
              disabled: !selectedClipForSheet.server_id,
            },
            {
              key: 'keep',
              label: 'Keep',
              onPress: handleSaveToSession,
              disabled: isClipInSession,
            },
          ]}
        />
        <PremiumOtherTakesRow
          clips={sectionTakeClips.length > 0 ? sectionTakeClips : clips}
          activeClipId={selectedClipForSheet.local_id}
          sectionLabel={activeSection}
          onSelectClip={(clip) => setSelectedClipForSheet(clip)}
        />
        {(parentClip || inspiredNote) && (
          <View style={styles.lineageContainer}>
            {parentClip && (
              <TouchableOpacity style={styles.parentClipRow} onPress={handleOpenParentClip}>
                <Text style={styles.parentClipText}>
                  From: <Text style={styles.parentClipLabel}>{parentClip.label || 'Untitled Clip'}</Text> {'\u2192'}
                </Text>
              </TouchableOpacity>
            )}
            {inspiredNote && (
              <View style={styles.inspiredNoteRow}>
                <Text style={styles.inspiredNoteText}>
                  Inspired by note: {inspiredNote.text}
                </Text>
              </View>
            )}
          </View>
        )}
        {/* Loop chips */}
        <LoopChipRow
          sessionId={sessionId}
          sourceUrl={selectedClipForSheet?.mux_playback_id ? `https://stream.mux.com/${selectedClipForSheet.mux_playback_id}` : null}
          currentPositionMs={positionMsRef.current}
          onSeek={handleLoopChipPress}
          onActiveLoopChange={setActiveLoop}
        />

        {/* Save row */}
          <View style={styles.saveRow}>
          <TouchableOpacity
            style={styles.tagsButton}
            onPress={() => tagSheetRef.current?.snapToIndex(0)}
          >
            <Text style={styles.tagsButtonText}>Edit tags</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.saveButton,
              isClipInSession && styles.saveButtonDisabled
            ]}
            onPress={handleSaveToSession}
            disabled={isClipInSession}
          >
            <Text style={[
              styles.saveButtonText,
              isClipInSession && styles.saveButtonTextDisabled
            ]}>
              {isClipInSession ? 'already in session' : 'save to session'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.momentButton,
              (!selectedClipForSheet?.server_id || isSavingMoment) && styles.momentButtonDisabled
            ]} 
            onPress={handleSetMoment}
            disabled={!selectedClipForSheet?.server_id || isSavingMoment}
          >
            <Text style={styles.momentButtonText}>{isSavingMoment ? 'saving...' : 'the moment →'}</Text>
          </TouchableOpacity>
          
          {/* Trim controls */}
            {isMineClip && (
              <>
                {trimStart === null && trimEnd === null ? (
                  <TouchableOpacity style={styles.setTrimButton} onPress={handleInitializeTrim}>
                    <Text style={styles.setTrimButtonText}>set trim</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.saveSegmentButton,
                      isSavingSegment && styles.saveSegmentButtonDisabled
                    ]}
                    onPress={handleSaveSegment}
                    disabled={isSavingSegment}
                  >
                    <Text style={styles.saveSegmentButtonText}>
                      {saveSuccess ? 'saved ✓' : (isSavingSegment ? 'saving...' : 'save segment')}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {canGiveFeedback && (
              <TouchableOpacity
                style={styles.feedbackButton}
                onPress={() => feedbackSheetRef.current?.expand()}
              >
                <Text style={styles.feedbackButtonText}>Give feedback</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </BottomSheet>
      <FeedbackSheet
        ref={feedbackSheetHandleRef}
        bottomSheetRef={feedbackSheetRef}
        sessionId={sessionId}
        clipId={selectedClipForSheet.server_id ?? ''}
        onClose={handleFeedbackSheetClose}
      />
      <TagSheet
        clip={selectedClipForSheet}
        bottomSheetRef={tagSheetRef}
        onSaved={(updatedClip) => {
          setSelectedClipForSheet(updatedClip);
        }}
        musicTrackBpm={null}
      />
      <TagHistorySheet
        clip={selectedClipForSheet as ClipRow}
        bottomSheetRef={tagHistorySheetRef}
        onRestored={(updatedClip) => {
          setSelectedClipForSheet(updatedClip);
        }}
      />
    </>
  );
});

const styles = StyleSheet.create({
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
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTextBlock: { flex: 1, paddingRight: 8 },
  takeMeta: {
    fontFamily: theme.typography.monoFamily,
    fontSize: 10,
    color: 'rgba(244,235,214,0.5)',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  clipLabel: {
    color: '#ffffff',
    fontFamily: theme.typography.serifFamily ?? theme.typography.brandFamily,
    fontSize: 22,
    letterSpacing: -0.2,
    flex: 1,
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
    fontFamily: theme.typography.monoFamily,
  },
  historyIconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 6,
  },
  historyIconText: {
    color: '#ffffff',
    fontSize: 14,
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
    color: staticLight.muted,
    fontSize: 13,
  },
  parentClipLabel: {
    color: staticLight.active,
    fontWeight: '700',
  },
  inspiredNoteRow: {
    paddingVertical: 2,
  },
  inspiredNoteText: {
    color: staticLight.muted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  loopChipsContainer: {
    marginBottom: 16,
  },
  loopChip: {
    backgroundColor: staticLight.mineBg,
    borderWidth: 1,
    borderColor: staticLight.mine,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  loopChipText: {
    color: staticLight.mine,
    fontSize: 12,
    fontWeight: '600',
  },
  saveRow: {
    gap: 12,
  },
  tagsButton: {
    borderWidth: 1,
    borderColor: staticLight.border,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: staticLight.chrome,
  },
  tagsButtonText: {
    color: staticLight.active,
    fontSize: 13,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#7DB9A8',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: staticLight.chrome,
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: staticLight.muted,
  },
  momentButton: {
    borderWidth: 1,
    borderColor: staticLight.amber,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  momentButtonDisabled: {
    opacity: 0.5,
  },
  momentButtonText: {
    color: staticLight.amber,
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  feedbackButton: {
    borderWidth: 1,
    borderColor: staticLight.mine,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  feedbackButtonText: {
    color: staticLight.mine,
    fontSize: 14,
    fontWeight: '600',
  },
  trimHandle: {
    position: 'absolute',
    top: -11,
    width: 12,
    height: 24,
    backgroundColor: staticLight.amber,
    borderRadius: 6,
    zIndex: 10,
  },
  trimRegion: {
    position: 'absolute',
    top: 0,
    height: '100%',
    backgroundColor: staticLight.amber + '40', // 25% opacity
    borderRadius: 1,
  },
  setTrimButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: staticLight.amber,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  setTrimButtonText: {
    color: staticLight.amber,
    fontSize: 14,
    fontWeight: '600',
  },
  saveSegmentButton: {
    backgroundColor: staticLight.amber,
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

function createLightStyles(colors: ThemePalette) {
  return StyleSheet.create({
    lightZone: {
      backgroundColor: colors.ground,
      padding: 16,
      paddingTop: 8,
    },
    lineageContainer: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.hair ?? colors.border,
      paddingTop: 10,
      marginBottom: 12,
      gap: 8,
    },
    parentClipText: { color: colors.muted, fontSize: 13 },
    parentClipLabel: { color: colors.active, fontWeight: '700' },
    inspiredNoteText: { color: colors.muted, fontSize: 13, fontStyle: 'italic' },
  });
}
