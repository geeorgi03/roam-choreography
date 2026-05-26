import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useChoreographyTheme } from '../../lib/contexts/ChoreographyThemeContext';
import type { ThemePalette } from '../../lib/contexts/ThemeContext';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { formatTimecode, sectionsWithSpan } from '../../lib/premiumUtils';
import { sectionColorForIndex } from '../../lib/choreographyTheme';
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
    loopRegion,
    sessionId,
    activeSection,
  } = useSessionContext();

  const totalMs = Math.max(durationMs, 1);
  const progress = Math.min(1, playheadMs / totalMs);
  const sections = (musicTrack?.sections ?? []) as Array<{ label: string; start_ms: number }>;
  const spans = useMemo(() => sectionsWithSpan(sections as any, totalMs), [sections, totalMs]);

  return (
    <View style={styles.wrap}>
      {loopRegion ? (
        <View style={styles.loopRow}>
          <MonoCaps>Loop · {activeSection}</MonoCaps>
        </View>
      ) : null}
      <View style={styles.timelineWrap}>
        {spans.length > 0 ? (
          <>
            <View style={styles.sectionBar}>
              {spans.map((s, i) => (
                <View
                  key={`${s.label}-${i}`}
                  style={[
                    styles.sectionSeg,
                    {
                      flex: s.flex,
                      backgroundColor: sectionColorForIndex(i),
                      opacity: s.label === activeSection ? 1 : 0.65,
                    },
                  ]}
                />
              ))}
              <View style={[styles.progressLine, { left: `${progress * 100}%` }]} />
            </View>
            <View style={styles.sectionLabelRow}>
              {spans.map((s, i) => (
                <View key={`${s.label}-${i}-label`} style={{ flex: s.flex }}>
                  <MonoCaps
                    style={[
                      styles.sectionLabel,
                      s.label === activeSection && styles.sectionLabelActive,
                    ]}
                  >
                    {s.label}
                  </MonoCaps>
                </View>
              ))}
            </View>
          </>
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
      </View>

      <View style={styles.transportRow}>
        <Pressable onPress={handlePlayPause} style={styles.playBtn}>
          <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
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
    timelineWrap: {
      marginBottom: 8,
    },
    sectionBar: {
      position: 'relative',
      flexDirection: 'row',
      height: 42,
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 6,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.chrome,
    },
    sectionSeg: {
      minWidth: 1,
    },
    progressLine: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 2,
      backgroundColor: colors.primary,
      opacity: 0.95,
    },
    sectionLabelRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 0,
      height: 18,
      marginBottom: 8,
    },
    sectionLabel: {
      fontSize: 10,
      color: colors.muted,
      textAlign: 'center',
    },
    sectionLabelActive: {
      color: colors.active,
    },
    waveTrack: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      height: 46,
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
