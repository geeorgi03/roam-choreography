"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpatialTab = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_native_svg_1 = __importStar(require("react-native-svg"));
const SessionContext_1 = require("../../lib/contexts/SessionContext");
const theme_1 = require("../../lib/theme");
const colors = theme_1.theme.light;
const DOT_SIZE = 14;
const DOT_RADIUS = DOT_SIZE / 2;
const SELECTED_DOT_SIZE = 20;
const PATH_TOUCH_RADIUS = 18;
function SpatialTab() {
    const { activeMoment, setActiveMoment, loopRegion, loopOpenAt, durationMs, handleLoopToggle, soundRef, setPlayheadMs, setActiveTab, } = (0, SessionContext_1.useSessionContext)();
    // Same moments state as SongMapTab (shared via context)
    const [moments, setMoments] = (0, react_1.useState)([{ id: '1', label: 'moment 1' }]);
    const [renamingMomentId, setRenamingMomentId] = (0, react_1.useState)(null);
    // Canvas state
    const [canvasSize, setCanvasSize] = (0, react_1.useState)({ width: 0, height: 0 });
    const [dancers, setDancers] = (0, react_1.useState)([
        { id: 'A', color: colors.mine, topPct: 40, leftPct: 30, orientationDeg: 0 },
        { id: 'B', color: colors.active, topPct: 60, leftPct: 70, orientationDeg: 180 },
    ]);
    const [selectedDancerId, setSelectedDancerId] = (0, react_1.useState)(null);
    const [selectedTool, setSelectedTool] = (0, react_1.useState)('position');
    const [pathsByDancer, setPathsByDancer] = (0, react_1.useState)({});
    const [waveformWidth, setWaveformWidth] = (0, react_1.useState)(0);
    // Tool progression state
    const [toolState, setToolState] = (0, react_1.useState)({
        position: 'active',
        path: 'locked',
        relationship: 'locked',
    });
    const [hasDot, setHasDot] = (0, react_1.useState)(false);
    const [hasPath, setHasPath] = (0, react_1.useState)(false);
    const dragStartRef = (0, react_1.useRef)({});
    // Quality layer state
    const [isExpanded, setIsExpanded] = (0, react_1.useState)(false);
    const [initiation, setInitiation] = (0, react_1.useState)('');
    const [relationshipQuality, setRelationshipQuality] = (0, react_1.useState)('');
    const [note, setNote] = (0, react_1.useState)('');
    const handleMomentPress = (momentId) => {
        setActiveMoment(momentId);
    };
    const handleMomentLongPress = (momentId) => {
        setRenamingMomentId(momentId);
    };
    const handleRenameMoment = (_newLabel) => {
        if (renamingMomentId) {
            // Update local moments state (same as SongMapTab)
            setRenamingMomentId(null);
        }
    };
    const handleAddMoment = () => {
        const newMoment = {
            id: String(moments.length + 1),
            label: `moment ${moments.length + 1}`,
        };
        setMoments([...moments, newMoment]);
        setActiveMoment(newMoment.id);
    };
    const maxLeftPx = Math.max(0, canvasSize.width - DOT_SIZE);
    const maxTopPx = Math.max(0, canvasSize.height - DOT_SIZE);
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const leftPctToPx = (leftPct) => (maxLeftPx === 0 ? 0 : (leftPct / 100) * maxLeftPx);
    const topPctToPx = (topPct) => (maxTopPx === 0 ? 0 : (topPct / 100) * maxTopPx);
    const leftPxToPct = (leftPx) => (maxLeftPx === 0 ? 0 : (leftPx / maxLeftPx) * 100);
    const topPxToPct = (topPx) => (maxTopPx === 0 ? 0 : (topPx / maxTopPx) * 100);
    const getDancerById = (id) => dancers.find((dancer) => dancer.id === id);
    const getDancerCenterPx = (dancer) => ({
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
    const selectDancerOnInteraction = (dancer) => {
        setSelectedDancerId(dancer.id);
        unlockPathOnFirstDotInteraction();
    };
    const createPathFromSelectedDancerToTarget = (targetDancer) => {
        if (selectedTool !== 'path' || toolState.path !== 'active' || !selectedDancerId)
            return;
        const selectedDancer = getDancerById(selectedDancerId);
        if (!selectedDancer || selectedDancer.id === targetDancer.id)
            return;
        const path = {
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
    const createPathForSelectedDancer = (event) => {
        if (selectedTool !== 'path' || toolState.path !== 'active' || !selectedDancerId || !canvasSize.width || !canvasSize.height) {
            return;
        }
        const selectedDancer = getDancerById(selectedDancerId);
        if (!selectedDancer)
            return;
        const tapX = clamp(event.nativeEvent.locationX - DOT_RADIUS, 0, maxLeftPx) + DOT_RADIUS;
        const tapY = clamp(event.nativeEvent.locationY - DOT_RADIUS, 0, maxTopPx) + DOT_RADIUS;
        const nearbyDancer = dancers.find((candidate) => {
            if (candidate.id === selectedDancerId)
                return false;
            const center = getDancerCenterPx(candidate);
            return Math.hypot(center.x - tapX, center.y - tapY) <= PATH_TOUCH_RADIUS;
        });
        if (nearbyDancer) {
            createPathFromSelectedDancerToTarget(nearbyDancer);
            return;
        }
        const endLeftPct = leftPxToPct(tapX - DOT_RADIUS);
        const endTopPct = topPxToPct(tapY - DOT_RADIUS);
        const path = {
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
    const handleCanvasTap = (event) => {
        createPathForSelectedDancer(event);
    };
    const startDancerDrag = (dancer) => {
        dragStartRef.current[dancer.id] = {
            leftPx: leftPctToPx(dancer.leftPct),
            topPx: topPctToPx(dancer.topPct),
            moved: false,
        };
        selectDancerOnInteraction(dancer);
    };
    const moveDancerDrag = (dancerId, gestureState) => {
        if (selectedTool !== 'position')
            return;
        const dragStart = dragStartRef.current[dancerId];
        if (!dragStart)
            return;
        const nextLeftPx = clamp(dragStart.leftPx + gestureState.dx, 0, maxLeftPx);
        const nextTopPx = clamp(dragStart.topPx + gestureState.dy, 0, maxTopPx);
        const hasMoved = Math.abs(gestureState.dx) > 1 || Math.abs(gestureState.dy) > 1;
        dragStart.moved = dragStart.moved || hasMoved;
        setDancers((prev) => prev.map((dancer) => dancer.id === dancerId
            ? {
                ...dancer,
                leftPct: clamp(leftPxToPct(nextLeftPx), 0, 100),
                topPct: clamp(topPxToPct(nextTopPx), 0, 100),
                orientationDeg: hasMoved
                    ? (Math.atan2(gestureState.dy, gestureState.dx) * 180) / Math.PI + 90
                    : dancer.orientationDeg,
            }
            : dancer));
    };
    const endDancerDrag = (dancerId) => {
        const dragStart = dragStartRef.current[dancerId];
        if (dragStart?.moved) {
            unlockPathOnFirstDotInteraction();
        }
        delete dragStartRef.current[dancerId];
    };
    const dancerPanResponders = (0, react_1.useMemo)(() => {
        const responders = {};
        dancers.forEach((dancer) => {
            responders[dancer.id] = react_native_1.PanResponder.create({
                onStartShouldSetPanResponder: () => {
                    const isPathTargetTap = selectedTool === 'path' &&
                        toolState.path === 'active' &&
                        !!selectedDancerId &&
                        selectedDancerId !== dancer.id;
                    return !isPathTargetTap;
                },
                onMoveShouldSetPanResponder: (_, gestureState) => selectedTool === 'position' && (Math.abs(gestureState.dx) > 1 || Math.abs(gestureState.dy) > 1),
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
        if (!canvasSize.width || !canvasSize.height)
            return null;
        const horizontalLines = [];
        const verticalLines = [];
        // Horizontal lines every 22dp
        for (let y = 22; y < canvasSize.height; y += 22) {
            horizontalLines.push(<react_native_1.View key={`h-${y}`} style={[
                    styles.gridLine,
                    styles.horizontalGridLine,
                    { top: y, width: canvasSize.width }
                ]}/>);
        }
        // Vertical lines every 22dp
        for (let x = 22; x < canvasSize.width; x += 22) {
            verticalLines.push(<react_native_1.View key={`v-${x}`} style={[
                    styles.gridLine,
                    styles.verticalGridLine,
                    { left: x, height: canvasSize.height }
                ]}/>);
        }
        return [...horizontalLines, ...verticalLines];
    };
    const renderWaveformBars = () => {
        const heights = [12, 24, 18, 30, 16, 28, 20, 26, 14, 22, 18, 25];
        return heights.map((height, index) => (<react_native_1.View key={index} style={[
                styles.waveformBar,
                { height, backgroundColor: colors.muted }
            ]}/>));
    };
    const isToolLocked = (tool) => toolState[tool] === 'locked';
    const isToolSelected = (tool) => selectedTool === tool;
    const renderAuthoredPaths = () => {
        if (!canvasSize.width || !canvasSize.height)
            return null;
        return (<react_native_svg_1.default pointerEvents="none" width={canvasSize.width} height={canvasSize.height} style={react_native_1.StyleSheet.absoluteFill}>
        {Object.values(pathsByDancer).map((path) => {
                const sourceDancer = getDancerById(path.dancerId);
                if (!sourceDancer)
                    return null;
                const start = getDancerCenterPx(sourceDancer);
                const targetDancer = path.targetDancerId ? getDancerById(path.targetDancerId) : undefined;
                const end = targetDancer
                    ? getDancerCenterPx(targetDancer)
                    : {
                        x: leftPctToPx(path.end.leftPct) + DOT_RADIUS,
                        y: topPctToPx(path.end.topPct) + DOT_RADIUS,
                    };
                const midpoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
                return (<react_1.default.Fragment key={path.id}>
              <react_native_svg_1.Line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={path.color} strokeWidth={1.5} strokeDasharray={[6, 6]}/>
              <react_native_svg_1.Circle cx={midpoint.x} cy={midpoint.y} r={5} fill="#faf8f5" stroke={path.color} strokeWidth={1}/>
            </react_1.default.Fragment>);
            })}
      </react_native_svg_1.default>);
    };
    return (<react_native_1.View style={styles.container}>
      {/* Canvas zone */}
      <react_native_1.View style={styles.canvasZone}>
        {/* Moment strip */}
        <react_native_1.ScrollView horizontal style={styles.momentStrip} showsHorizontalScrollIndicator={false}>
          {moments.map((moment) => (<react_native_1.TouchableOpacity key={moment.id} style={[
                styles.momentChip,
                activeMoment === moment.id && styles.momentChipActive
            ]} onPress={() => handleMomentPress(moment.id)} onLongPress={() => handleMomentLongPress(moment.id)}>
              {renamingMomentId === moment.id ? (<react_native_1.TextInput style={styles.renameInput} defaultValue={moment.label} onBlur={(e) => handleRenameMoment(e.nativeEvent.text)} onSubmitEditing={(e) => handleRenameMoment(e.nativeEvent.text)} autoFocus/>) : (<react_native_1.Text style={[
                    styles.momentChipText,
                    activeMoment === moment.id && styles.momentChipTextActive
                ]}>
                  {moment.label}
                </react_native_1.Text>)}
            </react_native_1.TouchableOpacity>))}
          <react_native_1.TouchableOpacity style={styles.addMomentButton} onPress={handleAddMoment}>
            <react_native_1.Text style={styles.addMomentText}>+</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.ScrollView>

        {/* Floor canvas */}
        <react_native_1.TouchableOpacity style={styles.floorCanvas} onPress={handleCanvasTap} activeOpacity={1} onLayout={(e) => setCanvasSize({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height
        })}>
          {renderGridLines()}
          {renderAuthoredPaths()}
          
          {/* Dancer dots */}
          {dancers.map((dancer) => {
            const isSelected = selectedDancerId === dancer.id;
            const dotSize = isSelected ? SELECTED_DOT_SIZE : DOT_SIZE;
            const positionOffset = (DOT_SIZE - dotSize) / 2;
            return (<react_native_1.View key={dancer.id} style={[
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
                ]} {...dancerPanResponders[dancer.id].panHandlers}>
                <react_native_1.View pointerEvents="none" style={[
                    styles.directionArrowWrap,
                    { transform: [{ rotate: `${dancer.orientationDeg}deg` }] },
                ]}>
                  <react_native_1.View style={styles.directionArrow}/>
                </react_native_1.View>
                <react_native_1.Text style={[styles.dancerInitial, isSelected && styles.dancerInitialSelected]}>{dancer.id}</react_native_1.Text>
              </react_native_1.View>);
        })}
          
          <react_native_1.Text style={styles.backstageLabel}>backstage</react_native_1.Text>
          <react_native_1.Text style={styles.audienceLabel}>audience</react_native_1.Text>
        </react_native_1.TouchableOpacity>

        {/* Tool bar */}
        <react_native_1.View style={styles.toolBar}>
          <react_native_1.TouchableOpacity style={[
            styles.toolButton,
            isToolSelected('position') && styles.toolButtonActive
        ]} onPress={() => setSelectedTool('position')}>
            <react_native_1.Text style={[
            styles.toolButtonText,
            isToolSelected('position') && styles.toolButtonTextActive
        ]}>
              Position
            </react_native_1.Text>
          </react_native_1.TouchableOpacity>
          
          <react_native_1.TouchableOpacity style={[
            styles.toolButton,
            isToolSelected('path') && styles.toolButtonActive,
            isToolLocked('path') && { opacity: 0.3 },
        ]} onPress={() => setSelectedTool('path')} disabled={isToolLocked('path')}>
            <react_native_1.Text style={[
            styles.toolButtonText,
            isToolSelected('path') && styles.toolButtonTextActive
        ]}>
              Path
            </react_native_1.Text>
          </react_native_1.TouchableOpacity>
          
          <react_native_1.TouchableOpacity style={[
            styles.toolButton,
            isToolSelected('relationship') && styles.toolButtonActive,
            isToolLocked('relationship') && { opacity: 0.3 },
        ]} onPress={() => setSelectedTool('relationship')} disabled={isToolLocked('relationship')}>
            <react_native_1.Text style={[
            styles.toolButtonText,
            isToolSelected('relationship') && styles.toolButtonTextActive
        ]}>
              Relationship
            </react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>
      </react_native_1.View>

      {/* Right panel */}
      <react_native_1.View style={styles.rightPanel}>
        <react_native_1.View style={styles.rightPanelHeader}>
          <react_native_1.TouchableOpacity style={styles.groupChip} onPress={() => setActiveTab('group')}>
            <react_native_1.Text style={styles.groupChipText}>Group →</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>

        {/* Mini waveform strip */}
        <react_native_1.TouchableOpacity style={styles.miniWaveform} activeOpacity={1} onLayout={(e) => setWaveformWidth(e.nativeEvent.layout.width)} onPress={(e) => {
            if (waveformWidth === 0)
                return;
            const fraction = e.nativeEvent.locationX / waveformWidth;
            const targetMs = fraction * durationMs;
            const clampedMs = Math.max(0, Math.min(durationMs, targetMs));
            soundRef.current?.setPositionAsync(clampedMs);
            setPlayheadMs(clampedMs);
        }}>
          {renderWaveformBars()}
        </react_native_1.TouchableOpacity>

        <react_native_1.TouchableOpacity style={styles.loopButtonRow} onPress={() => handleLoopToggle()}>
          <react_native_1.Text style={[
            styles.loopButtonRowText,
            { color: loopOpenAt !== null ? colors.amber : colors.muted },
        ]}>
            {loopOpenAt !== null ? 'tap to close' : 'set loop'}
          </react_native_1.Text>
        </react_native_1.TouchableOpacity>

        {/* Quality layer */}
        <react_native_1.View style={styles.qualityLayer}>
          {/* Header */}
          <react_native_1.View style={styles.qualityHeader}>
            <react_native_1.Text style={styles.qualityHeaderText}>quality layer</react_native_1.Text>
            <react_native_1.TouchableOpacity style={styles.expandButton} onPress={() => setIsExpanded(!isExpanded)}>
              <react_native_1.Text style={styles.expandButtonText}>{isExpanded ? '−' : '+'}</react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>

          {/* Body */}
          {isExpanded && (<react_native_1.View style={styles.qualityBody}>
              {/* INITIATION */}
              <react_native_1.View style={styles.field}>
                <react_native_1.Text style={styles.fieldLabel}>INITIATION</react_native_1.Text>
                <react_native_1.TextInput style={styles.fieldInput} placeholder="spine, heart, sternum…" placeholderTextColor={colors.muted} value={initiation} onChangeText={setInitiation}/>
              </react_native_1.View>

              {/* RELATIONSHIP QUALITY */}
              <react_native_1.View style={styles.field}>
                <react_native_1.Text style={styles.fieldLabel}>RELATIONSHIP QUALITY</react_native_1.Text>
                <react_native_1.TextInput style={styles.fieldInput} placeholder="leads · follows · resists · echoes" placeholderTextColor={colors.muted} value={relationshipQuality} onChangeText={setRelationshipQuality}/>
              </react_native_1.View>

              {/* NOTE */}
              <react_native_1.View style={[
                styles.field,
                styles.noteField,
                note && styles.noteFieldFilled
            ]}>
                <react_native_1.Text style={styles.fieldLabel}>NOTE</react_native_1.Text>
                <react_native_1.TextInput style={styles.noteInput} placeholder="add a voice or text note…" placeholderTextColor={colors.muted} value={note} onChangeText={setNote} multiline/>
              </react_native_1.View>

              {/* QUALITY REFERENCE */}
              <react_native_1.View style={styles.referenceField}>
                <react_native_1.Text style={styles.referenceText}>add reference</react_native_1.Text>
              </react_native_1.View>
            </react_native_1.View>)}
        </react_native_1.View>
      </react_native_1.View>
    </react_native_1.View>);
}
exports.SpatialTab = SpatialTab;
const styles = react_native_1.StyleSheet.create({
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
});
//# sourceMappingURL=SpatialTab.js.map