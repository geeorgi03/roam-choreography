import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
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
import Svg, { Circle as SvgCircle, Line as SvgLine } from 'react-native-svg';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { theme } from '../../lib/theme';
import type { Moment, QualityData } from '@roam/types';

const colors = theme.light;
const DOT_SIZE = 14;
const DOT_RADIUS = DOT_SIZE / 2;
const SELECTED_DOT_SIZE = 20;
const PATH_TOUCH_RADIUS = 18;

interface Dancer {
  id: string;
  color: string;
  topPct: number;
  leftPct: number;
  orientationDeg: number;
}

const DEFAULT_DANCERS: Dancer[] = [
  { id: 'A', color: colors.mine, topPct: 40, leftPct: 30, orientationDeg: 0 },
  { id: 'B', color: colors.active, topPct: 60, leftPct: 70, orientationDeg: 180 },
];

interface ToolState {
  position: 'active' | 'locked';
  path: 'active' | 'locked';
  relationship: 'active' | 'locked';
}

const DEFAULT_TOOL_STATE: ToolState = {
  position: 'active',
  path: 'locked',
  relationship: 'locked',
};

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
  const {
    activeMoment,
    setActiveMoment,
    moments,
    createMoment,
    renameMoment,
    deleteMoment,
    updateFormation,
    updateQuality,
    playheadMs,
    loopRegion,
    loopOpenAt,
    durationMs,
    handleLoopToggle,
    soundRef,
    setPlayheadMs,
    setActiveTab,
    momentsConnectionStatus,
  } = useSessionContext();

  const activeMomentRecord = useMemo(() => {
    if (!activeMoment) return null;
    return moments.find((m) => m.id === activeMoment) ?? null;
  }, [moments, activeMoment]);

  const [renamingMomentId, setRenamingMomentId] = useState<string | null>(null);

  // Keep writes (e.g. drag-end persistence) pointed at the latest active moment.
  const activeMomentRef = useRef<string | null>(activeMoment);
  useEffect(() => {
    activeMomentRef.current = activeMoment;
  }, [activeMoment]);

  // Prevent rehydration/reset from firing on same-moment optimistic updates.
  // We only want to fully reset transient interaction state when the active moment identity changes.
  const prevActiveMomentIdRef = useRef<string | null>(null);
  
  // Canvas state
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [dancers, setDancers] = useState<Dancer[]>(DEFAULT_DANCERS);
  const latestDancersRef = useRef<Dancer[]>(DEFAULT_DANCERS);
  const [selectedDancerId, setSelectedDancerId] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<SelectedTool>('position');
  const [pathsByDancer, setPathsByDancer] = useState<Record<string, PathModel>>({});
  const [waveformWidth, setWaveformWidth] = useState(0);
  
  // Tool progression state
  const [toolState, setToolState] = useState<ToolState>(DEFAULT_TOOL_STATE);
  const [hasDot, setHasDot] = useState(false);
  const [hasPath, setHasPath] = useState(false);
  const dragStartRef = useRef<Record<string, { leftPx: number; topPx: number; moved: boolean }>>({});
  
  // Quality layer state
  const [isExpanded, setIsExpanded] = useState(false);
  const [initiation, setInitiation] = useState('');
  const [relationshipQuality, setRelationshipQuality] = useState('');
  const [note, setNote] = useState('');

  // Persist the quality edits without dropping deferred/forward-compatible fields.
  // Server `PUT /quality` replaces the entire JSONB payload, so we merge the existing
  // stored quality object with the edited fields before sending.
  const commitQualityEdits = () => {
    if (!activeMoment) return;
    const mergedQuality = {
      ...(activeMomentRecord?.quality ?? {}),
      initiation,
      relationship_quality: relationshipQuality,
      note_text: note,
    } as QualityData;
    void updateQuality(activeMoment, mergedQuality);
  };

  const persistFormation = (
    momentId: string,
    overrides?: {
      dancers?: Dancer[];
      pathsByDancer?: Record<string, PathModel>;
      toolState?: ToolState;
    }
  ) => {
    // Backend requires `formation` to be a plain object (or null). Keep payload shape stable.
    const payload = {
      dancers: overrides?.dancers ?? latestDancersRef.current,
      paths: overrides?.pathsByDancer ?? pathsByDancer,
      toolState: overrides?.toolState ?? toolState,
    };
    void updateFormation(momentId, payload);
  };

  useEffect(() => {
    latestDancersRef.current = dancers;
  }, [dancers]);

  useEffect(() => {
    // Hydrate local UI state from the currently selected moment.
    // Full UI rehydration/reset must only happen when the active moment identity changes.
    const currentMomentId = activeMomentRecord?.id ?? null;
    const identityChanged = prevActiveMomentIdRef.current !== currentMomentId;
    prevActiveMomentIdRef.current = currentMomentId;

    if (!activeMomentRecord) {
      if (identityChanged) {
        setDancers(DEFAULT_DANCERS);
        setPathsByDancer({});
        setSelectedDancerId(null);
        setToolState(DEFAULT_TOOL_STATE);
        setHasDot(false);
        setHasPath(false);
        setSelectedTool('position');
        setInitiation('');
        setRelationshipQuality('');
        setNote('');
      }
      return;
    }

    type PersistedFormation = {
      dancers?: Dancer[];
      paths?: Record<string, PathModel>;
      toolState?: ToolState;
    };

    const formation = activeMomentRecord.formation as PersistedFormation | null;
    const hydratedDancers = Array.isArray(formation?.dancers) ? formation.dancers : DEFAULT_DANCERS;
    const hydratedPathsByDancer =
      formation?.paths && typeof formation.paths === 'object' && !Array.isArray(formation.paths)
        ? (formation.paths as Record<string, PathModel>)
        : {};

    // Keep persisted spatial + quality data synchronized, even during same-moment optimistic updates.
    setDancers(hydratedDancers);
    setPathsByDancer(hydratedPathsByDancer);

    const quality = activeMomentRecord.quality;
    setInitiation(quality?.initiation ?? '');
    setRelationshipQuality(quality?.relationship_quality ?? '');
    setNote(quality?.note_text ?? '');

    if (identityChanged) {
      const hydratedToolState: ToolState = (() => {
        const ts = formation?.toolState;
        if (!ts || typeof ts !== 'object' || Array.isArray(ts)) return DEFAULT_TOOL_STATE;

        const candidate = ts as Partial<ToolState>;
        const isActiveOrLocked = (v: unknown): v is ToolState[keyof ToolState] =>
          v === 'active' || v === 'locked';
        if (
          !isActiveOrLocked(candidate.position) ||
          !isActiveOrLocked(candidate.path) ||
          !isActiveOrLocked(candidate.relationship)
        ) {
          return DEFAULT_TOOL_STATE;
        }
        return candidate as ToolState;
      })();

      // Restore full spatial interaction state from moment formation (or deterministic defaults).
      setSelectedDancerId(null);
      setToolState(hydratedToolState);

      // Derive tool progression flags from restored tool state.
      setHasDot(hydratedToolState.path === 'active');
      setHasPath(hydratedToolState.relationship === 'active');
      setSelectedTool('position');
    }
  }, [activeMomentRecord]);

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
    await deleteMoment(momentId);
    if (activeMoment === momentId) {
      const remaining = moments.filter(m => m.id !== momentId);
      setActiveMoment(remaining[0]?.id ?? null);
    }
  };

  const handleRenameMoment = async (_newLabel: string) => {
    if (renamingMomentId) {
      await renameMoment(renamingMomentId, _newLabel);
      setRenamingMomentId(null);
    }
  };

  const handleAddMoment = async () => {
    const newMoment = await createMoment(`moment ${moments.length + 1}`, Math.round(playheadMs));
    if (newMoment) setActiveMoment(newMoment.id);
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

    const targetMomentId = activeMomentRef.current;
    const nextPathsByDancer = { ...pathsByDancer, [selectedDancer.id]: path };
    const nextToolState: ToolState = !hasPath ? { ...toolState, relationship: 'active' } : toolState;

    setPathsByDancer(nextPathsByDancer);
    unlockRelationshipOnFirstPathCreation();
    if (targetMomentId) persistFormation(targetMomentId, { pathsByDancer: nextPathsByDancer, toolState: nextToolState });
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

    const targetMomentId = activeMomentRef.current;
    const nextPathsByDancer = { ...pathsByDancer, [selectedDancer.id]: path };
    const nextToolState: ToolState = !hasPath ? { ...toolState, relationship: 'active' } : toolState;

    setPathsByDancer(nextPathsByDancer);
    unlockRelationshipOnFirstPathCreation();
    if (targetMomentId) persistFormation(targetMomentId, { pathsByDancer: nextPathsByDancer, toolState: nextToolState });
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

    setDancers((prev) => {
      const next = prev.map((dancer) =>
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
      );
      // Keep drag-end persistence in sync with the most recent visual drag state.
      latestDancersRef.current = next;
      return next;
    });
  };

  const endDancerDrag = (dancerId: string) => {
    const dragStart = dragStartRef.current[dancerId];
    if (dragStart?.moved) {
      const targetMomentId = activeMomentRef.current;
      const nextToolState: ToolState = !hasDot ? { ...toolState, path: 'active' } : toolState;

      unlockPathOnFirstDotInteraction();
      if (targetMomentId) persistFormation(targetMomentId, { dancers: latestDancersRef.current, toolState: nextToolState });
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

  const renderAuthoredPaths = () => {
    if (!canvasSize.width || !canvasSize.height) return null;

    return (
      <Svg
        pointerEvents="none"
        width={canvasSize.width}
        height={canvasSize.height}
        style={StyleSheet.absoluteFill}
      >
        {Object.values(pathsByDancer).map((path) => {
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
          const midpoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };

          return (
            <React.Fragment key={path.id}>
              <SvgLine
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={path.color}
                strokeWidth={1.5}
                strokeDasharray={[6, 6]}
              />
              <SvgCircle
                cx={midpoint.x}
                cy={midpoint.y}
                r={5}
                fill="#faf8f5"
                stroke={path.color}
                strokeWidth={1}
              />
            </React.Fragment>
          );
        })}
      </Svg>
    );
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

        {momentsConnectionStatus.hasError && (
          <View style={styles.connectionErrorBanner}>
            <Text style={styles.connectionErrorText}>Connection lost. Pull to refresh.</Text>
          </View>
        )}

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
          {dancers.map((dancer) => {
            const isSelected = selectedDancerId === dancer.id;
            const dotSize = isSelected ? SELECTED_DOT_SIZE : DOT_SIZE;
            const positionOffset = (DOT_SIZE - dotSize) / 2;

            return (
              <View
                key={dancer.id}
                style={[
                  styles.dancerDot,
                  isSelected && styles.dancerDotSelected,
                  {
                    width: dotSize,
                    height: dotSize,
                    borderRadius: dotSize / 2,
                    backgroundColor: dancer.color,
                    top: topPctToPx(dancer.topPct) + positionOffset,
                    left: leftPctToPx(dancer.leftPct) + positionOffset,
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
                <Text style={[styles.dancerInitial, isSelected && styles.dancerInitialSelected]}>{dancer.id}</Text>
              </View>
            );
          })}
          
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
        <View style={styles.rightPanelHeader}>
          <TouchableOpacity style={styles.groupChip} onPress={() => setActiveTab('group')}>
            <Text style={styles.groupChipText}>Group →</Text>
          </TouchableOpacity>
        </View>

        {/* Mini waveform strip */}
        <TouchableOpacity
          style={styles.miniWaveform}
          activeOpacity={1}
          onLayout={(e) => setWaveformWidth(e.nativeEvent.layout.width)}
          onPress={(e) => {
            if (waveformWidth === 0) return;
            const fraction = e.nativeEvent.locationX / waveformWidth;
            const targetMs = fraction * durationMs;
            const clampedMs = Math.max(0, Math.min(durationMs, targetMs));
            soundRef.current?.setPositionAsync(clampedMs);
            setPlayheadMs(clampedMs);
          }}
        >
          {renderWaveformBars()}
        </TouchableOpacity>

        <TouchableOpacity style={styles.loopButtonRow} onPress={() => handleLoopToggle()}>
          <Text
            style={[
              styles.loopButtonRowText,
              { color: loopOpenAt !== null ? colors.amber : colors.muted },
            ]}
          >
            {loopOpenAt !== null ? 'tap to close' : 'set loop'}
          </Text>
        </TouchableOpacity>

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
                  onBlur={() => {
                    commitQualityEdits();
                  }}
                  onSubmitEditing={() => {
                    commitQualityEdits();
                  }}
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
                  onBlur={() => {
                    commitQualityEdits();
                  }}
                  onSubmitEditing={() => {
                    commitQualityEdits();
                  }}
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
                  onBlur={() => {
                    commitQualityEdits();
                  }}
                  onSubmitEditing={() => {
                    commitQualityEdits();
                  }}
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
  dancerDotSelected: {
    borderWidth: 2.5,
    borderColor: colors.active,
    zIndex: 2,
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
  dancerInitialSelected: {
    fontSize: 8,
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
  rightPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  groupChip: {
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.mine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupChipText: {
    fontSize: 9,
    color: colors.mine,
    fontFamily: 'JetBrainsMono',
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
  loopButtonRow: {
    width: '100%',
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  loopButtonRowText: {
    fontSize: 9,
    fontFamily: 'JetBrainsMono',
    textAlign: 'center',
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
    fontFamily: 'JetBrainsMono',
  },
});
