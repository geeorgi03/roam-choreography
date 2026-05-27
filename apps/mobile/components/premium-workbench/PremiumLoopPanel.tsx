import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '../../lib/theme';
import { useTheme, type ThemePalette } from '../../lib/contexts/ThemeContext';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { useTranslation } from '../../lib/i18n';
import { formatTimecode } from '../../lib/premiumUtils';
import { PremiumCard, SectionLabel } from './PremiumPrimitives';

const BAR_COUNT = 48;

export function PremiumLoopPanel() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    musicTrack,
    isAnalysing,
    playheadMs,
    durationMs,
    loopRegion,
    activeSection,
    handleLoopToggle,
    loopOpenAt,
    openSheet,
  } = useSessionContext();

  if (!musicTrack) return null;

  const timelineMs = Math.max(durationMs, 75_000);
  const loopStart = loopRegion?.start ?? 0;
  const loopEnd = loopRegion?.end ?? Math.min(timelineMs, loopStart + 16_000);
  const loopLenSec = Math.max(0, (loopEnd - loopStart) / 1000);
  const bpm = musicTrack.bpm ?? 96;
  const bars = Math.max(1, Math.round(loopLenSec / (60 / bpm)));

  const barsHeights = useMemo(() => {
    return Array.from({ length: BAR_COUNT }, (_, i) => {
      const t = i / BAR_COUNT;
      const inLoop =
        loopRegion &&
        t * timelineMs >= loopRegion.start &&
        t * timelineMs <= loopRegion.end;
      const h = 0.25 + 0.75 * Math.abs(Math.sin(i * 0.45));
      return { h, inLoop: !!inLoop };
    });
  }, [loopRegion, timelineMs]);

  const playheadFrac = playheadMs / timelineMs;

  return (
    <View style={styles.wrap}>
      <SectionLabel
        right={loopRegion ? t('premium.loopActive') : t('premium.loopIdle')}
      >
        {t('premium.loopSection').replace(/\{\{section\}\}/g, activeSection)}
      </SectionLabel>
      <PremiumCard>
        {isAnalysing ? (
          <View style={styles.analysing}>
            <ActivityIndicator color={colors.muted} size="small" />
            <Text style={styles.analysingText}>{t('workbench.analysing')}</Text>
          </View>
        ) : (
          <View style={styles.waveRow}>
            {barsHeights.map((bar, i) => {
              const isPlayhead = Math.abs(i / BAR_COUNT - playheadFrac) < 0.02;
              return (
                <View
                  key={i}
                  style={[
                    styles.waveBar,
                    {
                      height: 56 * bar.h,
                      backgroundColor: bar.inLoop
                        ? 'rgba(224, 110, 63, 0.55)'
                        : isPlayhead
                          ? colors.active
                          : colors.hair2 ?? colors.border,
                    },
                  ]}
                />
              );
            })}
          </View>
        )}
        <View style={styles.timeRow}>
          <TimeChip label="in" value={formatTimecode(loopStart)} />
          <Text style={styles.midMeta}>
            {formatTimecode(loopLenSec * 1000)} · {bars} bars
          </Text>
          <TimeChip label="out" value={formatTimecode(loopEnd)} />
        </View>
        <View style={styles.loopActions}>
          <TouchableOpacity
            style={styles.loopBtn}
            onPress={handleLoopToggle}
            activeOpacity={0.85}
          >
            <Text style={styles.loopBtnText}>
              {loopOpenAt != null ? t('spatial.loopClose') : t('spatial.loopSet')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.loopBtn, styles.loopBtnAccent]}
            onPress={() => openSheet('capture')}
            activeOpacity={0.85}
          >
            <Text style={[styles.loopBtnText, styles.loopBtnAccentText]}>
              {t('premium.recordLoopTake')}
            </Text>
          </TouchableOpacity>
        </View>
      </PremiumCard>
    </View>
  );
}

function TimeChip({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createTimeStyles(colors), [colors]);
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function createTimeStyles(colors: ThemePalette) {
  return StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
    label: {
      fontFamily: theme.typography.monoFamily,
      fontSize: 10,
      color: colors.text4 ?? colors.muted,
      textTransform: 'uppercase',
    },
    value: {
      fontFamily: theme.typography.monoFamily,
      fontSize: 13,
      color: colors.active,
      letterSpacing: 0.4,
    },
  });
}

function createStyles(colors: ThemePalette) {
  return StyleSheet.create({
    wrap: {
      paddingHorizontal: 16,
      paddingTop: 14,
    },
    analysing: {
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    analysingText: {
      color: colors.muted,
      fontSize: 13,
    },
    waveRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      height: 56,
      gap: 2,
    },
    waveBar: {
      flex: 1,
      borderRadius: 1,
      minWidth: 2,
    },
    timeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 10,
    },
    midMeta: {
      fontFamily: theme.typography.monoFamily,
      fontSize: 11,
      color: colors.text3 ?? colors.muted,
    },
    loopActions: {
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.hair ?? colors.border,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    loopBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.hairStrong ?? colors.borderStrong,
    },
    loopBtnText: {
      fontFamily: theme.typography.monoFamily,
      fontSize: 11,
      fontWeight: '700',
      color: colors.active,
      textTransform: 'uppercase',
    },
    loopBtnAccent: {
      borderColor: colors.capture,
      backgroundColor: colors.capture + '22',
    },
    loopBtnAccentText: {
      color: colors.capture,
    },
  });
}
