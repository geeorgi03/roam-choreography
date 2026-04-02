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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClipViewerSheet = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const bottom_sheet_1 = __importDefault(require("@gorhom/bottom-sheet"));
const expo_av_1 = require("expo-av");
const SessionContext_1 = require("../../lib/contexts/SessionContext");
const useSession_1 = require("../../lib/hooks/useSession");
const theme_1 = require("../../lib/theme");
const api_1 = require("../../lib/api");
const colors = theme_1.theme.light;
const nightColors = theme_1.theme.night;
exports.ClipViewerSheet = react_1.default.forwardRef(function ClipViewerSheet({ onClose }, ref) {
    const { selectedClipForSheet, activeSheetId, loopRegion, activeSection, sectionClips, setSectionClips, sessionId, jumpToSongMap } = (0, SessionContext_1.useSessionContext)();
    const { session } = (0, useSession_1.useSession)();
    const videoRef = (0, react_1.useRef)(null);
    const positionMsRef = (0, react_1.useRef)(0);
    const [clipSpeed, setClipSpeed] = (0, react_1.useState)(1);
    const [playheadFraction, setPlayheadFraction] = (0, react_1.useState)(0);
    // Coordinator useEffect
    (0, react_1.useEffect)(() => {
        if (activeSheetId !== 'clip-viewer') {
            ref?.current?.close();
        }
    }, [activeSheetId, ref]);
    (0, react_1.useEffect)(() => {
        positionMsRef.current = 0;
        setPlayheadFraction(0);
    }, [selectedClipForSheet?.local_id]);
    if (!selectedClipForSheet) {
        return null;
    }
    const handleSkipBack = () => {
        if (videoRef.current) {
            videoRef.current.setPositionAsync(Math.max(0, positionMsRef.current - 5000));
        }
    };
    const handleSkipForward = () => {
        if (videoRef.current) {
            videoRef.current.setPositionAsync(positionMsRef.current + 5000);
        }
    };
    const handleSpeedToggle = () => {
        setClipSpeed(prev => prev === 1 ? 0.5 : 1);
    };
    const handleLoopChipPress = (start) => {
        if (videoRef.current) {
            videoRef.current.setPositionAsync(start);
        }
    };
    const isClipInSession = selectedClipForSheet.server_id &&
        sectionClips.some(sc => sc.clip_id === selectedClipForSheet.server_id && sc.section_label === activeSection);
    const handleSaveToSession = async () => {
        if (!selectedClipForSheet.server_id || !session?.access_token)
            return;
        try {
            const response = await fetch(`${api_1.API_BASE}/sessions/${sessionId}/assembly/section-clip`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clip_id: selectedClipForSheet.server_id,
                    section_label: activeSection,
                }),
            });
            if (response.ok) {
                const newSectionClip = (await response.json());
                setSectionClips([...sectionClips, newSectionClip]);
                console.log('Clip saved to session');
            }
        }
        catch (error) {
            console.error('Error saving clip to session:', error);
        }
    };
    const videoSource = selectedClipForSheet.mux_playback_id
        ? { uri: `https://stream.mux.com/${selectedClipForSheet.mux_playback_id}.m3u8` }
        : null;
    const handlePlaybackStatusUpdate = (status) => {
        if (!status.isLoaded) {
            positionMsRef.current = 0;
            setPlayheadFraction(0);
            return;
        }
        positionMsRef.current = status.positionMillis;
        setPlayheadFraction(status.durationMillis ? status.positionMillis / status.durationMillis : 0);
    };
    return (<bottom_sheet_1.default ref={ref} index={-1} snapPoints={['50%', '85%']} enablePanDownToClose onClose={onClose}>
      {/* Dark zone */}
      <react_native_1.View style={styles.darkZone}>
        {/* Header */}
        <react_native_1.View style={styles.header}>
          <react_native_1.Text style={styles.clipLabel}>{selectedClipForSheet.label || 'Untitled Clip'}</react_native_1.Text>
          <react_native_1.View style={styles.mirrorPill}>
            <react_native_1.Text style={styles.mirrorPillText}>mirror</react_native_1.Text>
          </react_native_1.View>
        </react_native_1.View>

        {/* Video */}
        <react_native_1.View style={styles.videoContainer}>
          {videoSource ? (<expo_av_1.Video ref={videoRef} source={videoSource} style={styles.video} useNativeControls resizeMode="contain" shouldPlay={false} rate={clipSpeed} onPlaybackStatusUpdate={handlePlaybackStatusUpdate}/>) : (<react_native_1.View style={styles.processingPlaceholder}>
              <react_native_1.Text style={styles.processingText}>processing...</react_native_1.Text>
            </react_native_1.View>)}
        </react_native_1.View>

        {/* Progress bar */}
        <react_native_1.View style={styles.progressBar}>
          <react_native_1.View style={[styles.progressFill, { width: `${playheadFraction * 100}%` }]}/>
        </react_native_1.View>

        {/* Skip row */}
        <react_native_1.View style={styles.skipRow}>
          <react_native_1.TouchableOpacity style={styles.skipButton} onPress={handleSkipBack}>
            <react_native_1.Text style={styles.skipButtonText}>-5s</react_native_1.Text>
          </react_native_1.TouchableOpacity>
          <react_native_1.TouchableOpacity style={styles.speedButton} onPress={handleSpeedToggle}>
            <react_native_1.Text style={styles.speedButtonText}>{clipSpeed}×</react_native_1.Text>
          </react_native_1.TouchableOpacity>
          <react_native_1.TouchableOpacity style={styles.skipButton} onPress={handleSkipForward}>
            <react_native_1.Text style={styles.skipButtonText}>+5s</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>
      </react_native_1.View>

      {/* Light zone */}
      <react_native_1.View style={styles.lightZone}>
        {/* Loop chips */}
        {loopRegion && (<react_native_1.ScrollView horizontal style={styles.loopChipsContainer} showsHorizontalScrollIndicator={false}>
            <react_native_1.TouchableOpacity style={styles.loopChip} onPress={() => handleLoopChipPress(loopRegion.start)}>
              <react_native_1.Text style={styles.loopChipText}>Loop</react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </react_native_1.ScrollView>)}

        {/* Save row */}
        <react_native_1.View style={styles.saveRow}>
          <react_native_1.TouchableOpacity style={[
            styles.saveButton,
            isClipInSession && styles.saveButtonDisabled
        ]} onPress={handleSaveToSession} disabled={isClipInSession}>
            <react_native_1.Text style={[
            styles.saveButtonText,
            isClipInSession && styles.saveButtonTextDisabled
        ]}>
              {isClipInSession ? 'already in session' : 'save to session'}
            </react_native_1.Text>
          </react_native_1.TouchableOpacity>

          <react_native_1.TouchableOpacity style={styles.momentButton} onPress={jumpToSongMap}>
            <react_native_1.Text style={styles.momentButtonText}>the moment →</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>
      </react_native_1.View>
    </bottom_sheet_1.default>);
});
const styles = react_native_1.StyleSheet.create({
    darkZone: {
        backgroundColor: nightColors.ground,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 16,
        paddingBottom: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    clipLabel: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
    },
    mirrorPill: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    mirrorPillText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
    },
    videoContainer: {
        height: 200,
        backgroundColor: '#000',
        borderRadius: 8,
        marginBottom: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    video: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    processingPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    processingText: {
        color: '#ffffff',
        fontSize: 14,
        opacity: 0.7,
    },
    progressBar: {
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 1,
        marginBottom: 16,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#7DB9A8',
        borderRadius: 1,
    },
    skipRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    skipButton: {
        width: 50,
        height: 32,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    skipButtonText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
    },
    speedButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 16,
    },
    speedButtonText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
    },
    lightZone: {
        backgroundColor: colors.ground,
        padding: 16,
        paddingTop: 8,
    },
    loopChipsContainer: {
        marginBottom: 16,
    },
    loopChip: {
        backgroundColor: colors.mineBg,
        borderWidth: 1,
        borderColor: colors.mine,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
    },
    loopChipText: {
        color: colors.mine,
        fontSize: 12,
        fontWeight: '600',
    },
    saveRow: {
        gap: 12,
    },
    saveButton: {
        backgroundColor: '#7DB9A8',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: colors.chrome,
        opacity: 0.5,
    },
    saveButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
    saveButtonTextDisabled: {
        color: colors.muted,
    },
    momentButton: {
        borderWidth: 1,
        borderColor: colors.amber,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    momentButtonText: {
        color: colors.amber,
        fontSize: 14,
        fontStyle: 'italic',
        fontWeight: '600',
    },
});
//# sourceMappingURL=ClipViewerSheet.js.map