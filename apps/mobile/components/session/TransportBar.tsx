import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { theme } from '../../lib/theme';

interface TransportBarProps {
  variant: 'full' | 'reduced';
}

const getThemeStyles = () => ({
  container: {
    backgroundColor: theme.light.chrome,
    borderTopWidth: 0.5,
    borderTopColor: theme.light.border,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  playButton: {
    backgroundColor: theme.light.active,
  },
  playButtonText: {
    color: '#ffffff',
    fontFamily: theme.typography.monoFamily,
  },
  seekButton: {
    backgroundColor: theme.light.active,
  },
  seekButtonText: {
    color: '#ffffff',
    fontFamily: theme.typography.monoFamily,
  },
  speedLabel: {
    fontFamily: theme.typography.monoFamily,
    color: theme.light.muted,
  },
  speedButton: {
    borderColor: theme.light.border,
    backgroundColor: theme.light.chrome,
  },
  activeSpeedButton: {
    backgroundColor: theme.light.active,
    borderColor: theme.light.active,
  },
  speedButtonText: {
    fontFamily: theme.typography.monoFamily,
    color: theme.light.muted,
  },
  activeSpeedButtonText: {
    color: '#ffffff',
  },
  loopButton: {
    borderLeftColor: theme.light.mine,
  },
  loopButtonText: {
    fontFamily: theme.typography.monoFamily,
    color: theme.light.mine,
  },
  waveformBarInactive: theme.light.border,
  waveformBarActive: 'rgba(125,185,168,0.6)',
});

export function TransportBar({ variant }: TransportBarProps) {
  const {
    isPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    handlePlayPause,
    handleSeekBack,
    handleSeekForward,
    handleLoopToggle,
    loopRegion,
    loopOpenAt,
    playheadMs,
    durationMs,
  } = useSessionContext();

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSpeedControl = () => {
    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIndex]);
  };

  const getLoopButtonStyle = () => {
    if (loopOpenAt !== null) {
      return {
        backgroundColor: '#fff8ee',
        borderColor: '#e8a87c',
      };
    }
    if (loopRegion) {
      return {
        backgroundColor: '#e1f5ee',
        borderColor: '#7db9a8',
      };
    }
    return {
      backgroundColor: '#e1f5ee',
      borderColor: '#7db9a8',
    };
  };

  const getLoopButtonText = () => {
    if (loopOpenAt !== null) {
      return 'tap to close';
    }
    if (loopRegion) {
      return 'set loop';
    }
    return 'set loop';
  };

  const getLoopDotColor = () => {
    if (loopOpenAt !== null) {
      return '#e8a87c'; // amber
    }
    return '#085041'; // teal
  };

  if (variant === 'reduced') {
    return (
      <View style={[styles.container, styles.reducedContainer]}>
        {/* Play button */}
        <TouchableOpacity
          style={[styles.playButton, styles.reducedPlayButton]}
          onPress={handlePlayPause}
        >
          <Text style={styles.playButtonText}>
            {isPlaying ? '⏸' : '▶'}
          </Text>
        </TouchableOpacity>

        {/* Mini waveform decorative */}
        <View style={styles.miniWaveformContainer}>
          <View style={styles.miniWaveform}>
            {[...Array(20)].map((_, i) => {
              const height = 8 + 16 * Math.abs(Math.sin(i * 0.3 + 0.5));
              const isInLoopRegion = loopRegion && durationMs > 0 && 
                (i * (durationMs / 20) >= loopRegion.start && i * (durationMs / 20) <= loopRegion.end);
              
              return (
                <View
                  key={i}
                  style={[
                    styles.waveformBar,
                    {
                      height,
                      backgroundColor: isInLoopRegion ? 'rgba(125,185,168,0.6)' : theme.light.border,
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>

        {/* Loop button */}
        <TouchableOpacity
          style={[styles.loopButton, styles.reducedLoopButton, getLoopButtonStyle()]}
          onPress={handleLoopToggle}
        >
          <View style={[styles.loopDot, { backgroundColor: getLoopDotColor() }]} />
          <Text style={[styles.loopButtonText, styles.reducedLoopButtonText]}>
            {getLoopButtonText()}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.fullContainer]}>
      {/* Seek back button */}
      <TouchableOpacity
        style={styles.seekButton}
        onPress={handleSeekBack}
      >
        <Text style={styles.seekButtonText}>⏪</Text>
      </TouchableOpacity>

      {/* Play/pause button */}
      <TouchableOpacity
        style={[styles.playButton, styles.fullPlayButton]}
        onPress={handlePlayPause}
      >
        <Text style={styles.playButtonText}>
          {isPlaying ? '⏸' : '▶'}
        </Text>
      </TouchableOpacity>

      {/* Seek forward button */}
      <TouchableOpacity
        style={styles.seekButton}
        onPress={handleSeekForward}
      >
        <Text style={styles.seekButtonText}>⏩</Text>
      </TouchableOpacity>

      {/* Speed controls */}
      <View style={styles.speedContainer}>
        <Text style={styles.speedLabel}>SPD</Text>
        <View style={styles.speedButtons}>
          {[0.5, 0.75, 1.0, 1.25, 1.5].map((speed) => (
            <TouchableOpacity
              key={speed}
              style={[
                styles.speedButton,
                playbackSpeed === speed && styles.activeSpeedButton,
              ]}
              onPress={() => setPlaybackSpeed(speed)}
            >
              <Text
                style={[
                  styles.speedButtonText,
                  playbackSpeed === speed && styles.activeSpeedButtonText,
                ]}
              >
                {speed}×
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Loop button */}
      <TouchableOpacity
        style={[styles.loopButton, styles.fullLoopButton, getLoopButtonStyle()]}
        onPress={handleLoopToggle}
      >
        <View style={[styles.loopDot, { backgroundColor: getLoopDotColor() }]} />
        <Text style={[styles.loopButtonText, styles.fullLoopButtonText]}>
          {getLoopButtonText()}
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const themeStyles = getThemeStyles();

const styles = StyleSheet.create({
  container: {
    ...themeStyles.container,
  },
  fullContainer: {
    height: 52,
    paddingHorizontal: 16,
    gap: 12,
  },
  reducedContainer: {
    height: 52,
    paddingHorizontal: 12,
    gap: 8,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    ...themeStyles.playButton,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reducedPlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  playButtonText: {
    ...themeStyles.playButtonText,
    fontSize: 16,
    fontWeight: '600',
  },
  seekButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    ...themeStyles.seekButton,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seekButtonText: {
    ...themeStyles.seekButtonText,
    fontSize: 14,
  },
  speedContainer: {
    flex: 1,
    alignItems: 'center',
  },
  speedLabel: {
    ...themeStyles.speedLabel,
    fontSize: 9,
    marginBottom: 2,
  },
  speedButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  speedButton: {
    ...themeStyles.speedButton,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  activeSpeedButton: {
    ...themeStyles.activeSpeedButton,
  },
  speedButtonText: {
    ...themeStyles.speedButtonText,
    fontSize: 8,
  },
  activeSpeedButtonText: {
    ...themeStyles.activeSpeedButtonText,
  },
  loopButton: {
    width: 110,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderLeftWidth: 0.5,
    ...themeStyles.loopButton,
  },
  fullLoopButton: {
    borderLeftColor: theme.light.mine,
  },
  reducedLoopButton: {
    borderLeftColor: theme.light.mine,
  },
  loopDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  loopButtonText: {
    ...themeStyles.loopButtonText,
    fontSize: 10,
  },
  fullLoopButtonText: {
    fontSize: 10,
  },
  reducedLoopButtonText: {
    fontSize: 8,
  },
  miniWaveformContainer: {
    flex: 1,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  waveformBar: {
    width: 2,
    borderRadius: 1,
  },
});
