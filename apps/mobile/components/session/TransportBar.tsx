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
});

export function TransportBar({ variant }: TransportBarProps) {
  const {
    isPlaying,
    playheadMs,
    durationMs,
    playbackSpeed,
    setPlaybackSpeed,
    loopRegion,
    loopOpenAt,
    handlePlayPause,
    handleSeekBack,
    handleSeekForward,
    handleLoopToggle,
  } = useSessionContext();

  const getLoopButtonStyle = () => {
    if (loopOpenAt !== null) {
      return {
        backgroundColor: '#fff8ee',
        borderColor: '#e8a87c',
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
    return 'set loop';
  };

  const getLoopDotColor = () => {
    if (loopOpenAt !== null) {
      return '#e8a87c'; // amber
    }
    return '#085041'; // teal
  };

  const getLoopDotSize = () => {
    return 9; // 9dp
  };

  const generateWaveformBars = () => {
    const bars = [];
    for (let i = 0; i < 20; i++) {
      let height = 8 + Math.sin(i * 0.5) * 8; // Deterministic height based on position
      
      // Highlight bars within loop region
      let backgroundColor = '#e8e3dc';
      if (loopRegion && durationMs > 0) {
        const barPosition = (i / 20) * durationMs;
        if (barPosition >= loopRegion.start && barPosition <= loopRegion.end) {
          backgroundColor = 'rgba(125,185,168,0.6)';
        }
      }
      
      bars.push(
        <View
          key={i}
          style={[
            styles.waveformBar,
            {
              height,
              backgroundColor,
            },
          ]}
        />
      );
    }
    return bars;
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
            {generateWaveformBars()}
          </View>
        </View>

        {/* Loop button */}
        <TouchableOpacity
          style={[styles.loopButton, styles.reducedLoopButton, getLoopButtonStyle()]}
          onPress={handleLoopToggle}
        >
          <View style={[styles.loopDot, { 
            backgroundColor: getLoopDotColor(),
            width: getLoopDotSize(),
            height: getLoopDotSize(),
            borderRadius: getLoopDotSize() / 2,
          }]} />
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
        <Text style={styles.seekButtonText}>←</Text>
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
        <Text style={styles.seekButtonText}>→</Text>
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
        <View style={[styles.loopDot, { 
          backgroundColor: getLoopDotColor(),
          width: getLoopDotSize(),
          height: getLoopDotSize(),
          borderRadius: getLoopDotSize() / 2,
        }]} />
        <Text style={[styles.loopButtonText, styles.fullLoopButtonText]}>
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
    paddingHorizontal: 16,
    gap: 12,
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
  seekButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3a342d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seekButtonText: {
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
    fontFamily: 'JetBrainsMono',
    color: '#8a8278',
    marginBottom: 2,
  },
  speedButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  speedButton: {
    paddingHorizontal: 6,
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
    fontFamily: 'JetBrainsMono',
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
    borderLeftColor: '#7db9a8',
  },
  reducedLoopButton: {
    borderLeftColor: '#7db9a8',
  },
  loopDot: {
    borderRadius: 4.5,
  },
  loopButtonText: {
    fontSize: 11,
    fontFamily: 'JetBrainsMono',
    color: '#085041',
  },
  fullLoopButtonText: {
    fontSize: 11,
  },
  reducedLoopButtonText: {
    fontSize: 9,
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
