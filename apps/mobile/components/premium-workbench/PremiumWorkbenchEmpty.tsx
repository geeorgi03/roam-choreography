import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../lib/theme';
import { useTheme, type ThemePalette } from '../../lib/contexts/ThemeContext';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { useTranslation } from '../../lib/i18n';
import { GhostPill, PrimaryPill, SerifTitle } from './PremiumPrimitives';

export type EmptyMode = 'no-music' | 'analysing' | 'ready-no-clips';

export function PremiumWorkbenchEmpty({ mode }: { mode: EmptyMode }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { sessionId, activeSection, inboxCount } = useSessionContext();

  const goMusic = () =>
    router.push({ pathname: './music-setup', params: { sessionId } });
  const goRecord = () =>
    router.push({
      pathname: './camera',
      params: { id: sessionId, sectionName: activeSection },
    });
  const goInbox = () => router.push('/inbox');

  return (
    <View style={styles.wrap}>
      {mode === 'analysing' ? (
        <>
          <ActivityIndicator size="large" color={colors.capture} />
          <Text style={styles.title}>{t('premium.emptyAnalysingTitle')}</Text>
          <Text style={styles.body}>{t('premium.emptyAnalysingBody')}</Text>
        </>
      ) : mode === 'ready-no-clips' ? (
        <>
          <SerifTitle size="lg">{t('premium.emptyReadyTitle')}</SerifTitle>
          <Text style={styles.body}>{t('premium.emptyReadyBody')}</Text>
          <View style={styles.actions}>
            <PrimaryPill label={t('premium.recordFirst')} onPress={goRecord} />
            <GhostPill label={t('workbench.addVideo')} onPress={goMusic} />
          </View>
        </>
      ) : (
        <>
          <SerifTitle size="lg">{t('premium.emptyNoMusicTitle')}</SerifTitle>
          <Text style={styles.body}>{t('premium.emptyNoMusicBody')}</Text>
          <View style={styles.actions}>
            <PrimaryPill label={t('premium.addMusic')} onPress={goMusic} />
            <GhostPill label={t('premium.recordAnyway')} onPress={goRecord} />
          </View>
        </>
      )}
      {inboxCount > 0 ? (
        <GhostPill
          label={t('premium.openInbox').replace(/\{\{count\}\}/g, String(inboxCount))}
          onPress={goInbox}
        />
      ) : null}
    </View>
  );
}

function createStyles(colors: ThemePalette) {
  return StyleSheet.create({
    wrap: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      gap: 16,
    },
    title: {
      fontFamily: theme.typography.serifFamily ?? theme.typography.brandFamily,
      fontSize: 20,
      color: colors.active,
      textAlign: 'center',
    },
    body: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.text3 ?? colors.muted,
      textAlign: 'center',
    },
    actions: {
      width: '100%',
      gap: 10,
      marginTop: 8,
    },
  });
}
