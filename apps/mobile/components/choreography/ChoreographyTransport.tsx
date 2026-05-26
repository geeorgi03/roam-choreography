import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useChoreographyTheme } from '../../lib/contexts/ChoreographyThemeContext';
import type { ThemePalette } from '../../lib/contexts/ThemeContext';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { formatTimecode } from '../../lib/premiumUtils';
import { MonoCaps } from './ChoreographyPrimitives';

export function ChoreographyTransport() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useChoreographyTheme();
  const styles = useMemo(
    () => createStyles(colors, insets.bottom),
    [colors, insets.bottom]
  );
  const {
    musicTrack,
    isPlaying,
    playheadMs,
    durationMs,
    handlePlayPause,
    handleSeekBack,
    loopRegion,
    sessionId,
    activeSection,
  } = useSessionContext();

  const totalMs = Math.max(durationMs, 1);
  const progress = Math.min(1, playheadMs / totalMs);

  return (
    <View style={styles.wrap}>
      {loopRegion ? (
        <View style={styles.loopRow}>
          <MonoCaps>Loop · {activeSection}</MonoCaps>
        </View>
      ) : null}
      <View style={styles.waveTrack}>
        {Array.from({ length: 48 }).map((_, i) => {
          const h = 8 + Math.sin(i * 0.5) * 12 + (i % 3) * 4;
          const past = i / 48 <= progress;
          return (
            <View
              key={i}
              style={[
                styles.waveBar,
                { height: h },
                past && { backgroundColor: colors.primary },
              ]}
            />
          );
        })}
      </View>
      <View style={styles.transportRow}>
        <Pressable onPress={handleSeekBack} style={styles.transportBtn}>
          <Text style={styles.transportIcon}>◀◀</Text>
        </Pressable>
        <Pressable onPress={handlePlayPause} style={styles.playBtn}>
          <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
        </Pressable>
        <Pressable style={styles.transportBtn}>
          <Text style={styles.transportIcon}>▶▶</Text>
        </Pressable>
        <Text style={styles.time}>
          {formatTimecode(playheadMs)} / {formatTimecode(totalMs)}
        </Text>
      </View>
      {!musicTrack ? (
        <Pressable
          style={styles.addMusic}
          onPress={() =>
            router.push({ pathname: './music-setup', params: { sessionId } })
          }
        >
          <MonoCaps style={{ color: colors.primary }}>Add reference track</MonoCaps>
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(colors: ThemePalette, bottomInset: number) {
  return StyleSheet.create({
    wrap: {
      paddingBottom: bottomInset + 8,
      paddingTop: 8,
      paddingHorizontal: 12,
      backgroundColor: colors.dockBg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    loopRow: {
      marginBottom: 6,
    },
    waveTrack: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      height: 50,
      marginBottom: 8,
      gap: 2,
    },
    waveBar: {
      flex: 1,
      borderRadius: 2,
      backgroundColor: colors.border,
      minWidth: 2,
    },
    transportRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    transportBtn: {
      padding: 8,
    },
    transportIcon: {
      color: colors.muted,
      fontSize: 14,
    },
    playBtn: {
      width: 44,
      height: 44,
      borderRadius: 8,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playIcon: {
      color: '#fff',
      fontSize: 18,
    },
    time: {
      marginLeft: 'auto',
      fontSize: 11,
      fontWeight: '500',
      color: colors.muted,
      fontVariant: ['tabular-nums'],
    },
    addMusic: {
      marginTop: 8,
      alignItems: 'center',
    },
  });
}
