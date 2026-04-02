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
exports.QuickSaveSheet = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const bottom_sheet_1 = __importDefault(require("@gorhom/bottom-sheet"));
const react_native_toast_message_1 = __importDefault(require("react-native-toast-message"));
const theme_1 = require("../lib/theme");
const useSession_1 = require("../lib/hooks/useSession");
const api_1 = require("../lib/api");
const saveClip_1 = require("../lib/saveClip");
async function parseJsonSafe(res) {
    const raw = await res.text();
    if (!raw)
        return { parsed: null, raw: '' };
    try {
        return { parsed: JSON.parse(raw), raw };
    }
    catch {
        return { parsed: null, raw };
    }
}
function QuickSaveSheet({ bottomSheetRef, videoUri, secondaryVideoUri, dualPairId, sessionId, sectionName, onDone, }) {
    const snapPoints = (0, react_1.useMemo)(() => ['55%'], []);
    const { session } = (0, useSession_1.useSession)();
    const [mode, setMode] = (0, react_1.useState)('saved');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [sessions, setSessions] = (0, react_1.useState)([]);
    const [name, setName] = (0, react_1.useState)('');
    const didLoadSessionsRef = (0, react_1.useRef)(false);
    const loadSessions = (0, react_1.useCallback)(async () => {
        if (!session?.access_token)
            return;
        if (didLoadSessionsRef.current)
            return;
        didLoadSessionsRef.current = true;
        try {
            let res = await fetch(`${api_1.API_BASE}/sessions/`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (res.status === 404) {
                res = await fetch(`${api_1.API_BASE}/sessions`, {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                });
            }
            if (!res.ok)
                return;
            const body = (await res.json());
            setSessions(Array.isArray(body.sessions) ? body.sessions : []);
        }
        catch {
            // ignore
        }
    }, [session?.access_token]);
    const saveToSession = (0, react_1.useCallback)(async (targetSessionId) => {
        if (!videoUri)
            return false;
        if (!session?.access_token)
            return false;
        setLoading(true);
        try {
            const r = await (0, saveClip_1.saveClip)(targetSessionId, videoUri, 'Clip', session.access_token, undefined, dualPairId);
            if (!r.ok) {
                react_native_toast_message_1.default.show({ type: 'error', text1: 'Could not save clip' });
                return false;
            }
            if (dualPairId && secondaryVideoUri) {
                const secondaryResult = await (0, saveClip_1.saveClip)(targetSessionId, secondaryVideoUri, 'Clip', session.access_token, undefined, dualPairId);
                if (!secondaryResult.ok) {
                    react_native_toast_message_1.default.show({ type: 'error', text1: 'Could not save clip' });
                    return false;
                }
            }
            react_native_toast_message_1.default.show({ type: 'success', text1: 'Saved' });
            bottomSheetRef.current?.close();
            onDone({ navigateTo: `/session/${targetSessionId}` });
            return true;
        }
        finally {
            setLoading(false);
        }
    }, [videoUri, secondaryVideoUri, dualPairId, session?.access_token, bottomSheetRef, onDone]);
    const saveToSectionSession = (0, react_1.useCallback)(async () => {
        if (!sessionId)
            return false;
        if (!videoUri)
            return false;
        if (!session?.access_token)
            return false;
        setLoading(true);
        try {
            // Pass sectionName so the upload queue creates a section_clips entry
            // once the server clip_id is confirmed.
            const r = await (0, saveClip_1.saveClip)(sessionId, videoUri, 'Clip', session.access_token, sectionName ?? undefined, dualPairId);
            if (!r.ok) {
                react_native_toast_message_1.default.show({ type: 'error', text1: 'Could not save clip' });
                return false;
            }
            if (dualPairId && secondaryVideoUri) {
                const secondaryResult = await (0, saveClip_1.saveClip)(sessionId, secondaryVideoUri, 'Clip', session.access_token, sectionName ?? undefined, dualPairId);
                if (!secondaryResult.ok) {
                    react_native_toast_message_1.default.show({ type: 'error', text1: 'Could not save clip' });
                    return false;
                }
            }
            react_native_toast_message_1.default.show({ type: 'success', text1: 'Saved' });
            bottomSheetRef.current?.close();
            onDone();
            return true;
        }
        finally {
            setLoading(false);
        }
    }, [sessionId, sectionName, videoUri, secondaryVideoUri, dualPairId, session?.access_token, bottomSheetRef, onDone]);
    const saveLater = (0, react_1.useCallback)(async () => {
        if (!videoUri)
            return false;
        if (!session?.access_token)
            return false;
        setLoading(true);
        try {
            const r = await (0, saveClip_1.saveInboxClip)(videoUri, 'Clip', session.access_token);
            if (!r.ok) {
                if (r.reason === 'plan_limit_reached') {
                    react_native_toast_message_1.default.show({ type: 'error', text1: 'Upload limit reached' });
                }
                else {
                    react_native_toast_message_1.default.show({ type: 'error', text1: 'Could not save to Inbox', text2: r.message });
                }
                return false;
            }
            react_native_toast_message_1.default.show({ type: 'success', text1: 'Saved to Inbox' });
            bottomSheetRef.current?.close();
            onDone({ navigateTo: '/inbox' });
            return true;
        }
        catch (e) {
            react_native_toast_message_1.default.show({ type: 'error', text1: 'Could not save to Inbox' });
            return false;
        }
        finally {
            setLoading(false);
        }
    }, [videoUri, session?.access_token, bottomSheetRef, onDone]);
    const createSession = (0, react_1.useCallback)(async () => {
        if (!session?.access_token)
            return null;
        setLoading(true);
        try {
            const trimmed = name.trim() || new Date().toLocaleDateString();
            let res = await fetch(`${api_1.API_BASE}/sessions/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ name: trimmed }),
            });
            if (res.status === 404) {
                res = await fetch(`${api_1.API_BASE}/sessions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({ name: trimmed }),
                });
            }
            const { parsed } = await parseJsonSafe(res);
            if (!res.ok)
                return null;
            return parsed;
        }
        finally {
            setLoading(false);
        }
    }, [name, session?.access_token]);
    const primaryExistingLabel = sessionId && sectionName ? `Save to ${sectionName}` : 'Existing →';
    return (<bottom_sheet_1.default ref={bottomSheetRef} index={-1} snapPoints={snapPoints} enablePanDownToClose backgroundStyle={styles.sheet} handleIndicatorStyle={styles.handle} onChange={(idx) => {
            if (idx >= 0)
                loadSessions().catch(() => { });
        }}>
      <react_native_1.View style={styles.content}>
        <react_native_1.Text style={styles.title}>Saved</react_native_1.Text>

        {mode === 'saved' ? (<>
            <react_native_1.TouchableOpacity style={styles.secondaryBtn} onPress={saveLater} disabled={loading}>
              {loading ? (<react_native_1.ActivityIndicator color={theme_1.theme.textPrimary} size="small"/>) : (<react_native_1.Text style={styles.secondaryBtnText}>Later</react_native_1.Text>)}
            </react_native_1.TouchableOpacity>

            <react_native_1.TouchableOpacity style={styles.secondaryBtn} onPress={() => setMode('new-session')} disabled={loading}>
              <react_native_1.Text style={styles.secondaryBtnText}>+ New session</react_native_1.Text>
            </react_native_1.TouchableOpacity>

            <react_native_1.TouchableOpacity style={styles.primaryBtn} onPress={() => {
                if (sessionId && sectionName) {
                    void saveToSectionSession();
                    return;
                }
                setMode('picker');
            }} disabled={loading}>
              <react_native_1.Text style={styles.primaryBtnText}>{primaryExistingLabel}</react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </>) : null}

        {mode === 'new-session' ? (<>
            <react_native_1.TextInput style={styles.input} placeholder="Session name" placeholderTextColor={theme_1.theme.textSecondary} value={name} onChangeText={setName} editable={!loading}/>
            <react_native_1.TouchableOpacity style={styles.primaryBtn} onPress={async () => {
                const s = await createSession();
                if (!s?.id) {
                    react_native_toast_message_1.default.show({ type: 'error', text1: 'Could not create session' });
                    return;
                }
                await saveToSession(s.id);
            }} disabled={loading}>
              {loading ? (<react_native_1.ActivityIndicator color="#0b0b0f" size="small"/>) : (<react_native_1.Text style={styles.primaryBtnText}>Create & save</react_native_1.Text>)}
            </react_native_1.TouchableOpacity>
            <react_native_1.TouchableOpacity style={styles.linkBtn} onPress={() => setMode('saved')} disabled={loading}>
              <react_native_1.Text style={styles.linkText}>Back</react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </>) : null}

        {mode === 'picker' ? (<>
            <react_native_1.Text style={styles.subTitle}>Choose a session</react_native_1.Text>
            <react_native_1.View style={styles.list}>
              {sessions.map((s) => (<react_native_1.TouchableOpacity key={s.id} style={styles.sessionRow} onPress={() => saveToSession(s.id)} disabled={loading}>
                  <react_native_1.Text style={styles.sessionText} numberOfLines={1}>
                    {s.name}
                  </react_native_1.Text>
                  <react_native_1.Text style={styles.chev}>→</react_native_1.Text>
                </react_native_1.TouchableOpacity>))}
            </react_native_1.View>
            <react_native_1.TouchableOpacity style={styles.linkBtn} onPress={() => setMode('saved')} disabled={loading}>
              <react_native_1.Text style={styles.linkText}>Back</react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </>) : null}
      </react_native_1.View>
    </bottom_sheet_1.default>);
}
exports.QuickSaveSheet = QuickSaveSheet;
const styles = react_native_1.StyleSheet.create({
    sheet: { backgroundColor: theme_1.theme.background },
    handle: { backgroundColor: theme_1.theme.textSecondary },
    content: { padding: 20, paddingBottom: 40, gap: 10 },
    title: { color: theme_1.theme.textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 4 },
    subTitle: { color: theme_1.theme.textSecondary, fontSize: 13, marginBottom: 6 },
    input: {
        backgroundColor: '#1B1B22',
        borderWidth: 1,
        borderColor: '#2A2A32',
        borderRadius: theme_1.theme.borderRadius,
        paddingVertical: 12,
        paddingHorizontal: 12,
        color: theme_1.theme.textPrimary,
    },
    primaryBtn: {
        backgroundColor: '#C8F135',
        borderRadius: theme_1.theme.borderRadius,
        paddingVertical: 14,
        alignItems: 'center',
    },
    primaryBtnText: { color: '#0b0b0f', fontSize: 16, fontWeight: '800' },
    secondaryBtn: {
        backgroundColor: '#222',
        borderWidth: 1,
        borderColor: theme_1.theme.textSecondary,
        borderRadius: theme_1.theme.borderRadius,
        paddingVertical: 14,
        alignItems: 'center',
    },
    secondaryBtnText: { color: theme_1.theme.textPrimary, fontSize: 16, fontWeight: '700' },
    linkBtn: { paddingVertical: 10, alignItems: 'center' },
    linkText: { color: '#4ECDC4', fontWeight: '800' },
    list: { gap: 10 },
    sessionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: theme_1.theme.borderRadius,
        borderWidth: 1,
        borderColor: theme_1.theme.textSecondary,
        backgroundColor: '#222',
    },
    sessionText: { color: theme_1.theme.textPrimary, fontSize: 16, fontWeight: '700', flex: 1, marginRight: 10 },
    chev: { color: theme_1.theme.textSecondary, fontSize: 18 },
});
//# sourceMappingURL=QuickSaveSheet.js.map