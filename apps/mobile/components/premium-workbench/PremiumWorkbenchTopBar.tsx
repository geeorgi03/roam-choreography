import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../lib/theme';
import { useTheme, type ThemePalette } from '../../lib/contexts/ThemeContext';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { useTranslation } from '../../lib/i18n';
import { IconMoreVertical, IconShareOut } from '../icons/SessionChromeIcons';
import { MonoCaps, SerifTitle } from './PremiumPrimitives';

export function PremiumWorkbenchTopBar() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { sessionName, sessionPhrase, sessionId, openSheet, playheadMs } =
    useSessionContext();
  const elapsed = formatElapsed(playheadMs);
  return (
    <View style={styles.wrap}>
      <Pressable
        style={styles.left}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={t('common.backA11y')}
      >
        <Text style={styles.backChev}>‹</Text>
        <View style={styles.titleBlock}>
          <MonoCaps>
            {t('premium.sessionBreadcrumb').replace(
              /\{\{index\}\}/g,
              sessionId.replace(/-/g, '').slice(-2).padStart(2, '0')
            )}
          </MonoCaps>
          {sessionPhrase ? (
            <SerifTitle size="md" italicPart={sessionPhrase}>
              {`${sessionName} ${sessionPhrase}`}
            </SerifTitle>
          ) : (
            <SerifTitle size="md">{sessionName}</SerifTitle>
          )}
        </View>
      </Pressable>
      <View style={styles.right}>
        <View style={styles.timePill}>
          <Text style={styles.timePillText}>{elapsed}</Text>
        </View>
        <Pressable
          style={styles.iconBtn}
          onPress={() => openSheet('share')}
          accessibilityRole="button"
          accessibilityLabel={t('premium.share')}
        >
          <IconShareOut size={16} color={colors.muted} />
        </Pressable>
        <Pressable
          style={styles.iconBtn}
          onPress={() => openSheet('capture')}
          accessibilityRole="button"
          accessibilityLabel={t('premium.more')}
        >
          <IconMoreVertical size={16} color={colors.muted} />
        </Pressable>
      </View>
    </View>
  );
}

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, '0');
  return `${m}:${ss}`;
}

function createStyles(colors: ThemePalette) {
  return StyleSheet.create({
    wrap: {
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hair ?? colors.border,
    },
    left: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flex: 1,
      minWidth: 0,
    },
    backChev: {
      fontSize: 28,
      color: colors.muted,
      lineHeight: 28,
      marginRight: 2,
    },
    titleBlock: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    right: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    timePill: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.hair2 ?? colors.border,
    },
    timePillText: {
      fontFamily: theme.typography.monoFamily,
      fontSize: 10,
      color: colors.text3 ?? colors.muted,
    },
    iconBtn: {
      width: 30,
      height: 30,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
