import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, type ReactNode } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { LandscapeLayout, useLandscapeLayout } from './LandscapeLayout';
import SidebarNavigation from './SidebarNavigation';
import CanvasArea from './CanvasArea';
import RightPanel from './RightPanel';
import Timeline from './Timeline';
import ToolBar, { createPlaybackToolBar, createEditToolBar } from './ToolBar';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export type LandscapeHomeScreenProps = {
  /** Children content for portrait mode */
  children?: ReactNode;
  /** Override automatic layout detection */
  forceLandscape?: boolean;
};

/**
 * A3 Landscape Home Screen
 * 
 * Professional tablet layout matching the App Build reference:
 * - Left sidebar with navigation and sessions
 * - Central canvas with video player
 * - Right panel with tools and properties
 * - Bottom timeline for editing
 * - Top toolbar with professional controls
 */
export function LandscapeHomeScreen({ children, forceLandscape = false }: LandscapeHomeScreenProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { isLandscape, isTablet, screenWidth, screenHeight } = useLandscapeLayout();
  
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(10000); // 10 seconds

  const styles = createLandscapeHomeStyles(colors);

  // Sample data for demonstration
  const sidebarSections = [
    {
      title: 'Workspace',
      items: [
        { id: 'home', title: 'Home', icon: 'H', isActive: true },
        { id: 'sessions', title: 'Sessions', icon: 'S', badge: 3 },
        { id: 'inbox', title: 'Inbox', icon: 'I', badge: 12 },
        { id: 'archive', title: 'Archive', icon: 'A' },
      ],
    },
    {
      title: 'Tools',
      items: [
        { id: 'capture', title: 'Capture', icon: 'C' },
        { id: 'edit', title: 'Edit', icon: 'E' },
        { id: 'export', title: 'Export', icon: 'X' },
      ],
    },
  ];

  const sessions = [
    { id: '1', name: 'Morning Routine', clipCount: 5, isActive: true },
    { id: '2', name: 'Dance Practice', clipCount: 12 },
    { id: '3', name: 'Yoga Flow', clipCount: 8 },
    { id: '4', name: 'Workout Session', clipCount: 15 },
  ];

  const toolSections = [
    {
      id: 'selection',
      title: 'Selection',
      tools: [
        { id: 'select', name: 'Select', icon: 'S', isActive: selectedTool === 'select' },
        { id: 'crop', name: 'Crop', icon: 'C', isActive: selectedTool === 'crop' },
        { id: 'trim', name: 'Trim', icon: 'T', isActive: selectedTool === 'trim' },
      ],
    },
    {
      id: 'adjustment',
      title: 'Adjustment',
      tools: [
        { id: 'speed', name: 'Speed', icon: 'SP', isActive: selectedTool === 'speed' },
        { id: 'volume', name: 'Volume', icon: 'V', isActive: selectedTool === 'volume' },
        { id: 'filter', name: 'Filter', icon: 'F', isActive: selectedTool === 'filter' },
      ],
    },
  ];

  const properties = [
    { id: 'name', label: 'Clip Name', type: 'text' as const, value: 'Sample Clip' },
    { id: 'duration', label: 'Duration', type: 'number' as const, value: 10.5 },
    { id: 'quality', label: 'Quality', type: 'select' as const, value: 'HD', options: ['SD', 'HD', '4K'] },
    { id: 'loop', label: 'Loop', type: 'toggle' as const, value: false },
    { id: 'mute', label: 'Mute', type: 'toggle' as const, value: true },
  ];

  const timelineClips = [
    { id: '1', name: 'Intro', startTime: 0, duration: 2000, color: '#007AFF' },
    { id: '2', name: 'Main', startTime: 2000, duration: 5000, color: '#34C759' },
    { id: '3', name: 'Outro', startTime: 7000, duration: 3000, color: '#FF9500' },
  ];

  const timelineMarkers = [
    { id: 'start', time: 0, label: 'Start', color: '#34C759' },
    { id: 'marker1', time: 5000, label: 'Key Point', color: '#FF9500' },
    { id: 'end', time: 10000, label: 'End', color: '#FF3B30' },
  ];

  const handleToolPress = (tool: any) => {
    setSelectedTool(tool.id);
  };

  const handleSessionSelect = (sessionId: string) => {
    setActiveSession(sessionId);
  };

  const handleTimelineSeek = (time: number) => {
    setCurrentTime(time);
  };

  const handleClipSelect = (clip: any) => {
    console.log('Clip selected:', clip);
  };

  // If not landscape or not tablet, show regular content
  if ((!isLandscape || !isTablet) && !forceLandscape) {
    return (
      <View style={styles.portraitContainer}>
        {children}
      </View>
    );
  }

  return (
    <LandscapeLayout>
      {/* Left Sidebar */}
      <SidebarNavigation
        sections={sidebarSections}
        showSessions={true}
        sessions={sessions}
        activeItem={activeSession || 'home'}
        onItemPress={(item) => {
          if (item.id.startsWith('session-')) {
            handleSessionSelect(item.id);
          } else {
            router.push(`/${item.id}`);
          }
        }}
      />

      {/* Central Canvas */}
      <CanvasArea
        title="Active Session"
        videoUri="https://example.com/video.mp4" // Replace with actual video URI
        mode="video"
        currentTime={currentTime}
        duration={duration}
        onVideoLoad={(status) => setDuration(status.durationMillis || 0)}
        onSeek={handleTimelineSeek}
      />

      {/* Right Panel */}
      <RightPanel
        title="Inspector"
        sections={toolSections}
        properties={properties}
        onToolPress={handleToolPress}
      />

      {/* Bottom Timeline */}
      <Timeline
        clips={timelineClips}
        markers={timelineMarkers}
        duration={duration}
        currentTime={currentTime}
        onSeek={handleTimelineSeek}
        onClipSelect={handleClipSelect}
      />

      {/* Top Toolbar - This would be integrated into LandscapeLayout */}
      {/* For now, the toolbar is handled by the parent layout */}
    </LandscapeLayout>
  );
}

