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
exports.AssignPickerSheet = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const bottom_sheet_1 = __importDefault(require("@gorhom/bottom-sheet"));
const react_native_toast_message_1 = __importDefault(require("react-native-toast-message"));
const theme_1 = require("../lib/theme");
const api_1 = require("../lib/api");
const supabase_1 = require("../lib/supabase");
async function getAuthToken() {
    if (!supabase_1.supabase)
        return null;
    const { data: { session } } = await supabase_1.supabase.auth.getSession();
    return session?.access_token ?? null;
}
function AssignPickerSheet({ bottomSheetRef, onPick, onCreateNewSession, title = 'Add to session', }) {
    const snapPoints = (0, react_1.useMemo)(() => ['55%'], []);
    const [sessions, setSessions] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [pickingId, setPickingId] = (0, react_1.useState)(null);
    const load = (0, react_1.useCallback)(async () => {
        setLoading(true);
        try {
            const token = await getAuthToken();
            if (!token) {
                setSessions([]);
                return;
            }
            const res = await fetch(`${api_1.API_BASE}/sessions`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                setSessions([]);
                return;
            }
            const body = (await res.json());
            setSessions(Array.isArray(body.sessions) ? body.sessions : []);
        }
        finally {
            setLoading(false);
        }
    }, []);
    (0, react_1.useEffect)(() => {
        const ref = bottomSheetRef.current;
        if (!ref)
            return;
        load().catch(() => { });
    }, [bottomSheetRef, load]);
    const handlePick = async (s) => {
        setPickingId(s.id);
        try {
            const ok = await onPick(s);
            if (ok)
                bottomSheetRef.current?.close();
            else
                react_native_toast_message_1.default.show({ type: 'error', text1: 'Could not assign clip' });
        }
        finally {
            setPickingId(null);
        }
    };
    return (<bottom_sheet_1.default ref={bottomSheetRef} index={-1} snapPoints={snapPoints} enablePanDownToClose backgroundStyle={styles.sheet} handleIndicatorStyle={styles.handle} onChange={(idx) => {
            if (idx >= 0)
                load().catch(() => { });
        }}>
      <react_native_1.View style={styles.content}>
        <react_native_1.Text style={styles.title}>{title}</react_native_1.Text>

        {loading ? (<react_native_1.View style={styles.center}>
            <react_native_1.ActivityIndicator color={theme_1.theme.textPrimary}/>
          </react_native_1.View>) : sessions.length === 0 ? (<react_native_1.View style={styles.empty}>
            <react_native_1.Text style={styles.emptyTitle}>No sessions yet</react_native_1.Text>
            <react_native_1.Text style={styles.emptySub}>Create one to start organising clips.</react_native_1.Text>
            {onCreateNewSession ? (<react_native_1.TouchableOpacity style={styles.primaryBtn} onPress={() => {
                    bottomSheetRef.current?.close();
                    onCreateNewSession();
                }}>
                <react_native_1.Text style={styles.primaryBtnText}>+ Create one</react_native_1.Text>
              </react_native_1.TouchableOpacity>) : null}
          </react_native_1.View>) : (<react_native_1.View style={styles.list}>
            {sessions.map((s) => (<react_native_1.TouchableOpacity key={s.id} style={styles.row} onPress={() => handlePick(s)} disabled={pickingId !== null}>
                <react_native_1.Text style={styles.rowText} numberOfLines={1}>
                  {s.name}
                </react_native_1.Text>
                {pickingId === s.id ? (<react_native_1.ActivityIndicator size="small" color={theme_1.theme.textPrimary}/>) : (<react_native_1.Text style={styles.chev}>→</react_native_1.Text>)}
              </react_native_1.TouchableOpacity>))}
          </react_native_1.View>)}
      </react_native_1.View>
    </bottom_sheet_1.default>);
}
exports.AssignPickerSheet = AssignPickerSheet;
const styles = react_native_1.StyleSheet.create({
    sheet: { backgroundColor: theme_1.theme.background },
    handle: { backgroundColor: theme_1.theme.textSecondary },
    content: { padding: 20, paddingBottom: 40 },
    title: { fontSize: 18, fontWeight: '700', color: theme_1.theme.textPrimary, marginBottom: 12 },
    center: { paddingVertical: 24, alignItems: 'center' },
    list: { gap: 10 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: theme_1.theme.borderRadius,
        borderWidth: 1,
        borderColor: theme_1.theme.textSecondary,
        backgroundColor: '#222',
    },
    rowText: { color: theme_1.theme.textPrimary, fontSize: 16, fontWeight: '600', flex: 1, marginRight: 12 },
    chev: { color: theme_1.theme.textSecondary, fontSize: 18 },
    empty: { paddingVertical: 20 },
    emptyTitle: { color: theme_1.theme.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 6 },
    emptySub: { color: theme_1.theme.textSecondary, fontSize: 14, marginBottom: 14 },
    primaryBtn: {
        backgroundColor: theme_1.theme.accent,
        borderWidth: 1,
        borderColor: theme_1.theme.textSecondary,
        borderRadius: theme_1.theme.borderRadius,
        paddingVertical: 12,
        alignItems: 'center',
    },
    primaryBtnText: { color: theme_1.theme.textPrimary, fontSize: 16, fontWeight: '700' },
});
//# sourceMappingURL=AssignPickerSheet.js.map