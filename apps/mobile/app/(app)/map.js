"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const storage_1 = require("../../lib/storage");
const theme_1 = require("../../lib/theme");
function MapScreen() {
    const redirectToActiveSession = (0, react_1.useCallback)(() => {
        const activeSessionId = (0, storage_1.getActiveSessionId)();
        if (activeSessionId) {
            expo_router_1.router.push(`/session/${activeSessionId}?tab=map`);
        }
    }, []);
    (0, react_1.useEffect)(() => {
        redirectToActiveSession();
    }, [redirectToActiveSession]);
    (0, expo_router_1.useFocusEffect)(redirectToActiveSession);
    return (<react_native_1.View style={styles.container}>
      <react_native_1.Text style={styles.text}>No active session. Start one from Session tab.</react_native_1.Text>
    </react_native_1.View>);
}
exports.default = MapScreen;
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme_1.theme.light.ground,
        paddingHorizontal: 24,
    },
    text: {
        color: theme_1.theme.light.muted,
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
    },
});
//# sourceMappingURL=map.js.map