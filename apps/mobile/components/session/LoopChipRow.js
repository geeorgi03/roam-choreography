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
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_native_gesture_handler_1 = require("react-native-gesture-handler");
const react_native_toast_message_1 = __importDefault(require("react-native-toast-message"));
const useLoops_1 = __importDefault(require("../../lib/hooks/useLoops"));
const theme_1 = require("../../lib/theme");
const LOOP_COLOR_PALETTE = ['#e67c5c', '#4a90e2', '#8a6ee8', '#3ba287', '#f2b233', '#d35d9e'];
function LoopChipRow({ sessionId, sourceUrl, currentPositionMs, onSeek, onActiveLoopChange, }) {
    const { loops, isLoading, createLoop, deleteLoop, setLoops } = (0, useLoops_1.default)(sessionId, sourceUrl);
    const [activeLoopId, setActiveLoopId] = (0, react_1.useState)(null);
    const [undoQueue, setUndoQueue] = (0, react_1.useState)([]);
    const handleChipPress = (0, react_1.useCallback)((loop) => {
        setActiveLoopId(loop.id);
        onActiveLoopChange?.(loop);
        onSeek(loop.start_ms);
    }, [onSeek, onActiveLoopChange]);
    const handleAddLoop = (0, react_1.useCallback)(() => {
        if (!sourceUrl)
            return;
        // Pick next color from palette
        const nextColor = LOOP_COLOR_PALETTE[loops.length % LOOP_COLOR_PALETTE.length];
        // Create 10-second loop at current position
        createLoop(currentPositionMs, currentPositionMs + 10000, nextColor);
    }, [sourceUrl, loops.length, currentPositionMs, createLoop]);
    const restoreLoop = (0, react_1.useCallback)((loopId, originalIndex) => {
        // Find the loop in the undo queue
        const queueItem = undoQueue.find((item) => item.loop.id === loopId);
        if (!queueItem)
            return;
        // Clear the timeout
        clearTimeout(queueItem.timeoutId);
        // Restore the loop at its original position
        setLoops((prev) => {
            if (originalIndex === -1)
                return [...prev, queueItem.loop];
            return [...prev.slice(0, originalIndex), queueItem.loop, ...prev.slice(originalIndex)];
        });
        // Remove from undo queue
        setUndoQueue((prev) => prev.filter((item) => item.loop.id !== loopId));
    }, [undoQueue, setLoops]);
    const handleSwipeDelete = (0, react_1.useCallback)((loop) => {
        // Find original index
        const originalIndex = loops.findIndex((l) => l.id === loop.id);
        // Optimistic delete from local state only
        setLoops((prev) => prev.filter((l) => l.id !== loop.id));
        // Show undo toast with onPress handler
        react_native_toast_message_1.default.show({
            type: 'info',
            text1: 'Loop removed',
            text2: 'Undo',
            visibilityTime: 3000,
            position: 'bottom',
            props: {
                onPress: () => restoreLoop(loop.id, originalIndex),
            },
        });
        // Schedule actual server delete after timeout
        const timeoutId = setTimeout(async () => {
            // Call the actual server delete
            await deleteLoop(loop.id);
            // Remove from undo queue
            setUndoQueue((prev) => prev.filter((item) => item.loop.id !== loop.id));
        }, 3000);
        setUndoQueue((prev) => [...prev, { loop, originalIndex, timeoutId }]);
    }, [loops, setLoops, deleteLoop, restoreLoop]);
    // Cleanup timeouts on unmount
    (0, react_1.useEffect)(() => {
        return () => {
            undoQueue.forEach((item) => clearTimeout(item.timeoutId));
        };
    }, [undoQueue]);
    const renderChip = (0, react_1.useCallback)((loop) => {
        const isActive = loop.id === activeLoopId;
        const chipStyle = [
            styles.chip,
            {
                borderColor: isActive ? loop.color : theme_1.theme.light.border,
                backgroundColor: isActive ? loop.color + '25' : 'transparent',
            },
        ];
        const textStyle = [
            styles.chipText,
            {
                color: isActive ? loop.color : theme_1.theme.light.muted,
                fontFamily: theme_1.theme.typography.monoFamily,
            },
        ];
        return (<react_native_gesture_handler_1.Swipeable key={loop.id} onSwipeableOpen={() => handleSwipeDelete(loop)} renderRightActions={() => <react_native_1.View style={styles.deleteAction}/>}>
          <react_native_1.TouchableOpacity style={chipStyle} onPress={() => handleChipPress(loop)} activeOpacity={0.7}>
            <react_native_1.Text style={textStyle}>{loop.name}</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_gesture_handler_1.Swipeable>);
    }, [activeLoopId, handleChipPress, handleSwipeDelete]);
    if (isLoading) {
        return null;
    }
    return (<react_native_1.View style={styles.container}>
      <react_native_1.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {loops.map(renderChip)}
        <react_native_1.TouchableOpacity style={[styles.chip, styles.addChip, { borderColor: theme_1.theme.light.border }]} onPress={handleAddLoop} activeOpacity={0.7}>
          <react_native_1.Text style={[styles.chipText, { color: theme_1.theme.light.muted, fontFamily: theme_1.theme.typography.monoFamily }]}>
            +
          </react_native_1.Text>
        </react_native_1.TouchableOpacity>
      </react_native_1.ScrollView>
    </react_native_1.View>);
}
exports.default = LoopChipRow;
const styles = react_native_1.StyleSheet.create({
    container: {
        height: 32,
        marginVertical: 8,
    },
    scrollContent: {
        paddingHorizontal: 16,
        alignItems: 'center',
        gap: 8,
    },
    chip: {
        height: 24,
        paddingHorizontal: 8,
        borderWidth: 0.5,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 48,
    },
    addChip: {
        minWidth: 32,
    },
    chipText: {
        fontSize: 9,
        fontWeight: '500',
    },
    deleteAction: {
        width: 60,
        backgroundColor: '#ff4444',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
//# sourceMappingURL=LoopChipRow.js.map