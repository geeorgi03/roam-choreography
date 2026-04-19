import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../lib/contexts/ThemeContext';
import { useTranslation } from '../lib/i18n';
import { theme } from '../lib/theme';

export function HeaderBackButton() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  
  // Animation values
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const opacityValue = React.useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const handlePress = () => {
    router.back();
  };
  
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }], opacity: opacityValue }}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.hit}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={t('common.backA11y')}
      >
        <Text style={[styles.chev, { color: colors.active }]}>‹</Text>
        <Text style={[styles.label, { color: colors.active }]}>{t('common.back')}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hit: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: theme.spacing['2'],
    paddingRight: theme.spacing['2'],
    paddingLeft: theme.spacing['1'],
    borderRadius: theme.spacing.radiusMd,
  },
  chev: {
    fontSize: theme.typography.sizes['2xl'],
    fontWeight: theme.typography.weights.semibold,
    marginRight: theme.spacing['0.5'],
    marginTop: -1,
    lineHeight: theme.typography.lineHeights.tight,
  },
  label: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.medium,
    lineHeight: theme.typography.lineHeights.snug,
    letterSpacing: theme.typography.letterSpacing.tight,
  },
});
