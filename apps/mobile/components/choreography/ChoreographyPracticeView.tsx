import React, { useMemo, useEffect } from 'react';
import { View, StyleSheet, Text, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useChoreographyTheme } from '../../lib/contexts/ChoreographyThemeContext';
import type { ThemePalette } from '../../lib/contexts/ThemeContext';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { MonoCaps } from './ChoreographyPrimitives';
import { ChoreographyMuxVideo } from './ChoreographyMuxVideo';
import { PracticeSelfCamera } from './PracticeSelfCamera';
import { useTranslation } from '../../lib/i18n';
import { AnalyticsEvents, trackEvent } from '../../lib/productAnalytics';
import { getDeviceTier, uxTokens } from '../../lib/designTokens';

export function ChoreographyPracticeView() {
  const colors = useChoreographyTheme();
  const { width } = useWindowDimensions();
  const tier = getDeviceTier(width);
  const { t } = useTranslation();
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors, tier), [colors, tier]);
  const { musicTrack, sessionId } = useSessionContext();

  useEffect(() => {
    trackEvent(AnalyticsEvents.PRACTICE_VIEW_OPEN, { sessionId });
  }, [sessionId]);

  const openSelfCamera = () => {
    trackEvent(AnalyticsEvents.PRACTICE_RECORD_START, { sessionId });
    router.push(`/session/camera?id=${sessionId}`);
  };

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
          <View style={styles.selfCameraWrap}>
            <PracticeSelfCamera enabled onRequestFullRecord={openSelfCamera} />
          </View>
        </View>
      </View>
    </View>
  );
}

function createStyles(colors: ThemePalette, tier: 'phone' | 'tablet') {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.ground,
      paddingHorizontal: tier === 'tablet' ? 20 : 16,
      paddingTop: uxTokens.spacing.sm,
    },
    header: {
      marginBottom: uxTokens.spacing.md,
      gap: uxTokens.spacing.xs,
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
      fontSize: uxTokens.typography.title[tier],
      fontWeight: '700',
      color: colors.active,
    },
    subtitle: {
      fontSize: uxTokens.typography.caption[tier],
      color: colors.muted,
    },
    row: {
      flex: 1,
      flexDirection: 'row',
      gap: uxTokens.spacing.sm,
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
    selfCameraWrap: {
      flex: 1,
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
  });
}
