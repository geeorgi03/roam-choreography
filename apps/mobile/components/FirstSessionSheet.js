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
exports.FirstSessionSheet = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const bottom_sheet_1 = __importDefault(require("@gorhom/bottom-sheet"));
const theme_1 = require("../lib/theme");
const useSession_1 = require("../lib/hooks/useSession");
const api_1 = require("../lib/api");
const colors = theme_1.theme.light;
const spacing = theme_1.theme.spacing;
function FirstSessionSheet({ bottomSheetRef, onCreated, onPaywallRequired, }) {
    const { session } = (0, useSession_1.useSession)();
    const nameInputRef = (0, react_1.useRef)(null);
    const [step, setStep] = (0, react_1.useState)(1);
    const [name, setName] = (0, react_1.useState)('');
    const [musicUrl, setMusicUrl] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const reset = () => {
        setStep(1);
        setName('');
        setMusicUrl('');
        setError(null);
    };
    const parseJsonSafe = async (res) => {
        const raw = await res.text();
        if (!raw)
            return null;
        try {
            return JSON.parse(raw);
        }
        catch {
            return null;
        }
    };
    const postCreateSession = async (path, body) => {
        return fetch(`${api_1.API_BASE}${path}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(body),
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
            const body = {
                name: name.trim(),
                ...(musicUrl.trim() ? { music_url: musicUrl.trim() } : {}),
            };
            // Try with trailing slash first (some proxies require it), then without.
            let res = await postCreateSession('/sessions/', body);
            if (res.status === 404) {
                res = await postCreateSession('/sessions', body);
            }
            const data = await parseJsonSafe(res);
            if (res.status === 403 && data?.error === 'plan_limit_reached') {
                bottomSheetRef.current?.close();
                onPaywallRequired?.();
                return;
            }
            if (!res.ok) {
                const msg = data?.error ??
                    `HTTP ${res.status} ${res.statusText}`;
                throw new Error(msg || 'Request failed');
            }
            onCreated(data);
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
    return (<bottom_sheet_1.default ref={bottomSheetRef} index={-1} snapPoints={['70%']} enablePanDownToClose onChange={(i) => {
            if (i === -1)
                reset();
        }} backgroundStyle={styles.sheet} handleIndicatorStyle={styles.handle}>
      <react_native_1.View style={[styles.content, { paddingBottom: 40 }]}>
        {step === 1 ? (<>
            <react_native_1.Text style={[styles.stepTitle, { color: colors.active }]}>Name your session</react_native_1.Text>
            <react_native_1.TextInput ref={nameInputRef} autoFocus placeholder="晴天 project" placeholderTextColor={colors.muted} style={[
                styles.input,
                {
                    backgroundColor: colors.ground,
                    borderColor: colors.border,
                    color: colors.active,
                    fontSize: 20,
                },
            ]} value={name} onChangeText={setName} editable={!loading}/>

            {error ? <react_native_1.Text style={[styles.errorText, { color: colors.capture }]}>{error}</react_native_1.Text> : null}

            <react_native_1.TouchableOpacity style={[
                styles.primaryButton,
                (!name.trim() || loading) && styles.buttonDisabled,
            ]} onPress={() => {
                if (name.trim())
                    setStep(2);
            }} disabled={!name.trim() || loading}>
              <react_native_1.Text style={[styles.primaryButtonText, { color: colors.chrome }]}>Next →</react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </>) : null}

        {step === 2 ? (<>
            <react_native_1.Text style={[styles.stepTitle, { color: colors.active }]}>Add a reference video?</react_native_1.Text>
            <react_native_1.Text style={[styles.subtext, { color: colors.muted }]}>Paste a YouTube or Bilibili URL</react_native_1.Text>

            <react_native_1.TextInput style={[
                styles.input,
                {
                    backgroundColor: colors.ground,
                    borderColor: colors.border,
                    color: colors.active,
                },
            ]} placeholder="https://youtube.com/..." placeholderTextColor={colors.muted} value={musicUrl} onChangeText={setMusicUrl} autoCapitalize="none" keyboardType="url" editable={!loading}/>

            {error ? <react_native_1.Text style={[styles.errorText, { color: colors.capture }]}>{error}</react_native_1.Text> : null}

            <react_native_1.View style={styles.buttonRow}>
              <react_native_1.TouchableOpacity style={[
                styles.secondaryButton,
                loading && styles.buttonDisabled,
            ]} onPress={() => {
                handleCreate();
            }} disabled={loading}>
                {loading ? (<react_native_1.ActivityIndicator size="small" color={colors.muted}/>) : (<react_native_1.Text style={[styles.secondaryButtonText, { color: colors.muted }]}>Skip</react_native_1.Text>)}
              </react_native_1.TouchableOpacity>

              <react_native_1.TouchableOpacity style={[
                styles.primaryButton,
                loading && styles.buttonDisabled,
            ]} onPress={() => handleCreate()} disabled={loading}>
                {loading ? (<react_native_1.ActivityIndicator size="small" color={colors.chrome}/>) : (<react_native_1.Text style={[styles.primaryButtonText, { color: colors.chrome }]}>Start →</react_native_1.Text>)}
              </react_native_1.TouchableOpacity>
            </react_native_1.View>
          </>) : null}

      </react_native_1.View>
    </bottom_sheet_1.default>);
}
exports.FirstSessionSheet = FirstSessionSheet;
const styles = react_native_1.StyleSheet.create({
    sheet: {
        backgroundColor: colors.chrome,
    },
    handle: {
        backgroundColor: colors.border,
    },
    content: {
        padding: 20,
    },
    stepTitle: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 10,
        textAlign: 'left',
    },
    subtext: {
        fontSize: 14,
        marginBottom: 14,
    },
    input: {
        borderWidth: 1,
        borderRadius: spacing.radiusMd,
        paddingVertical: 14,
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    primaryButton: {
        backgroundColor: colors.mine,
        borderRadius: spacing.radiusMd,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        borderWidth: 1,
        borderColor: colors.mine,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '800',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderRadius: spacing.radiusMd,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        borderWidth: 1,
        borderColor: colors.border,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '800',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 4,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    errorText: {
        fontSize: 14,
        marginBottom: 8,
        textAlign: 'left',
    },
    step3Container: {
        minHeight: 200,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
//# sourceMappingURL=FirstSessionSheet.js.map