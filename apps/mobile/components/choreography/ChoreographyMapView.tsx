import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Text } from 'react-native';
import type { SectionEntry } from '@roam/types';
import { useChoreographyTheme } from '../../lib/contexts/ChoreographyThemeContext';
import { sectionColorForIndex } from '../../lib/choreographyTheme';
import type { ThemePalette } from '../../lib/contexts/ThemeContext';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { sectionsWithSpan } from '../../lib/premiumUtils';
import { DisplayTitle, MonoCaps } from './ChoreographyPrimitives';
import { useTranslation } from '../../lib/i18n';
type Props = {
  onJumpToWork: (sectionLabel: string) => void;
};

export function ChoreographyMapView({ onJumpToWork }: Props) {
  const colors = useChoreographyTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { musicTrack, clips, durationMs, setActiveSection } = useSessionContext();

  // If there's no reference track (music/vocal), this view should be empty.
  if (!musicTrack) {
    return <View style={styles.root} />;
  }

  const sections = musicTrack?.sections ?? [];
  const totalMs = Math.max(durationMs, 1);
  const spans = useMemo(
    () => sectionsWithSpan(sections as SectionEntry[], totalMs),
    [sections, totalMs]
  );

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <DisplayTitle>{t('choreo.map.title')}</DisplayTitle>
      <View style={styles.bar}>
        {spans.map((s, i) => (
          <View
            key={`${s.label}-${i}`}
            style={[
              styles.barSegment,
              { flex: s.flex, backgroundColor: sectionColorForIndex(i) },
            ]}
          />
        ))}
      </View>
      <View style={styles.grid}>
        {spans.map((s, i) => {
          const mine = clips.filter(
            (c) => (c as { section?: string }).section === s.label || c.move_name
          ).length;
          return (
            <Pressable
              key={`card-${s.label}-${i}`}
              style={styles.card}
              onPress={() => {
                setActiveSection(s.label);
                onJumpToWork(s.label);
              }}
            >
              <View style={[styles.cardStripe, { backgroundColor: sectionColorForIndex(i) }]} />
              <Text style={styles.cardTitle}>{s.label}</Text>
              <MonoCaps>
                {t('choreo.map.clipsCount').replace('{count}', String(mine))}
              </MonoCaps>
            </Pressable>
          );
        })}
      </View>
      {spans.length === 0 ? (
        <MonoCaps style={styles.empty}>{t('choreo.map.empty')}</MonoCaps>
      ) : null}
    </ScrollView>
  );
}

function createStyles(colors: ThemePalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.ground },
    content: { padding: 16, paddingBottom: 32 },
    bar: {
      flexDirection: 'row',
      height: 12,
      borderRadius: 6,
      overflow: 'hidden',
      marginTop: 16,
      marginBottom: 20,
    },
    barSegment: { minWidth: 4 },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    card: {
      width: '47%',
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      overflow: 'hidden',
    },
    cardStripe: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.active,
      marginBottom: 6,
      paddingLeft: 8,
    },
    empty: {
      marginTop: 24,
      textAlign: 'center',
    },
  });
}
