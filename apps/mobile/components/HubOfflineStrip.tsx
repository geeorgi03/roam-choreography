import { View, Text, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import { useTheme } from '../lib/contexts/ThemeContext';
import type { ThemePalette } from '../lib/contexts/ThemeContext';
import { theme } from '../lib/theme';

export type HubOfflineStripKind = 'offline' | 'cached';

type Props = {
  kind: HubOfflineStripKind;
  message: string;
};

/** Sessions hub strip — matches Figma OfflineBanner (Roam · UI banner tokens). */
export function HubOfflineStrip({ kind, message }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors, kind), [colors, kind]);

  return (
    <View style={styles.wrap} accessibilityRole="text">
      <View style={styles.dot} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

function createStyles(colors: ThemePalette, kind: HubOfflineStripKind) {
  const bg = kind === 'offline' ? colors.bannerOfflineBg : colors.bannerCacheBg;
  const fg = kind === 'offline' ? colors.bannerOfflineText : colors.bannerCacheText;
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingVertical: theme.spacing['2.5'],
      paddingHorizontal: theme.spacing['3'],
      backgroundColor: bg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      ...theme.shadows.sm,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: fg,
      marginRight: theme.spacing['2.5'],
    },
    text: {
      flex: 1,
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.bold,
      color: fg,
      lineHeight: theme.typography.lineHeights.snug,
      letterSpacing: theme.typography.letterSpacing.tight,
    },
  });
}
