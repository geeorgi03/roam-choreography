"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const react_native_1 = require("react-native");
const netinfo_1 = __importDefault(require("@react-native-community/netinfo"));
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
function OfflineBanner() {
    const [isOffline, setIsOffline] = (0, react_1.useState)(false);
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    (0, react_1.useEffect)(() => {
        const unsubscribe = netinfo_1.default.addEventListener((state) => {
            setIsOffline(!(state.isConnected && state.isInternetReachable !== false));
        });
        return unsubscribe;
    }, []);
    if (!isOffline)
        return null;
    return (<react_native_1.View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <react_native_1.Text style={styles.text}>No connection — changes will sync when back online</react_native_1.Text>
    </react_native_1.View>);
}
exports.default = OfflineBanner;
const styles = react_native_1.StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: '#D97706',
        paddingBottom: 10,
        paddingHorizontal: 12,
    },
    text: {
        color: '#111827',
        textAlign: 'center',
        fontWeight: '600',
        fontSize: 12,
    },
});
//# sourceMappingURL=OfflineBanner.js.map