function createLandscapeHomeStyles(colors: any) {
  return StyleSheet.create({
    portraitContainer: {
      flex: 1,
      backgroundColor: colors.ground,
    },
  });
}

// Enhanced version with toolbar integration
export function LandscapeHomeScreenWithToolbar({ children, forceLandscape = false }: LandscapeHomeScreenProps) {
  const { colors } = useTheme();
  const { isLandscape, isTablet } = useLandscapeLayout();
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(10000);
  const [selectedTool, setSelectedTool] = useState<string>('select');

  const styles = createLandscapeHomeStyles(colors);

  // If not landscape or not tablet, show regular content
  if ((!isLandscape || !isTablet) && !forceLandscape) {
    return (
      <View style={styles.portraitContainer}>
        {children}
      </View>
    );
  }

  return (
    <View style={styles.landscapeContainer}>
      {/* Top Toolbar */}
      <ToolBar
        sections={createPlaybackToolBar()}
        title="Roam Studio"
        variant="default"
        onActionPress={(action) => {
          console.log('Toolbar action:', action.id);
          // Handle toolbar actions
        }}
      />

      {/* Main Layout */}
      <View style={styles.mainLayout}>
        {/* Left Sidebar */}
        <View style={styles.sidebar}>
          <SidebarNavigation
            sections={[
              {
                title: 'Workspace',
                items: [
                  { id: 'home', title: 'Home', icon: 'H', isActive: true },
                  { id: 'sessions', title: 'Sessions', icon: 'S', badge: 3 },
                  { id: 'inbox', title: 'Inbox', icon: 'I', badge: 12 },
                ],
              },
            ]}
            showSessions={true}
            sessions={[
              { id: '1', name: 'Morning Routine', clipCount: 5, isActive: true },
              { id: '2', name: 'Dance Practice', clipCount: 12 },
            ]}
          />
        </View>

        {/* Central Canvas */}
        <View style={styles.canvas}>
          <CanvasArea
            title="Active Session"
            mode="video"
            currentTime={currentTime}
            duration={duration}
            onVideoLoad={(status) => setDuration(status.durationMillis || 0)}
          />
        </View>

        {/* Right Panel */}
        <View style={styles.rightPanel}>
          <RightPanel
            title="Inspector"
            sections={[
              {
                id: 'selection',
                title: 'Selection',
                tools: [
                  { id: 'select', name: 'Select', icon: 'S', isActive: selectedTool === 'select' },
                  { id: 'crop', name: 'Crop', icon: 'C', isActive: selectedTool === 'crop' },
                ],
              },
            ]}
            properties={[
              { id: 'name', label: 'Clip Name', type: 'text' as const, value: 'Sample Clip' },
              { id: 'duration', label: 'Duration', type: 'number' as const, value: 10.5 },
            ]}
            onToolPress={setSelectedTool}
          />
        </View>
      </View>

      {/* Bottom Timeline */}
      <View style={styles.timeline}>
        <Timeline
          clips={[
            { id: '1', name: 'Intro', startTime: 0, duration: 2000, color: '#007AFF' },
            { id: '2', name: 'Main', startTime: 2000, duration: 5000, color: '#34C759' },
          ]}
          duration={duration}
          currentTime={currentTime}
          onSeek={setCurrentTime}
        />
      </View>
    </View>
  );
}

const enhancedStyles = StyleSheet.create({
  landscapeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 280,
    backgroundColor: '#FFFEFC',
    borderRightWidth: 1,
    borderRightColor: '#E5E5EA',
  },
  canvas: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  rightPanel: {
    width: 320,
    backgroundColor: '#FFFEFC',
    borderLeftWidth: 1,
    borderLeftColor: '#E5E5EA',
  },
  timeline: {
    height: 120,
    backgroundColor: '#FFFEFC',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    padding: 12,
  },
});

export default LandscapeHomeScreen;
