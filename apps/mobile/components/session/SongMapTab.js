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
exports.SongMapTab = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const SessionContext_1 = require("../../lib/contexts/SessionContext");
const theme_1 = require("../../lib/theme");
const colors = theme_1.theme.light;
function SongMapTab() {
    const { sessionName, activeMoment, setActiveMoment, activeSection, setActiveSection, musicTrack, sectionClips, moments, createMoment, renameMoment, deleteMoment, playheadMs, momentsConnectionStatus, } = (0, SessionContext_1.useSessionContext)();
    const [renamingMomentId, setRenamingMomentId] = (0, react_1.useState)(null);
    const [canvasSize, setCanvasSize] = (0, react_1.useState)({ width: 0, height: 0 });
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
        if (newMoment)
            setActiveMoment(newMoment.id);
    };
    const handleMomentPress = (momentId) => {
        setActiveMoment(momentId);
    };
    const handleMomentLongPress = (momentId) => {
        const moment = moments.find(m => m.id === momentId);
        if (!moment)
            return;
        react_native_1.Alert.alert(moment.name, undefined, [
            { text: 'Rename', onPress: () => setRenamingMomentId(momentId) },
            { text: 'Delete', style: 'destructive', onPress: () => handleDeleteMoment(momentId) },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };
    const handleDeleteMoment = async (momentId) => {
        const success = await deleteMoment(momentId);
        if (success && activeMoment === momentId) {
            const remaining = moments.filter(m => m.id !== momentId);
            setActiveMoment(remaining[0]?.id ?? null);
        }
    };
    const handleRenameMoment = async (newLabel) => {
        if (!renamingMomentId)
            return;
        await renameMoment(renamingMomentId, newLabel);
        setRenamingMomentId(null);
    };
    const getSectionClipCount = (sectionLabel) => {
        return sectionClips.filter(clip => clip.section_label === sectionLabel).length;
    };
    const handleCountsPress = () => {
        // Counts is intentionally the always-active mode in V3.
    };
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
    return (<react_native_1.View style={styles.container}>
      <react_native_1.View style={styles.topBar}>
        <react_native_1.Text style={styles.topBarSessionName}>{sessionName}</react_native_1.Text>
        <react_native_1.View style={styles.topBarRight}>
          <react_native_1.Text style={styles.topBarSectionLabel}>{activeSection}</react_native_1.Text>
        </react_native_1.View>
      </react_native_1.View>

      {momentsConnectionStatus.hasError && (<react_native_1.View style={styles.connectionErrorBanner}>
          <react_native_1.Text style={styles.connectionErrorText}>Connection lost. Pull to refresh.</react_native_1.Text>
        </react_native_1.View>)}

      <react_native_1.View style={styles.middleRow}>
        {/* Canvas zone */}
        <react_native_1.View style={styles.canvasZone}>
          {/* Moment strip */}
          <react_native_1.ScrollView horizontal style={styles.momentStrip} showsHorizontalScrollIndicator={false}>
            {moments.map((moment) => (<react_native_1.TouchableOpacity key={moment.id} style={[
                styles.momentChip,
                activeMoment === moment.id && styles.momentChipActive
            ]} onPress={() => handleMomentPress(moment.id)} onLongPress={() => handleMomentLongPress(moment.id)}>
                {renamingMomentId === moment.id ? (<react_native_1.TextInput style={styles.renameInput} defaultValue={moment.name} onBlur={(e) => handleRenameMoment(e.nativeEvent.text)} onSubmitEditing={(e) => handleRenameMoment(e.nativeEvent.text)} autoFocus/>) : (<react_native_1.Text style={[
                    styles.momentChipText,
                    activeMoment === moment.id && styles.momentChipTextActive
                ]}>
                    {moment.name}
                  </react_native_1.Text>)}
              </react_native_1.TouchableOpacity>))}
            <react_native_1.TouchableOpacity style={styles.addMomentButton} onPress={handleAddMoment}>
              <react_native_1.Text style={styles.addMomentText}>+</react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </react_native_1.ScrollView>

          {/* Floor canvas */}
          <react_native_1.View style={styles.floorCanvas} onLayout={(e) => setCanvasSize({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height
        })}>
            {renderGridLines()}
            
            <react_native_1.Text style={styles.backstageLabel}>backstage</react_native_1.Text>
            <react_native_1.Text style={styles.audienceLabel}>audience</react_native_1.Text>
          </react_native_1.View>
        </react_native_1.View>

        {/* Right section panel */}
        <react_native_1.View style={styles.sectionPanel}>
          <react_native_1.Text style={styles.sectionHeader}>SECTIONS</react_native_1.Text>
          
          {/* Counts | Partition toggle */}
          <react_native_1.View style={styles.toggleRow}>
            <react_native_1.TouchableOpacity style={[
            styles.toggleButton,
            styles.toggleButtonActive
        ]} onPress={handleCountsPress}>
              <react_native_1.Text style={[
            styles.toggleButtonText,
            styles.toggleButtonTextActive
        ]}>
                Counts
              </react_native_1.Text>
            </react_native_1.TouchableOpacity>
            
            <react_native_1.View style={[
            styles.toggleButton,
            { opacity: 0.4 }
        ]}>
              <react_native_1.Text style={styles.toggleButtonText}>
                Partition
              </react_native_1.Text>
            </react_native_1.View>
          </react_native_1.View>
          <react_native_1.Text style={styles.partitionHint}>read-only in V3</react_native_1.Text>

          {/* Section rows */}
          <react_native_1.ScrollView showsVerticalScrollIndicator={false}>
            {sections.map((section) => {
            const clipCount = getSectionClipCount(section.label);
            const isActive = activeSection === section.label;
            return (<react_native_1.TouchableOpacity key={section.label} style={[
                    styles.sectionRow,
                    isActive && styles.sectionRowActive
                ]} onPress={() => setActiveSection(section.label)}>
                  <react_native_1.Text style={[
                    styles.sectionRowText,
                    isActive && styles.sectionRowTextActive
                ]}>
                    {section.label}
                  </react_native_1.Text>
                  <react_native_1.Text style={[
                    styles.sectionCount,
                    isActive && styles.sectionCountActive
                ]}>
                    {clipCount}
                  </react_native_1.Text>
                </react_native_1.TouchableOpacity>);
        })}
          </react_native_1.ScrollView>
        </react_native_1.View>
      </react_native_1.View>

    </react_native_1.View>);
}
exports.SongMapTab = SongMapTab;
const styles = react_native_1.StyleSheet.create({
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
        fontFamily: theme_1.theme.typography.monoFamily,
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
//# sourceMappingURL=SongMapTab.js.map