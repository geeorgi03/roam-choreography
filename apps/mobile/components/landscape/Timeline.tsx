import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, PanGestureHandler, State, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { theme } from '../../lib/theme';

export type TimelineClip = {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  color?: string;
  thumbnail?: string;
  isSelected?: boolean;
};

export type TimelineMarker = {
  id: string;
  time: number;
  label?: string;
  color?: string;
};

export type TimelineProps = {
  /** Timeline clips to display */
  clips: TimelineClip[];
  /** Timeline markers */
  markers?: TimelineMarker[];
  /** Total duration in milliseconds */
  duration: number;
  /** Current playback position */
  currentTime?: number;
  /** Zoom level (pixels per second) */
  zoom?: number;
  /** Show/hide ruler */
  showRuler?: boolean;
  /** Show/hide playhead */
  showPlayhead?: boolean;
  /** On clip press callback */
  onClipPress?: (clip: TimelineClip) => void;
  /** On timeline seek callback */
  onSeek?: (time: number) => void;
  /** On clip select callback */
  onClipSelect?: (clip: TimelineClip) => void;
  /** Additional styles */
  style?: any;
};

/**
 * Professional Horizontal Timeline for A3 Landscape Mode
 * 
 * Matches the App Build reference design with:
 * - Horizontal clip arrangement
 * - Professional time ruler
 * - Draggable playhead
 * - Clip selection and manipulation
 * - Zoom and scroll capabilities
 */
