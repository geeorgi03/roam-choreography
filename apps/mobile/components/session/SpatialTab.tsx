import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { theme } from '../../lib/theme';

const colors = theme.light;

interface Moment {
  id: string;
  label: string;
}

interface Dancer {
  id: string;
  color: string;
  top: string;
  left: string;
}

interface ToolState {
  position: 'active' | 'locked';
  path: 'active' | 'locked';
  relationship: 'active' | 'locked';
}

export function SpatialTab() {
  const { activeMoment, setActiveMoment, activeSection } = useSessionContext();
  
  // Same moments state as SongMapTab (shared via context)
  const [moments] = useState<Moment[]>([{ id: '1', label: 'moment 1' }]);
  const [renamingMomentId, setRenamingMomentId] = useState<string | null>(null);
  
  // Canvas state
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [dancers] = useState<Dancer[]>([
    { id: 'A', color: colors.mine, top: '40%', left: '30%' },
    { id: 'B', color: colors.active, top: '60%', left: '70%' },
  ]);
  
  // Tool progression state
  const [toolState, setToolState] = useState<ToolState>({
    position: 'active',
    path: 'locked',
    relationship: 'locked',
  });
  const [hasDot, setHasDot] = useState(false);
  const [hasPath, setHasPath] = useState(false);
  
  // Quality layer state
  const [isExpanded, setIsExpanded] = useState(false);
  const [initiation, setInitiation] = useState('');
  const [relationshipQuality, setRelationshipQuality] = useState('');
  const [note, setNote] = useState('');

  const handleMomentPress = (momentId: string) => {
    setActiveMoment(momentId);
  };

  const handleMomentLongPress = (momentId: string) => {
    setRenamingMomentId(momentId);
  };

  const handleRenameMoment = (newLabel: string) => {
    if (renamingMomentId) {
      // Update local moments state (same as SongMapTab)
      setRenamingMomentId(null);
    }
  };

  const handleCanvasTap = () => {
    if (toolState.position === 'active' && !hasDot) {
      setHasDot(true);
      setToolState(prev => ({ ...prev, path: 'active' }));
    } else if (toolState.path === 'active' && !hasPath) {
      setHasPath(true);
      setToolState(prev => ({ ...prev, relationship: 'active' }));
    }
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

  const renderWaveformBars = () => {
    const heights = [12, 24, 18, 30, 16, 28, 20, 26, 14, 22, 18, 25];
    return heights.map((height, index) => (
      <View
        key={index}
        style={[
          styles.waveformBar,
          { height, backgroundColor: colors.muted }
        ]}
      />
    ));
  };

  const isToolLocked = (tool: keyof ToolState) => toolState[tool] === 'locked';

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
        </ScrollView>

        {/* Floor canvas */}
        <TouchableOpacity 
          style={styles.floorCanvas}
          onPress={handleCanvasTap}
          onLayout={(e) => setCanvasSize({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height
          })}
        >
          {renderGridLines()}
          
          {/* Dancer dots */}
          {dancers.map((dancer) => (
            <View
              key={dancer.id}
              style={[
                styles.dancerDot,
                {
                  backgroundColor: dancer.color,
                  top: dancer.top,
                  left: dancer.left,
                }
              ]}
            >
              <Text style={styles.dancerInitial}>{dancer.id}</Text>
            </View>
          ))}
          
          <Text style={styles.backstageLabel}>backstage</Text>
          <Text style={styles.audienceLabel}>audience</Text>
        </TouchableOpacity>

        {/* Tool bar */}
        <View style={styles.toolBar}>
          <TouchableOpacity
            style={[
              styles.toolButton,
              toolState.position === 'active' && styles.toolButtonActive
            ]}
            onPress={() => {}} // Position is always active initially
          >
            <Text style={[
              styles.toolButtonText,
              toolState.position === 'active' && styles.toolButtonTextActive
            ]}>
              Position
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.toolButton,
              toolState.path === 'active' && styles.toolButtonActive,
              isToolLocked('path') && { opacity: 0.3 },
            ]}
            onPress={() => {}} // Path unlocked after dot placement
            disabled={isToolLocked('path')}
          >
            <Text style={[
              styles.toolButtonText,
              toolState.path === 'active' && styles.toolButtonTextActive
            ]}>
              Path
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.toolButton,
              toolState.relationship === 'active' && styles.toolButtonActive,
              isToolLocked('relationship') && { opacity: 0.3 },
            ]}
            onPress={() => {}} // Relationship unlocked after path
            disabled={isToolLocked('relationship')}
          >
            <Text style={[
              styles.toolButtonText,
              toolState.relationship === 'active' && styles.toolButtonTextActive
            ]}>
              Relationship
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Right panel */}
      <View style={styles.rightPanel}>
        {/* Mini waveform strip */}
        <View style={styles.miniWaveform}>
          {renderWaveformBars()}
        </View>

        {/* Quality layer */}
        <View style={styles.qualityLayer}>
          {/* Header */}
          <View style={styles.qualityHeader}>
            <Text style={styles.qualityHeaderText}>quality layer</Text>
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => setIsExpanded(!isExpanded)}
            >
              <Text style={styles.expandButtonText}>{isExpanded ? '−' : '+'}</Text>
            </TouchableOpacity>
          </View>

          {/* Body */}
          {isExpanded && (
            <View style={styles.qualityBody}>
              {/* INITIATION */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>INITIATION</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="spine, heart, sternum…"
                  placeholderTextColor={colors.muted}
                  value={initiation}
                  onChangeText={setInitiation}
                />
              </View>

              {/* RELATIONSHIP QUALITY */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>RELATIONSHIP QUALITY</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="leads · follows · resists · echoes"
                  placeholderTextColor={colors.muted}
                  value={relationshipQuality}
                  onChangeText={setRelationshipQuality}
                />
              </View>

              {/* NOTE */}
              <View style={[
                styles.field,
                styles.noteField,
                note && styles.noteFieldFilled
              ]}>
                <Text style={styles.fieldLabel}>NOTE</Text>
                <TextInput
                  style={styles.noteInput}
                  placeholder="add a voice or text note…"
                  placeholderTextColor={colors.muted}
                  value={note}
                  onChangeText={setNote}
                  multiline
                />
              </View>

              {/* QUALITY REFERENCE */}
              <View style={styles.referenceField}>
                <Text style={styles.referenceText}>add reference</Text>
              </View>
            </View>
          )}
        </View>
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
    flex: 0.65,
    flexDirection: 'column',
    position: 'relative',
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
  dancerDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dancerInitial: {
    color: '#fff',
    fontSize: 7,
    fontWeight: 'bold',
  },
  toolBar: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  toolButton: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: colors.border,
    backgroundColor: colors.ground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolButtonActive: {
    backgroundColor: colors.active,
    borderColor: colors.active,
  },
  toolButtonText: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: '500',
  },
  toolButtonTextActive: {
    color: '#ffffff',
  },
  rightPanel: {
    flex: 0.35,
    backgroundColor: colors.chrome,
    borderLeftWidth: 0.5,
    borderLeftColor: colors.border,
    padding: 12,
  },
  miniWaveform: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.ground,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  waveformBar: {
    width: 2,
    borderRadius: 1,
  },
  qualityLayer: {
    flex: 1,
  },
  qualityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  qualityHeaderText: {
    fontSize: 9,
    color: colors.muted,
    fontFamily: 'JetBrainsMono',
  },
  expandButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: colors.border,
    backgroundColor: colors.ground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandButtonText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
  },
  qualityBody: {
    gap: 12,
  },
  field: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 8,
    color: colors.muted,
    fontFamily: 'JetBrainsMono',
  },
  fieldInput: {
    fontSize: 10,
    color: colors.muted,
    padding: 6,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 4,
    backgroundColor: colors.ground,
  },
  noteField: {
    borderLeftWidth: 0,
  },
  noteFieldFilled: {
    borderLeftWidth: 2.5,
    borderLeftColor: colors.mine,
  },
  noteInput: {
    fontSize: 10,
    color: colors.muted,
    padding: 6,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 4,
    backgroundColor: colors.ground,
    fontFamily: 'Fraunces',
    fontStyle: 'italic',
    minHeight: 40,
  },
  referenceField: {
    padding: 8,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 6,
    backgroundColor: colors.ground,
    alignItems: 'center',
  },
  referenceText: {
    fontSize: 10,
    color: colors.muted,
  },
});
