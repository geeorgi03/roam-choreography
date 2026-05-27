import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { useTheme, type ThemePalette } from '../../lib/contexts/ThemeContext';
import { theme } from '../../lib/theme';
import { PremiumTabHeader } from '../premium-workbench/PremiumTabHeader';
import type { Moment } from '@roam/types';

export function SongMapTab() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { 
    sessionName,
    activeMoment, 
    setActiveMoment, 
    activeSection, 
    setActiveSection, 
    musicTrack, 
    sectionClips,
    moments,
    createMoment,
    renameMoment,
    deleteMoment,
    playheadMs,
    momentsConnectionStatus,
  } = useSessionContext();
  const [renamingMomentId, setRenamingMomentId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Get sections from musicTrack or use placeholders
  const sections = musicTrack?.sections || [
    { label: 'INTRO' },
    { label: 'VERSE' },
    { label: 'CHORUS' },
    { label: 'BRIDGE' },
    { label: 'OUTRO' },
  ];

  const handleAddMoment = async () => {
    const newMoment = await createMoment(`moment ${moments.length + 1}`, Math.round(playheadMs));
    if (newMoment) setActiveMoment(newMoment.id);
  };

  const handleMomentPress = (momentId: string) => {
    setActiveMoment(momentId);
  };

  const handleMomentLongPress = (momentId: string) => {
    const moment = moments.find(m => m.id === momentId);
    if (!moment) return;
    
    Alert.alert(
      moment.name,
      undefined,
      [
        { text: 'Rename', onPress: () => setRenamingMomentId(momentId) },
        { text: 'Delete', style: 'destructive', onPress: () => handleDeleteMoment(momentId) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleDeleteMoment = async (momentId: string) => {
    const success = await deleteMoment(momentId);
    if (success && activeMoment === momentId) {
      const remaining = moments.filter(m => m.id !== momentId);
      setActiveMoment(remaining[0]?.id ?? null);
    }
  };

  const handleRenameMoment = async (newLabel: string) => {
    if (!renamingMomentId) return;
    await renameMoment(renamingMomentId, newLabel);
    setRenamingMomentId(null);
  };

  const getSectionClipCount = (sectionLabel: string) => {
    return sectionClips.filter(clip => clip.section_label === sectionLabel).length;
  };

  const handleCountsPress = () => {
    // Counts is intentionally the always-active mode in V3.
  };

  const renderGridLines = () => {
    if (!canvasSize.width || !canvasSize.height) return null;
    
    const horizontalLines: React.ReactElement[] = [];
    const verticalLines: React.ReactElement[] = [];
    
    // Horizontal lines every 22dp
    for (let y = 22; y < canvasSize.height; y += 22) {
      horizontalLines.push(
        <View
          key={`h-${y}`}
          style={[
            styles.gridLine,
            styles.horizontalGridLine,
            { top: y, width: canvasSize.width }
          ]}
        />
      );
    }
    
    // Vertical lines every 22dp
    for (let x = 22; x < canvasSize.width; x += 22) {
      verticalLines.push(
        <View
          key={`v-${x}`}
          style={[
            styles.gridLine,
            styles.verticalGridLine,
            { left: x, height: canvasSize.height }
          ]}
        />
      );
    }
    
    return [...horizontalLines, ...verticalLines];
  };

  return (
    <View style={styles.container}>
      <PremiumTabHeader title="Song map" subtitle={sessionName} />

      {!momentsConnectionStatus.isConnected && (
        <View style={styles.connectionErrorBanner}>
          <Text style={styles.connectionErrorText}>
            {momentsConnectionStatus.errorMessage ??
              (momentsConnectionStatus.hasError
                ? 'Connection lost. Check network and reopen this session.'
                : 'Reconnecting...')}
          </Text>
        </View>
      )}

      <View style={styles.middleRow}>
        {/* Canvas zone */}
        <View style={styles.canvasZone}>
          <View style={styles.momentStripShell}>
          <ScrollView 
            horizontal 
            style={styles.momentStrip}
            showsHorizontalScrollIndicator={false}
          >
            {moments.map((moment: Moment) => (
              <TouchableOpacity
                key={moment.id}
                style={[
                  styles.momentChip,
                  activeMoment === moment.id && styles.momentChipActive
                ]}
                onPress={() => handleMomentPress(moment.id)}
                onLongPress={() => handleMomentLongPress(moment.id)}
              >
                {renamingMomentId === moment.id ? (
                  <TextInput
                    style={styles.renameInput}
                    defaultValue={moment.name}
                    onBlur={(e) => handleRenameMoment(e.nativeEvent.text)}
                    onSubmitEditing={(e) => handleRenameMoment(e.nativeEvent.text)}
                    autoFocus
                  />
                ) : (
                  <Text style={[
                    styles.momentChipText,
                    activeMoment === moment.id && styles.momentChipTextActive
                  ]}>
                    {moment.name}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.addMomentButton}
              onPress={handleAddMoment}
            >
              <Text style={styles.addMomentText}>+</Text>
            </TouchableOpacity>
          </ScrollView>
          </View>

          {/* Floor canvas */}
          <View 
            style={styles.floorCanvas}
            onLayout={(e) => setCanvasSize({
              width: e.nativeEvent.layout.width,
              height: e.nativeEvent.layout.height
            })}
          >
            {renderGridLines()}
            
            <Text style={styles.backstageLabel}>backstage</Text>
            <Text style={styles.audienceLabel}>audience</Text>
          </View>
        </View>

        {/* Right section panel */}
        <View style={styles.sectionPanel}>
          <Text style={styles.sectionHeader}>SECTIONS</Text>
          
          {/* Counts | Partition toggle */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                styles.toggleButtonActive
              ]}
              onPress={handleCountsPress}
            >
              <Text style={[
                styles.toggleButtonText,
                styles.toggleButtonTextActive
              ]}>
                Counts
              </Text>
            </TouchableOpacity>
            
            <View
              style={[
                styles.toggleButton,
                { opacity: 0.4 }
              ]}
            >
              <Text style={styles.toggleButtonText}>
                Partition
              </Text>
            </View>
          </View>
          <Text style={styles.partitionHint}>read-only in V3</Text>

          {/* Section rows */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {sections.map((section) => {
              const clipCount = getSectionClipCount(section.label);
              const isActive = activeSection === section.label;

              return (
                <TouchableOpacity
                  key={section.label}
                  style={[
                    styles.sectionRow,
                    isActive && styles.sectionRowActive
                  ]}
                  onPress={() => setActiveSection(section.label)}
                >
                  <Text style={[
                    styles.sectionRowText,
                    isActive && styles.sectionRowTextActive
                  ]}>
                    {section.label}
                  </Text>
                  <Text style={[
                    styles.sectionCount,
                    isActive && styles.sectionCountActive
                  ]}>
                    {clipCount}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

    </View>
  );
}

function createStyles(colors: ThemePalette) {
  return StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: colors.ground,
  },
  middleRow: {
    flex: 1,
    flexDirection: 'row',
  },
  canvasZone: {
    flex: 1,
    flexDirection: 'column',
  },
  momentStripShell: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 6,
    borderRadius: 12,
    backgroundColor: colors.chrome,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  momentStrip: {
    height: 32,
    backgroundColor: 'transparent',
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  momentChip: {
    minHeight: 30,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.ground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  momentChipActive: {
    borderColor: colors.mine,
    backgroundColor: colors.mineBg,
  },
  momentChipText: {
    fontSize: theme.typography.tool.caption,
    color: colors.muted,
    fontWeight: '600',
    fontFamily: theme.typography.bodyFamily,
  },
  momentChipTextActive: {
    color: colors.active,
  },
  renameInput: {
    fontSize: theme.typography.tool.caption,
    color: colors.active,
    fontWeight: '600',
    textAlign: 'center',
    minWidth: 60,
    fontFamily: theme.typography.bodyFamily,
  },
  addMomentButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.ground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  addMomentText: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '600',
  },
  floorCanvas: {
    flex: 1,
    backgroundColor: '#faf8f5',
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: '#ede8e0',
  },
  horizontalGridLine: {
    height: 0.5,
    left: 0,
  },
  verticalGridLine: {
    width: 0.5,
    top: 0,
  },
  backstageLabel: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: theme.typography.tool.caption,
    color: colors.muted,
    fontFamily: theme.typography.bodyFamily,
    fontWeight: '500',
    letterSpacing: 0.4,
    textTransform: 'uppercase' as const,
  },
  audienceLabel: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: theme.typography.tool.caption,
    color: colors.muted,
    fontFamily: theme.typography.bodyFamily,
    fontWeight: '500',
    letterSpacing: 0.4,
    textTransform: 'uppercase' as const,
  },
  sectionPanel: {
    width: 180,
    backgroundColor: colors.chrome,
    borderLeftWidth: 0.5,
    borderLeftColor: colors.border,
    padding: 12,
  },
  sectionHeader: {
    fontSize: theme.typography.tool.caption,
    color: colors.muted,
    fontFamily: theme.typography.bodyFamily,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 6,
  },
  partitionHint: {
    fontFamily: theme.typography.bodyFamily,
    fontSize: theme.typography.tool.caption,
    color: colors.muted,
    paddingHorizontal: 12,
    marginBottom: 8,
    fontWeight: '500',
  },
  toggleButton: {
    flex: 1,
    minHeight: 40,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.ground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: colors.active,
    borderColor: colors.active,
  },
  toggleButtonText: {
    fontSize: theme.typography.tool.label,
    color: colors.muted,
    fontWeight: '600',
    fontFamily: theme.typography.bodyFamily,
  },
  toggleButtonTextActive: {
    color: '#ffffff',
  },
  sectionRow: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.ground,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  sectionRowActive: {
    borderColor: colors.capture,
    backgroundColor: colors.mineBg,
  },
  sectionRowText: {
    fontSize: theme.typography.tool.label,
    color: colors.active,
    fontWeight: '600',
    fontFamily: theme.typography.bodyFamily,
  },
  sectionRowTextActive: {
    color: colors.active,
  },
  sectionCount: {
    fontSize: theme.typography.tool.caption,
    color: colors.muted,
    fontWeight: '600',
    fontFamily: theme.typography.bodyFamily,
  },
  sectionCountActive: {
    color: colors.active,
  },
  connectionErrorBanner: {
    backgroundColor: '#fee2e2',
    borderBottomWidth: 0.5,
    borderBottomColor: '#fca5a5',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  connectionErrorText: {
    fontSize: 12,
    color: '#dc2626',
    textAlign: 'center',
    fontFamily: theme.typography.monoFamily,
  },
});
}
