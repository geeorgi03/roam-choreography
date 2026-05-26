import React, { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { theme } from '../../lib/theme';
import { useTheme, type ThemePalette } from '../../lib/contexts/ThemeContext';

export function SectionLabel({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.sectionLabelRow}>
      <Text style={styles.sectionLabel}>{children}</Text>
      {right != null ? (
        typeof right === 'string' ? (
          <Text style={styles.sectionLabelRight}>{right}</Text>
        ) : (
          right
        )
      ) : null}
    </View>
  );
}

export function MonoCaps({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <Text style={[styles.monoCaps, style]}>{children}</Text>;
}

export function SerifTitle({
  children,
  size = 'lg',
  italicPart,
}: {
  children: string;
  size?: 'md' | 'lg' | 'xl';
  italicPart?: string;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const sizeStyle =
    size === 'xl' ? styles.serifXl : size === 'md' ? styles.serifMd : styles.serifLg;
  if (italicPart && children.includes(italicPart)) {
    const [before, after] = children.split(italicPart);
    return (
      <Text style={sizeStyle} numberOfLines={2}>
        {before}
        <Text style={styles.serifItalic}>{italicPart}</Text>
        {after}
      </Text>
    );
  }
  return (
    <Text style={sizeStyle} numberOfLines={2}>
      {children}
    </Text>
  );
}

export function PremiumCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PrimaryPill({
  label,
  onPress,
  style,
}: {
  label: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable
      style={[styles.primaryPill, style]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={styles.primaryPillText}>{label}</Text>
    </Pressable>
  );
}

export function GhostPill({
  label,
  onPress,
}: {
  label: string;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable style={styles.ghostPill} onPress={onPress} disabled={!onPress}>
      <Text style={styles.ghostPillText}>{label}</Text>
    </Pressable>
  );
}

function createStyles(colors: ThemePalette) {
  return StyleSheet.create({
    sectionLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    sectionLabel: {
      fontFamily: theme.typography.monoFamily,
      fontSize: 10,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: colors.text4 ?? colors.muted,
      fontWeight: '600',
    },
    sectionLabelRight: {
      fontFamily: theme.typography.monoFamily,
      fontSize: 10,
      color: colors.text3 ?? colors.muted,
    },
    monoCaps: {
      fontFamily: theme.typography.monoFamily,
      fontSize: 10,
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: colors.text4 ?? colors.muted,
    },
    serifLg: {
      fontFamily: theme.typography.serifFamily ?? theme.typography.brandFamily,
      fontSize: 21,
      lineHeight: 24,
      letterSpacing: -0.2,
      color: colors.active,
    },
    serifMd: {
      fontFamily: theme.typography.serifFamily ?? theme.typography.brandFamily,
      fontSize: 17,
      lineHeight: 20,
      color: colors.active,
    },
    serifXl: {
      fontFamily: theme.typography.serifFamily ?? theme.typography.brandFamily,
      fontSize: 22,
      lineHeight: 26,
      letterSpacing: -0.2,
      color: colors.active,
    },
    serifItalic: {
      fontStyle: 'italic',
      color: colors.text3 ?? colors.muted,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: theme.spacing.radiusMd,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.hair ?? colors.border,
      padding: 12,
    },
    primaryPill: {
      backgroundColor: colors.capture,
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderRadius: theme.spacing.pill,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    primaryPillText: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '700',
      fontFamily: theme.typography.monoFamily,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    ghostPill: {
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.hairStrong ?? colors.borderStrong,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    ghostPillText: {
      color: colors.active,
      fontSize: 11,
      fontWeight: '600',
      fontFamily: theme.typography.monoFamily,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
  });
}
