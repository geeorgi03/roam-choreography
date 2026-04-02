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
const expo_router_1 = require("expo-router");
const react_native_toast_message_1 = __importDefault(require("react-native-toast-message"));
const theme_1 = require("../../lib/theme");
const useInbox_1 = require("../../lib/hooks/useInbox");
const AssignPickerSheet_1 = require("../../components/AssignPickerSheet");
const CreateSessionSheet_1 = require("../../components/CreateSessionSheet");
function timeAgo(iso) {
    const t = new Date(iso).getTime();
    if (!Number.isFinite(t))
        return '';
    const diff = Math.max(0, Date.now() - t);
    const mins = Math.floor(diff / 60000);
    if (mins < 1)
        return 'just now';
    if (mins < 60)
        return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)
        return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}
function InboxScreen() {
    const router = (0, expo_router_1.useRouter)();
    const { sessionId: originSessionId, sectionName: originSectionName } = (0, expo_router_1.useLocalSearchParams)();
    const { clips, loading, staleClips, assignClip, deleteClip, refresh } = (0, useInbox_1.useInbox)();
    const assignSheetRef = (0, react_1.useRef)(null);
    const createSheetRef = (0, react_1.useRef)(null);
    const [selectedClip, setSelectedClip] = (0, react_1.useState)(null);
    const sectionContext = typeof originSessionId === 'string' &&
        originSessionId.length > 0 &&
        typeof originSectionName === 'string' &&
        originSectionName.length > 0
        ? { sessionId: originSessionId, sectionName: originSectionName }
        : null;
    const headerCount = (0, react_1.useMemo)(() => clips.length, [clips.length]);
    const handleAssign = (clip) => {
        setSelectedClip(clip);
        assignSheetRef.current?.snapToIndex(0);
    };
    const onPickSession = async (s) => {
        if (!selectedClip)
            return false;
        const ok = await assignClip(selectedClip.id, s.id);
        if (ok)
            react_native_toast_message_1.default.show({ type: 'success', text1: `Added to ${s.name}` });
        return ok;
    };
    const renderItem = ({ item }) => {
        const canPlay = item.upload_status === 'ready' && !!item.mux_playback_id;
        return (<react_native_1.View style={styles.row}>
        <react_native_1.View style={styles.rowLeft}>
          <react_native_1.Text style={styles.typeIcon}>🎬</react_native_1.Text>
          <react_native_1.View style={{ flex: 1 }}>
            <react_native_1.Text style={styles.rowTitle} numberOfLines={1}>
              {item.label ?? 'Clip'}
            </react_native_1.Text>
            <react_native_1.Text style={styles.rowMeta}>{timeAgo(item.recorded_at)}</react_native_1.Text>
          </react_native_1.View>
        </react_native_1.View>

        <react_native_1.View style={styles.actions}>
          <react_native_1.TouchableOpacity style={[styles.actionBtn, !canPlay && styles.actionBtnDisabled]} onPress={() => {
                if (!canPlay)
                    return;
                router.push({
                    pathname: '/session/clip-player',
                    params: {
                        mux_playback_id: item.mux_playback_id ?? undefined,
                        move_name: item.label ?? undefined,
                    },
                });
            }} disabled={!canPlay}>
            <react_native_1.Text style={styles.actionText}>▶</react_native_1.Text>
          </react_native_1.TouchableOpacity>
          <react_native_1.TouchableOpacity style={styles.actionBtn} onPress={async () => {
                if (sectionContext) {
                    const ok = await assignClip(item.id, sectionContext.sessionId, sectionContext.sectionName);
                    if (ok) {
                        react_native_toast_message_1.default.show({
                            type: 'success',
                            text1: `Added to ${sectionContext.sectionName}`,
                        });
                        router.replace({
                            pathname: `/session/${sectionContext.sessionId}`,
                            params: { sectionName: sectionContext.sectionName },
                        });
                    }
                    return;
                }
                handleAssign(item);
            }}>
            <react_native_1.Text style={styles.actionText}>{sectionContext ? '＋' : '→'}</react_native_1.Text>
          </react_native_1.TouchableOpacity>
          <react_native_1.TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={async () => {
                const ok = await deleteClip(item.id);
                if (!ok)
                    react_native_toast_message_1.default.show({ type: 'error', text1: 'Failed to delete' });
            }}>
            <react_native_1.Text style={styles.actionText}>🗑</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>
      </react_native_1.View>);
    };
    return (<react_native_1.View style={styles.container}>
      <react_native_1.View style={styles.header}>
        <react_native_1.View style={styles.handle}/>
        <react_native_1.View style={styles.headerRow}>
          <react_native_1.Text style={styles.headerTitle}>
            {sectionContext ? `Pick for ${sectionContext.sectionName}` : 'Inbox'}
          </react_native_1.Text>
          <react_native_1.View style={styles.badge}>
            <react_native_1.Text style={styles.badgeText}>{headerCount}</react_native_1.Text>
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.View>

      {staleClips.length > 0 ? (<react_native_1.View style={styles.nudge}>
          <react_native_1.Text style={styles.nudgeText}>
            Some clips are older than 48 hours. Assign them to a session to keep things tidy.
          </react_native_1.Text>
        </react_native_1.View>) : null}

      {sectionContext ? (<react_native_1.View style={styles.nudge}>
          <react_native_1.Text style={styles.nudgeText}>
            Picking for <react_native_1.Text style={{ color: theme_1.theme.textPrimary, fontWeight: '800' }}>{sectionContext.sectionName}</react_native_1.Text>
          </react_native_1.Text>
        </react_native_1.View>) : null}

      {loading ? (<react_native_1.View style={styles.center}>
          <react_native_1.ActivityIndicator color={theme_1.theme.textPrimary}/>
        </react_native_1.View>) : clips.length === 0 ? (<react_native_1.View style={styles.empty}>
          <react_native_1.Text style={styles.emptyIcon}>📥</react_native_1.Text>
          <react_native_1.Text style={styles.emptyTitle}>Nothing here</react_native_1.Text>
          <react_native_1.Text style={styles.emptySub}>Clips you save “Later” will appear in your Inbox.</react_native_1.Text>
        </react_native_1.View>) : (<react_native_1.FlatList data={clips} keyExtractor={(c) => c.id} renderItem={renderItem} contentContainerStyle={styles.listContent} onRefresh={refresh} refreshing={loading}/>)}

      <AssignPickerSheet_1.AssignPickerSheet bottomSheetRef={assignSheetRef} title="Assign clip" onPick={onPickSession} onCreateNewSession={() => createSheetRef.current?.snapToIndex(0)}/>
      <CreateSessionSheet_1.CreateSessionSheet bottomSheetRef={createSheetRef} onCreated={(s) => {
            react_native_toast_message_1.default.show({ type: 'success', text1: 'Session created' });
            if (!selectedClip)
                return;
            assignClip(selectedClip.id, s.id).catch(() => { });
        }}/>
    </react_native_1.View>);
}
exports.default = InboxScreen;
const styles = react_native_1.StyleSheet.create({
    container: { flex: 1, backgroundColor: theme_1.theme.background },
    header: { paddingTop: 12, paddingHorizontal: 16, paddingBottom: 8 },
    handle: {
        alignSelf: 'center',
        width: 48,
        height: 5,
        borderRadius: 3,
        backgroundColor: theme_1.theme.textSecondary,
        marginBottom: 10,
        opacity: 0.6,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerTitle: { fontSize: 22, fontWeight: '800', color: theme_1.theme.textPrimary },
    badge: {
        backgroundColor: '#222',
        borderWidth: 1,
        borderColor: theme_1.theme.textSecondary,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    badgeText: { color: theme_1.theme.textPrimary, fontWeight: '700' },
    nudge: {
        marginHorizontal: 16,
        marginBottom: 10,
        padding: 12,
        borderRadius: theme_1.theme.borderRadius,
        borderWidth: 1,
        borderColor: '#2A2A32',
        backgroundColor: '#1B1B22',
    },
    nudgeText: { color: theme_1.theme.textSecondary, fontSize: 14 },
    listContent: { padding: 16, paddingTop: 8, gap: 10 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        padding: 12,
        borderRadius: theme_1.theme.borderRadius,
        borderWidth: 1,
        borderColor: '#2A2A32',
        backgroundColor: '#1B1B22',
    },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    typeIcon: { fontSize: 18 },
    rowTitle: { color: theme_1.theme.textPrimary, fontSize: 15, fontWeight: '700' },
    rowMeta: { color: theme_1.theme.textSecondary, fontSize: 12, marginTop: 2 },
    actions: { flexDirection: 'row', gap: 8 },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme_1.theme.textSecondary,
        backgroundColor: '#222',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionBtnDisabled: { opacity: 0.4 },
    deleteBtn: { borderColor: '#e57373' },
    actionText: { color: theme_1.theme.textPrimary, fontSize: 14 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    emptyIcon: { fontSize: 42, marginBottom: 12 },
    emptyTitle: { color: theme_1.theme.textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 8 },
    emptySub: { color: theme_1.theme.textSecondary, fontSize: 14, textAlign: 'center' },
});
//# sourceMappingURL=inbox.js.map