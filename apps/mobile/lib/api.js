"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApiBaseOverride = exports.setApiBaseOverride = exports.API_BASE = void 0;
const expo_constants_1 = __importDefault(require("expo-constants"));
const API_URL_STORAGE_KEY = 'roam_api_url_override';
let _mmkv = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { MMKV } = require('react-native-mmkv');
    _mmkv = new MMKV({ id: 'roam-store' });
}
catch {
    // MMKV unavailable — runtime override won't persist
}
function resolveApiBase() {
    const override = _mmkv?.getString(API_URL_STORAGE_KEY);
    if (override)
        return override;
    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL;
    }
    const debuggerHost = expo_constants_1.default.expoConfig?.hostUri ?? expo_constants_1.default.manifest2?.extra?.expoGo?.debuggerHost;
    if (debuggerHost) {
        const ip = debuggerHost.split(':')[0];
        return `http://${ip}:3001`;
    }
    return 'http://localhost:3001';
}
/** Current API base URL. Changes when setApiBaseOverride is called. */
exports.API_BASE = resolveApiBase();
/** Override the API URL at runtime (persisted in MMKV). Pass null to clear. */
function setApiBaseOverride(url) {
    if (url) {
        _mmkv?.set(API_URL_STORAGE_KEY, url);
    }
    else {
        _mmkv?.delete(API_URL_STORAGE_KEY);
    }
    exports.API_BASE = resolveApiBase();
}
exports.setApiBaseOverride = setApiBaseOverride;
/** Get the current override (null if using default). */
function getApiBaseOverride() {
    return _mmkv?.getString(API_URL_STORAGE_KEY) ?? null;
}
exports.getApiBaseOverride = getApiBaseOverride;
//# sourceMappingURL=api.js.map