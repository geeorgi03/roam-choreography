import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import type { SectionEntry } from '@roam/types';
import { useChoreographyTheme } from '../../lib/contexts/ChoreographyThemeContext';
import { sectionColorForIndex } from '../../lib/choreographyTheme';
import type { ThemePalette } from '../../lib/contexts/ThemeContext';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { sectionsWithSpan } from '../../lib/premiumUtils';
import { MonoCaps } from './ChoreographyPrimitives';

const TRACKS = ['Song', 'Lyrics', 'My video', 'Reference', 'Drawing'] as const;

export function ChoreographyComposeView() {
  const colors = useChoreographyTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { musicTrack, durationMs, clips, activeSection } = useSessionContext();
  const sections = musicTrack?.sections ?? [];
  const spans = useMemo(
    () => sectionsWithSpan(sections as SectionEntry[], Math.max(durationMs, 1)),
    [sections, durationMs]
  );
  const mineCount = clips.filter((c) => c.clip_type !== 'REF').length;
  const refCount = clips.filter((c) => c.clip_type === 'REF').length;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <MonoCaps style={styles.hint}>Compose · read-only timeline</MonoCaps>
      <View style={styles.ruler}>
        {spans.map((s, i) => (
          <View
            key={`${s.label}-${i}`}
            style={[styles.rulerSeg, { flex: s.flex, backgroundColor: sectionColorForIndex(i) }]}
          />
        ))}
      </View>
      {TRACKS.map((track) => (
        <View key={track} style={styles.trackRow}>
          <Text style={styles.trackLabel}>{track}</Text>
          <View style={styles.trackLane}>
            {track === 'Song' && spans.length === 0 ? (
              <MonoCaps>No sections</MonoCaps>
            ) : null}
            {track === 'My video' ? (
              <MonoCaps>
                {mineCount} takes · {activeSection}
              </MonoCaps>
            ) : null}
            {track === 'Reference' ? <MonoCaps>{refCount} ref clips</MonoCaps> : null}
            {track === 'Lyrics' ? <MonoCaps>See Lyrics panel</MonoCaps> : null}
            {track === 'Drawing' ? <MonoCaps>Draw mode overlay</MonoCaps> : null}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function createStyles(colors: ThemePalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: '#090910' },
    content: { padding: 16, paddingBottom: 32 },
    hint: { marginBottom: 12 },
    ruler: {
      flexDirection: 'row',
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 16,
    },
    rulerSeg: { minWidth: 4 },
    trackRow: {
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      overflow: 'hidden',
    },
    trackLabel: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 12,
      fontWeight: '700',
      color: colors.muted,
      backgroundColor: colors.chrome,
    },
    trackLane: {
      padding: 12,
      minHeight: 44,
      justifyContent: 'center',
    },
  });
}
