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
exports.CreateSessionSheet = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const bottom_sheet_1 = __importDefault(require("@gorhom/bottom-sheet"));
const theme_1 = require("../lib/theme");
const useSession_1 = require("../lib/hooks/useSession");
const api_1 = require("../lib/api");
const defaultName = () => new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
});
function CreateSessionSheet({ bottomSheetRef, onCreated, onPaywallRequired, }) {
    const { session } = (0, useSession_1.useSession)();
    const [name, setName] = (0, react_1.useState)(defaultName);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const parseJsonSafe = async (res) => {
        const raw = await res.text();
        if (!raw)
            return { parsed: null, raw: '' };
        try {
            return { parsed: JSON.parse(raw), raw };
        }
        catch {
            return { parsed: null, raw };
        }
    };
    const postCreateSession = async (path) => {
        return fetch(`${api_1.API_BASE}${path}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ name: name.trim() || defaultName() }),
        });
    };
    const handleCreate = async () => {
        if (!session?.access_token) {
            const msg = 'Not signed in. Close this sheet, open Profile, sign in again, then try Create again.';
            setError(msg);
            react_native_1.Alert.alert('Can’t create session', msg);
            return;
        }
        setError(null);
        setLoading(true);
        try {
            // Try with trailing slash first (some proxies require it), then without.
            let res = await postCreateSession('/sessions/');
            if (res.status === 404) {
                res = await postCreateSession('/sessions');
            }
            const { parsed: data, raw } = await parseJsonSafe(res);
            if (res.status === 403 && data?.error === 'plan_limit_reached') {
                bottomSheetRef.current?.close();
                onPaywallRequired?.();
                return;
            }
            if (!res.ok) {
                const msg = data?.error ??
                    (raw ? `HTTP ${res.status}: ${raw.slice(0, 200)}` : `HTTP ${res.status} ${res.statusText}`);
                throw new Error(msg || 'Request failed');
            }
            const newSession = data;
            if (!newSession?.id) {
                throw new Error('Server returned no session id');
            }
            onCreated(newSession);
            bottomSheetRef.current?.close();
        }
        catch (e) {
            const message = e instanceof Error ? e.message : 'Failed to create session';
            setError(message);
            react_native_1.Alert.alert('Create session failed', message);
        }
        finally {
            setLoading(false);
        }
    };
    return (<bottom_sheet_1.default ref={bottomSheetRef} index={-1} snapPoints={['40%']} enablePanDownToClose backgroundStyle={styles.sheet} handleIndicatorStyle={styles.handle}>
      <react_native_1.View style={styles.content}>
        <react_native_1.Text style={styles.title}>New session</react_native_1.Text>
        <react_native_1.TextInput style={styles.input} placeholder="Session name" placeholderTextColor={theme_1.theme.textSecondary} value={name} onChangeText={setName} editable={!loading}/>
        {error ? <react_native_1.Text style={styles.errorText}>{error}</react_native_1.Text> : null}
        <react_native_1.TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleCreate} disabled={loading}>
          {loading ? (<react_native_1.ActivityIndicator color={theme_1.theme.textPrimary} size="small"/>) : (<react_native_1.Text style={styles.buttonText}>Create</react_native_1.Text>)}
        </react_native_1.TouchableOpacity>
      </react_native_1.View>
    </bottom_sheet_1.default>);
}
exports.CreateSessionSheet = CreateSessionSheet;
const styles = react_native_1.StyleSheet.create({
    sheet: {
        backgroundColor: theme_1.theme.background,
    },
    handle: {
        backgroundColor: theme_1.theme.textSecondary,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: theme_1.theme.textPrimary,
        marginBottom: 12,
    },
    input: {
        backgroundColor: '#222',
        borderWidth: 1,
        borderColor: theme_1.theme.textSecondary,
        borderRadius: theme_1.theme.borderRadius,
        paddingVertical: 14,
        paddingHorizontal: 16,
        fontSize: 16,
        color: theme_1.theme.textPrimary,
        marginBottom: 12,
    },
    errorText: {
        color: '#e57373',
        fontSize: 14,
        marginBottom: 8,
    },
    button: {
        backgroundColor: theme_1.theme.accent,
        borderWidth: 1,
        borderColor: theme_1.theme.textSecondary,
        borderRadius: theme_1.theme.borderRadius,
        paddingVertical: 14,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: theme_1.theme.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
});
//# sourceMappingURL=CreateSessionSheet.js.map