"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfflineBanner = void 0;
const react_1 = require("react");
const react_native_1 = require("react-native");
const netinfo_1 = __importDefault(require("@react-native-community/netinfo"));
function OfflineBanner() {
    const [isOffline, setIsOffline] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        const unsubscribe = netinfo_1.default.addEventListener((state) => {
            const connected = state.isConnected === true;
            const reachable = state.isInternetReachable !== false;
            setIsOffline(!(connected && reachable));
        });
        return unsubscribe;
    }, []);
    if (!isOffline)
        return null;
    return (<react_native_1.View style={styles.container}>
      <react_native_1.Text style={styles.text}>Offline mode: changes will sync when connection returns.</react_native_1.Text>
    </react_native_1.View>);
}
exports.OfflineBanner = OfflineBanner;
const styles = react_native_1.StyleSheet.create({
    container: {
        backgroundColor: '#D97706',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.2)',
        paddingVertical: 8,
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