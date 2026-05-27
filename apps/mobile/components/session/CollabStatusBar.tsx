import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme, type ThemePalette } from '../../lib/contexts/ThemeContext';
import { useTranslation } from '../../lib/i18n';
import { theme } from '../../lib/theme';

export function CollabStatusBar({
  compact = false,
  connected,
  hasError = false,
  participantCount = 0,
  showInvite = false,
  onInvite,
}: {
  compact?: boolean;
  connected: boolean;
  hasError?: boolean;
  participantCount?: number;
  showInvite?: boolean;
  onInvite?: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors, compact), [colors, compact]);

  const statusLabel = connected
    ? t('collab.live')
    : hasError
      ? t('collab.offline')
      : t('collab.connecting');

  return (
    <View style={styles.wrap}>
      <View style={[styles.dot, connected ? styles.dotLive : styles.dotOff]} />
      <Text style={styles.statusText} numberOfLines={1}>
        {statusLabel}
        {participantCount > 0
          ? ` · ${t('collab.people').replace(/\{\{count\}\}/g, String(participantCount))}`
          : ''}
      </Text>
      {showInvite && onInvite ? (
        <Pressable style={styles.inviteBtn} onPress={onInvite}>
          <Text style={styles.inviteBtnText}>{t('collab.invite')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(colors: ThemePalette, compact: boolean) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: compact ? 4 : 8,
      paddingHorizontal: compact ? 0 : 4,
      flexWrap: 'wrap',
    },
    dot: { width: 8, height: 8, borderRadius: 4 },
    dotLive: { backgroundColor: colors.capture },
    dotOff: { backgroundColor: colors.muted },
    statusText: {
      flex: 1,
      fontFamily: theme.typography.monoFamily,
      fontSize: compact ? 9 : 10,
      color: colors.text3 ?? colors.muted,
      textTransform: 'uppercase',
    },
    inviteBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.hairStrong ?? colors.border,
    },
    inviteBtnText: {
      fontFamily: theme.typography.monoFamily,
      fontSize: 9,
      fontWeight: '700',
      color: colors.active,
      textTransform: 'uppercase',
    },
  });
}
