import React, { useMemo } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { ClipRow } from '../../lib/database';
import { theme } from '../../lib/theme';
import { useTheme, type ThemePalette } from '../../lib/contexts/ThemeContext';
import { SectionLabel } from './PremiumPrimitives';

export function PremiumOtherTakesRow({
  clips,
  activeClipId,
  sectionLabel,
  onSelectClip,
}: {
  clips: ClipRow[];
  activeClipId: string | null;
  sectionLabel: string;
  onSelectClip: (clip: ClipRow) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (clips.length <= 1) return null;

  return (
    <View style={styles.wrap}>
      <SectionLabel
        right={`${clips.length} in section`}
      >
        {`Other takes · ${sectionLabel}`}
      </SectionLabel>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {clips.map((clip, index) => {
          const isActive =
            clip.local_id === activeClipId || clip.server_id === activeClipId;
          const thumb = clip.mux_playback_id
            ? `https://image.mux.com/${clip.mux_playback_id}/thumbnail.jpg?width=120`
            : null;
          return (
            <Pressable
              key={clip.local_id}
              style={[styles.thumb, isActive && styles.thumbActive]}
              onPress={() => onSelectClip(clip)}
            >
              {thumb ? (
                <Image source={{ uri: thumb }} style={styles.thumbImg} />
              ) : (
                <View style={styles.thumbPlaceholder} />
              )}
              <Text style={styles.thumbLabel}>
                T{String(index + 1).padStart(2, '0')}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemePalette) {
  return StyleSheet.create({
    wrap: { marginTop: 8 },
    scroll: { gap: 6, paddingBottom: 4 },
    thumb: {
      width: 78,
      aspectRatio: 9 / 11,
      borderRadius: 6,
      overflow: 'hidden',
      backgroundColor: '#0a0907',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.hair ?? colors.border,
    },
    thumbActive: {
      borderWidth: 2,
      borderColor: colors.capture,
    },
    thumbImg: { width: '100%', height: '100%' },
    thumbPlaceholder: {
      flex: 1,
      backgroundColor: colors.surface3 ?? colors.chrome,
    },
    thumbLabel: {
      position: 'absolute',
      bottom: 4,
      left: 4,
      fontFamily: theme.typography.monoFamily,
      fontSize: 9,
      color: '#fff',
      backgroundColor: 'rgba(0,0,0,0.6)',
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 2,
    },
  });
}
