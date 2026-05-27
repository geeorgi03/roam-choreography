import { View, Text, StyleSheet, TouchableOpacity, type StyleProp, type ViewStyle, Animated } from 'react-native';
import { useMemo, useRef } from 'react';
import { useTheme } from '../lib/contexts/ThemeContext';
import type { ThemePalette } from '../lib/contexts/ThemeContext';
import { theme } from '../lib/theme';

const spacing = theme.spacing;

export type ListRowProps = {
  title: string;
  subtitle?: string;
  rightMeta?: string;
  onPress?: () => void;
  disabled?: boolean;
  /** Coral border — “recommended” row (new session sheet). */
  recommended?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ListRow({
  title,
  subtitle,
  rightMeta,
  onPress,
  disabled,
  recommended,
  style,
}: ListRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, !!recommended, !!disabled),
    [colors, recommended, disabled]
  );
  
  // Animation for micro-interactions
  const scaleValue = useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const inner = (
    <>
      <View style={styles.textCol}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightMeta ? (
        <Text style={styles.rightMeta} numberOfLines={1}>
          {rightMeta}
        </Text>
      ) : null}
      <Text style={styles.chev}>›</Text>
    </>
  );

  if (onPress && !disabled) {
    return (
      <Animated.View style={[styles.row, style, { transform: [{ scale: scaleValue }] }]}>
        <TouchableOpacity
          style={styles.touchable}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          accessibilityRole="button"
        >
          {inner}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return <View style={[styles.row, style]}>{inner}</View>;
}

function createStyles(colors: ThemePalette, recommended: boolean, disabled: boolean) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 72,
      paddingVertical: theme.spacing['4'],
      paddingHorizontal: theme.spacing['5'],
      marginBottom: theme.spacing['3'],
      backgroundColor: colors.surfaceElevated,
      borderRadius: theme.spacing.radiusXl,
      borderWidth: recommended ? 2 : 1,
      borderColor: recommended ? colors.capture : colors.borderLight,
      opacity: disabled ? 0.45 : 1,
      ...theme.shadows.sm,
    },
    touchable: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    textCol: {
      flex: 1,
      marginRight: theme.spacing['3'],
    },
    title: {
      fontSize: theme.typography.sizes.xl,
      fontWeight: theme.typography.weights.semibold,
      fontFamily: theme.typography.displayFamily,
      color: colors.active,
      marginBottom: theme.spacing['1'],
      lineHeight: theme.typography.lineHeights.snug,
      letterSpacing: theme.typography.letterSpacing.tight,
    },
    subtitle: {
      fontSize: theme.typography.sizes.base,
      lineHeight: theme.typography.lineHeights.snug,
      color: colors.muted,
      marginTop: theme.spacing['1'],
    },
    rightMeta: {
      fontSize: theme.typography.sizes.sm,
      color: colors.muted,
      marginRight: theme.spacing['2'],
      maxWidth: 120,
      fontFamily: theme.typography.monoFamily,
      letterSpacing: theme.typography.letterSpacing.wide,
    },
    chev: {
      fontSize: theme.typography.sizes['3xl'],
      color: colors.muted,
      paddingLeft: theme.spacing['2'],
      minWidth: 36,
      textAlign: 'right',
      fontWeight: theme.typography.weights.light,
    },
  });
}
