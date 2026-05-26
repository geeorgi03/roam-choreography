import React, { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useChoreographyTheme } from '../../../lib/contexts/ChoreographyThemeContext';
import type { ThemePalette } from '../../../lib/contexts/ThemeContext';
import { useChoreographyFonts } from '../../../lib/hooks/useChoreographyFonts';
import { DisplayTitle, GlassBar, MonoCaps } from '../ChoreographyPrimitives';

export function ChoreographyHubHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const colors = useChoreographyTheme();
  const styles = useMemo(() => createHeaderStyles(colors), [colors]);

  return (
    <View style={styles.header}>
      <View style={styles.titleBlock}>
        <DisplayTitle style={styles.title}>{title}</DisplayTitle>
        {subtitle ? <MonoCaps style={styles.subtitle}>{subtitle}</MonoCaps> : null}
      </View>
      {right}
    </View>
  );
}

export function ChoreographyHubFab({
  onPress,
  label = '+',
}: {
  onPress: () => void;
  label?: string;
}) {
  const colors = useChoreographyTheme();
  const fonts = useChoreographyFonts();
  const styles = useMemo(() => createFabStyles(colors, fonts.display), [colors, fonts.display]);

  return (
    <Pressable style={styles.fab} onPress={onPress} accessibilityRole="button">
      <Text style={styles.fabText}>{label}</Text>
    </Pressable>
  );
}

export function ChoreographyHubSearch({
  value,
  onChangeText,
  placeholder,
  style,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useChoreographyTheme();
  const fonts = useChoreographyFonts();
  const styles = useMemo(() => createSearchStyles(colors, fonts.body), [colors, fonts.body]);

  return (
    <GlassBar style={[styles.search, style]}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </GlassBar>
  );
}

export function ChoreographyHubFilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const colors = useChoreographyTheme();
  const styles = useMemo(() => createChipStyles(colors), [colors]);

  return (
    <Pressable
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
    >
      <MonoCaps style={active ? { color: colors.active } : undefined}>{label}</MonoCaps>
    </Pressable>
  );
}

export function ChoreographyHubBanner({
  children,
  onPress,
}: {
  children: React.ReactNode;
  onPress?: () => void;
}) {
  const colors = useChoreographyTheme();
  const styles = useMemo(() => createBannerStyles(colors), [colors]);
  const inner = <GlassBar style={styles.banner}>{children}</GlassBar>;
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={styles.wrap}>
        {inner}
      </Pressable>
    );
  }
  return <View style={styles.wrap}>{inner}</View>;
}

function createHeaderStyles(colors: ThemePalette) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 12,
      backgroundColor: colors.ground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    titleBlock: { flex: 1, paddingRight: 12 },
    title: { fontSize: 22 },
    subtitle: { marginTop: 6 },
  });
}

function createFabStyles(colors: ThemePalette, displayFont: string) {
  return StyleSheet.create({
    fab: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fabText: {
      color: '#fff',
      fontSize: 28,
      fontWeight: '300',
      fontFamily: displayFont,
      marginTop: -2,
    },
  });
}

function createSearchStyles(colors: ThemePalette, bodyFont: string) {
  return StyleSheet.create({
    search: { paddingHorizontal: 12, paddingVertical: 4 },
    input: {
      flex: 1,
      fontSize: 15,
      color: colors.active,
      fontFamily: bodyFont,
      paddingVertical: 10,
    },
  });
}

function createChipStyles(colors: ThemePalette) {
  return StyleSheet.create({
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.chrome,
    },
    chipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryBg,
    },
  });
}

function createBannerStyles(colors: ThemePalette) {
  return StyleSheet.create({
    wrap: { marginHorizontal: 16, marginBottom: 10 },
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      gap: 8,
    },
  });
}
