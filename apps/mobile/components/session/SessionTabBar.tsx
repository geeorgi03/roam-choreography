import React, { useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Animated } from 'react-native';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { useTheme, type ThemePalette } from '../../lib/contexts/ThemeContext';
import { theme } from '../../lib/theme';

const tabs = [
  { id: 'workbench', fullLabel: 'Workbench', shortLabel: 'Work' },
  { id: 'song-map', fullLabel: 'Map', shortLabel: 'Map' },
  { id: 'spatial', fullLabel: 'Spatial', shortLabel: 'Space' },
  { id: 'group', fullLabel: 'Group', shortLabel: 'Group' },
] as const;

export function SessionTabBar() {
  const { colors, mode } = useTheme();
  const styles = useMemo(() => createTabBarStyles(colors, mode === 'night'), [colors, mode]);
  const { activeTab, setActiveTab, closeSheet } = useSessionContext();
  const { width } = useWindowDimensions();
  
  // Animation values for tab transitions
  const tabAnimations = useRef(
    tabs.reduce((acc, tab) => {
      acc[tab.id] = new Animated.Value(activeTab === tab.id ? 1 : 0);
      return acc;
    }, {} as Record<string, Animated.Value>)
  ).current;
  
  // Update animations when active tab changes
  React.useEffect(() => {
    tabs.forEach((tab) => {
      Animated.timing(tabAnimations[tab.id], {
        toValue: activeTab === tab.id ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [activeTab]);

  return (
    <View style={styles.outer}>
      <View style={styles.track}>
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <Animated.View
              key={tab.id}
              style={[
                styles.segment,
                {
                  backgroundColor: tabAnimations[tab.id].interpolate({
                    inputRange: [0, 1],
                    outputRange: ['transparent', colors.chrome],
                  }),
                  transform: [
                    {
                      scale: tabAnimations[tab.id].interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.02],
                      }),
                    },
                  ],
                  ...theme.shadows.sm,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.segmentTouchable}
                onPress={() => {
                  closeSheet();
                  setActiveTab(tab.id);
                }}
                activeOpacity={1}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <Animated.Text
                  style={[
                    styles.segmentLabel,
                    {
                      color: tabAnimations[tab.id].interpolate({
                        inputRange: [0, 1],
                        outputRange: [colors.muted, colors.active],
                      }),
                      fontWeight: tabAnimations[tab.id].interpolate({
                        inputRange: [0, 1],
                        outputRange: [theme.typography.weights.semibold, theme.typography.weights.bold],
                      }),
                    },
                  ]}
                >
                  {width >= 600 ? tab.fullLabel : tab.shortLabel}
                </Animated.Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

function createTabBarStyles(colors: ThemePalette, isNight: boolean) {
  const trackBg = isNight ? 'rgba(255,255,255,0.06)' : '#e2ded8';
  const activeBg = colors.chrome;
  const inactiveLabel = colors.muted;
  const activeLabel = colors.active;

  return StyleSheet.create({
    outer: {
      paddingHorizontal: theme.spacing['3'],
      paddingVertical: theme.spacing['2'],
      backgroundColor: colors.ground,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    track: {
      flexDirection: 'row' as const,
      borderRadius: theme.spacing.radiusXl,
      padding: theme.spacing['0.5'],
      backgroundColor: trackBg,
      gap: theme.spacing['0.5'],
    },
    segment: {
      flex: 1,
      paddingVertical: theme.spacing['2'],
      borderRadius: theme.spacing.radiusLg,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    segmentTouchable: {
      flex: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: theme.spacing['2'],
    },
    segmentActive: {
      backgroundColor: activeBg,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isNight ? 0.35 : 0.08,
      shadowRadius: 2,
      elevation: 2,
    },
    segmentLabel: {
      fontSize: theme.typography.sizes.sm,
      fontFamily: theme.typography.bodyFamily,
      lineHeight: theme.typography.lineHeights.snug,
      letterSpacing: theme.typography.letterSpacing.tight,
    },
  });
}
