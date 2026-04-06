import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { Video, AVPlaybackStatus } from 'expo-av';
import { SectionClip, Loop } from '@roam/types';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { useSession } from '../../lib/hooks/useSession';
import { theme } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { API_BASE } from '../../lib/api';
import LoopChipRow from './LoopChipRow';

const colors = theme.light;
const nightColors = theme.night;

interface ClipViewerSheetProps {
  onClose: () => void;
}

export const ClipViewerSheet = React.forwardRef<BottomSheet, ClipViewerSheetProps>(function ClipViewerSheet({ onClose }, ref) {
  const { selectedClipForSheet, activeSheetId, loopRegion, activeSection, sectionClips, setSectionClips, sessionId, jumpToSongMap } = useSessionContext();
  const { session } = useSession();
  const videoRef = useRef<Video>(null);
  const positionMsRef = useRef<number>(0);
  const [clipSpeed, setClipSpeed] = useState(1);
  const [playheadFraction, setPlayheadFraction] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [activeLoop, setActiveLoop] = useState<Loop | null>(null);

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

  const handleLoopChipPress = (start: number) => {
    if (videoRef.current) {
      videoRef.current.setPositionAsync(start);
    }
  };

  const isClipInSession = selectedClipForSheet.server_id && 
    sectionClips.some(sc => sc.clip_id === selectedClipForSheet.server_id && sc.section_label === activeSection);

  const handleSaveToSession = async () => {
    if (!selectedClipForSheet.server_id || !session?.access_token) return;
    
    try {
      const response = await fetch(`${API_BASE}/sessions/${sessionId}/assembly/section-clip`, {
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

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={['50%', '85%']}
      enablePanDownToClose
      onClose={onClose}
    >
      {/* Dark zone */}
      <View style={styles.darkZone}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.clipLabel}>{selectedClipForSheet.label || 'Untitled Clip'}</Text>
          <View style={styles.mirrorPill}>
            <Text style={styles.mirrorPillText}>mirror</Text>
          </View>
        </View>

        {/* Video */}
        <View style={styles.videoContainer}>
          {videoSource ? (
            <Video
              ref={videoRef}
              source={videoSource}
              style={styles.video}
              useNativeControls
              resizeMode="contain"
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

        {/* Progress bar */}
        <View style={styles.progressBar}>
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
      <View style={styles.lightZone}>
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

          <TouchableOpacity style={styles.momentButton} onPress={jumpToSongMap}>
            <Text style={styles.momentButtonText}>the moment →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
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
  momentButtonText: {
    color: colors.amber,
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '600',
  },
});
