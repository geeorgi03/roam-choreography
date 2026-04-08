import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Video, AVPlaybackStatus, ResizeMode } from 'expo-av';
import type { ClipRow } from '../../lib/database';
import type { Loop } from '@roam/types';
import { theme } from '../../lib/theme';
import LoopChipRow from './LoopChipRow';

const colors = theme.light;
const nightColors = theme.night;

interface ClipViewerSheetStandaloneProps {
  clip: ClipRow | null;
  sessionId: string | null;
  onClose: () => void;
}

export const ClipViewerSheetStandalone = React.forwardRef<BottomSheet, ClipViewerSheetStandaloneProps>(
  function ClipViewerSheetStandalone({ clip, sessionId, onClose }, ref) {
    const videoRef = useRef<Video>(null);
    const positionMsRef = useRef<number>(0);
    const [clipSpeed, setClipSpeed] = useState(1);
    const [playheadFraction, setPlayheadFraction] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [durationMs, setDurationMs] = useState(0);
    const [activeLoop, setActiveLoop] = useState<Loop | null>(null);

    useEffect(() => {
      positionMsRef.current = 0;
      setPlayheadFraction(0);
      setPlaying(false);
    }, [clip?.local_id]);

    // Always render the BottomSheet, but show empty content when no clip
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
      const newSpeed = clipSpeed === 1 ? 0.5 : 1;
      setClipSpeed(newSpeed);
      if (videoRef.current) {
        videoRef.current.setRateAsync(newSpeed, true);
      }
    };

    const handlePlayPause = async () => {
      if (videoRef.current) {
        if (playing) {
          await videoRef.current.pauseAsync();
        } else {
          await videoRef.current.playAsync();
        }
        setPlaying(!playing);
      }
    };

    const videoSource = clip?.mux_playback_id
      ? { uri: `https://stream.mux.com/${clip.mux_playback_id}.m3u8` }
      : null;

    const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
      if (!status.isLoaded) {
        positionMsRef.current = 0;
        setPlayheadFraction(0);
        setPlaying(false);
        setDurationMs(0);
        return;
      }

      positionMsRef.current = status.positionMillis;
      setDurationMs(status.durationMillis || 0);
      setPlayheadFraction(status.durationMillis ? status.positionMillis / status.durationMillis : 0);
      setPlaying(status.isPlaying);
    };

    const handleLoopChipPress = (start: number) => {
      if (videoRef.current) {
        videoRef.current.setPositionAsync(start);
      }
    };

    const clipTypeBadge =
      clip?.clip_type === 'REF'
        ? { label: 'REF', backgroundColor: '#7db9a8' }
        : clip?.clip_type === 'MINE'
          ? { label: 'MINE', backgroundColor: '#e8a87c' }
          : null;

    const renderBackdrop = (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={['50%', '85%']}
        enablePanDownToClose
        onClose={onClose}
        backdropComponent={renderBackdrop}
      >
        {clip ? (
          <>
            {/* Dark zone */}
            <View style={styles.darkZone}>
              <View style={styles.header}>
                <Text style={styles.clipLabel}>{clip.label || 'Untitled Clip'}</Text>
                {clipTypeBadge && (
                  <View style={[styles.typeBadge, { backgroundColor: clipTypeBadge.backgroundColor }]}>
                    <Text style={styles.typeBadgeText}>{clipTypeBadge.label}</Text>
                  </View>
                )}
                <View style={styles.libraryPill}>
                  <Text style={styles.libraryPillText}>library</Text>
                </View>
              </View>
              <View style={styles.videoContainer}>
                {videoSource ? (
                  <Video
                    ref={videoRef}
                    source={videoSource}
                    style={styles.video}
                    useNativeControls={false}
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
              {/* Controls row: -5s | Play/Pause | speed | +5s */}
              <View style={styles.controlsRow}>
                <TouchableOpacity style={styles.skipButton} onPress={handleSkipBack}>
                  <Text style={styles.skipButtonText}>-5s</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
                  <Text style={styles.playButtonText}>{playing ? 'Pause' : 'Play'}</Text>
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
              {/* Loop chips - only show if clip has source_url */}
              {clip?.mux_playback_id && (
                <LoopChipRow
                  sessionId={sessionId}
                  sourceUrl={`https://stream.mux.com/${clip.mux_playback_id}`}
                  currentPositionMs={positionMsRef.current}
                  onSeek={handleLoopChipPress}
                  onActiveLoopChange={setActiveLoop}
                />
              )}
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer} />
        )}
      </BottomSheet>
    );
  }
);

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
  libraryPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  libraryPillText: {
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
    fontFamily: theme.typography.monoFamily,
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
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
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
  playButton: {
    width: 60,
    height: 32,
    backgroundColor: '#7DB9A8',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
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
  emptyContainer: {
    flex: 1,
  },
});
