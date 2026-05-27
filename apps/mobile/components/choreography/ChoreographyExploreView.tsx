import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, Text, ScrollView } from 'react-native';
import { useChoreographyTheme } from '../../lib/contexts/ChoreographyThemeContext';
import type { ThemePalette } from '../../lib/contexts/ThemeContext';
import { DisplayTitle, MonoCaps } from './ChoreographyPrimitives';
import { useTranslation } from '../../lib/i18n';

const PROMPTS = [
  { movement: 'Fold', quality: 'Weighted', spatial: 'Low · Wide' },
  { movement: 'Sweep', quality: 'Light', spatial: 'High · Narrow' },
  { movement: 'Pulse', quality: 'Sharp', spatial: 'Center' },
];

export function ChoreographyExploreView() {
  const colors = useChoreographyTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [index, setIndex] = useState(0);
  const prompt = PROMPTS[index % PROMPTS.length]!;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <DisplayTitle>{t('choreo.explore.title')}</DisplayTitle>
      <MonoCaps style={styles.sub}>{t('choreo.explore.subtitle')}</MonoCaps>

      <View style={styles.bpmRow}>
        <MonoCaps>{t('choreo.explore.bpm').replace('{bpm}', '92')}</MonoCaps>
        <Pressable style={styles.tapBtn}>
          <MonoCaps style={{ color: colors.active }}>{t('choreo.explore.tap')}</MonoCaps>
        </Pressable>
      </View>

      <View style={styles.promptStack}>
        <Text style={styles.movement}>{prompt.movement}</Text>
        <Text style={styles.quality}>{prompt.quality}</Text>
        <MonoCaps style={styles.spatial}>{prompt.spatial}</MonoCaps>
      </View>

      <Pressable
        style={styles.generateBtn}
        onPress={() => setIndex((i) => i + 1)}
      >
        <Text style={styles.generateLabel}>{t('choreo.explore.generate')}</Text>
      </Pressable>

      <View style={styles.filters}>
        <MonoCaps style={styles.filterHeading}>{t('choreo.explore.bodyFocus')}</MonoCaps>
        {[
          t('choreo.explore.focusArms'),
          t('choreo.explore.focusTorso'),
          t('choreo.explore.focusLegs'),
          t('choreo.explore.focusFull'),
        ].map((f) => (
          <Pressable key={f} style={styles.filterChip}>
            <MonoCaps>{f}</MonoCaps>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function createStyles(colors: ThemePalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.ground },
    content: { padding: 16, paddingBottom: 40 },
    sub: { marginTop: 6, marginBottom: 20 },
    bpmRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    tapBtn: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    promptStack: {
      minHeight: 200,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    movement: {
      fontSize: 56,
      fontWeight: '900',
      color: colors.primary,
      letterSpacing: 1,
    },
    quality: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.accent,
      marginTop: 8,
    },
    spatial: {
      marginTop: 12,
      fontSize: 11,
    },
    generateBtn: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 28,
    },
    generateLabel: {
      fontSize: 14,
      fontWeight: '900',
      letterSpacing: 3,
      color: '#fff',
    },
    filters: { gap: 10 },
    filterHeading: { marginBottom: 4 },
    filterChip: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 6,
    },
  });
}
