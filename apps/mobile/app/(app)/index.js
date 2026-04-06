"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const theme_1 = require("../../lib/theme");
const useSession_1 = require("../../lib/hooks/useSession");
const CreateSessionSheet_1 = require("../../components/CreateSessionSheet");
const PaywallSheet_1 = require("../../components/PaywallSheet");
const react_native_mmkv_1 = require("react-native-mmkv");
const netinfo_1 = __importDefault(require("@react-native-community/netinfo"));
const api_1 = require("../../lib/api");
const sessionCache_1 = require("../../lib/sessionCache");
const homeStorage = new react_native_mmkv_1.MMKV({ id: 'home-state' });
const LAST_SESSION_KEY = 'last_session_id';
const colors = theme_1.theme.light;
const spacing = theme_1.theme.spacing;
function HomeScreen() {
    const { session } = (0, useSession_1.useSession)();
    const createSheetRef = (0, react_1.useRef)(null);
    const paywallSheetRef = (0, react_1.useRef)(null);
    const redirected = (0, react_1.useRef)(false);
    const [sessions, setSessions] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [inboxCount, setInboxCount] = (0, react_1.useState)(0);
    const cachedSessionId = (0, react_1.useRef)(null);
    // TODO(boot): start false so BottomSheet doesn't mount on first render before Reanimated is ready
    const [sheetsReady, setSheetsReady] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        const t = setTimeout(() => setSheetsReady(true), 300);
        return () => clearTimeout(t);
    }, []);
    (0, react_1.useEffect)(() => {
        const cachedId = homeStorage.getString(LAST_SESSION_KEY);
        if (cachedId && !redirected.current) {
            cachedSessionId.current = cachedId;
            redirected.current = true;
            expo_router_1.router.replace(`/session/${cachedId}`);
        }
    }, []);
    const fetchSessions = async () => {
        if (!session?.access_token) {
            setLoading(false);
            return;
        }
        const netState = await netinfo_1.default.fetch();
        if (!netState.isConnected) {
            const cached = (0, sessionCache_1.getCachedSessionList)();
            setSessions(cached);
            setLoading(false);
            return;
        }
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        try {
            let res = await fetch(`${api_1.API_BASE}/sessions/`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
                signal: controller.signal,
            });
            if (res.status === 404) {
                res = await fetch(`${api_1.API_BASE}/sessions`, {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                    signal: controller.signal,
                });
            }
            clearTimeout(timeoutId);
            const text = await res.text();
            let data = null;
            try {
                data = text ? JSON.parse(text) : null;
            }
            catch {
                data = null;
            }
            if (res.ok && data && typeof data === 'object' && 'sessions' in data) {
                const sessionsData = data.sessions ?? [];
                setSessions(sessionsData);
                sessionsData.forEach((s) => {
                    (0, sessionCache_1.cacheSession)(s.id, {
                        session: { name: s.name, phrase: null, quality_target: null },
                        sections: [],
                        clips: [],
                        cachedAt: Date.now(),
                    });
                });
                if (sessionsData.length > 0) {
                    const latestSessionId = sessionsData[0].id;
                    homeStorage.set(LAST_SESSION_KEY, latestSessionId);
                    // Reconcile stale cache: if cached ID differs from API result, redirect again
                    if (cachedSessionId.current && cachedSessionId.current !== latestSessionId) {
                        expo_router_1.router.replace(`/session/${latestSessionId}`);
                    }
                    else if (!redirected.current) {
                        redirected.current = true;
                        expo_router_1.router.replace(`/session/${latestSessionId}`);
                    }
                }
                else {
                    homeStorage.delete(LAST_SESSION_KEY);
                }
            }
        }
        catch {
            // API unreachable, timeout, or network error
            const cached = (0, sessionCache_1.getCachedSessionList)();
            setSessions((cached.length ? cached : []));
        }
        finally {
            clearTimeout(timeoutId);
            setLoading(false);
        }
    };
    (0, react_1.useEffect)(() => {
        fetchSessions();
    }, [session?.access_token]);
    const fetchInboxCount = async () => {
        if (!session?.access_token)
            return;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);
            const res = await fetch(`${api_1.API_BASE}/inbox/count`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!res.ok)
                return;
            const data = (await res.json());
            setInboxCount(typeof data.count === 'number' ? data.count : 0);
        }
        catch {
            // ignore
        }
    };
    (0, react_1.useEffect)(() => {
        fetchInboxCount();
    }, [session?.access_token, sessions.length]);
    const handleCreated = (newSession) => {
        setSessions((prev) => [newSession, ...prev]);
        createSheetRef.current?.close();
        expo_router_1.router.push(`/session/${newSession.id}`);
    };
    const formatDate = (iso) => {
        const d = new Date(iso);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
        if (diffDays === 0)
            return 'Today';
        if (diffDays === 1)
            return 'Yesterday';
        if (diffDays < 7)
            return `${diffDays} days ago`;
        return d.toLocaleDateString();
    };
    return (<react_native_1.View style={styles.container}>
      {sessions.length === 0 ? (<react_native_1.ScrollView contentContainerStyle={styles.emptyScroll} style={styles.container} showsVerticalScrollIndicator={false}>
          <react_native_1.View style={styles.empty}>
            {loading ? (<>
                <react_native_1.ActivityIndicator size="small" color={colors.active} style={{ marginBottom: 12 }}/>
                <react_native_1.Text style={styles.subtitle}>Loading…</react_native_1.Text>
              </>) : (<>
                <react_native_1.Text style={styles.title}>What do you want to do?</react_native_1.Text>
                <react_native_1.View style={styles.twoDoorRow}>
                  <react_native_1.TouchableOpacity style={styles.doorCard} onPress={() => expo_router_1.router.push('/library')} activeOpacity={0.85}>
                    <react_native_1.Text style={styles.doorIcon}>📚</react_native_1.Text>
                    <react_native_1.Text style={styles.doorTitle}>Browse library</react_native_1.Text>
                    <react_native_1.Text style={styles.doorSub}>Explore your collection</react_native_1.Text>
                  </react_native_1.TouchableOpacity>
                  <react_native_1.TouchableOpacity style={styles.doorCard} onPress={() => createSheetRef.current?.snapToIndex(0)} activeOpacity={0.85}>
                    <react_native_1.Text style={styles.doorIcon}>🎵</react_native_1.Text>
                    <react_native_1.Text style={styles.doorTitle}>Start a session</react_native_1.Text>
                    <react_native_1.Text style={styles.doorSub}>I have a song to work with</react_native_1.Text>
                  </react_native_1.TouchableOpacity>
                </react_native_1.View>
                {inboxCount > 0 ? (<react_native_1.TouchableOpacity style={styles.inboxPill} onPress={() => expo_router_1.router.push('/inbox')} activeOpacity={0.85}>
                    <react_native_1.Text style={styles.inboxPillText}>
                      {inboxCount} unorganised clips →
                    </react_native_1.Text>
                  </react_native_1.TouchableOpacity>) : null}
              </>)}
          </react_native_1.View>
        </react_native_1.ScrollView>) : (<react_native_1.View style={{ flex: 1 }}>
          {inboxCount > 0 ? (<react_native_1.TouchableOpacity style={styles.inboxBanner} onPress={() => expo_router_1.router.push('/inbox')} activeOpacity={0.85}>
              <react_native_1.View style={styles.inboxDot}/>
              <react_native_1.Text style={styles.inboxBannerText}>{inboxCount} unorganised clips</react_native_1.Text>
              <react_native_1.Text style={styles.inboxBannerChev}>›</react_native_1.Text>
            </react_native_1.TouchableOpacity>) : null}
          <react_native_1.FlatList data={sessions} keyExtractor={(item) => item.id} contentContainerStyle={styles.listContent} renderItem={({ item }) => (<react_native_1.TouchableOpacity style={styles.card} onPress={() => expo_router_1.router.push(`/session/${item.id}`)} activeOpacity={0.8}>
                <react_native_1.Text style={styles.cardTitle}>{item.name}</react_native_1.Text>
                <react_native_1.Text style={styles.cardDate}>{formatDate(item.created_at)}</react_native_1.Text>
              </react_native_1.TouchableOpacity>)} ListFooterComponent={<react_native_1.TouchableOpacity style={styles.newSessionCard} onPress={() => createSheetRef.current?.snapToIndex(0)} activeOpacity={0.85}>
                <react_native_1.Text style={styles.newSessionText}>+ New session</react_native_1.Text>
              </react_native_1.TouchableOpacity>}/>

          <react_native_1.TouchableOpacity style={styles.fab} onPress={() => expo_router_1.router.push('/session/camera')} activeOpacity={0.9}>
            <react_native_1.Text style={styles.fabText}>⬤</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>)}
      {sheetsReady && (<>
          <CreateSessionSheet_1.CreateSessionSheet bottomSheetRef={createSheetRef} onCreated={handleCreated} onPaywallRequired={() => paywallSheetRef.current?.snapToIndex(0)}/>
          <PaywallSheet_1.PaywallSheet bottomSheetRef={paywallSheetRef}/>
        </>)}
    </react_native_1.View>);
}
exports.default = HomeScreen;
const t = theme_1.theme.light;
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: t.ground,
    },
    emptyScroll: {
        flexGrow: 1,
        minHeight: 400,
        justifyContent: 'center',
    },
    empty: {
        flex: 1,
        minHeight: 280,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 32,
    },
    listContent: {
        padding: 16,
        paddingBottom: 24,
    },
    icon: {
        fontSize: 48,
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.active,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: colors.muted,
        textAlign: 'center',
        marginBottom: 24,
    },
    twoDoorRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
        marginTop: 12,
    },
    doorCard: {
        flex: 1,
        backgroundColor: colors.chrome,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: spacing.radiusMd,
        padding: 16,
    },
    doorIcon: { fontSize: 20, marginBottom: 10 },
    doorTitle: { color: colors.active, fontSize: 16, fontWeight: '800', marginBottom: 4 },
    doorSub: { color: colors.muted, fontSize: 13, lineHeight: 18 },
    inboxPill: {
        marginTop: 14,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 999,
        backgroundColor: colors.chrome,
        borderWidth: 1,
        borderColor: colors.border,
    },
    inboxPillText: { color: colors.active, fontWeight: '700' },
    inboxBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 10,
        marginBottom: 4,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: spacing.radiusMd,
        backgroundColor: colors.chrome,
        borderWidth: 1,
        borderColor: colors.border,
    },
    inboxDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#4ECDC4',
        marginRight: 10,
    },
    inboxBannerText: { color: colors.active, fontSize: 14, fontWeight: '700', flex: 1 },
    inboxBannerChev: { color: colors.muted, fontSize: 22, marginLeft: 6 },
    card: {
        backgroundColor: colors.chrome,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: spacing.radiusMd,
        padding: 16,
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.active,
        marginBottom: 4,
    },
    cardDate: {
        fontSize: 12,
        color: colors.muted,
    },
    newSessionCard: {
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: colors.border,
        borderRadius: spacing.radiusMd,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
        backgroundColor: 'transparent',
    },
    newSessionText: { color: colors.active, fontSize: 15, fontWeight: '800' },
    fab: {
        position: 'absolute',
        right: 18,
        bottom: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: t.capture,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6,
    },
    fabText: { color: colors.chrome, fontSize: 18, fontWeight: '900' },
});
//# sourceMappingURL=index.js.map