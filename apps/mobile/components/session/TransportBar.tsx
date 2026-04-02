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
});

export function TransportBar({ variant }: TransportBarProps) {
  const {
    isPlaying,
    playheadMs,
    durationMs,
    playbackSpeed,
    setPlaybackSpeed,
    handleSeekBack,
    handleSeekForward,
    loopRegion,
    loopOpenAt,
    handlePlayPause,
    handleLoopToggle,
    handleClearLoop,
  } = useSessionContext();

  const getLoopButtonStyle = () => {
    if (loopOpenAt !== null) {
      return {
        backgroundColor: '#fff8ee',
        borderColor: '#e8a87c',
        borderLeftColor: '#e8a87c',
      };
    }
    if (loopRegion !== null && loopOpenAt === null) {
      return {
        backgroundColor: '#e1f5ee',
        borderColor: '#7db9a8',
        borderLeftColor: '#7db9a8',
      };
    }
    return {
      backgroundColor: '#e1f5ee',
      borderColor: '#7db9a8',
      borderLeftColor: '#7db9a8',
    };
  };

  const getLoopButtonText = () => {
    if (loopOpenAt !== null) {
      return 'tap to close';
    }
    if (loopRegion !== null && loopOpenAt === null) {
      return 'set loop';
    }
    return 'set loop';
  };

  const getLoopDotColor = () => {
    if (loopOpenAt !== null) {
      return '#e8a87c'; // amber
    }
    if (loopRegion !== null && loopOpenAt === null) {
      return '#7db9a8'; // teal
    }
    return '#7db9a8'; // teal
  };

  const getLoopLabelColor = () => {
    if (loopOpenAt !== null) {
      return '#7a5c2e';
    }
    return '#085041';
  };

  const getLoopDotSize = () => {
    return 9; // 9dp
  };

  const handleLoopButtonPress = () => {
    // "set loop" should always enter loop capture flow; if a loop exists, reset it first.
    if (loopRegion !== null && loopOpenAt === null) {
      handleClearLoop();
    }
    handleLoopToggle();
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

        <View style={{ flex: 1 }} />

        {/* Loop button */}
        <TouchableOpacity
          style={[styles.loopButton, styles.reducedLoopButton, getLoopButtonStyle()]}
          onPress={handleLoopButtonPress}
        >
          <View style={[styles.loopDot, { 
            backgroundColor: getLoopDotColor(),
            width: getLoopDotSize(),
            height: getLoopDotSize(),
            borderRadius: getLoopDotSize() / 2,
          }]} />
          <Text
            style={[
              styles.loopButtonText,
              styles.reducedLoopButtonText,
              { color: getLoopLabelColor() },
            ]}
          >
            {getLoopButtonText()}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.fullContainer]}>
      {/* Seek-back button */}
      <TouchableOpacity
        style={styles.seekButton}
        onPress={handleSeekBack}
      >
        <Text style={{ fontFamily: theme.typography.monoFamily, color: theme.light.muted }}>
          {'⏮'}
        </Text>
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

      {/* Seek-forward button */}
      <TouchableOpacity
        style={styles.seekButton}
        onPress={handleSeekForward}
      >
        <Text style={{ fontFamily: theme.typography.monoFamily, color: theme.light.muted }}>
          {'⏭'}
        </Text>
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
        onPress={handleLoopButtonPress}
      >
        <View style={[styles.loopDot, { 
          backgroundColor: getLoopDotColor(),
          width: getLoopDotSize(),
          height: getLoopDotSize(),
          borderRadius: getLoopDotSize() / 2,
        }]} />
        <Text
          style={[
            styles.loopButtonText,
            styles.fullLoopButtonText,
            { color: getLoopLabelColor() },
          ]}
        >
          {getLoopButtonText()}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 52,
    backgroundColor: '#ffffff',
    borderTopWidth: 0.5,
    borderTopColor: '#e8e3dc',
    flexDirection: 'row',
    alignItems: 'center',
  },
  fullContainer: {
    paddingHorizontal: 8,
    gap: 8,
  },
  reducedContainer: {
    paddingHorizontal: 12,
    gap: 8,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3a342d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPlayButton: {
    width: 36,
    height: 36,
  },
  reducedPlayButton: {
    width: 36,
    height: 36,
  },
  playButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  speedContainer: {
    flex: 1,
    alignItems: 'center',
  },
  speedLabel: {
    fontSize: 9,
    fontFamily: theme.typography.monoFamily,
    color: '#8a8278',
    marginBottom: 2,
  },
  speedButtons: {
    flexDirection: 'row',
    gap: 3,
  },
  speedButton: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e8e3dc',
    backgroundColor: '#ffffff',
  },
  activeSpeedButton: {
    backgroundColor: '#3a342d',
    borderColor: '#3a342d',
  },
  speedButtonText: {
    fontSize: 9,
    fontFamily: theme.typography.monoFamily,
    color: '#8a8278',
  },
  activeSpeedButtonText: {
    color: '#ffffff',
  },
  loopButton: {
    width: 110,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderLeftWidth: 0.5,
  },
  fullLoopButton: {
    width: 110,
  },
  reducedLoopButton: {},
  loopDot: {
    borderRadius: 4.5,
  },
  loopButtonText: {
    fontSize: 11,
    fontFamily: theme.typography.monoFamily,
  },
  fullLoopButtonText: {
    fontSize: 11,
  },
  reducedLoopButtonText: {
    fontSize: 9,
  },
  seekButton: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.light.border,
    backgroundColor: theme.light.chrome,
  },
});
