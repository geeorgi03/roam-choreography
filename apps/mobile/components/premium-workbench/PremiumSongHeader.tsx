import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../lib/theme';
import { useTheme, type ThemePalette } from '../../lib/contexts/ThemeContext';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { useTranslation } from '../../lib/i18n';
import type { MusicTrack } from '@roam/types';
import { MonoCaps } from './PremiumPrimitives';

export function PremiumSongHeader({ onPress }: { onPress?: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { musicTrack } = useSessionContext();

  if (!musicTrack) return null;

  const mt = musicTrack as MusicTrack & {
    title?: string | null;
    artist?: string | null;
    musical_key?: string | null;
  };

  const title =
    mt.title?.trim() ||
    (mt.source_type === 'youtube'
      ? t('premium.youtubeReference')
      : t('premium.uploadedAudio'));
  const artist = mt.artist?.trim() || t('premium.unknownArtist');
  const sourceLabel =
    musicTrack.source_type === 'youtube'
      ? t('premium.sourceYoutube')
      : t('premium.sourceUpload');
  const bpm = musicTrack.bpm != null ? `${Math.round(musicTrack.bpm)} BPM` : '—';
  const keyLabel = mt.musical_key?.trim() || '—';

  const content = (
    <>
      <View style={styles.art}>
        <Text style={styles.artLetter}>{title.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.meta}>
        <View style={styles.badgeRow}>
          <View style={styles.badgeDot} />
          <MonoCaps style={styles.badgeText}>{sourceLabel}</MonoCaps>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.subline} numberOfLines={1}>
          {artist} · <Text style={styles.monoInline}>{bpm}</Text> ·{' '}
          <Text style={styles.monoInline}>{keyLabel}</Text>
        </Text>
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable style={styles.row} onPress={onPress}>
        {content}
      </Pressable>
    );
  }
  return <View style={styles.row}>{content}</View>;
}

function createStyles(colors: ThemePalette) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 8,
    },
    art: {
      width: 52,
      height: 52,
      borderRadius: 6,
      backgroundColor: colors.surface3 ?? colors.surfaceElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.hair2 ?? colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    artLetter: {
      fontFamily: theme.typography.serifFamily ?? theme.typography.brandFamily,
      fontStyle: 'italic',
      fontSize: 18,
      color: colors.text4 ?? colors.muted,
    },
    meta: { flex: 1, minWidth: 0 },
    badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    badgeDot: {
      width: 5,
      height: 5,
      borderRadius: 999,
      backgroundColor: colors.capture,
    },
    badgeText: { color: colors.capture },
    title: {
      fontFamily: theme.typography.serifFamily ?? theme.typography.brandFamily,
      fontSize: 21,
      lineHeight: 24,
      letterSpacing: -0.2,
      color: colors.active,
    },
    subline: {
      fontSize: 12,
      color: colors.text3 ?? colors.muted,
      marginTop: 2,
    },
    monoInline: {
      fontFamily: theme.typography.monoFamily,
      fontSize: 11,
    },
  });
}
