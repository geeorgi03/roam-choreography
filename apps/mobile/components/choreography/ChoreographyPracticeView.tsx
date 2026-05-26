import React, { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useChoreographyTheme } from '../../lib/contexts/ChoreographyThemeContext';
import type { ThemePalette } from '../../lib/contexts/ThemeContext';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { MonoCaps } from './ChoreographyPrimitives';
import { ChoreographyMuxVideo } from './ChoreographyMuxVideo';
import { useTranslation } from '../../lib/i18n';

export function ChoreographyPracticeView() {
  const colors = useChoreographyTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { musicTrack } = useSessionContext();

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <MonoCaps style={styles.betaTag}>{t('choreo.practice.betaTag')}</MonoCaps>
        <Text style={styles.title}>{t('choreo.practice.title')}</Text>
        <Text style={styles.subtitle}>{t('choreo.practice.subtitle')}</Text>
      </View>
      <View style={styles.row}>
        <View style={styles.refPane}>
          {musicTrack ? (
            <>
              <MonoCaps style={styles.paneLabel}>{t('choreo.practice.refLabel')}</MonoCaps>
              <View style={styles.videoWrap}>
                <ChoreographyMuxVideo clip={null} practiceLoupe />
              </View>
            </>
          ) : (
            <View style={styles.emptyPane}>
              <MonoCaps style={styles.emptyText}>{t('choreo.practice.noTrack')}</MonoCaps>
            </View>
          )}
        </View>
        <View style={styles.selfPane}>
          <MonoCaps style={styles.paneLabel}>{t('choreo.practice.selfLabel')}</MonoCaps>
          <View style={styles.selfPlaceholder}>
            <Text style={styles.selfPlaceholderText}>{t('choreo.practice.selfPlaceholder')}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function createStyles(colors: ThemePalette) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.ground,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    header: {
      marginBottom: 16,
      gap: 6,
    },
    betaTag: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: colors.primaryBg,
      color: colors.primary,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.active,
    },
    subtitle: {
      fontSize: 12,
      color: colors.muted,
    },
    row: {
      flex: 1,
      flexDirection: 'row',
      gap: 12,
    },
    refPane: {
      flex: 1,
      gap: 6,
    },
    selfPane: {
      flex: 1,
      gap: 6,
    },
    paneLabel: {
      color: colors.text3,
    },
    videoWrap: {
      flex: 1,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: '#000',
    },
    emptyPane: {
      flex: 1,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      color: colors.muted,
      textAlign: 'center',
      paddingHorizontal: 12,
    },
    selfPlaceholder: {
      flex: 1,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    selfPlaceholderText: {
      fontSize: 12,
      color: colors.muted,
      textAlign: 'center',
    },
  });
}

