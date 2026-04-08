import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { theme } from '../../lib/theme';
import type { Session } from '@roam/types';
import { useSession } from '../../lib/hooks/useSession';
import { FirstSessionSheet } from '../../components/FirstSessionSheet';
import { CreateSessionSheet } from '../../components/CreateSessionSheet';
import { PaywallSheet } from '../../components/PaywallSheet';
import BottomSheet from '@gorhom/bottom-sheet';
import { MMKV } from 'react-native-mmkv';
import NetInfo from '@react-native-community/netinfo';

import { API_BASE } from '../../lib/api';
import { cacheSession, getCachedSessionList } from '../../lib/sessionCache';
import { useTranslation } from '../../lib/i18n';

const homeStorage = new MMKV({ id: 'home-state' });
const LAST_SESSION_KEY = 'last_session_id';

const colors = theme.light;
const spacing = theme.spacing;

function mapCachedToSession(
  cached: ReturnType<typeof getCachedSessionList>[number]
): Session {
  return {
    id: cached.id,
    name: cached.name,
    created_at: new Date(cached.created_at).toISOString(),
    user_id: '',
    phrase: null,
    quality_target: null,
  };
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const { session } = useSession();
  const createSheetRef = useRef<BottomSheet | null>(null);
  const firstSessionSheetRef = useRef<BottomSheet | null>(null);
  const paywallSheetRef = useRef<BottomSheet | null>(null);
  const redirected = useRef<boolean>(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [inboxCount, setInboxCount] = useState<number>(0);
  const cachedSessionId = useRef<string | null>(null);
  // TODO(boot): start false so BottomSheet doesn't mount on first render before Reanimated is ready
  const [sheetsReady, setSheetsReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSheetsReady(true), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const cachedId = homeStorage.getString(LAST_SESSION_KEY);
    if (cachedId && !redirected.current) {
      cachedSessionId.current = cachedId;
      redirected.current = true;
      router.replace(`/session/${cachedId}`);
    }
  }, []);

  const fetchSessions = async () => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      setSessions(getCachedSessionList().map(mapCachedToSession));
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);
    try {
      let res = await fetch(`${API_BASE}/sessions/`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        signal: controller.signal,
      });
      if (res.status === 404) {
        res = await fetch(`${API_BASE}/sessions`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
          signal: controller.signal,
        });
      }
      clearTimeout(timeoutId);
      const text = await res.text();
      let data: unknown = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }
      if (res.ok && data && typeof data === 'object' && 'sessions' in data) {
        const sessionsData = (data as { sessions: Session[] }).sessions ?? [];
        setSessions(sessionsData);
        sessionsData.forEach((s) => {
          cacheSession(s.id, {
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
            router.replace(`/session/${latestSessionId}`);
          } else if (!redirected.current) {
            redirected.current = true;
            router.replace(`/session/${latestSessionId}`);
          }
        } else {
          homeStorage.delete(LAST_SESSION_KEY);
        }
      }
    } catch {
      // API unreachable, timeout, or network error
      const cachedSessions = getCachedSessionList().map(mapCachedToSession);
      setSessions(cachedSessions.length > 0 ? cachedSessions : []);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [session?.access_token]);

  const fetchInboxCount = async () => {
    if (!session?.access_token) return;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${API_BASE}/inbox/count`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) return;
      const data = (await res.json()) as { count?: number };
      setInboxCount(typeof data.count === 'number' ? data.count : 0);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchInboxCount();
  }, [session?.access_token, sessions.length]);

  const handleCreated = (newSession: Session) => {
    setSessions((prev) => [newSession, ...prev]);
    createSheetRef.current?.close();
    router.push(`/session/${newSession.id}`);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays === 0) return t('home.today');
    if (diffDays === 1) return t('home.yesterday');
    if (diffDays < 7) return t('home.daysAgo').replace('{count}', String(diffDays));
    return d.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      {sessions.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyScroll}
          style={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.empty}>
            {loading ? (
              <>
                <ActivityIndicator size="small" color={colors.active} style={{ marginBottom: 12 }} />
                <Text style={styles.subtitle}>{t('home.loading')}</Text>
              </>
            ) : (
              <>
                <Text style={styles.title}>{t('home.whatToDo')}</Text>
                <View style={styles.twoDoorRow}>
                  <TouchableOpacity
                    style={styles.doorCard}
                    onPress={() => router.push('/library')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.doorIcon}>📚</Text>
                    <Text style={styles.doorTitle}>{t('home.browseLibrary')}</Text>
                    <Text style={styles.doorSub}>{t('home.exploreCollection')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.doorCard}
                    onPress={() => firstSessionSheetRef.current?.snapToIndex(0)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.doorIcon}>🎵</Text>
                    <Text style={styles.doorTitle}>{t('home.startSession')}</Text>
                    <Text style={styles.doorSub}>{t('home.startSessionSub')}</Text>
                  </TouchableOpacity>
                </View>
                {inboxCount > 0 ? (
                  <TouchableOpacity
                    style={styles.inboxPill}
                    onPress={() => router.push('/inbox')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.inboxPillText}>
                      {t('home.unorganisedClips').replace('{count}', String(inboxCount))}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </>
            )}
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {inboxCount > 0 ? (
            <TouchableOpacity
              style={styles.inboxBanner}
              onPress={() => router.push('/inbox')}
              activeOpacity={0.85}
            >
              <View style={styles.inboxDot} />
              <Text style={styles.inboxBannerText}>
                {t('home.unorganisedClipsBanner').replace('{count}', String(inboxCount))}
              </Text>
              <Text style={styles.inboxBannerChev}>›</Text>
            </TouchableOpacity>
          ) : null}
          <FlatList
            data={sessions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/session/${item.id}`)}
                activeOpacity={0.8}
              >
                <Text style={styles.cardTitle}>{item.name}</Text>
                <View style={styles.cardMeta}>
                  <Text style={styles.cardMetaText}>
                    {(item.clip_count ?? 0) === 0 && (item.section_count ?? 0) === 0
                      ? t('home.cardNoClips')
                      : t('home.cardCounts')
                          .replace('{sections}', String(item.section_count ?? 0))
                          .replace('{clips}', String(item.clip_count ?? 0))}
                  </Text>
                  <Text style={[styles.cardMetaText, { flex: 1, textAlign: 'right' }]}>
                    {formatDate(item.created_at)}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            ListFooterComponent={
              <TouchableOpacity
                style={styles.newSessionCard}
                onPress={() => createSheetRef.current?.snapToIndex(0)}
                activeOpacity={0.85}
              >
                <Text style={styles.newSessionText}>{t('home.newSession')}</Text>
              </TouchableOpacity>
            }
          />

          <TouchableOpacity
            style={styles.fab}
            onPress={() => router.push('/session/camera')}
            activeOpacity={0.9}
          >
            <Text style={styles.fabText}>⬤</Text>
          </TouchableOpacity>
        </View>
      )}
      {sheetsReady && (
        <>
          <FirstSessionSheet
            bottomSheetRef={firstSessionSheetRef}
            onCreated={handleCreated}
            onPaywallRequired={() => paywallSheetRef.current?.snapToIndex(0)}
          />
          <CreateSessionSheet
            bottomSheetRef={createSheetRef}
            onCreated={handleCreated}
            onPaywallRequired={() => paywallSheetRef.current?.snapToIndex(0)}
          />
          <PaywallSheet bottomSheetRef={paywallSheetRef} />
        </>
      )}
    </View>
  );
}

const themeColors = theme.light;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.ground,
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
    backgroundColor: colors.mine,
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
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  cardMetaText: {
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
    backgroundColor: themeColors.capture,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  fabText: { color: colors.chrome, fontSize: 18, fontWeight: '900' },
});
