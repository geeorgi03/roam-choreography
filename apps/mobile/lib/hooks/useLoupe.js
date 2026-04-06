"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLoupe = exports.LOUPE_DIAMETER = void 0;
const react_1 = require("react");
const react_native_reanimated_1 = require("react-native-reanimated");
const react_native_mmkv_1 = require("react-native-mmkv");
// Loupe persistence — key: loupe:${mux_playback_id ?? clip_id ?? source_url} -> { x, y, zoom }
const loupeStorage = new react_native_mmkv_1.MMKV({ id: 'loupe-state' });
// Loupe constants
exports.LOUPE_DIAMETER = 140;
function useLoupe(options) {
    const { persistKey, frameSize, onFrameCapture } = options;
    // State
    const [loupeActive, setLoupeActive] = (0, react_1.useState)(false);
    const [loupeZoom, setLoupeZoom] = (0, react_1.useState)(2.5);
    const [capturedFrame, setCapturedFrame] = (0, react_1.useState)(null);
    // Shared values for animations
    const loupeX = (0, react_native_reanimated_1.useSharedValue)(0);
    const loupeY = (0, react_native_reanimated_1.useSharedValue)(0);
    const loupeActiveShared = (0, react_native_reanimated_1.useSharedValue)(0); // 0 = inactive, 1 = active
    const loupeZoomShared = (0, react_native_reanimated_1.useSharedValue)(2.5);
    // Refs for tracking last values
    const loupeLastX = (0, react_1.useRef)(0);
    const loupeLastY = (0, react_1.useRef)(0);
    const loupeLastZoom = (0, react_1.useRef)(0);
    // Animated styles
    const loupeAnimatedStyle = (0, react_native_reanimated_1.useSharedValue)(() => ({
        transform: [
            { translateX: loupeX.value - exports.LOUPE_DIAMETER / 2 },
            { translateY: loupeY.value - exports.LOUPE_DIAMETER / 2 },
        ],
    }));
    const loupeVideoAnimatedStyle = (0, react_native_reanimated_1.useSharedValue)(() => ({
        transform: [
            { scale: loupeZoomShared.value },
            { translateX: -(loupeX.value - exports.LOUPE_DIAMETER / 2) * (loupeZoomShared.value - 1) },
            { translateY: -(loupeY.value - exports.LOUPE_DIAMETER / 2) * (loupeZoomShared.value - 1) },
        ],
    }));
    const loupeOverlayAnimatedStyle = (0, react_native_reanimated_1.useSharedValue)(() => ({
        transform: [
            { scale: loupeZoomShared.value },
            { translateX: -(loupeX.value - exports.LOUPE_DIAMETER / 2) * (loupeZoomShared.value - 1) },
            { translateY: -(loupeY.value - exports.LOUPE_DIAMETER / 2) * (loupeZoomShared.value - 1) },
        ],
    }));
    // Initialize loupe position to center of video container only if no saved state exists
    (0, react_1.useEffect)(() => {
        if (frameSize.width > 0 && frameSize.height > 0) {
            // Only center-initialize if no saved state exists for the current persistKey
            if (!persistKey || !loupeStorage.getString(persistKey)) {
                loupeX.value = frameSize.width / 2;
                loupeY.value = frameSize.height / 2;
                loupeLastX.current = frameSize.width / 2;
                loupeLastY.current = frameSize.height / 2;
            }
        }
    }, [frameSize, persistKey]);
    // Restore saved loupe state on clip open - single restore effect
    (0, react_1.useEffect)(() => {
        if (!persistKey)
            return;
        try {
            const savedStateString = loupeStorage.getString(persistKey);
            if (savedStateString) {
                const savedState = JSON.parse(savedStateString);
                // Validate shape and numeric finiteness before applying values
                if (savedState &&
                    typeof savedState.x === 'number' &&
                    typeof savedState.y === 'number' &&
                    typeof savedState.zoom === 'number' &&
                    Number.isFinite(savedState.x) &&
                    Number.isFinite(savedState.y) &&
                    Number.isFinite(savedState.zoom) &&
                    savedState.zoom >= 2 &&
                    savedState.zoom <= 3) {
                    loupeLastX.current = savedState.x;
                    loupeLastY.current = savedState.y;
                    loupeLastZoom.current = savedState.zoom;
                    loupeX.value = savedState.x;
                    loupeY.value = savedState.y;
                    loupeZoomShared.value = savedState.zoom;
                }
                else {
                    // Malformed data - clear the key so restore falls back to default centering
                    loupeStorage.delete(persistKey);
                }
            }
        }
        catch {
            // Silently ignore malformed data
        }
    }, [persistKey]);
    // JS-thread helpers for gesture callbacks
    const activateLoupe = (0, react_native_reanimated_1.runOnJS)((zoom, x, y) => {
        setLoupeZoom(zoom);
        loupeZoomShared.value = zoom;
        setLoupeActive(true);
        loupeLastZoom.current = zoom;
        loupeLastX.current = x;
        loupeLastY.current = y;
        // Attempt frame capture when loupe activates (for YouTube)
        if (onFrameCapture) {
            onFrameCapture().then(setCapturedFrame).catch(() => { });
        }
    });
    const updateLoupeZoom = (0, react_native_reanimated_1.runOnJS)((zoom) => {
        setLoupeZoom(zoom);
        loupeZoomShared.value = zoom;
        loupeLastZoom.current = zoom;
    });
    const saveLoupeState = (0, react_native_reanimated_1.runOnJS)((x, y) => {
        if (persistKey) {
            loupeStorage.set(persistKey, JSON.stringify({ x, y, zoom: loupeLastZoom.current }));
        }
    });
    const resetLoupe = (0, react_native_reanimated_1.runOnJS)(() => {
        setLoupeActive(false);
        loupeActiveShared.value = 0;
        loupeLastZoom.current = 0;
        loupeLastX.current = 0;
        loupeLastY.current = 0;
        setCapturedFrame(null);
    });
    const captureCurrentFrame = async () => {
        if (onFrameCapture) {
            try {
                const frame = await onFrameCapture();
                setCapturedFrame(frame);
            }
            catch (error) {
                console.warn('Frame capture failed:', error);
                setCapturedFrame(null);
            }
        }
    };
    return {
        // State
        loupeActive,
        loupeZoom,
        capturedFrame,
        // Shared values
        loupeX,
        loupeY,
        loupeActiveShared,
        loupeZoomShared,
        // Refs
        loupeLastX,
        loupeLastY,
        loupeLastZoom,
        // Animated styles
        loupeAnimatedStyle,
        loupeVideoAnimatedStyle,
        loupeOverlayAnimatedStyle,
        // Actions
        activateLoupe,
        updateLoupeZoom,
        saveLoupeState,
        resetLoupe,
        captureCurrentFrame,
        setCapturedFrame,
    };
}
exports.useLoupe = useLoupe;
//# sourceMappingURL=useLoupe.js.map