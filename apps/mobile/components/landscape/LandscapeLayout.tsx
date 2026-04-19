import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, type ViewStyle, type ReactNode } from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { theme } from '../../lib/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export type LandscapeLayoutProps = {
  children: ReactNode;
  /** Override default layout behavior */
  layout?: 'sidebar-left' | 'sidebar-right' | 'full-width';
  /** Custom sidebar width */
  sidebarWidth?: number;
  /** Custom right panel width */
  rightPanelWidth?: number;
  /** Show/hide right panel */
  showRightPanel?: boolean;
  /** Show/hide timeline */
  showTimeline?: boolean;
  /** Show/hide toolbar */
  showToolbar?: boolean;
  /** Additional styles */
  style?: ViewStyle;
};

/**
 * A3 Landscape Layout Component
 * 
 * Provides the professional tablet layout matching the App Build reference:
 * - Left Sidebar (280px): Navigation and session management
 * - Central Canvas (flexible): Main content area with video player
 * - Right Panel (320px): Tools, properties, and metadata
 * - Bottom Timeline (120px): Horizontal timeline for editing
 * - Top Toolbar (56px): Professional tool interface
 */
export function LandscapeLayout({
  children,
  layout = 'sidebar-left',
  sidebarWidth = theme.landscape.sidebar.width,
  rightPanelWidth = theme.landscape.rightPanel.width,
  showRightPanel = true,
  showTimeline = true,
  showToolbar = true,
  style,
}: LandscapeLayoutProps) {
  const { colors } = useTheme();
  const [isLandscape, setIsLandscape] = useState(screenWidth > screenHeight);

  // Update orientation on screen size change
  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setIsLandscape(window.width > window.height);
    });
    return () => subscription?.remove();
  }, []);

  // If not in landscape mode, return children wrapped in container
  if (!isLandscape) {
    return (
      <View style={[styles.portraitContainer, { backgroundColor: colors.ground }, style]}>
        {children}
      </View>
    );
  }

  const styles = createLandscapeStyles(colors, sidebarWidth, rightPanelWidth);

  return (
    <View style={[styles.landscapeContainer, style]}>
      {/* Top Toolbar */}
      {showToolbar && (
        <View style={styles.toolBar}>
          {/* Toolbar content will be passed as children or handled by parent */}
        </View>
      )}

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        {/* Left Sidebar */}
        {layout === 'sidebar-left' && (
          <View style={styles.sidebar}>
            {/* Sidebar navigation content */}
          </View>
        )}

        {/* Central Canvas */}
        <View style={styles.canvas}>
          {children}
        </View>

        {/* Right Panel */}
        {showRightPanel && (
          <View style={styles.rightPanel}>
            {/* Tools and properties content */}
          </View>
        )}

        {/* Right Sidebar (alternative layout) */}
        {layout === 'sidebar-right' && (
          <View style={styles.sidebar}>
            {/* Sidebar navigation content */}
          </View>
        )}
      </View>

      {/* Bottom Timeline */}
      {showTimeline && (
        <View style={styles.timeline}>
          {/* Timeline content */}
        </View>
      )}
    </View>
  );
}

function createLandscapeStyles(
  colors: any,
  sidebarWidth: number,
  rightPanelWidth: number
) {
  return StyleSheet.create({
    portraitContainer: {
      flex: 1,
    },
    landscapeContainer: {
      flex: 1,
      flexDirection: 'column',
      backgroundColor: colors.ground,
    },
    toolBar: {
      height: theme.landscape.toolBar.height,
      backgroundColor: theme.landscape.toolBar.backgroundColor,
      borderBottomWidth: 1,
      borderBottomColor: theme.landscape.toolBar.borderBottom,
      paddingHorizontal: theme.landscape.toolBar.paddingHorizontal,
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: theme.zIndex.sticky,
    },
    mainContent: {
      flex: 1,
      flexDirection: 'row',
      overflow: 'hidden',
    },
    sidebar: {
      width: sidebarWidth,
      backgroundColor: theme.landscape.sidebar.backgroundColor,
      borderRightWidth: 1,
      borderRightColor: theme.landscape.sidebar.borderRight,
      padding: theme.landscape.sidebar.padding,
      zIndex: theme.zIndex.base,
    },
    canvas: {
      flex: 1,
      backgroundColor: theme.landscape.canvas.backgroundColor,
      padding: theme.landscape.canvas.padding,
      minWidth: theme.landscape.canvas.minWidth,
      maxWidth: theme.landscape.canvas.maxWidth,
      zIndex: theme.zIndex.base,
    },
    rightPanel: {
      width: rightPanelWidth,
      backgroundColor: theme.landscape.rightPanel.backgroundColor,
      borderLeftWidth: 1,
      borderLeftColor: theme.landscape.rightPanel.borderLeft,
      padding: theme.landscape.rightPanel.padding,
      zIndex: theme.zIndex.base,
    },
    timeline: {
      height: theme.landscape.timeline.height,
      backgroundColor: theme.landscape.timeline.backgroundColor,
      borderTopWidth: 1,
      borderTopColor: theme.landscape.timeline.borderTop,
      padding: theme.landscape.timeline.padding,
      zIndex: theme.zIndex.sticky,
    },
  });
}

// Helper hook for responsive layout
export function useLandscapeLayout() {
  const { width, height } = Dimensions.get('window');
  const isLandscape = width > height;
  const isTablet = width >= theme.landscape.breakpoints.tablet;
  const isDesktop = width >= theme.landscape.breakpoints.desktop;
  
  return {
    isLandscape,
    isTablet,
    isDesktop,
    screenWidth: width,
    screenHeight: height,
    layoutWidth: isLandscape ? width : height,
    layoutHeight: isLandscape ? height : width,
  };
}

// Helper component for responsive rendering
export type ResponsiveProps = {
  landscape?: ReactNode;
  portrait?: ReactNode;
  tablet?: ReactNode;
  phone?: ReactNode;
  desktop?: ReactNode;
  children?: ReactNode;
};

export function Responsive({
  landscape,
  portrait,
  tablet,
  phone,
  desktop,
  children,
}: ResponsiveProps) {
  const { isLandscape, isTablet, isDesktop } = useLandscapeLayout();

  // Priority: specific > generic > children
  if (isDesktop && desktop) return <>{desktop}</>;
  if (isTablet && tablet) return <>{tablet}</>;
  if (!isTablet && phone) return <>{phone}</>;
  if (isLandscape && landscape) return <>{landscape}</>;
  if (!isLandscape && portrait) return <>{portrait}</>;
  
  return <>{children}</>;
}

export default LandscapeLayout;
