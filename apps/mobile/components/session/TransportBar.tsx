import React, { useMemo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { useTranslation } from '../../lib/i18n';
import type { StemFocusState } from '../../lib/storage';
import { theme } from '../../lib/theme';
import { useTheme, type ThemePalette } from '../../lib/contexts/ThemeContext';
import {
  IconPause,
  IconPlay,
  IconSkipBack,
  IconSkipForward,
} from '../icons/SessionChromeIcons';

interface TransportBarProps {
  variant: 'full' | 'reduced';
}

const STEMS: Array<{ key: keyof StemFocusState; labelKey: string }> = [
  { key: 'vocals', labelKey: 'transport.stemVocals' },
  { key: 'drums', labelKey: 'transport.stemDrums' },
  { key: 'bass', labelKey: 'transport.stemBass' },
  { key: 'instruments', labelKey: 'transport.stemInstruments' },
];

export function TransportBar({ variant }: TransportBarProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createTransportStyles(colors), [colors]);
  const {
    musicTrack,
    isPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    handleSeekBack,
    handleSeekForward,
    loopRegion,
    loopOpenAt,
    handlePlayPause,
    handleLoopToggle,
    handleClearLoop,
    stemFocus,
    setStemFocus,
  } = useSessionContext();

  if (musicTrack === null) return null;

  const loopIdleBorder = colors.mine;
  const loopOpenBorder = colors.amber;
  const loopIdleBg = colors.mineBg;
  const loopOpenBg = colors.amberBg;

  const getLoopChrome = () => {
    if (loopOpenAt !== null) {
      return {
        backgroundColor: loopOpenBg,
        borderColor: loopOpenBorder,
      };
    }
    if (loopRegion !== null && loopOpenAt === null) {
      return {
        backgroundColor: loopIdleBg,
        borderColor: loopIdleBorder,
      };
    }
    return {
      backgroundColor: loopIdleBg,
      borderColor: loopIdleBorder,
    };
  };

  const getLoopLabelColor = () => {
    if (loopOpenAt !== null) {
      return colors.active;
    }
    return colors.active;
  };

  const getLoopButtonText = () => {
    if (loopOpenAt !== null) {
      return t('spatial.loopClose');
    }
    return t('spatial.loopSet');
  };

  const handleLoopButtonPress = () => {
    if (loopRegion !== null && loopOpenAt === null) {
      handleClearLoop();
    }
    handleLoopToggle();
  };

  const iconMuted = colors.muted;
  const playGlyph = isPlaying ? (
    <IconPause size={16} color="#ffffff" />
  ) : (
    <IconPlay size={16} color="#ffffff" />
  );

  if (variant === 'reduced') {
    return (
      <View style={[styles.container, styles.reducedContainer]}>
        <TouchableOpacity
          style={[styles.playButton, styles.compactControl]}
          onPress={handlePlayPause}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? t('clipPlayer.pause') : t('clipPlayer.play')}
        >
          {playGlyph}
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          style={[styles.loopCompact, getLoopChrome()]}
          onPress={handleLoopButtonPress}
          accessibilityRole="button"
          accessibilityLabel={getLoopButtonText()}
        >
          <View style={[styles.loopDot, { backgroundColor: loopOpenAt !== null ? colors.amber : colors.mine }]} />
          <Text style={[styles.loopCompactText, { color: getLoopLabelColor() }]} numberOfLines={1}>
            {getLoopButtonText()}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.fullContainer]}>
      <TouchableOpacity
        style={[styles.seekButton, styles.compactControl]}
        onPress={handleSeekBack}
        accessibilityRole="button"
        accessibilityLabel={t('transport.seekBack')}
      >
        <IconSkipBack size={16} color={iconMuted} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.playButton, styles.compactControl]}
        onPress={handlePlayPause}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? t('clipPlayer.pause') : t('clipPlayer.play')}
      >
        {playGlyph}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.seekButton, styles.compactControl]}
        onPress={handleSeekForward}
        accessibilityRole="button"
        accessibilityLabel={t('transport.seekForward')}
      >
        <IconSkipForward size={16} color={iconMuted} />
      </TouchableOpacity>

      <View style={styles.middleColumn}>
        <View style={styles.speedContainer}>
          <Text style={styles.speedLabel}>SPD</Text>
          <View style={styles.speedButtons}>
            {[0.5, 0.75, 1.0, 1.25, 1.5].map((speed) => (
              <TouchableOpacity
                key={speed}
                style={[styles.speedButton, playbackSpeed === speed && styles.activeSpeedButton]}
                onPress={() => setPlaybackSpeed(speed)}
              >
                <Text
                  style={[styles.speedButtonText, playbackSpeed === speed && styles.activeSpeedButtonText]}
                >
                  {speed}×
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.stemRow}>
          {STEMS.map(({ key, labelKey }) => {
            const isActive = stemFocus[key] === 'active';
            return (
              <TouchableOpacity
                key={key}
                style={[styles.stemChip, isActive ? styles.stemChipActive : styles.stemChipMuted]}
                onPress={() =>
                  setStemFocus({
                    ...stemFocus,
                    [key]: stemFocus[key] === 'active' ? 'muted' : 'active',
                  })
                }
              >
                <Text style={styles.stemChipText}>{t(labelKey)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.loopCompact, styles.loopInFullRow, getLoopChrome()]}
        onPress={handleLoopButtonPress}
        accessibilityRole="button"
        accessibilityLabel={getLoopButtonText()}
      >
        <View style={[styles.loopDot, { backgroundColor: loopOpenAt !== null ? colors.amber : colors.mine }]} />
        <Text style={[styles.loopCompactText, { color: getLoopLabelColor() }]} numberOfLines={1}>
          {getLoopButtonText()}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function createTransportStyles(colors: ThemePalette) {
  return StyleSheet.create({
    container: {
      minHeight: 48,
      backgroundColor: colors.chrome,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    fullContainer: {
      height: 'auto',
      minHeight: 48,
      paddingVertical: 6,
      paddingHorizontal: 8,
      gap: 6,
      alignItems: 'center',
    },
    reducedContainer: {
      paddingHorizontal: 12,
      gap: 8,
      minHeight: 48,
    },
    compactControl: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    playButton: {
      backgroundColor: colors.active,
    },
    middleColumn: {
      flex: 1,
      justifyContent: 'center',
      paddingVertical: 2,
      gap: 4,
    },
    speedContainer: {
      alignItems: 'center',
    },
    speedLabel: {
      fontSize: 10,
      fontFamily: theme.typography.monoFamily,
      color: colors.muted,
      marginBottom: 2,
      fontWeight: '600',
    },
    speedButtons: {
      flexDirection: 'row',
      gap: 3,
    },
    stemRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 4,
    },
    stemChip: {
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    stemChipActive: {
      backgroundColor: colors.mine,
      opacity: 1,
    },
    stemChipMuted: {
      backgroundColor: colors.muted,
      opacity: 0.4,
    },
    stemChipText: {
      color: '#ffffff',
      fontSize: 11,
      fontFamily: theme.typography.monoFamily,
      fontWeight: '600',
    },
    speedButton: {
      minHeight: 28,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.chrome,
      justifyContent: 'center',
    },
    activeSpeedButton: {
      backgroundColor: colors.active,
      borderColor: colors.active,
    },
    speedButtonText: {
      fontSize: 11,
      fontFamily: theme.typography.monoFamily,
      color: colors.muted,
      fontWeight: '600',
    },
    activeSpeedButtonText: {
      color: '#ffffff',
    },
    loopCompact: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      minHeight: 40,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1,
    },
    loopInFullRow: {
      alignSelf: 'center',
      maxWidth: 112,
    },
    loopDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    loopCompactText: {
      fontSize: 12,
      fontFamily: theme.typography.bodyFamily,
      fontWeight: '700',
      textTransform: 'none' as const,
    },
    seekButton: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.ground,
    },
  });
}
