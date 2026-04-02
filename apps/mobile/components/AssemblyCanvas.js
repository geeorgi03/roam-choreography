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
exports.AssemblyCanvas = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const theme_1 = require("../lib/theme");
const useSession_1 = require("../lib/hooks/useSession");
const useMusicTrackStatus_1 = require("../lib/hooks/useMusicTrackStatus");
const useClips_1 = require("../lib/hooks/useClips");
const api_1 = require("../lib/api");
const { width: SCREEN_WIDTH } = react_native_1.Dimensions.get('window');
const LEFT_WIDTH = SCREEN_WIDTH * 0.55;
const RIGHT_WIDTH = SCREEN_WIDTH * 0.45;
const colors = theme_1.theme.light;
const spacing = theme_1.theme.spacing;
function formatMs(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
}
function AssemblyCanvas({ sessionId }) {
    const { session } = (0, useSession_1.useSession)();
    const { musicTrack } = (0, useMusicTrackStatus_1.useMusicTrackStatus)(sessionId);
    const { clips } = (0, useClips_1.useClips)(sessionId, undefined);
    const [assignments, setAssignments] = (0, react_1.useState)([]);
    const [selectedSection, setSelectedSection] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [saveError, setSaveError] = (0, react_1.useState)(null);
    const sections = (musicTrack?.sections ?? []);
    (0, react_1.useEffect)(() => {
        if (!sessionId || !session?.access_token)
            return;
        let mounted = true;
        (async () => {
            try {
                const res = await fetch(`${api_1.API_BASE}/sessions/${sessionId}/assembly`, {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                });
                if (mounted && res.ok) {
                    const data = (await res.json());
                    setAssignments(data.map((a) => ({
                        section_label: a.section_label,
                        section_start_ms: a.section_start_ms,
                        clip_id: a.clip_id,
                        position: a.position,
                    })));
                }
            }
            catch {
                // ignore
            }
            finally {
                if (mounted)
                    setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [sessionId, session?.access_token]);
    const persistAssignments = (0, react_1.useCallback)(async (next) => {
        if (!sessionId || !session?.access_token)
            return;
        try {
            setSaveError(null);
            const res = await fetch(`${api_1.API_BASE}/sessions/${sessionId}/assembly`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ assignments: next }),
            });
            if (!res.ok) {
                setSaveError('Could not save assembly changes. Please try again.');
                return;
            }
            // Prefer canonical server output (ordering/validation) when available.
            try {
                const data = (await res.json());
                setAssignments(data.map((a) => ({
                    section_label: a.section_label,
                    section_start_ms: a.section_start_ms,
                    clip_id: a.clip_id,
                    position: a.position,
                })));
            }
            catch {
                // If server returns no body, fall back to the requested next state.
                setAssignments(next);
            }
        }
        catch {
            setSaveError('Could not save assembly changes. Please check your connection and try again.');
        }
    }, [sessionId, session?.access_token]);
    const getClipsForSection = (0, react_1.useCallback)((section) => {
        return assignments
            .filter((a) => a.section_label === section.label && a.section_start_ms === section.start_ms)
            .sort((a, b) => a.position - b.position)
            .map((a) => clips.find((c) => c.server_id === a.clip_id))
            .filter((c) => !!c);
    }, [assignments, clips]);
    const handleAddClip = (0, react_1.useCallback)((clipId) => {
        if (!selectedSection)
            return;
        if (assignments.some((a) => a.clip_id === clipId))
            return;
        const existing = assignments.filter((a) => a.section_label === selectedSection.label &&
            a.section_start_ms === selectedSection.start_ms);
        const maxPos = existing.length > 0 ? Math.max(...existing.map((a) => a.position)) : -1;
        const next = [
            ...assignments,
            {
                section_label: selectedSection.label,
                section_start_ms: selectedSection.start_ms,
                clip_id: clipId,
                position: maxPos + 1,
            },
        ];
        persistAssignments(next);
    }, [selectedSection, assignments, persistAssignments]);
    const handleRemoveClip = (0, react_1.useCallback)((section, clipId) => {
        const next = assignments.filter((a) => !(a.section_label === section.label &&
            a.section_start_ms === section.start_ms &&
            a.clip_id === clipId));
        persistAssignments(next);
    }, [assignments, persistAssignments]);
    const handleReorder = (0, react_1.useCallback)((section, orderedClipIds) => {
        const other = assignments.filter((a) => !(a.section_label === section.label &&
            a.section_start_ms === section.start_ms));
        const reordered = orderedClipIds.map((clip_id, position) => ({
            section_label: section.label,
            section_start_ms: section.start_ms,
            clip_id,
            position,
        }));
        persistAssignments([...other, ...reordered]);
    }, [assignments, persistAssignments]);
    const isAssigned = (clipId) => assignments.some((a) => a.clip_id === clipId);
    if (loading) {
        return (<react_native_1.View style={styles.container}>
        <react_native_1.Text style={styles.placeholderText}>Loading…</react_native_1.Text>
      </react_native_1.View>);
    }
    if (sections.length === 0) {
        return (<react_native_1.View style={styles.container}>
        <react_native_1.Text style={styles.placeholderText}>No music set up</react_native_1.Text>
      </react_native_1.View>);
    }
    return (<react_native_1.View style={styles.container}>
      {!!saveError && (<react_native_1.View style={styles.errorBanner}>
          <react_native_1.Text style={styles.errorBannerText}>{saveError}</react_native_1.Text>
        </react_native_1.View>)}
      <react_native_1.View style={styles.row}>
        <react_native_1.View style={[styles.panel, { width: LEFT_WIDTH }]}>
          <react_native_1.FlatList data={sections} keyExtractor={(item) => `${item.label}-${item.start_ms}`} renderItem={({ item }) => (<SectionSlot section={item} isSelected={selectedSection?.label === item.label &&
                selectedSection?.start_ms === item.start_ms} sectionClips={getClipsForSection(item)} onSelect={() => setSelectedSection(item)} onRemoveClip={(clipId) => handleRemoveClip(item, clipId)} onReorder={(newOrder) => handleReorder(item, newOrder.map((c) => c.server_id))}/>)}/>
        </react_native_1.View>
        <react_native_1.ScrollView style={[styles.panel, { width: RIGHT_WIDTH }]}>
          <react_native_1.Text style={styles.panelTitle}>Session Clips</react_native_1.Text>
          <react_native_1.View style={styles.clipGrid}>
            {clips
            .filter((c) => c.server_id && c.upload_status === 'ready')
            .map((clip) => (<ClipThumb key={clip.server_id} clip={clip} assigned={isAssigned(clip.server_id)} disabled={!selectedSection || isAssigned(clip.server_id)} onPress={() => selectedSection && !isAssigned(clip.server_id) && handleAddClip(clip.server_id)}/>))}
          </react_native_1.View>
        </react_native_1.ScrollView>
      </react_native_1.View>
    </react_native_1.View>);
}
exports.AssemblyCanvas = AssemblyCanvas;
function SectionSlot({ section, isSelected, sectionClips, onSelect, onRemoveClip, onReorder, }) {
    return (<react_native_1.View style={styles.sectionRow}>
      <react_native_1.TouchableOpacity style={[styles.sectionHeader, isSelected && styles.sectionHeaderSelected]} onPress={onSelect}>
        <react_native_1.Text style={styles.sectionLabel}>{section.label}</react_native_1.Text>
        <react_native_1.Text style={styles.sectionTime}>{formatMs(section.start_ms)}</react_native_1.Text>
      </react_native_1.TouchableOpacity>
      <react_native_1.ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.assignedClips} contentContainerStyle={styles.assignedClipsContent}>
        {sectionClips.map((clip) => (<AssignedClipThumb key={clip.server_id ?? clip.local_id} clip={clip} section={section} onRemove={() => onRemoveClip(clip.server_id)} onReorder={onReorder} allClips={sectionClips}/>))}
        {sectionClips.length === 0 && (<react_native_1.Text style={styles.emptyHint}>Tap a clip to assign →</react_native_1.Text>)}
      </react_native_1.ScrollView>
    </react_native_1.View>);
}
function ClipThumb({ clip, assigned, disabled, onPress, }) {
    return (<react_native_1.TouchableOpacity style={[styles.clipThumbWrap, disabled && styles.clipThumbDisabled]} onPress={onPress} disabled={disabled}>
      {clip.mux_playback_id ? (<react_native_1.Image source={{
                uri: `https://image.mux.com/${clip.mux_playback_id}/thumbnail.jpg?time=0`,
            }} style={styles.clipThumbImg}/>) : (<react_native_1.View style={styles.clipThumbPlaceholder}/>)}
      <react_native_1.Text style={styles.clipThumbLabel} numberOfLines={1}>
        {clip.move_name ?? clip.label ?? 'Clip'}
      </react_native_1.Text>
      {assigned && (<react_native_1.View style={styles.clipThumbCheckmark}>
          <react_native_1.Text style={styles.clipThumbCheckmarkText}>✓</react_native_1.Text>
        </react_native_1.View>)}
    </react_native_1.TouchableOpacity>);
}
function AssignedClipThumb({ clip, section, onRemove, onReorder, allClips, }) {
    const isLongPress = (0, react_1.useRef)(false);
    const longPressTimer = (0, react_1.useRef)(null);
    const panResponder = (0, react_1.useRef)(react_native_1.PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
            longPressTimer.current = setTimeout(() => {
                isLongPress.current = true;
            }, 500);
        },
        onPanResponderRelease: (_evt, gestureState) => {
            const dx = gestureState.dx;
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
            }
            if (dx < -60) {
                onRemove();
            }
            else if (isLongPress.current && Math.abs(dx) > 40) {
                const idx = allClips.findIndex((c) => c.server_id === clip.server_id);
                if (idx >= 0) {
                    const next = [...allClips];
                    const targetIdx = dx > 0 ? idx + 1 : idx - 1;
                    if (targetIdx >= 0 && targetIdx < next.length) {
                        [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
                        onReorder(next);
                    }
                }
            }
            isLongPress.current = false;
        },
        onPanResponderTerminate: () => {
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
            }
            isLongPress.current = false;
        },
    })).current;
    return (<react_native_1.View style={styles.assignedThumbWrap} {...panResponder.panHandlers}>
      {clip.mux_playback_id ? (<react_native_1.Image source={{
                uri: `https://image.mux.com/${clip.mux_playback_id}/thumbnail.jpg?time=0`,
            }} style={styles.assignedThumbImg}/>) : (<react_native_1.View style={styles.assignedThumbPlaceholder}/>)}
      <react_native_1.TouchableOpacity style={styles.removeBtn} onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <react_native_1.Text style={styles.removeBtnText}>×</react_native_1.Text>
      </react_native_1.TouchableOpacity>
    </react_native_1.View>);
}
const t = theme_1.theme.light;
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: t.ground,
    },
    errorBanner: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: 'rgba(255, 90, 90, 0.12)',
    },
    errorBannerText: {
        color: colors.active,
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },
    row: {
        flexDirection: 'row',
        flex: 1,
    },
    panel: {
        padding: 12,
        borderRightWidth: 1,
        borderRightColor: colors.border,
    },
    panelTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.active,
        marginBottom: 12,
    },
    sectionRow: {
        marginBottom: 16,
    },
    sectionHeader: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: colors.chrome,
        marginBottom: 8,
    },
    sectionHeaderSelected: {
        backgroundColor: colors.amberBg,
        borderWidth: 1,
        borderColor: colors.warm,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.active,
    },
    sectionTime: {
        fontSize: 12,
        color: colors.muted,
        marginTop: 2,
    },
    assignedClips: {
        maxHeight: 80,
    },
    assignedClipsContent: {
        gap: 8,
        paddingRight: 8,
    },
    emptyHint: {
        fontSize: 12,
        color: colors.muted,
        alignSelf: 'center',
    },
    assignedThumbWrap: {
        width: 64,
        height: 64,
        borderRadius: spacing.radiusSm,
        overflow: 'hidden',
        position: 'relative',
    },
    assignedThumbImg: {
        width: 64,
        height: 64,
    },
    assignedThumbPlaceholder: {
        width: 64,
        height: 64,
        backgroundColor: colors.chrome,
    },
    removeBtn: {
        position: 'absolute',
        top: 2,
        right: 2,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: 'rgba(58,52,45,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeBtnText: {
        color: colors.chrome,
        fontSize: 16,
        fontWeight: '600',
    },
    clipGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    clipThumbWrap: {
        width: (RIGHT_WIDTH - 24 - 16) / 2,
        aspectRatio: 16 / 9,
        borderRadius: spacing.radiusSm,
        overflow: 'hidden',
        backgroundColor: colors.chrome,
        position: 'relative',
    },
    clipThumbDisabled: {
        opacity: 0.6,
    },
    clipThumbImg: {
        width: '100%',
        height: '100%',
    },
    clipThumbPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: colors.chrome,
    },
    clipThumbLabel: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 4,
        fontSize: 10,
        color: colors.chrome,
        backgroundColor: 'rgba(58,52,45,0.6)',
    },
    clipThumbCheckmark: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(58,52,45,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    clipThumbCheckmarkText: {
        color: colors.chrome,
        fontSize: 24,
        fontWeight: '700',
    },
    placeholderText: {
        fontSize: 16,
        color: colors.muted,
        textAlign: 'center',
        marginTop: 48,
    },
});
//# sourceMappingURL=AssemblyCanvas.js.map