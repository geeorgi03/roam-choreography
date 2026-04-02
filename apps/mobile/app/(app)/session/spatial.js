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
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const theme_1 = require("../../../lib/theme");
const colors = theme_1.theme.light;
function SpatialRedirect() {
    const router = (0, expo_router_1.useRouter)();
    const { sessionId, id } = (0, expo_router_1.useLocalSearchParams)();
    const resolvedSessionId = typeof sessionId === 'string' && sessionId.length > 0
        ? sessionId
        : typeof id === 'string' && id.length > 0
            ? id
            : null;
    (0, react_1.useEffect)(() => {
        if (resolvedSessionId) {
            router.replace({
                pathname: '../[id]',
                params: { id: resolvedSessionId, tab: 'spatial' },
            });
        }
    }, [resolvedSessionId, router]);
    if (!resolvedSessionId) {
        return null;
    }
    return <react_native_1.View style={styles.container}/>;
}
exports.default = SpatialRedirect;
const styles = react_native_1.StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.ground },
});
//# sourceMappingURL=spatial.js.map