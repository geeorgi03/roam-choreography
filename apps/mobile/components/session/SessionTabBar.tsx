import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { theme } from '../../lib/theme';
import { useTheme, type ThemePalette } from '../../lib/contexts/ThemeContext';

const tabs = [
  { id: 'workbench', fullLabel: 'Workbench', shortLabel: 'Work' },
  { id: 'song-map', fullLabel: 'Map', shortLabel: 'Map' },
  { id: 'spatial', fullLabel: 'Spatial', shortLabel: 'Space' },
  { id: 'group', fullLabel: 'Group', shortLabel: 'Group' },
] as const;

export function SessionTabBar() {
  const { colors } = useTheme();
  const styles = useMemo(() => createTabBarStyles(colors), [colors]);
  const { activeTab, setActiveTab, closeSheet } = useSessionContext();
  const { width } = useWindowDimensions();

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            activeTab === tab.id && styles.tabActive,
          ]}
          onPress={() => {
            closeSheet();
            setActiveTab(tab.id);
          }}
          activeOpacity={0.75}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === tab.id && styles.tabTextActive,
            ]}
          >
            {width >= 600 ? tab.fullLabel : tab.shortLabel}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function createTabBarStyles(colors: ThemePalette) {
  return StyleSheet.create({
    container: {
      height: 36,
      flexDirection: 'row',
      alignItems: 'stretch',
      paddingHorizontal: 12,
      backgroundColor: colors.chrome,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    tab: {
      paddingHorizontal: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: {
      borderBottomColor: colors.active,
    },
    tabText: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: '400',
    },
    tabTextActive: {
      color: colors.active,
      fontWeight: '700',
    },
  });
}