export function Timeline({
  clips,
  markers = [],
  duration,
  currentTime = 0,
  zoom = 50, // pixels per second
  showRuler = true,
  showPlayhead = true,
  onClipPress,
  onSeek,
  onClipSelect,
  style,
}: TimelineProps) {
  const { colors } = useTheme();
  const scrollViewRef = useRef<any>(null);
  const [selectedClips, setSelectedClips] = useState<Set<string>>(new Set());
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  
  // Animation values
  const playheadX = useRef(new Animated.Value(0)).current;
  const timelineWidth = useRef(0);

  const styles = createTimelineStyles(colors);

  // Calculate position from time
  const timeToX = (time: number) => (time / 1000) * zoom;

  // Calculate time from position
  const xToTime = (x: number) => (x / zoom) * 1000;

  // Update playhead position when currentTime changes
  useEffect(() => {
    const x = timeToX(currentTime);
    playheadX.setValue(x);
    
    // Auto-scroll to keep playhead visible
    if (scrollViewRef.current && timelineWidth.current > 0) {
      const scrollX = Math.max(0, x - timelineWidth.current / 2);
      scrollViewRef.current.scrollTo({ x: scrollX, animated: true });
    }
  }, [currentTime, zoom, playheadX]);

  const handleClipPress = (clip: TimelineClip) => {
    if (onClipPress) {
      onClipPress(clip);
    }
    
    // Toggle selection
    const newSelected = new Set(selectedClips);
    if (newSelected.has(clip.id)) {
      newSelected.delete(clip.id);
    } else {
      newSelected.add(clip.id);
    }
    setSelectedClips(newSelected);
    onClipSelect?.(clip);
  };

  const handleTimelinePress = (event: any) => {
    const { locationX } = event.nativeEvent;
    const time = xToTime(locationX);
    onSeek?.(Math.max(0, Math.min(duration, time)));
  };

  const handlePlayheadGesture = (event: any) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      const { absoluteX } = event.nativeEvent;
      const time = xToTime(absoluteX);
      onSeek?.(Math.max(0, Math.min(duration, time)));
    }
  };

  const formatTime = (time: number) => {
    const totalSeconds = Math.floor(time / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderRuler = () => {
    const rulerHeight = 30;
    const majorInterval = 10; // seconds
    const minorInterval = 1; // seconds
    const rulerWidth = timeToX(duration) + 100; // Extra space for scrolling

    const majorMarks = [];
    const minorMarks = [];

    // Generate major marks
    for (let time = 0; time <= duration / 1000; time += majorInterval) {
      const x = timeToX(time * 1000);
      majorMarks.push(
        <View key={`major-${time}`} style={[styles.rulerMark, { left: x }]}>
          <View style={styles.rulerMajorLine} />
          <Text style={styles.rulerText}>{formatTime(time * 1000)}</Text>
        </View>
      );
    }

    // Generate minor marks
    for (let time = 0; time <= duration / 1000; time += minorInterval) {
      if (time % majorInterval !== 0) {
        const x = timeToX(time * 1000);
        minorMarks.push(
          <View key={`minor-${time}`} style={[styles.rulerMinorLine, { left: x }]} />
        );
      }
    }

    return (
      <View style={[styles.ruler, { height: rulerHeight }]}>
        <View style={[styles.rulerTrack, { width: rulerWidth }]}>
          {minorMarks}
          {majorMarks}
        </View>
      </View>
    );
  };

  const renderClips = () => {
    const trackHeight = 60;
    const trackGap = 8;
    const timelineHeight = clips.length * (trackHeight + trackGap);

    return (
      <View style={[styles.clipTracks, { height: timelineHeight }]}>
        {clips.map((clip, index) => {
          const x = timeToX(clip.startTime);
          const width = timeToX(clip.duration);
          const y = index * (trackHeight + trackGap);
          const isSelected = selectedClips.has(clip.id);

          return (
            <TouchableOpacity
              key={clip.id}
              style={[
                styles.clip,
                {
                  left: x,
                  width: Math.max(width, 40), // Minimum width for visibility
                  top: y,
                  height: trackHeight,
                  backgroundColor: clip.color || colors.primary,
                },
                isSelected && styles.clipSelected,
              ]}
              onPress={() => handleClipPress(clip)}
              activeOpacity={0.8}
            >
              <Text style={styles.clipName} numberOfLines={1}>
                {clip.name}
              </Text>
              <Text style={styles.clipDuration}>
                {formatTime(clip.duration)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderMarkers = () => {
    return (
      <View style={styles.markers}>
        {markers.map((marker) => {
          const x = timeToX(marker.time);
          return (
            <View
              key={marker.id}
              style={[
                styles.marker,
                { left: x, backgroundColor: marker.color || colors.warning },
              ]}
            >
              {marker.label && (
                <Text style={styles.markerLabel}>{marker.label}</Text>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderPlayhead = () => {
    if (!showPlayhead) return null;

    return (
      <PanGestureHandler onGestureEvent={handlePlayheadGesture}>
        <Animated.View
          style={[
            styles.playhead,
            {
              transform: [{ translateX: playheadX }],
            },
          ]}
        >
          <View style={styles.playheadLine} />
          <View style={styles.playheadHandle} />
        </Animated.View>
      </PanGestureHandler>
    );
  };

  const timelineWidth = Math.max(timeToX(duration) + 200, 800); // Minimum width + scroll space

  return (
    <View style={[styles.container, style]}>
      {/* Timeline Header */}
      <View style={styles.timelineHeader}>
        <Text style={styles.timelineTitle}>Timeline</Text>
        <View style={styles.timelineControls}>
          <TouchableOpacity style={styles.zoomButton} activeOpacity={0.7}>
            <Text style={styles.zoomButtonText}>Zoom In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomButton} activeOpacity={0.7}>
            <Text style={styles.zoomButtonText}>Zoom Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Timeline Content */}
      <View style={styles.timelineContent}>
        {/* Ruler */}
        {showRuler && renderRuler()}

        {/* Timeline Tracks */}
        <View
          style={styles.timelineTrack}
          onLayout={(event) => {
            timelineWidth.current = event.nativeEvent.layout.width;
          }}
        >
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ width: timelineWidth }}
          >
            <TouchableOpacity
              style={styles.timelineBackground}
              onPress={handleTimelinePress}
              activeOpacity={1}
            >
              {renderClips()}
              {renderMarkers()}
              {renderPlayhead()}
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Time Display */}
        <View style={styles.timeDisplay}>
          <Text style={styles.timeText}>
            Current: {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function createTimelineStyles(colors: any) {
  return StyleSheet.create({
    container: {
      height: theme.landscape.timeline.height,
      backgroundColor: theme.landscape.timeline.backgroundColor,
      borderTopWidth: 1,
      borderTopColor: theme.landscape.timeline.borderTop,
      padding: theme.landscape.timeline.padding,
    },
    timelineHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.landscape.spacing.timelineGap,
    },
    timelineTitle: {
      fontSize: theme.landscape.typography.timelineLabel.fontSize,
      fontWeight: theme.landscape.typography.timelineLabel.fontWeight,
      color: theme.landscape.typography.timelineLabel.color,
    },
    timelineControls: {
      flexDirection: 'row',
      gap: 8,
    },
    zoomButton: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: colors.chrome,
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: 4,
    },
    zoomButtonText: {
      fontSize: 12,
      color: colors.active,
    },
    timelineContent: {
      flex: 1,
    },
    ruler: {
      marginBottom: 4,
    },
    rulerTrack: {
      height: '100%',
      position: 'relative',
    },
    rulerMark: {
      position: 'absolute',
      alignItems: 'center',
    },
    rulerMajorLine: {
      width: 1,
      height: 20,
      backgroundColor: colors.borderStrong,
    },
    rulerMinorLine: {
      width: 1,
      height: 10,
      backgroundColor: colors.borderLight,
    },
    rulerText: {
      fontSize: 10,
      color: colors.muted,
      marginTop: 2,
    },
    timelineTrack: {
      flex: 1,
      position: 'relative',
      backgroundColor: colors.chrome,
      borderRadius: 4,
    },
    timelineBackground: {
      flex: 1,
      minHeight: 100,
      position: 'relative',
    },
    clipTracks: {
      position: 'relative',
      paddingVertical: 8,
    },
    clip: {
      position: 'absolute',
      borderRadius: 4,
      padding: 8,
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    clipSelected: {
      borderWidth: 2,
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    clipName: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFFFFF',
      marginBottom: 2,
    },
    clipDuration: {
      fontSize: 10,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    markers: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    marker: {
      position: 'absolute',
      width: 2,
      height: '100%',
      borderRadius: 1,
    },
    markerLabel: {
      position: 'absolute',
      top: -20,
      left: 4,
      fontSize: 10,
      color: colors.muted,
      backgroundColor: colors.chrome,
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 2,
    },
    playhead: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 20,
      marginLeft: -10,
      alignItems: 'center',
      zIndex: 10,
    },
    playheadLine: {
      width: 2,
      height: '100%',
      backgroundColor: theme.landscape.toolColors.playhead,
      borderRadius: 1,
    },
    playheadHandle: {
      position: 'absolute',
      top: -4,
      width: 20,
      height: 12,
      backgroundColor: theme.landscape.toolColors.playhead,
      borderRadius: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 3,
    },
    timeDisplay: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    timeText: {
      fontSize: theme.landscape.typography.timelineLabel.fontSize,
      fontWeight: theme.landscape.typography.timelineLabel.fontWeight,
      color: theme.landscape.typography.timelineLabel.color,
    },
  });
}

export default Timeline;
