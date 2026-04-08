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
exports.ClipViewerSheetStandalone = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const bottom_sheet_1 = __importStar(require("@gorhom/bottom-sheet"));
const expo_av_1 = require("expo-av");
const theme_1 = require("../../lib/theme");
const LoopChipRow_1 = __importDefault(require("./LoopChipRow"));
const colors = theme_1.theme.light;
const nightColors = theme_1.theme.night;
exports.ClipViewerSheetStandalone = react_1.default.forwardRef(function ClipViewerSheetStandalone({ clip, sessionId, onClose }, ref) {
    const videoRef = (0, react_1.useRef)(null);
    const positionMsRef = (0, react_1.useRef)(0);
    const [clipSpeed, setClipSpeed] = (0, react_1.useState)(1);
    const [playheadFraction, setPlayheadFraction] = (0, react_1.useState)(0);
    const [playing, setPlaying] = (0, react_1.useState)(false);
    const [durationMs, setDurationMs] = (0, react_1.useState)(0);
    const [activeLoop, setActiveLoop] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        positionMsRef.current = 0;
        setPlayheadFraction(0);
        setPlaying(false);
    }, [clip?.local_id]);
    // Always render the BottomSheet, but show empty content when no clip
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
        const newSpeed = clipSpeed === 1 ? 0.5 : 1;
        setClipSpeed(newSpeed);
        if (videoRef.current) {
            videoRef.current.setRateAsync(newSpeed, true);
        }
    };
    const handlePlayPause = async () => {
        if (videoRef.current) {
            if (playing) {
                await videoRef.current.pauseAsync();
            }
            else {
                await videoRef.current.playAsync();
            }
            setPlaying(!playing);
        }
    };
    const videoSource = clip?.mux_playback_id
        ? { uri: `https://stream.mux.com/${clip.mux_playback_id}.m3u8` }
        : null;
    const handlePlaybackStatusUpdate = (status) => {
        if (!status.isLoaded) {
            positionMsRef.current = 0;
            setPlayheadFraction(0);
            setPlaying(false);
            setDurationMs(0);
            return;
        }
        positionMsRef.current = status.positionMillis;
        setDurationMs(status.durationMillis || 0);
        setPlayheadFraction(status.durationMillis ? status.positionMillis / status.durationMillis : 0);
        setPlaying(status.isPlaying);
    };
    const handleLoopChipPress = (start) => {
        if (videoRef.current) {
            videoRef.current.setPositionAsync(start);
        }
    };
    const clipTypeBadge = clip?.clip_type === 'REF'
        ? { label: 'REF', backgroundColor: '#7db9a8' }
        : clip?.clip_type === 'MINE'
            ? { label: 'MINE', backgroundColor: '#e8a87c' }
            : null;
    const renderBackdrop = (props) => (<bottom_sheet_1.BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close"/>);
    return (<bottom_sheet_1.default ref={ref} index={-1} snapPoints={['50%', '85%']} enablePanDownToClose onClose={onClose} backdropComponent={renderBackdrop}>
        {clip ? (<>
            {/* Dark zone */}
            <react_native_1.View style={styles.darkZone}>
              <react_native_1.View style={styles.header}>
                <react_native_1.Text style={styles.clipLabel}>{clip.label || 'Untitled Clip'}</react_native_1.Text>
                {clipTypeBadge && (<react_native_1.View style={[styles.typeBadge, { backgroundColor: clipTypeBadge.backgroundColor }]}>
                    <react_native_1.Text style={styles.typeBadgeText}>{clipTypeBadge.label}</react_native_1.Text>
                  </react_native_1.View>)}
                <react_native_1.View style={styles.libraryPill}>
                  <react_native_1.Text style={styles.libraryPillText}>library</react_native_1.Text>
                </react_native_1.View>
              </react_native_1.View>
              <react_native_1.View style={styles.videoContainer}>
                {videoSource ? (<expo_av_1.Video ref={videoRef} source={videoSource} style={styles.video} useNativeControls={false} resizeMode={expo_av_1.ResizeMode.CONTAIN} shouldPlay={false} rate={clipSpeed} onPlaybackStatusUpdate={handlePlaybackStatusUpdate}/>) : (<react_native_1.View style={styles.processingPlaceholder}>
                    <react_native_1.Text style={styles.processingText}>processing...</react_native_1.Text>
                  </react_native_1.View>)}
              </react_native_1.View>
              <react_native_1.View style={styles.progressBar}>
                {/* Loop region overlay */}
                {activeLoop && durationMs > 0 && (<react_native_1.View style={[
                    styles.loopRegion,
                    {
                        left: `${(activeLoop.start_ms / durationMs) * 100}%`,
                        width: `${((activeLoop.end_ms - activeLoop.start_ms) / durationMs) * 100}%`,
                        backgroundColor: activeLoop.color + '59', // 35% opacity
                    },
                ]}>
                    {/* Edge lines */}
                    <react_native_1.View style={[styles.loopEdgeLine, { backgroundColor: activeLoop.color, left: 0 }]}/>
                    <react_native_1.View style={[styles.loopEdgeLine, { backgroundColor: activeLoop.color, right: 0 }]}/>
                  </react_native_1.View>)}
                <react_native_1.View style={[styles.progressFill, { width: `${playheadFraction * 100}%` }]}/>
              </react_native_1.View>
              {/* Controls row: -5s | Play/Pause | speed | +5s */}
              <react_native_1.View style={styles.controlsRow}>
                <react_native_1.TouchableOpacity style={styles.skipButton} onPress={handleSkipBack}>
                  <react_native_1.Text style={styles.skipButtonText}>-5s</react_native_1.Text>
                </react_native_1.TouchableOpacity>
                <react_native_1.TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
                  <react_native_1.Text style={styles.playButtonText}>{playing ? 'Pause' : 'Play'}</react_native_1.Text>
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
              {/* Loop chips - only show if clip has source_url */}
              {clip?.mux_playback_id && (<LoopChipRow_1.default sessionId={sessionId} sourceUrl={`https://stream.mux.com/${clip.mux_playback_id}`} currentPositionMs={positionMsRef.current} onSeek={handleLoopChipPress} onActiveLoopChange={setActiveLoop}/>)}
            </react_native_1.View>
          </>) : (<react_native_1.View style={styles.emptyContainer}/>)}
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
    libraryPill: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    libraryPillText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
    },
    typeBadge: {
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 6,
    },
    typeBadgeText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '700',
        fontFamily: theme_1.theme.typography.monoFamily,
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
    loopRegion: {
        position: 'absolute',
        top: 0,
        height: '100%',
        borderRadius: 1,
    },
    loopEdgeLine: {
        position: 'absolute',
        top: -3,
        width: 3,
        height: 8,
        borderRadius: 1,
    },
    controlsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
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
    playButton: {
        width: 60,
        height: 32,
        backgroundColor: '#7DB9A8',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playButtonText: {
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
    emptyContainer: {
        flex: 1,
    },
});
//# sourceMappingURL=ClipViewerSheetStandalone.js.map