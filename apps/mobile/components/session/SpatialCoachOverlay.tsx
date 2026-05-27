import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme, type ThemePalette } from '../../lib/contexts/ThemeContext';
import { useTranslation } from '../../lib/i18n';
import { theme } from '../../lib/theme';
import { dismissSpatialCoach } from '../../lib/spatialCoachState';

const STEPS = [
  { titleKey: 'spatial.coachStep1Title', bodyKey: 'spatial.coachStep1Body' },
  { titleKey: 'spatial.coachStep2Title', bodyKey: 'spatial.coachStep2Body' },
  { titleKey: 'spatial.coachStep3Title', bodyKey: 'spatial.coachStep3Body' },
] as const;

export function SpatialCoachOverlay({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [step, setStep] = useState(0);

  const current = STEPS[step];
  const isLast = step >= STEPS.length - 1;

  const finish = () => {
    dismissSpatialCoach();
    onDone();
  };

  const next = () => {
    if (isLast) {
      finish();
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <View style={styles.scrim} pointerEvents="box-none">
      <View style={styles.card}>
        <Text style={styles.stepPill}>
          {t('spatial.coachProgress')
            .replace(/\{\{current\}\}/g, String(step + 1))
            .replace(/\{\{total\}\}/g, String(STEPS.length))}
        </Text>
        <Text style={styles.title}>{t(current.titleKey)}</Text>
        <Text style={styles.body}>{t(current.bodyKey)}</Text>
        <View style={styles.actions}>
          <Pressable onPress={finish} hitSlop={12}>
            <Text style={styles.skip}>{t('spatial.coachSkip')}</Text>
          </Pressable>
          <Pressable style={styles.nextBtn} onPress={next}>
            <Text style={styles.nextText}>
              {isLast ? t('spatial.coachDone') : t('spatial.coachNext')}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function createStyles(colors: ThemePalette) {
  return StyleSheet.create({
    scrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(14,12,10,0.55)',
      justifyContent: 'flex-end',
      padding: 16,
      zIndex: 50,
    },
    card: {
      backgroundColor: colors.chrome,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.hair2 ?? colors.border,
      padding: 18,
    },
    stepPill: {
      fontFamily: theme.typography.monoFamily,
      fontSize: 9,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: colors.capture,
      marginBottom: 8,
    },
    title: {
      fontFamily: theme.typography.serifFamily ?? theme.typography.brandFamily,
      fontSize: 20,
      color: colors.active,
      marginBottom: 8,
    },
    body: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.text3 ?? colors.muted,
      fontFamily: theme.typography.bodyFamily,
      marginBottom: 16,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    skip: {
      fontSize: 13,
      color: colors.muted,
      fontFamily: theme.typography.bodyFamily,
    },
    nextBtn: {
      backgroundColor: colors.capture,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 999,
    },
    nextText: {
      fontFamily: theme.typography.monoFamily,
      fontSize: 11,
      fontWeight: '700',
      color: '#fff',
      textTransform: 'uppercase',
    },
  });
}
