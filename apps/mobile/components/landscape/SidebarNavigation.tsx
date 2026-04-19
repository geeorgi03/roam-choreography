import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { theme } from '../../lib/theme';

export type SidebarItem = {
  id: string;
  title: string;
  icon?: string;
  badge?: number;
  onPress?: () => void;
  isActive?: boolean;
  isDisabled?: boolean;
};

export type SidebarSection = {
  title: string;
  items: SidebarItem[];
};

export type SidebarNavigationProps = {
  sections: SidebarSection[];
  activeItem?: string;
  onItemPress?: (item: SidebarItem) => void;
  style?: ViewStyle;
  /** Show session list instead of navigation */
  showSessions?: boolean;
  sessions?: Array<{
    id: string;
    name: string;
    clipCount?: number;
    isActive?: boolean;
  }>;
};

/**
 * Professional Sidebar Navigation for A3 Landscape Mode
 * 
 * Matches the App Build reference design with:
 * - Clean navigation hierarchy
 * - Session management
 * - Professional tool aesthetics
 * - Active state indicators
 */
export function SidebarNavigation({
  sections,
  activeItem,
  onItemPress,
  style,
  showSessions = false,
  sessions = [],
}: SidebarNavigationProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const styles = createSidebarStyles(colors);

  const toggleSection = (sectionTitle: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionTitle)) {
      newExpanded.delete(sectionTitle);
    } else {
      newExpanded.add(sectionTitle);
    }
    setExpandedSections(newExpanded);
  };

  const handleItemPress = (item: SidebarItem) => {
    if (item.isDisabled) return;
    
    if (onItemPress) {
      onItemPress(item);
    } else if (item.onPress) {
      item.onPress();
    }
  };

  const handleSessionPress = (sessionId: string) => {
    router.push(`/session/${sessionId}`);
  };

  return (
    <View style={[styles.container, style]}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* App Title */}
        <View style={styles.appHeader}>
          <Text style={styles.appTitle}>Roam</Text>
          <Text style={styles.appSubtitle}>Choreography Studio</Text>
        </View>

        {/* Navigation Sections */}
        {!showSessions && sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection(section.title)}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionToggle}>
                {expandedSections.has(section.title) ? '×' : '+'}
              </Text>
            </TouchableOpacity>
            
            {expandedSections.has(section.title) && (
              <View style={styles.sectionItems}>
                {section.items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.sidebarItem,
                      item.isActive && styles.sidebarItemActive,
                      item.isDisabled && styles.sidebarItemDisabled,
                    ]}
                    onPress={() => handleItemPress(item)}
                    activeOpacity={0.7}
                    disabled={item.isDisabled}
                  >
                    <View style={styles.itemContent}>
                      {item.icon && (
                        <Text style={styles.itemIcon}>{item.icon}</Text>
                      )}
                      <Text style={[
                        styles.itemTitle,
                        item.isActive && styles.itemTitleActive,
                        item.isDisabled && styles.itemTitleDisabled,
                      ]}>
                        {item.title}
                      </Text>
                    </View>
                    {item.badge && item.badge > 0 && (
                      <View style={styles.itemBadge}>
                        <Text style={styles.itemBadgeText}>{item.badge}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Sessions List */}
        {showSessions && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection('Sessions')}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionTitle}>Sessions</Text>
              <Text style={styles.sectionToggle}>
                {expandedSections.has('Sessions') ? '×' : '+'}
              </Text>
            </TouchableOpacity>
            
            {expandedSections.has('Sessions') && (
              <View style={styles.sectionItems}>
                {sessions.map((session) => (
                  <TouchableOpacity
                    key={session.id}
                    style={[
                      styles.sessionItem,
                      session.isActive && styles.sessionItemActive,
                    ]}
                    onPress={() => handleSessionPress(session.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sessionContent}>
                      <Text style={[
                        styles.sessionName,
                        session.isActive && styles.sessionNameActive,
                      ]}>
                        {session.name}
                      </Text>
                      {session.clipCount !== undefined && (
                        <Text style={styles.sessionMeta}>
                          {session.clipCount} clip{session.clipCount !== 1 ? 's' : ''}
                        </Text>
                      )}
                    </View>
                    {session.isActive && (
                      <View style={styles.activeIndicator} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
            <Text style={styles.actionButtonText}>New Session</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
            <Text style={styles.actionButtonText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function createSidebarStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.landscape.sidebar.backgroundColor,
      borderRightWidth: 1,
      borderRightColor: theme.landscape.sidebar.borderRight,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: theme.landscape.sidebar.padding,
    },
    appHeader: {
      marginBottom: theme.landscape.spacing.sidebarGap * 2,
    },
    appTitle: {
      fontSize: 24,
      fontWeight: '700',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      color: colors.primary,
      marginBottom: 4,
    },
    appSubtitle: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.muted,
    },
    section: {
      marginBottom: theme.landscape.spacing.sidebarGap,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: 'rgba(0, 122, 255, 0.05)',
      borderRadius: 6,
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: theme.landscape.typography.sidebarTitle.fontSize,
      fontWeight: theme.landscape.typography.sidebarTitle.fontWeight,
      fontFamily: theme.landscape.typography.sidebarTitle.fontFamily,
      color: theme.landscape.typography.sidebarTitle.color,
    },
    sectionToggle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.primary,
      width: 20,
      textAlign: 'center',
    },
    sectionItems: {
      paddingLeft: 8,
    },
    sidebarItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 6,
      marginBottom: 4,
    },
    sidebarItemActive: {
      backgroundColor: colors.primaryBg,
    },
    sidebarItemDisabled: {
      opacity: 0.4,
    },
    itemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    itemIcon: {
      fontSize: 16,
      marginRight: 12,
      color: colors.muted,
    },
    itemTitle: {
      fontSize: theme.landscape.typography.sidebarItem.fontSize,
      fontWeight: theme.landscape.typography.sidebarItem.fontWeight,
      color: theme.landscape.typography.sidebarItem.color,
    },
    itemTitleActive: {
      color: colors.primary,
      fontWeight: '600',
    },
    itemTitleDisabled: {
      color: colors.muted,
    },
    itemBadge: {
      backgroundColor: colors.capture,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    itemBadgeText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '600',
    },
    sessionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 6,
      marginBottom: 4,
      backgroundColor: colors.chrome,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    sessionItemActive: {
      backgroundColor: colors.primaryBg,
      borderColor: colors.primary,
    },
    sessionContent: {
      flex: 1,
    },
    sessionName: {
      fontSize: theme.landscape.typography.sidebarItem.fontSize,
      fontWeight: '500',
      color: colors.active,
      marginBottom: 2,
    },
    sessionNameActive: {
      color: colors.primary,
      fontWeight: '600',
    },
    sessionMeta: {
      fontSize: 12,
      color: colors.muted,
    },
    activeIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    bottomActions: {
      marginTop: 'auto',
      paddingTop: theme.landscape.spacing.sidebarGap,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    actionButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.chrome,
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: 6,
      alignItems: 'center',
      marginBottom: 8,
    },
    actionButtonText: {
      fontSize: theme.landscape.typography.sidebarItem.fontSize,
      fontWeight: '500',
      color: colors.active,
    },
  });
}

export default SidebarNavigation;
