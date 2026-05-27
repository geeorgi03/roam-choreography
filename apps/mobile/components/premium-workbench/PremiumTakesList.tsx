import React, { useMemo } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { theme } from '../../lib/theme';
import { useTheme, type ThemePalette } from '../../lib/contexts/ThemeContext';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { useTranslation } from '../../lib/i18n';
import type { ClipRow } from '../../lib/database';
import { clipTags, isKeeperClip } from '../../lib/premiumUtils';
import { SectionLabel } from './PremiumPrimitives';

export function PremiumTakesList() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { clips, sectionClips, activeSection, openClipSheet } = useSessionContext();

  const displayClips = useMemo(() => {
    const sectionIds = new Set(
      sectionClips
        .filter((sc) => sc.section_label === activeSection)
        .map((sc) => sc.clip_id)
    );
    const filtered = clips.filter(
      (c) => !c.server_id || sectionIds.has(c.server_id)
    );
    return filtered.length > 0 ? filtered : clips;
  }, [clips, sectionClips, activeSection]);

  if (displayClips.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <SectionLabel
        right={t('premium.takesCount').replace(
          /\{\{count\}\}/g,
          String(displayClips.length)
        )}
      >
        {t('premium.takes')}
      </SectionLabel>
      <View style={styles.list}>
        {displayClips.map((clip, index) => (
          <TakeRow
            key={clip.local_id}
            clip={clip}
            index={index}
            onPress={() => openClipSheet(clip)}
          />
        ))}
      </View>
    </View>
  );
}

function TakeRow({
  clip,
  index,
  onPress,
}: {
  clip: ClipRow;
  index: number;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();
  const tags = clipTags(clip);
  const keeper = isKeeperClip(clip);
  const takeNum = String(index + 1).padStart(2, '0');
  const section =
    clip.label?.split('·')[0]?.trim() ??
    (clip.clip_type === 'REF' ? 'ref' : 'take');
  const thumbUri = clip.mux_playback_id
    ? `https://image.mux.com/${clip.mux_playback_id}/thumbnail.jpg?width=120`
    : null;

  return (
    <Pressable
      style={[styles.row, keeper && styles.rowKeeper]}
      onPress={onPress}
    >
      <View style={styles.thumb}>
        {thumbUri ? (
          <Image source={{ uri: thumbUri }} style={styles.thumbImg} />
        ) : (
          <View style={styles.thumbPlaceholder} />
        )}
        <Text style={styles.durBadge}>
          {clip.upload_status === 'ready' ? '✓' : '…'}
        </Text>
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.takeId}>T{takeNum}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {section}
          </Text>
          {clip.clip_type === 'REF' ? (
            <>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.meta}>{t('workbench.clipBadgeRef')}</Text>
            </>
          ) : null}
        </View>
        <View style={styles.tagRow}>
          {tags.slice(0, 3).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          {clip.notes ? (
            <Text style={styles.note} numberOfLines={1}>
              "{clip.notes}"
            </Text>
          ) : null}
        </View>
      </View>
      {keeper ? <View style={styles.keeperDot} /> : null}
    </Pressable>
  );
}

function createStyles(colors: ThemePalette) {
  return StyleSheet.create({
    wrap: {
      paddingHorizontal: 16,
      paddingTop: 18,
      paddingBottom: 8,
    },
    list: { gap: 6 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 10,
      borderRadius: theme.spacing.radiusMd,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.hair ?? colors.border,
    },
    rowKeeper: {
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.hairStrong ?? colors.borderStrong,
    },
    thumb: {
      width: 46,
      height: 46,
      borderRadius: 6,
      backgroundColor: '#0a0907',
      overflow: 'hidden',
    },
    thumbImg: { width: '100%', height: '100%' },
    thumbPlaceholder: {
      flex: 1,
      backgroundColor: colors.surface3 ?? colors.chrome,
    },
    durBadge: {
      position: 'absolute',
      bottom: 3,
      right: 3,
      fontFamily: theme.typography.monoFamily,
      fontSize: 8,
      color: '#fff',
      backgroundColor: 'rgba(0,0,0,0.6)',
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 2,
    },
    body: { flex: 1, minWidth: 0 },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 4,
    },
    takeId: {
      fontFamily: theme.typography.monoFamily,
      fontSize: 11,
      fontWeight: '700',
      color: colors.active,
    },
    metaDot: {
      color: colors.text4 ?? colors.muted,
      fontSize: 10,
    },
    meta: {
      fontFamily: theme.typography.monoFamily,
      fontSize: 10,
      color: colors.text3 ?? colors.muted,
      textTransform: 'lowercase',
      flexShrink: 1,
    },
    tagRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      alignItems: 'center',
    },
    tag: {
      backgroundColor: colors.surface3 ?? colors.chrome,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 3,
    },
    tagText: {
      fontFamily: theme.typography.monoFamily,
      fontSize: 9,
      color: colors.text3 ?? colors.muted,
      textTransform: 'lowercase',
    },
    note: {
      fontFamily: theme.typography.serifFamily ?? theme.typography.brandFamily,
      fontStyle: 'italic',
      fontSize: 12,
      color: colors.text3 ?? colors.muted,
      flex: 1,
    },
    keeperDot: {
      width: 5,
      height: 5,
      borderRadius: 999,
      backgroundColor: colors.capture,
    },
  });
}
