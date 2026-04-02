import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { theme } from '../../lib/theme';

const colors = theme.light;

interface Moment {
  id: string;
  label: string;
}

export function SongMapTab() {
  const { 
    sessionName,
    setActiveTab,
    activeMoment, 
    setActiveMoment, 
    activeSection, 
    setActiveSection, 
    musicTrack, 
    sectionClips,
    isPlaying,
    handlePlayPause,
    handleLoopToggle,
    handleClearLoop,
    loopRegion,
    loopOpenAt,
    durationMs,
    soundRef,
    setPlayheadMs
  } = useSessionContext();
  
  const [moments, setMoments] = useState<Moment[]>([{ id: '1', label: 'moment 1' }]);
  const [renamingMomentId, setRenamingMomentId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [waveformWidth, setWaveformWidth] = useState(0);

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

  const handleSeekTo = (targetMs: number) => {
    soundRef.current?.setPositionAsync(targetMs);
    setPlayheadMs(targetMs);
  };

  const handleLoopButtonPress = () => {
    if (loopRegion !== null && loopOpenAt === null) {
      handleClearLoop();
      handleLoopToggle();
      return;
    }
    handleLoopToggle();
  };

  const handleCountsPress = () => {
    // Counts is intentionally the always-active mode in V3.
  };

  const loopLabel = loopOpenAt !== null
    ? 'tap to close'
    : 'set loop';

  const waveformHeights = [12, 24, 18, 30, 16, 28, 20, 26, 14, 22, 18, 25];

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
      <View style={styles.topBar}>
        <Text style={styles.topBarSessionName}>{sessionName}</Text>
        <View style={styles.topBarRight}>
          <Text style={styles.topBarSectionLabel}>{activeSection}</Text>
          <TouchableOpacity style={styles.spatialChip} onPress={() => setActiveTab('spatial')}>
            <Text style={styles.spatialChipText}>Spatial →</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.middleRow}>
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

      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={handlePlayPause}>
          <Text style={styles.transportIcon}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.waveformScrubber}
          onLayout={(e) => setWaveformWidth(e.nativeEvent.layout.width)}
          onPress={(e) => {
            if (!waveformWidth) return;
            const fraction = e.nativeEvent.locationX / waveformWidth;
            handleSeekTo(fraction * durationMs);
          }}
        >
          {waveformHeights.map((height, index) => (
            <View key={`bar-${index}`} style={[styles.waveformBar, { height }]} />
          ))}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLoopButtonPress}>
          <Text
            style={[
              styles.loopButtonText,
              loopOpenAt !== null && styles.loopButtonTextAmber,
            ]}
          >
            {loopLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: colors.ground,
  },
  topBar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: colors.chrome,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  topBarSessionName: {
    fontFamily: 'Fraunces',
    fontSize: 18,
    color: colors.active,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topBarSectionLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    color: colors.muted,
  },
  spatialChip: {
    borderWidth: 1,
    borderColor: colors.mine,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  spatialChipText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    color: colors.mine,
  },
  middleRow: {
    flex: 1,
    flexDirection: 'row',
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
  partitionHint: {
    fontFamily: theme.typography.monoFamily,
    fontSize: 9,
    color: colors.muted,
    paddingHorizontal: 12,
    marginBottom: 8,
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
    borderColor: '#7db9a8',
    backgroundColor: 'rgba(125,185,168,0.12)',
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
  bottomBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: colors.chrome,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  transportIcon: {
    fontSize: 18,
    color: colors.active,
  },
  waveformScrubber: {
    flex: 1,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginHorizontal: 12,
  },
  waveformBar: {
    width: 2,
    borderRadius: 1,
    backgroundColor: colors.muted,
  },
  loopButtonText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    color: colors.muted,
  },
  loopButtonTextAmber: {
    color: colors.amber,
  },
});
