import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../lib/theme';
import { useTheme, type ThemePalette } from '../../lib/contexts/ThemeContext';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { useTranslation } from '../../lib/i18n';
import { formatTimecode } from '../../lib/premiumUtils';
import {
  IconLoop,
  IconPause,
  IconPlay,
  IconSkipBack,
} from '../icons/SessionChromeIcons';

export function PremiumTransportDock() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, insets.bottom),
    [colors, insets.bottom]
  );
  const {
    musicTrack,
    isPlaying,
    playheadMs,
    durationMs,
    handlePlayPause,
    handleSeekBack,
    handleLoopToggle,
    loopRegion,
    sessionId,
    activeSection,
  } = useSessionContext();

  const hasMusic = musicTrack != null;
  const timelineMs = Math.max(durationMs, 1);
  const progressPct = Math.min(100, (playheadMs / timelineMs) * 100);
  const remaining = formatTimecode(Math.max(0, timelineMs - playheadMs));

  const goRecord = () =>
    router.push({
      pathname: './camera',
      params: { id: sessionId, sectionName: activeSection },
    });

  return (
    <View style={styles.wrap}>
      {hasMusic ? (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>
      ) : (
        <Pressable style={styles.noMusicBanner} onPress={() => router.push({
          pathname: './music-setup',
          params: { sessionId },
        })}>
          <Text style={styles.noMusicText}>{t('premium.addMusicForPlayback')}</Text>
        </Pressable>
      )}
      <View style={styles.row}>
        <Text style={styles.time}>{hasMusic ? formatTimecode(playheadMs) : '0:00'}</Text>
        <View style={styles.transport}>
          <Pressable
            style={styles.iconBtn}
            onPress={handleSeekBack}
            disabled={!hasMusic}
          >
            <IconSkipBack size={15} color={colors.muted} />
          </Pressable>
          <Pressable
            style={styles.playBtn}
            onPress={handlePlayPause}
            disabled={!hasMusic}
          >
            {isPlaying ? (
              <IconPause size={16} color={colors.ground} />
            ) : (
              <IconPlay size={16} color={colors.ground} />
            )}
          </Pressable>
          <Pressable
            style={[styles.iconBtn, loopRegion && styles.iconBtnActive]}
            onPress={handleLoopToggle}
            disabled={!hasMusic}
          >
            <IconLoop size={15} color={loopRegion ? colors.capture : colors.muted} />
          </Pressable>
        </View>
        <Text style={styles.timeRight}>{hasMusic ? `-${remaining}` : '0:00'}</Text>
        <Pressable style={styles.recBtn} onPress={goRecord}>
          <View style={styles.recDot} />
          <Text style={styles.recLabel}>{t('premium.rec')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(colors: ThemePalette, bottomInset: number) {
  return StyleSheet.create({
    wrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.dockBg ?? 'rgba(20, 18, 15, 0.92)',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.hair2 ?? colors.border,
      paddingTop: 10,
      paddingHorizontal: 14,
      paddingBottom: Math.max(12, bottomInset + 8),
      zIndex: 20,
    },
    progressTrack: {
      height: 2,
      backgroundColor: colors.hair ?? colors.border,
      borderRadius: 2,
      marginBottom: 10,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.capture,
      borderRadius: 2,
    },
    noMusicBanner: {
      marginBottom: 10,
      paddingVertical: 8,
      alignItems: 'center',
    },
    noMusicText: {
      fontFamily: theme.typography.monoFamily,
      fontSize: 10,
      color: colors.capture,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    time: {
      fontFamily: theme.typography.monoFamily,
      fontSize: 11,
      color: colors.text3 ?? colors.muted,
      width: 40,
    },
    timeRight: {
      fontFamily: theme.typography.monoFamily,
      fontSize: 11,
      color: colors.text3 ?? colors.muted,
      width: 40,
      textAlign: 'right',
    },
    transport: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBtnActive: {
      backgroundColor: colors.primaryBg,
    },
    playBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.active,
      alignItems: 'center',
      justifyContent: 'center',
    },
    recBtn: {
      marginLeft: 4,
      height: 40,
      paddingHorizontal: 14,
      borderRadius: 999,
      backgroundColor: colors.capture,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    recDot: {
      width: 10,
      height: 10,
      borderRadius: 999,
      backgroundColor: '#fff',
    },
    recLabel: {
      fontFamily: theme.typography.monoFamily,
      fontSize: 11,
      fontWeight: '700',
      color: '#fff',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
  });
}
