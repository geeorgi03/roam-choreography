import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme, type ThemePalette } from '../../lib/contexts/ThemeContext';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { useTranslation } from '../../lib/i18n';
import { theme } from '../../lib/theme';
import { PremiumSectionMap } from './PremiumSectionMap';
import { PremiumLoopPanel } from './PremiumLoopPanel';
import { PremiumTakesList } from './PremiumTakesList';

/**
 * Phone-focused rehearsal panel: section picker + loop + takes (mirrors iPad right rail).
 */
export function PremiumSectionLab() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { activeSection, musicTrack } = useSessionContext();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.kicker}>{t('sectionLab.kicker')}</Text>
        <Text style={styles.sectionTitle}>{activeSection}</Text>
        {!musicTrack ? (
          <Text style={styles.hint}>{t('sectionLab.addMusicHint')}</Text>
        ) : null}
      </View>
      <PremiumSectionMap />
      <PremiumLoopPanel />
      <PremiumTakesList />
    </ScrollView>
  );
}

function createStyles(colors: ThemePalette) {
  return StyleSheet.create({
    scroll: { flex: 1 },
    content: {
      paddingBottom: 120,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 4,
      paddingBottom: 8,
    },
    kicker: {
      fontFamily: theme.typography.monoFamily,
      fontSize: 10,
      letterSpacing: 0.9,
      textTransform: 'uppercase',
      color: colors.text4 ?? colors.muted,
      marginBottom: 4,
    },
    sectionTitle: {
      fontFamily: theme.typography.serifFamily ?? theme.typography.brandFamily,
      fontSize: 26,
      color: colors.active,
      letterSpacing: -0.3,
    },
    hint: {
      marginTop: 6,
      fontSize: 12,
      color: colors.text3 ?? colors.muted,
      fontFamily: theme.typography.bodyFamily,
    },
  });
}
