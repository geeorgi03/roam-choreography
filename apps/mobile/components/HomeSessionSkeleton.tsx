import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useMemo } from 'react';
import { useTheme } from '../lib/contexts/ThemeContext';
import type { ThemePalette } from '../lib/contexts/ThemeContext';
import { theme } from '../lib/theme';

type Props = { rows?: number };

export function HomeSessionSkeleton({ rows = 4 }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const items = useMemo(() => Array.from({ length: rows }, (_, i) => i), [rows]);
  
  // Animation values for shimmer effect
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerAnimation.start();
    return () => shimmerAnimation.stop();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  return (
    <View style={styles.wrap} accessibilityLabel="Loading sessions">
      {items.map((i) => (
        <Animated.View key={i} style={[styles.card, { opacity }]}>
          <View style={styles.lineLg} />
          <View style={styles.lineSm} />
        </Animated.View>
      ))}
    </View>
  );
}

function createStyles(colors: ThemePalette) {
  return StyleSheet.create({
    wrap: {
      paddingHorizontal: theme.spacing['5'],
      paddingTop: theme.spacing['3'],
      gap: theme.spacing['2.5'],
    },
    card: {
      borderRadius: theme.spacing.radiusLg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.chrome,
      padding: theme.spacing['3.5'],
      gap: theme.spacing['2.5'],
      minHeight: 64,
      justifyContent: 'center' as const,
      ...theme.shadows.sm,
    },
    lineLg: {
      height: 16,
      borderRadius: theme.spacing.radiusSm,
      width: '72%',
      backgroundColor: colors.inactive,
      opacity: 0.4,
    },
    lineSm: {
      height: 12,
      borderRadius: theme.spacing.radiusSm,
      width: '44%',
      backgroundColor: colors.inactive,
      opacity: 0.3,
    },
  });
}
