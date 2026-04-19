import React from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../lib/contexts/ThemeContext';
import { theme } from '../lib/theme';
import { IconGear, IconMoon, IconSun } from './icons/SessionChromeIcons';

type Props = {
  /** When false, only theme toggle (e.g. on Profile). */
  showProfileLink?: boolean;
};

export function AppTabHeaderRight({ showProfileLink = true }: Props) {
  const { colors, toggleMode, mode } = useTheme();
  
  // Animation values
  const themeScale = React.useRef(new Animated.Value(1)).current;
  const profileScale = React.useRef(new Animated.Value(1)).current;
  
  const handleThemePress = () => {
    Animated.sequence([
      Animated.timing(themeScale, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(themeScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    toggleMode();
  };
  
  const handleProfilePress = () => {
    Animated.sequence([
      Animated.timing(profileScale, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(profileScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    router.push('/profile');
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: themeScale }] }}>
        <TouchableOpacity
          onPress={handleThemePress}
          style={styles.iconButton}
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel={mode === 'night' ? 'Switch to day mode' : 'Switch to night mode'}
        >
          {mode === 'night' ? (
            <IconSun size={24} color={colors.active} />
          ) : (
            <IconMoon size={22} color={colors.active} />
          )}
        </TouchableOpacity>
      </Animated.View>
      {showProfileLink ? (
        <Animated.View style={{ transform: [{ scale: profileScale }] }}>
          <TouchableOpacity
            onPress={handleProfilePress}
            style={styles.iconButton}
            activeOpacity={1}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <IconGear size={24} color={colors.active} />
          </TouchableOpacity>
        </Animated.View>
      ) : null}
    </View>
  );
}

function createStyles(colors: any) {
  return {
    container: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: theme.spacing['2'],
    },
    iconButton: {
      padding: theme.spacing['2'],
      borderRadius: theme.spacing.radiusLg,
      backgroundColor: 'transparent',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minWidth: 44,
      minHeight: 44,
    },
  };
}
