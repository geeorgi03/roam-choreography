import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { theme } from '../../lib/theme';

const colors = theme.light;
const spacing = theme.spacing;

const tabs = [
  { id: 'workbench', label: 'Workbench' },
  { id: 'song-map', label: 'Song Map' },
  { id: 'spatial', label: 'Spatial' },
  { id: 'group', label: 'Group' },
] as const;

export function SessionTabBar() {
  const { activeTab, setActiveTab } = useSessionContext();

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            activeTab === tab.id && styles.tabActive,
          ]}
          onPress={() => setActiveTab(tab.id)}
          activeOpacity={0.75}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === tab.id && styles.tabTextActive,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.chrome,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: spacing.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.ground,
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: colors.active,
    borderColor: colors.active,
  },
  tabText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#ffffff',
  },
});
