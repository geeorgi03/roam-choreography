import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { theme } from '../../lib/theme';

const colors = theme.light;

interface Moment {
  id: string;
  label: string;
}

export function SongMapTab() {
  const { 
    activeMoment, 
    setActiveMoment, 
    activeSection, 
    setActiveSection, 
    musicTrack, 
    sectionClips 
  } = useSessionContext();
  
  const [moments, setMoments] = useState<Moment[]>([{ id: '1', label: 'moment 1' }]);
  const [renamingMomentId, setRenamingMomentId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'counts' | 'partition'>('counts');
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Get sections from musicTrack or use placeholders
  const sections = musicTrack?.sections || [
    { label: 'INTRO' },
    { label: 'VERSE' },
    { label: 'CHORUS' },
    { label: 'BRIDGE' },
    { label: 'OUTRO' },
  ];

  const handleAddMoment = () => {
    const newMoment = {
      id: String(moments.length + 1),
      label: `moment ${moments.length + 1}`,
    };
    setMoments([...moments, newMoment]);
    setActiveMoment(newMoment.id);
  };

  const handleMomentPress = (momentId: string) => {
    setActiveMoment(momentId);
  };

  const handleMomentLongPress = (momentId: string) => {
    setRenamingMomentId(momentId);
  };

  const handleRenameMoment = (newLabel: string) => {
    if (renamingMomentId) {
      setMoments(moments.map(m => 
        m.id === renamingMomentId ? { ...m, label: newLabel } : m
      ));
      setRenamingMomentId(null);
    }
  };

  const getSectionClipCount = (sectionLabel: string) => {
    return sectionClips.filter(clip => clip.section_label === sectionLabel).length;
  };

  const renderGridLines = () => {
    if (!canvasSize.width || !canvasSize.height) return null;
    
    const horizontalLines = [];
    const verticalLines = [];
    
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
      {/* Canvas zone */}
      <View style={styles.canvasZone}>
        {/* Moment strip */}
        <ScrollView 
          horizontal 
          style={styles.momentStrip}
          showsHorizontalScrollIndicator={false}
        >
          {moments.map((moment) => (
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
                  defaultValue={moment.label}
                  onBlur={(e) => handleRenameMoment(e.nativeEvent.text)}
                  onSubmitEditing={(e) => handleRenameMoment(e.nativeEvent.text)}
                  autoFocus
                />
              ) : (
                <Text style={[
                  styles.momentChipText,
                  activeMoment === moment.id && styles.momentChipTextActive
                ]}>
                  {moment.label}
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
              viewMode === 'counts' && styles.toggleButtonActive
            ]}
            onPress={() => setViewMode('counts')}
          >
            <Text style={[
              styles.toggleButtonText,
              viewMode === 'counts' && styles.toggleButtonTextActive
            ]}>
              Counts
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'partition' && styles.toggleButtonActive
            ]}
            onPress={() => {}} // Read-only in V3
          >
            <Text style={[
              styles.toggleButtonText,
              viewMode === 'partition' && styles.toggleButtonTextActive
            ]}>
              Partition
            </Text>
          </TouchableOpacity>
        </View>

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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.ground,
  },
  canvasZone: {
    flex: 1,
    flexDirection: 'column',
  },
  momentStrip: {
    height: 36,
    backgroundColor: colors.chrome,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  momentChip: {
    height: 24,
    paddingHorizontal: 8,
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
    fontSize: 10,
    color: colors.muted,
    fontWeight: '500',
  },
  momentChipTextActive: {
    color: colors.active,
  },
  renameInput: {
    fontSize: 10,
    color: colors.active,
    fontWeight: '500',
    textAlign: 'center',
    minWidth: 60,
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
    fontSize: 7,
    color: colors.inactive,
    fontFamily: 'JetBrainsMono',
  },
  audienceLabel: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 7,
    color: colors.inactive,
    fontFamily: 'JetBrainsMono',
  },
  sectionPanel: {
    width: 180,
    backgroundColor: colors.chrome,
    borderLeftWidth: 0.5,
    borderLeftColor: colors.border,
    padding: 12,
  },
  sectionHeader: {
    fontSize: 8,
    color: colors.muted,
    fontFamily: 'JetBrainsMono',
    marginBottom: 12,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 6,
  },
  toggleButton: {
    flex: 1,
    height: 28,
    borderRadius: 6,
    borderWidth: 0.5,
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
    fontSize: 10,
    color: colors.muted,
    fontWeight: '500',
  },
  toggleButtonTextActive: {
    color: '#ffffff',
  },
  sectionRow: {
    height: 32,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: colors.border,
    backgroundColor: colors.ground,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  sectionRowActive: {
    borderColor: colors.mine,
    backgroundColor: colors.mineBg,
  },
  sectionRowText: {
    fontSize: 11,
    color: colors.active,
    fontWeight: '600',
  },
  sectionRowTextActive: {
    color: colors.active,
  },
  sectionCount: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: '500',
  },
  sectionCountActive: {
    color: colors.active,
  },
});
