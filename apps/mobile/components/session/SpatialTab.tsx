import React, { useMemo, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
  StyleSheet,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { theme } from '../../lib/theme';

const colors = theme.light;
const DOT_SIZE = 14;
const DOT_RADIUS = DOT_SIZE / 2;
const PATH_TOUCH_RADIUS = 18;

interface Moment {
  id: string;
  label: string;
}

interface Dancer {
  id: string;
  color: string;
  topPct: number;
  leftPct: number;
  orientationDeg: number;
}

interface ToolState {
  position: 'active' | 'locked';
  path: 'active' | 'locked';
  relationship: 'active' | 'locked';
}

type SelectedTool = keyof ToolState;

interface PathModel {
  id: string;
  dancerId: string;
  color: string;
  end: {
    topPct: number;
    leftPct: number;
  };
  targetDancerId?: string;
}

export function SpatialTab() {
  const { activeMoment, setActiveMoment } = useSessionContext();
  
  // Same moments state as SongMapTab (shared via context)
  const [moments] = useState<Moment[]>([{ id: '1', label: 'moment 1' }]);
  const [renamingMomentId, setRenamingMomentId] = useState<string | null>(null);
  
  // Canvas state
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [dancers, setDancers] = useState<Dancer[]>([
    { id: 'A', color: colors.mine, topPct: 40, leftPct: 30, orientationDeg: 0 },
    { id: 'B', color: colors.active, topPct: 60, leftPct: 70, orientationDeg: 180 },
  ]);
  const [selectedDancerId, setSelectedDancerId] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<SelectedTool>('position');
  const [pathsByDancer, setPathsByDancer] = useState<Record<string, PathModel>>({});
  
  // Tool progression state
  const [toolState, setToolState] = useState<ToolState>({
    position: 'active',
    path: 'locked',
    relationship: 'locked',
  });
  const [hasDot, setHasDot] = useState(false);
  const [hasPath, setHasPath] = useState(false);
  const dragStartRef = useRef<Record<string, { leftPx: number; topPx: number; moved: boolean }>>({});
  
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

  const handleRenameMoment = (_newLabel: string) => {
    if (renamingMomentId) {
      // Update local moments state (same as SongMapTab)
      setRenamingMomentId(null);
    }
  };

  const maxLeftPx = Math.max(0, canvasSize.width - DOT_SIZE);
  const maxTopPx = Math.max(0, canvasSize.height - DOT_SIZE);

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

  const leftPctToPx = (leftPct: number) => (maxLeftPx === 0 ? 0 : (leftPct / 100) * maxLeftPx);
  const topPctToPx = (topPct: number) => (maxTopPx === 0 ? 0 : (topPct / 100) * maxTopPx);
  const leftPxToPct = (leftPx: number) => (maxLeftPx === 0 ? 0 : (leftPx / maxLeftPx) * 100);
  const topPxToPct = (topPx: number) => (maxTopPx === 0 ? 0 : (topPx / maxTopPx) * 100);

  const getDancerById = (id: string) => dancers.find((dancer) => dancer.id === id);

  const getDancerCenterPx = (dancer: Dancer) => ({
    x: leftPctToPx(dancer.leftPct) + DOT_RADIUS,
    y: topPctToPx(dancer.topPct) + DOT_RADIUS,
  });

  const unlockPathOnFirstDotInteraction = () => {
    if (!hasDot) {
      setHasDot(true);
      setToolState((prev) => ({ ...prev, path: 'active' }));
    }
  };

  const unlockRelationshipOnFirstPathCreation = () => {
    if (!hasPath) {
      setHasPath(true);
      setToolState((prev) => ({ ...prev, relationship: 'active' }));
    }
  };

  const selectDancerOnInteraction = (dancer: Dancer) => {
    setSelectedDancerId(dancer.id);
    unlockPathOnFirstDotInteraction();
  };

  const createPathFromSelectedDancerToTarget = (targetDancer: Dancer) => {
    if (selectedTool !== 'path' || toolState.path !== 'active' || !selectedDancerId) return;

    const selectedDancer = getDancerById(selectedDancerId);
    if (!selectedDancer || selectedDancer.id === targetDancer.id) return;

    const path: PathModel = {
      id: `path-${selectedDancer.id}`,
      dancerId: selectedDancer.id,
      color: selectedDancer.color,
      end: {
        leftPct: clamp(targetDancer.leftPct, 0, 100),
        topPct: clamp(targetDancer.topPct, 0, 100),
      },
      targetDancerId: targetDancer.id,
    };

    setPathsByDancer((prev) => ({ ...prev, [selectedDancer.id]: path }));
    unlockRelationshipOnFirstPathCreation();
  };

  const createPathForSelectedDancer = (event: GestureResponderEvent) => {
    if (selectedTool !== 'path' || toolState.path !== 'active' || !selectedDancerId || !canvasSize.width || !canvasSize.height) {
      return;
    }

    const selectedDancer = getDancerById(selectedDancerId);
    if (!selectedDancer) return;

    const tapX = clamp(event.nativeEvent.locationX - DOT_RADIUS, 0, maxLeftPx) + DOT_RADIUS;
    const tapY = clamp(event.nativeEvent.locationY - DOT_RADIUS, 0, maxTopPx) + DOT_RADIUS;

    const nearbyDancer = dancers.find((candidate) => {
      if (candidate.id === selectedDancerId) return false;
      const center = getDancerCenterPx(candidate);
      return Math.hypot(center.x - tapX, center.y - tapY) <= PATH_TOUCH_RADIUS;
    });

    if (nearbyDancer) {
      createPathFromSelectedDancerToTarget(nearbyDancer);
      return;
    }

    const endLeftPct = leftPxToPct(tapX - DOT_RADIUS);
    const endTopPct = topPxToPct(tapY - DOT_RADIUS);

    const path: PathModel = {
      id: `path-${selectedDancer.id}`,
      dancerId: selectedDancer.id,
      color: selectedDancer.color,
      end: {
        leftPct: clamp(endLeftPct, 0, 100),
        topPct: clamp(endTopPct, 0, 100),
      },
    };

    setPathsByDancer((prev) => ({ ...prev, [selectedDancer.id]: path }));
    unlockRelationshipOnFirstPathCreation();
  };

  const handleCanvasTap = (event: GestureResponderEvent) => {
    createPathForSelectedDancer(event);
  };

  const startDancerDrag = (dancer: Dancer) => {
    dragStartRef.current[dancer.id] = {
      leftPx: leftPctToPx(dancer.leftPct),
      topPx: topPctToPx(dancer.topPct),
      moved: false,
    };
    selectDancerOnInteraction(dancer);
  };

  const moveDancerDrag = (dancerId: string, gestureState: PanResponderGestureState) => {
    if (selectedTool !== 'position') return;
    const dragStart = dragStartRef.current[dancerId];
    if (!dragStart) return;

    const nextLeftPx = clamp(dragStart.leftPx + gestureState.dx, 0, maxLeftPx);
    const nextTopPx = clamp(dragStart.topPx + gestureState.dy, 0, maxTopPx);
    const hasMoved = Math.abs(gestureState.dx) > 1 || Math.abs(gestureState.dy) > 1;
    dragStart.moved = dragStart.moved || hasMoved;

    setDancers((prev) =>
      prev.map((dancer) =>
        dancer.id === dancerId
          ? {
              ...dancer,
              leftPct: clamp(leftPxToPct(nextLeftPx), 0, 100),
              topPct: clamp(topPxToPct(nextTopPx), 0, 100),
              orientationDeg: hasMoved
                ? (Math.atan2(gestureState.dy, gestureState.dx) * 180) / Math.PI + 90
                : dancer.orientationDeg,
            }
          : dancer
      )
    );
  };

  const endDancerDrag = (dancerId: string) => {
    const dragStart = dragStartRef.current[dancerId];
    if (dragStart?.moved) {
      unlockPathOnFirstDotInteraction();
    }
    delete dragStartRef.current[dancerId];
  };

  const dancerPanResponders = useMemo(() => {
    const responders: Record<string, ReturnType<typeof PanResponder.create>> = {};
    dancers.forEach((dancer) => {
      responders[dancer.id] = PanResponder.create({
        onStartShouldSetPanResponder: () => {
          const isPathTargetTap =
            selectedTool === 'path' &&
            toolState.path === 'active' &&
            !!selectedDancerId &&
            selectedDancerId !== dancer.id;
          return !isPathTargetTap;
        },
        onMoveShouldSetPanResponder: (_, gestureState) =>
          selectedTool === 'position' && (Math.abs(gestureState.dx) > 1 || Math.abs(gestureState.dy) > 1),
        onPanResponderGrant: () => {
          if (selectedTool === 'position') {
            startDancerDrag(dancer);
            return;
          }
          selectDancerOnInteraction(dancer);
        },
        onPanResponderMove: (_, gestureState) => moveDancerDrag(dancer.id, gestureState),
        onPanResponderRelease: () => {
          if (selectedTool === 'position') {
            endDancerDrag(dancer.id);
          }
        },
        onPanResponderTerminate: () => {
          if (selectedTool === 'position') {
            endDancerDrag(dancer.id);
          }
        },
      });
    });
    return responders;
  }, [dancers, selectedDancerId, selectedTool, toolState.path]);

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
  const isToolSelected = (tool: keyof ToolState) => selectedTool === tool;

  const renderAuthoredPaths = () =>
    Object.values(pathsByDancer).map((path) => {
      const sourceDancer = getDancerById(path.dancerId);
      if (!sourceDancer) return null;

      const start = getDancerCenterPx(sourceDancer);
      const targetDancer = path.targetDancerId ? getDancerById(path.targetDancerId) : undefined;
      const end = targetDancer
        ? getDancerCenterPx(targetDancer)
        : {
            x: leftPctToPx(path.end.leftPct) + DOT_RADIUS,
            y: topPctToPx(path.end.topPct) + DOT_RADIUS,
          };

      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.hypot(dx, dy);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      const midpoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };

      return (
        <View key={path.id} pointerEvents="none">
          <View
            style={[
              styles.pathLine,
              {
                left: start.x,
                top: start.y,
                width: length,
                borderColor: path.color,
                transform: [{ rotate: `${angle}deg` }],
              },
            ]}
          />
          <View
            style={[
              styles.pathMidpointHandle,
              {
                left: midpoint.x - 5,
                top: midpoint.y - 5,
                borderColor: path.color,
              },
            ]}
          />
        </View>
      );
    });

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
          activeOpacity={1}
          onLayout={(e) => setCanvasSize({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height
          })}
        >
          {renderGridLines()}
          {renderAuthoredPaths()}
          
          {/* Dancer dots */}
          {dancers.map((dancer) => (
            <View
              key={dancer.id}
              style={[
                styles.dancerDot,
                {
                  backgroundColor: dancer.color,
                  top: topPctToPx(dancer.topPct),
                  left: leftPctToPx(dancer.leftPct),
                }
              ]}
              {...dancerPanResponders[dancer.id].panHandlers}
            >
              <View
                pointerEvents="none"
                style={[
                  styles.directionArrowWrap,
                  { transform: [{ rotate: `${dancer.orientationDeg}deg` }] },
                ]}
              >
                <View style={styles.directionArrow} />
              </View>
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
              isToolSelected('position') && styles.toolButtonActive
            ]}
            onPress={() => setSelectedTool('position')}
          >
            <Text style={[
              styles.toolButtonText,
              isToolSelected('position') && styles.toolButtonTextActive
            ]}>
              Position
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.toolButton,
              isToolSelected('path') && styles.toolButtonActive,
              isToolLocked('path') && { opacity: 0.3 },
            ]}
            onPress={() => setSelectedTool('path')}
            disabled={isToolLocked('path')}
          >
            <Text style={[
              styles.toolButtonText,
              isToolSelected('path') && styles.toolButtonTextActive
            ]}>
              Path
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.toolButton,
              isToolSelected('relationship') && styles.toolButtonActive,
              isToolLocked('relationship') && { opacity: 0.3 },
            ]}
            onPress={() => setSelectedTool('relationship')}
            disabled={isToolLocked('relationship')}
          >
            <Text style={[
              styles.toolButtonText,
              isToolSelected('relationship') && styles.toolButtonTextActive
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
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_RADIUS,
    borderWidth: 1.5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionArrowWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  directionArrow: {
    marginTop: -4,
    width: 0,
    height: 0,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderBottomWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#ffffff',
  },
  dancerInitial: {
    color: '#fff',
    fontSize: 7,
    fontWeight: 'bold',
  },
  pathLine: {
    position: 'absolute',
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
  },
  pathMidpointHandle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    backgroundColor: '#faf8f5',
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
