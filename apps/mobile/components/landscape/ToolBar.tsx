import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { theme } from '../../lib/theme';

export type ToolBarAction = {
  id: string;
  name: string;
  icon?: string;
  isActive?: boolean;
  isDisabled?: boolean;
  badge?: number;
  onPress?: () => void;
};

export type ToolBarSection = {
  id: string;
  title?: string;
  actions: ToolBarAction[];
  position?: 'left' | 'center' | 'right';
};

export type ToolBarProps = {
  /** Toolbar sections */
  sections: ToolBarSection[];
  /** Show/hide toolbar title */
  showTitle?: boolean;
  /** Toolbar title */
  title?: string;
  /** Toolbar variant */
  variant?: 'default' | 'compact' | 'expanded';
  /** Additional styles */
  style?: ViewStyle;
  /** On action press callback */
  onActionPress?: (action: ToolBarAction) => void;
};

/**
 * Professional Tool Bar for A3 Landscape Mode
 * 
 * Matches the App Build reference design with:
 * - Professional tool layout
 * - Action grouping and sections
 * - Active state indicators
 * - Badge notifications
 * - Responsive positioning
 */
export function ToolBar({
  sections,
  showTitle = true,
  title = 'Roam Studio',
  variant = 'default',
  style,
  onActionPress,
}: ToolBarProps) {
  const { colors } = useTheme();
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const styles = createToolBarStyles(colors, variant);

  const handleActionPress = (action: ToolBarAction) => {
    if (action.isDisabled) return;
    
    setActiveAction(action.id);
    
    if (onActionPress) {
      onActionPress(action);
    } else if (action.onPress) {
      action.onPress();
    }
  };

  const renderAction = (action: ToolBarAction) => (
    <TouchableOpacity
      key={action.id}
      style={[
        styles.actionButton,
        action.isActive && styles.actionButtonActive,
        action.isDisabled && styles.actionButtonDisabled,
        activeAction === action.id && styles.actionButtonPressed,
      ]}
      onPress={() => handleActionPress(action)}
      activeOpacity={0.7}
      disabled={action.isDisabled}
    >
      {action.icon && (
        <Text style={[
          styles.actionIcon,
          action.isActive && styles.actionIconActive,
          action.isDisabled && styles.actionIconDisabled,
        ]}>
          {action.icon}
        </Text>
      )}
      
      {variant !== 'compact' && (
        <Text style={[
          styles.actionText,
          action.isActive && styles.actionTextActive,
          action.isDisabled && styles.actionTextDisabled,
        ]}>
          {action.name}
        </Text>
      )}
      
      {action.badge && action.badge > 0 && (
        <View style={styles.actionBadge}>
          <Text style={styles.actionBadgeText}>{action.badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderSection = (section: ToolBarSection) => {
    const sectionStyles = {
      left: styles.sectionLeft,
      center: styles.sectionCenter,
      right: styles.sectionRight,
    };

    return (
      <View key={section.id} style={[styles.section, sectionStyles[section.position || 'left']]}>
        {section.title && variant === 'expanded' && (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        <View style={styles.sectionActions}>
          {section.actions.map(renderAction)}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Left Section */}
      {showTitle && (
        <View style={styles.titleSection}>
          <Text style={styles.toolbarTitle}>{title}</Text>
        </View>
      )}

      {/* Toolbar Actions */}
      <View style={styles.toolbarContent}>
        {sections.map(renderSection)}
      </View>

      {/* Right Section - Status */}
      <View style={styles.statusSection}>
        <Text style={styles.statusText}>Ready</Text>
      </View>
    </View>
  );
}

function createToolBarStyles(colors: any, variant: 'default' | 'compact' | 'expanded') {
  const baseHeight = theme.landscape.toolBar.height;
  const padding = theme.landscape.toolBar.paddingHorizontal;

  return StyleSheet.create({
    container: {
      height: baseHeight,
      backgroundColor: theme.landscape.toolBar.backgroundColor,
      borderBottomWidth: 1,
      borderBottomColor: theme.landscape.toolBar.borderBottom,
      paddingHorizontal: padding,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: theme.zIndex.sticky,
    },
    titleSection: {
      flex: 0,
      marginRight: 16,
    },
    toolbarTitle: {
      fontSize: 18,
      fontWeight: '700',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      color: colors.primary,
    },
    toolbarContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    statusSection: {
      flex: 0,
      marginLeft: 16,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.muted,
    },
    section: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionLeft: {
      justifyContent: 'flex-start',
    },
    sectionCenter: {
      justifyContent: 'center',
      flex: 1,
    },
    sectionRight: {
      justifyContent: 'flex-end',
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.muted,
      marginRight: 8,
      textTransform: 'uppercase',
    },
    sectionActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: variant === 'compact' ? 4 : 8,
    },
    actionButton: {
      flexDirection: variant === 'compact' ? 'column' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: variant === 'compact' ? 6 : 12,
      paddingVertical: variant === 'compact' ? 4 : 6,
      borderRadius: 6,
      backgroundColor: colors.chrome,
      borderWidth: 1,
      borderColor: colors.borderLight,
      minHeight: variant === 'compact' ? 32 : 40,
      minWidth: variant === 'compact' ? 32 : 40,
      position: 'relative',
    },
    actionButtonActive: {
      backgroundColor: colors.primaryBg,
      borderColor: colors.primary,
    },
    actionButtonDisabled: {
      opacity: 0.4,
    },
    actionButtonPressed: {
      transform: [{ scale: 0.95 }],
    },
    actionIcon: {
      fontSize: variant === 'compact' ? 14 : 16,
      marginRight: variant === 'compact' ? 0 : 6,
      color: colors.muted,
    },
    actionIconActive: {
      color: colors.primary,
    },
    actionIconDisabled: {
      color: colors.muted,
    },
    actionText: {
      fontSize: variant === 'compact' ? 10 : 12,
      fontWeight: '500',
      color: colors.active,
    },
    actionTextActive: {
      color: colors.primary,
      fontWeight: '600',
    },
    actionTextDisabled: {
      color: colors.muted,
    },
    actionBadge: {
      position: 'absolute',
      top: variant === 'compact' ? -2 : -4,
      right: variant === 'compact' ? -2 : -4,
      backgroundColor: colors.capture,
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    actionBadgeText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: '600',
    },
  });
}

// Preset toolbar configurations
export const createPlaybackToolBar = (): ToolBarSection[] => [
  {
    id: 'playback',
    position: 'center',
    actions: [
      { id: 'play', name: 'Play', icon: '>', onPress: () => {} },
      { id: 'pause', name: 'Pause', icon: '||', onPress: () => {} },
      { id: 'stop', name: 'Stop', icon: '[]', onPress: () => {} },
      { id: 'prev', name: 'Previous', icon: '<<', onPress: () => {} },
      { id: 'next', name: 'Next', icon: '>>', onPress: () => {} },
    ],
  },
];

export const createEditToolBar = (): ToolBarSection[] => [
  {
    id: 'edit',
    position: 'left',
    actions: [
      { id: 'cut', name: 'Cut', icon: 'C', onPress: () => {} },
      { id: 'copy', name: 'Copy', icon: 'P', onPress: () => {} },
      { id: 'paste', name: 'Paste', icon: 'V', onPress: () => {} },
      { id: 'delete', name: 'Delete', icon: 'D', onPress: () => {} },
    ],
  },
  {
    id: 'view',
    position: 'right',
    actions: [
      { id: 'zoom-in', name: 'Zoom In', icon: '+', onPress: () => {} },
      { id: 'zoom-out', name: 'Zoom Out', icon: '-', onPress: () => {} },
      { id: 'fit', name: 'Fit', icon: 'F', onPress: () => {} },
    ],
  },
];

export const createCaptureToolBar = (): ToolBarSection[] => [
  {
    id: 'capture',
    position: 'center',
    actions: [
      { id: 'record', name: 'Record', icon: 'R', isActive: true, onPress: () => {} },
      { id: 'photo', name: 'Photo', icon: 'C', onPress: () => {} },
      { id: 'screenshot', name: 'Screenshot', icon: 'S', onPress: () => {} },
    ],
  },
];

export default ToolBar;
