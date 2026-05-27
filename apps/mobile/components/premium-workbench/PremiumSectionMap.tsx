import React, { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SectionEntry } from '@roam/types';
import { theme } from '../../lib/theme';
import { useTheme, type ThemePalette } from '../../lib/contexts/ThemeContext';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { useTranslation } from '../../lib/i18n';
import {
  formatTimecode,
  sectionToneForIndex,
  sectionsWithSpan,
  type SectionTone,
} from '../../lib/premiumUtils';
import { SectionLabel } from './PremiumPrimitives';

export function PremiumSectionMap() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    musicTrack,
    activeSection,
    setActiveSection,
    playheadMs,
    durationMs,
    soundRef,
    setLoopRegion,
  } = useSessionContext();

  const sections = musicTrack?.sections ?? [];
  const totalMs = Math.max(durationMs, 1);
  const spans = useMemo(
    () => sectionsWithSpan(sections as SectionEntry[], totalMs),
    [sections, totalMs]
  );
  const playheadPct = Math.min(100, Math.max(0, (playheadMs / totalMs) * 100));

  const jumpSection = useCallback(
    async (section: SectionEntry & { end_ms: number }) => {
      setActiveSection(section.label);
      setLoopRegion({ start: section.start_ms, end: section.end_ms });
      const sound = soundRef.current;
      if (sound) {
        try {
          await sound.setPositionAsync(section.start_ms);
        } catch {
          /* ignore */
        }
      }
    },
    [setActiveSection, setLoopRegion, soundRef]
  );

  if (spans.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <SectionLabel right={formatTimecode(totalMs)}>
        {t('premium.songMap')}
      </SectionLabel>
      <View style={styles.strip}>
        {spans.map((section, index) => {
          const tone = sectionToneForIndex(index);
          const isActive = activeSection === section.label;
          const toneStyle = toneStyles(colors, tone, isActive);
          return (
            <Pressable
              key={`${section.label}-${index}`}
              style={[styles.segment, { flex: section.flex }, toneStyle.segment]}
              onPress={() => void jumpSection(section)}
            >
              <Text style={[styles.segmentLabel, toneStyle.label]} numberOfLines={1}>
                {section.label}
              </Text>
            </Pressable>
          );
        })}
        <View style={[styles.playhead, { left: `${playheadPct}%` }]} />
      </View>
    </View>
  );
}

function toneStyles(
  colors: ThemePalette,
  tone: SectionTone,
  active: boolean
): { segment: object; label: object } {
  const map = {
    sage: {
      bg: 'rgba(143,168,142,0.18)',
      fg: colors.sage ?? '#8FA88E',
    },
    accent: {
      bg: 'rgba(224,110,63,0.18)',
      fg: colors.capture,
    },
    gold: {
      bg: 'rgba(201,164,107,0.16)',
      fg: colors.gold ?? '#C9A46B',
    },
    plum: {
      bg: 'rgba(154,111,132,0.16)',
      fg: colors.plum ?? '#9A6F84',
    },
    ghost: {
      bg: 'rgba(244,235,214,0.06)',
      fg: colors.text3 ?? colors.muted,
    },
  }[tone];

  return {
    segment: {
      backgroundColor: active ? map.fg : map.bg,
    },
    label: {
      color: active ? colors.ground : map.fg,
    },
  };
}

function createStyles(colors: ThemePalette) {
  return StyleSheet.create({
    wrap: {
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    strip: {
      flexDirection: 'row',
      height: 26,
      borderRadius: 6,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.hair2 ?? colors.border,
      backgroundColor: colors.surface,
      position: 'relative',
    },
    segment: {
      justifyContent: 'center',
      paddingHorizontal: 7,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: colors.ground,
    },
    segmentLabel: {
      fontFamily: theme.typography.monoFamily,
      fontSize: 9.5,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      fontWeight: '600',
    },
    playhead: {
      position: 'absolute',
      top: -2,
      bottom: -2,
      width: 1,
      backgroundColor: colors.active,
      marginLeft: -0.5,
    },
  });
}
