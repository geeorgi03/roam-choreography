import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, type ViewStyle } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { theme } from '../../lib/theme';

export type CanvasAreaProps = {
  /** Video source URL */
  videoUri?: string;
  /** Canvas title */
  title?: string;
  /** Show/hide video controls */
  showControls?: boolean;
  /** Canvas content (alternative to video) */
  children?: React.ReactNode;
  /** Canvas mode */
  mode?: 'video' | 'timeline' | 'grid' | 'loupe';
  /** Additional styles */
  style?: ViewStyle;
  /** On video load callback */
  onVideoLoad?: (status: any) => void;
  /** On video error callback */
  onVideoError?: (error: any) => void;
};

/**
 * Professional Canvas Area for A3 Landscape Mode
 * 
 * Matches the App Build reference design with:
 * - Central video player with controls
 * - Professional timeline view
 * - Grid layout for multiple clips
 * - Loupe view for detailed analysis
 */
export function CanvasArea({
  videoUri,
  title = 'Canvas',
  showControls = true,
  children,
  mode = 'video',
  style,
  onVideoLoad,
  onVideoError,
}: CanvasAreaProps) {
  const { colors } = useTheme();
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [showControlsOverlay, setShowControlsOverlay] = useState(true);
  
  // Animation for controls fade
  const controlsOpacity = useRef(new Animated.Value(1)).current;

  const styles = createCanvasStyles(colors);

  const handleVideoStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis || 0);
      setIsPlaying(status.isPlaying || false);
      onVideoLoad?.(status);
    }
  };

  const handleVideoError = (error: any) => {
    console.error('Video error:', error);
    onVideoError?.(error);
  };

  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pauseAsync();
      } else {
        videoRef.current.playAsync();
      }
    }
  };

  const seekTo = (position: number) => {
    if (videoRef.current) {
      videoRef.current.setPositionAsync(position);
    }
  };

  const hideControls = () => {
    Animated.timing(controlsOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowControlsOverlay(false));
  };

  const showControls = () => {
    setShowControlsOverlay(true);
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderVideoPlayer = () => (
    <View style={styles.videoContainer}>
      {videoUri ? (
        <Video
          ref={videoRef}
          style={styles.videoPlayer}
          source={{ uri: videoUri }}
          useNativeControls={false}
          resizeMode={ResizeMode.CONTAIN}
          onPlaybackStatusUpdate={handleVideoStatusUpdate}
          onError={handleVideoError}
        />
      ) : (
        <View style={[styles.videoPlayer, styles.videoPlaceholder]}>
          <Text style={styles.placeholderText}>No video loaded</Text>
        </View>
      )}

      {/* Video Controls Overlay */}
      {showControls && showControlsOverlay && (
        <Animated.View style={[styles.controlsOverlay, { opacity: controlsOpacity }]}>
          {/* Play/Pause Button */}
          <TouchableOpacity
            style={styles.playPauseButton}
            onPress={togglePlayback}
            activeOpacity={0.7}
          >
            <Text style={styles.playPauseText}>
              {isPlaying ? 'Pause' : 'Play'}
            </Text>
          </TouchableOpacity>

          {/* Time Display */}
          <View style={styles.timeDisplay}>
            <Text style={styles.timeText}>
              {formatTime(position)} / {formatTime(duration)}
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBar}>
            <TouchableOpacity
              style={styles.progressTrack}
              onPress={(e) => {
                const { width } = e.nativeEvent.layout;
                const newPercent = e.nativeEvent.locationX / width;
                seekTo(duration * newPercent);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.progressBackground} />
              <View
                style={[
                  styles.progressFill,
                  { width: `${(position / duration) * 100}%` },
                ]}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Tap to show/hide controls */}
      <TouchableOpacity
        style={styles.videoOverlay}
        onPress={showControlsOverlay ? hideControls : showControls}
        activeOpacity={1}
      />
    </View>
  );

  const renderTimeline = () => (
    <View style={styles.timelineContainer}>
      <Text style={styles.canvasTitle}>Timeline View</Text>
      {/* Timeline implementation would go here */}
      <View style={styles.timelinePlaceholder}>
        <Text style={styles.placeholderText}>Timeline content</Text>
      </View>
    </View>
  );

  const renderGrid = () => (
    <View style={styles.gridContainer}>
      <Text style={styles.canvasTitle}>Grid View</Text>
      {/* Grid implementation would go here */}
      <View style={styles.gridPlaceholder}>
        <Text style={styles.placeholderText}>Grid content</Text>
      </View>
    </View>
  );

  const renderLoupe = () => (
    <View style={styles.loupeContainer}>
      <Text style={styles.canvasTitle}>Loupe View</Text>
      {/* Loupe implementation would go here */}
      <View style={styles.loupePlaceholder}>
        <Text style={styles.placeholderText}>Loupe content</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      {/* Canvas Header */}
      <View style={styles.canvasHeader}>
        <Text style={styles.canvasTitle}>{title}</Text>
        
        {/* Mode Switcher */}
        <View style={styles.modeSwitcher}>
          {(['video', 'timeline', 'grid', 'loupe'] as const).map((modeOption) => (
            <TouchableOpacity
              key={modeOption}
              style={[
                styles.modeButton,
                mode === modeOption && styles.modeButtonActive,
              ]}
              onPress={() => {/* Handle mode switch */}}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.modeButtonText,
                mode === modeOption && styles.modeButtonTextActive,
              ]}>
                {modeOption.charAt(0).toUpperCase() + modeOption.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Canvas Content */}
      <View style={styles.canvasContent}>
        {children ? (
          children
        ) : (
          <>
            {mode === 'video' && renderVideoPlayer()}
            {mode === 'timeline' && renderTimeline()}
            {mode === 'grid' && renderGrid()}
            {mode === 'loupe' && renderLoupe()}
          </>
        )}
      </View>
    </View>
  );
}

function createCanvasStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.landscape.canvas.backgroundColor,
      padding: theme.landscape.canvas.padding,
    },
    canvasHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.landscape.spacing.canvasGap,
    },
    canvasTitle: {
      fontSize: theme.landscape.typography.canvasTitle.fontSize,
      fontWeight: theme.landscape.typography.canvasTitle.fontWeight,
      fontFamily: theme.landscape.typography.canvasTitle.fontFamily,
      color: theme.landscape.typography.canvasTitle.color,
    },
    modeSwitcher: {
      flexDirection: 'row',
      backgroundColor: colors.chrome,
      borderRadius: 6,
      padding: 2,
    },
    modeButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 4,
    },
    modeButtonActive: {
      backgroundColor: colors.primary,
    },
    modeButtonText: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.muted,
    },
    modeButtonTextActive: {
      color: '#FFFFFF',
    },
    canvasContent: {
      flex: 1,
    },
    videoContainer: {
      flex: 1,
      position: 'relative',
    },
    videoPlayer: {
      ...theme.landscape.components.videoPlayer,
      backgroundColor: colors.chrome,
    },
    videoPlaceholder: {
      ...theme.landscape.components.videoPlayer,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.chrome,
      borderWidth: 2,
      borderColor: colors.borderLight,
      borderStyle: 'dashed',
    },
    placeholderText: {
      fontSize: 16,
      color: colors.muted,
      textAlign: 'center',
    },
    videoOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    controlsOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: 16,
    },
    playPauseButton: {
      position: 'absolute',
      top: 16,
      left: 16,
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
    },
    playPauseText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    timeDisplay: {
      position: 'absolute',
      top: 16,
      right: 16,
    },
    timeText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '500',
    },
    progressBar: {
      marginTop: 16,
    },
    progressTrack: {
      height: theme.landscape.components.timelineTrack.height,
      borderRadius: theme.landscape.components.timelineTrack.borderRadius,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      position: 'relative',
    },
    progressBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      borderRadius: theme.landscape.components.timelineTrack.borderRadius,
    },
    progressFill: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      backgroundColor: colors.primary,
      borderRadius: theme.landscape.components.timelineTrack.borderRadius,
    },
    timelineContainer: {
      flex: 1,
    },
    timelinePlaceholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.chrome,
      borderWidth: 2,
      borderColor: colors.borderLight,
      borderStyle: 'dashed',
      borderRadius: 8,
    },
    gridContainer: {
      flex: 1,
    },
    gridPlaceholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.chrome,
      borderWidth: 2,
      borderColor: colors.borderLight,
      borderStyle: 'dashed',
      borderRadius: 8,
    },
    loupeContainer: {
      flex: 1,
    },
    loupePlaceholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.chrome,
      borderWidth: 2,
      borderColor: colors.borderLight,
      borderStyle: 'dashed',
      borderRadius: 8,
    },
  });
}

export default CanvasArea;
