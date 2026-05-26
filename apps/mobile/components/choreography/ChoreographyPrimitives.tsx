import React, { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useChoreographyTheme } from '../../lib/contexts/ChoreographyThemeContext';
import type { ThemePalette } from '../../lib/contexts/ThemeContext';
import { useChoreographyFonts } from '../../lib/hooks/useChoreographyFonts';

export function MonoCaps({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) {
  const colors = useChoreographyTheme();
  const fonts = useChoreographyFonts();
  const styles = useMemo(() => createStyles(colors, fonts.mono), [colors, fonts.mono]);
  return <Text style={[styles.monoCaps, style]}>{children}</Text>;
}

export function DisplayTitle({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) {
  const colors = useChoreographyTheme();
  const fonts = useChoreographyFonts();
  const styles = useMemo(() => createStyles(colors, fonts.mono, fonts.display), [colors, fonts.mono, fonts.display]);
  return <Text style={[styles.displayTitle, style]}>{children}</Text>;
}

export function GlassBar({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useChoreographyTheme();
  const fonts = useChoreographyFonts();
  const styles = useMemo(() => createStyles(colors, fonts.mono, fonts.display), [colors, fonts.mono, fonts.display]);
  return <View style={[styles.glassBar, style]}>{children}</View>;
}

export function SectionPill({
  label,
  active,
  color,
  onPress,
}: {
  label: string;
  active: boolean;
  color: string;
  onPress: () => void;
}) {
  const colors = useChoreographyTheme();
  const fonts = useChoreographyFonts();
  const styles = useMemo(() => createStyles(colors, fonts.mono), [colors, fonts.mono]);
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.sectionPill,
        active && { borderColor: color, backgroundColor: `${color}22` },
      ]}
    >
      <View style={[styles.sectionDot, { backgroundColor: color }]} />
      <MonoCaps style={active ? { color: colors.active } : undefined}>{label}</MonoCaps>
    </Pressable>
  );
}

function createStyles(
  colors: ThemePalette,
  monoFont = 'monospace',
  displayFont = 'System'
) {
  return StyleSheet.create({
    monoCaps: {
      fontSize: 9,
      fontFamily: monoFont,
      fontWeight: '600',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: colors.muted,
    },
    displayTitle: {
      fontSize: 20,
      fontFamily: displayFont,
      fontWeight: '900',
      letterSpacing: 2,
      textTransform: 'uppercase',
      color: colors.active,
    },
    glassBar: {
      backgroundColor: colors.surfaceGlass,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
    },
    sectionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.chrome,
    },
    sectionDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
  });
}
