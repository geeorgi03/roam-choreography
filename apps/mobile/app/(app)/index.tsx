import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  FlatList,
  Alert,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { theme } from '../../lib/theme';
import type { ThemePalette } from '../../lib/contexts/ThemeContext';
import { useAppChromeTheme } from '../../lib/hooks/useAppChromeTheme';
import {
  ChoreographyHubFab,
  ChoreographyHubHeader,
  ChoreographyHubBanner,
} from '../../components/choreography/hub/ChoreographyHubChrome';
import { ChoreographyHubListRow } from '../../components/choreography/hub/ChoreographyHubListRow';
import { DisplayTitle, MonoCaps } from '../../components/choreography/ChoreographyPrimitives';
import type { Session } from '@roam/types';
import { useSession } from '../../lib/hooks/useSession';
import { FirstSessionSheet } from '../../components/FirstSessionSheet';
import { CreateSessionSheet } from '../../components/CreateSessionSheet';
import { NewSessionEntrySheet } from '../../components/NewSessionEntrySheet';
import { PaywallSheet } from '../../components/PaywallSheet';
import BottomSheet from '@gorhom/bottom-sheet';
import NetInfo from '@react-native-community/netinfo';

import { apiRequest, ApiRequestError } from '../../lib/api';
import { cacheSession, cacheSessionList, getCachedSessionList } from '../../lib/sessionCache';
import { useTranslation } from '../../lib/i18n';
import { getRuntimeDiagnosticsSnapshot, runConnectivityDiagnostics } from '../../lib/runtimeDiagnostics';
import {
  clearLastOpenedSessionId,
  dismissHomePlusCoach,
  getLastOpenedSessionId,
  isHomePlusCoachDismissed,
  setLastOpenedSessionId,
} from '../../lib/homeHubState';
import { HubOfflineStrip } from '../../components/HubOfflineStrip';
import { ListRow } from '../../components/ListRow';
import { HomeSessionSkeleton } from '../../components/HomeSessionSkeleton';

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
  const { colors, isChoreography } = useAppChromeTheme();
  const styles = useMemo(() => createHomeStyles(colors, isChoreography), [colors, isChoreography]);
  const { session } = useSession();
  const createSheetRef = useRef<BottomSheet | null>(null);
  const firstSessionSheetRef = useRef<BottomSheet | null>(null);
  const newEntrySheetRef = useRef<BottomSheet | null>(null);
  const paywallSheetRef = useRef<BottomSheet | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [inboxCount, setInboxCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(true);
  const [sessionsFromCacheFallback, setSessionsFromCacheFallback] = useState(false);
  const [coachDismissed, setCoachDismissed] = useState(() => isHomePlusCoachDismissed());
  // TODO(boot): start false so BottomSheet doesn't mount on first render before Reanimated is ready
  const [sheetsReady, setSheetsReady] = useState(false);
  
  // Animation values for micro-interactions
  const addButtonScale = React.useRef(new Animated.Value(1)).current;
  const headerOpacity = React.useRef(new Animated.Value(0)).current;
  const contentTranslateY = React.useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const t = setTimeout(() => setSheetsReady(true), 300);
    return () => clearTimeout(t);
  }, []);

  // Animate content on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    const sub = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected !== false);
    });
    void NetInfo.fetch().then((s) => setIsConnected(s.isConnected !== false));
    return () => sub();
  }, []);

  const dismissCoach = useCallback(() => {
    dismissHomePlusCoach();
    setCoachDismissed(true);
  }, []);

  useEffect(() => {
    if (sessions.length > 0 && !isHomePlusCoachDismissed()) {
      dismissHomePlusCoach();
      setCoachDismissed(true);
    }
  }, [sessions.length]);

  const fetchSessions = async () => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }
    setLoadError(null);
    setSessionsFromCacheFallback(false);
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      const cachedSessions = getCachedSessionList().map(mapCachedToSession);
      setSessions(cachedSessions);
      if (cachedSessions.length === 0) {
        setLoadError(t('home.offlineNoCache'));
      }
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const sessionTimeoutMs = 35_000;
    const timeoutId = setTimeout(() => controller.abort(), sessionTimeoutMs);
    try {
      let res = await apiRequest(`/sessions/`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        signal: controller.signal,
        retries: 2,
        timeoutMs: sessionTimeoutMs,
      });
      if (res.status === 404) {
        res = await apiRequest(`/sessions`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
          signal: controller.signal,
          retries: 1,
          timeoutMs: sessionTimeoutMs,
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
        setSessionsFromCacheFallback(false);
        setSessions(sessionsData);
        cacheSessionList(
          sessionsData.map((s) => ({
            id: s.id,
            name: s.name,
            created_at: s.created_at,
          }))
        );
        sessionsData.forEach((s) => {
          cacheSession(s.id, {
            session: { name: s.name, phrase: null, quality_target: null },
            sections: [],
            clips: [],
            cachedAt: Date.now(),
          });
        });
        const lastOpened = getLastOpenedSessionId();
        if (lastOpened && !sessionsData.some((s) => s.id === lastOpened)) {
          clearLastOpenedSessionId();
        }
      }
    } catch (error) {
      const connectivity = await runConnectivityDiagnostics();
      const diag = getRuntimeDiagnosticsSnapshot();
      const cachedSessions = getCachedSessionList().map(mapCachedToSession);
      setSessions(cachedSessions.length > 0 ? cachedSessions : []);
      if (cachedSessions.length > 0) {
        setSessionsFromCacheFallback(true);
      }
      const reason = error instanceof ApiRequestError ? error.reason : 'unknown';
      if (cachedSessions.length === 0) {
        let detail = diag.apiBase;
        try {
          detail = new URL(diag.apiBase).host;
        } catch {
          // keep raw
        }
        if (connectivity.issue === 'supabase_unreachable' && connectivity.supabaseHost) {
          setLoadError(t('home.backendSupabaseDown').replace('{host}', connectivity.supabaseHost));
        } else if (connectivity.issue === 'api_wrong_service') {
          setLoadError(t('home.backendApiWrong').replace('{host}', connectivity.apiHost));
        } else if (connectivity.issue === 'api_unreachable') {
          setLoadError(t('home.backendApiDown').replace('{host}', connectivity.apiHost));
        } else if (reason === 'timeout') {
          setLoadError(`${t('home.unableToLoadSessions')} (${t('home.timeoutLabel')}) — ${detail}`);
        } else if (reason === 'network' || reason === 'offline') {
          setLoadError(`${t('home.unableToLoadSessions')} (${t('home.offlineLabel')}) — ${detail}`);
        } else {
          setLoadError(
            `${t('home.unableToLoadSessions')} (${connectivity.apiHealthy ? 'auth' : 'api'}) — ${detail}`
          );
        }
      }
      console.warn('[Home] session load fallback', {
        connectivity,
        apiBase: diag.apiBase,
        supabaseHost: diag.supabaseHost,
      });
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
      const res = await apiRequest(`/inbox/count`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        signal: controller.signal,
        retries: 1,
        timeoutMs: 6_000,
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

  const mapCreatedSession = (
    created: Pick<Session, 'id' | 'name' | 'created_at' | 'user_id'>
  ): Session => ({
    ...created,
    phrase: null,
    quality_target: null,
  });

  const handleCreated = (newSession: Pick<Session, 'id' | 'name' | 'created_at' | 'user_id'>) => {
    const mapped = mapCreatedSession(newSession);
    setSessions((prev) => [mapped, ...prev]);
    setLastOpenedSessionId(mapped.id);
    createSheetRef.current?.close();
    firstSessionSheetRef.current?.close();
    router.push(`/session/${mapped.id}`);
  };

  const defaultNewSessionName = () =>
    new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

  const createBlankSessionOnServer = async (): Promise<Session | null> => {
    if (!session?.access_token) {
      Alert.alert('', t('home.quickCreateNotSignedIn'));
      return null;
    }
    const name = defaultNewSessionName();
    let res = await apiRequest('/sessions/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ name }),
      retries: 0,
    });
    if (res.status === 404) {
      res = await apiRequest('/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ name }),
        retries: 0,
      });
    }
    const text = await res.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    if (res.status === 403 && (data as { error?: string })?.error === 'plan_limit_reached') {
      paywallSheetRef.current?.snapToIndex(0);
      return null;
    }
    if (!res.ok) {
      const msg =
        (data as { error?: string })?.error ??
        (text ? `HTTP ${res.status}: ${text.slice(0, 200)}` : `HTTP ${res.status}`);
      throw new Error(msg || 'Request failed');
    }
    const raw = data as {
      id?: string;
      name?: string;
      created_at?: string;
      user_id?: string;
    };
    if (!raw?.id) {
      throw new Error('Server returned no session id');
    }
    return mapCreatedSession({
      id: raw.id,
      name: (raw.name as string) ?? name,
      created_at: (raw.created_at as string) ?? new Date().toISOString(),
      user_id: (raw.user_id as string) ?? '',
    });
  };

  const handleAddButtonPress = () => {
    Animated.sequence([
      Animated.timing(addButtonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(addButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    newEntrySheetRef.current?.snapToIndex(0);
  };

  const openNewProjectMenu = () => handleAddButtonPress();

  const handleBlankSessionOpenCamera = async () => {
    try {
      const mapped = await createBlankSessionOnServer();
      if (!mapped) return;
      setSessions((prev) => [mapped, ...prev]);
      setLastOpenedSessionId(mapped.id);
      router.push(`/session/camera?id=${mapped.id}`);
    } catch (e) {
      Alert.alert(
        t('home.quickCreateFailedTitle'),
        e instanceof Error ? e.message : t('home.quickCreateFailedBody')
      );
    }
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

  const orderedSessions = useMemo(() => {
    if (sessions.length === 0) return [] as Session[];
    const last = getLastOpenedSessionId();
    const primary = last ? sessions.find((s) => s.id === last) ?? sessions[0] : sessions[0];
    const others = sessions.filter((s) => s.id !== primary.id);
    return [primary, ...others];
  }, [sessions]);

  const sessionMetaLine = (item: Session) =>
    (item.clip_count ?? 0) === 0 && (item.section_count ?? 0) === 0
      ? t('home.cardNoClips')
      : t('home.cardCounts')
          .replace('{sections}', String(item.section_count ?? 0))
          .replace('{clips}', String(item.clip_count ?? 0));

  const inboxHeader =
    inboxCount > 0 ? (
      isChoreography ? (
        <ChoreographyHubBanner onPress={() => router.push('/inbox')}>
          <View style={styles.inboxDot} />
          <MonoCaps style={styles.inboxBannerText}>
            {t('home.unorganisedClipsBanner').replace('{count}', String(inboxCount))}
          </MonoCaps>
          <Text style={styles.inboxBannerChev}>›</Text>
        </ChoreographyHubBanner>
      ) : (
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
      )
    ) : null;

  const showOfflineBanner = !isConnected;
  const showCacheBanner = isConnected && sessionsFromCacheFallback && sessions.length > 0;
  const showHubCoach = !coachDismissed && sessions.length === 0 && !loading;

  const listHeader =
    inboxCount > 0 ? (
      <View>
        {inboxHeader}
      </View>
    ) : null;

  return (
    <View style={styles.container}>
      {showOfflineBanner ? (
        <HubOfflineStrip kind="offline" message={t('home.bannerOffline')} />
      ) : showCacheBanner ? (
        <HubOfflineStrip kind="cached" message={t('home.bannerCache')} />
      ) : null}
      {isChoreography ? (
        <ChoreographyHubHeader
          title={t('home.hubTitle')}
          subtitle={t('home.hubSubtitle')}
          right={
            <Animated.View style={{ transform: [{ scale: addButtonScale }] }}>
              <ChoreographyHubFab onPress={openNewProjectMenu} />
            </Animated.View>
          }
        />
      ) : (
        <Animated.View style={[styles.topBar, { opacity: headerOpacity }]}>
          <View style={styles.titleBlock}>
            <Text style={styles.topBarTitle}>{t('home.hubTitle')}</Text>
            <Text style={styles.topBarSubtitle}>{t('home.hubSubtitle')}</Text>
          </View>
          <Animated.View style={{ transform: [{ scale: addButtonScale }] }}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={openNewProjectMenu}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel={t('home.newProjectA11y')}
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}

      {showHubCoach ? (
        <View style={styles.coachWrap}>
          <Text style={styles.coachText}>{t('home.coachPlusBody')}</Text>
          <TouchableOpacity onPress={dismissCoach} hitSlop={12} accessibilityRole="button">
            <Text style={styles.coachDismiss}>{t('home.coachDismiss')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading && sessions.length === 0 ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator size="small" color={colors.capture} />
          <Text style={styles.loadingText}>{t('home.loading')}</Text>
          <HomeSessionSkeleton rows={4} />
        </View>
      ) : sessions.length === 0 ? (
        <Animated.ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {inboxHeader}
          <View style={styles.hubBlock}>
            {isChoreography ? (
              <DisplayTitle style={styles.hubEmptyTitle}>{t('home.hubEmptyTitle')}</DisplayTitle>
            ) : (
              <Text style={styles.hubEmptyTitle}>{t('home.hubEmptyTitle')}</Text>
            )}
            <Text style={styles.hubEmptySubtitle}>{t('home.hubEmptySubtitle')}</Text>
            <TouchableOpacity
              style={styles.emptyPrimaryBtn}
              onPress={openNewProjectMenu}
              activeOpacity={0.88}
            >
              <Text style={styles.emptyPrimaryBtnText}>{t('home.startSession')}</Text>
            </TouchableOpacity>
            <Text style={styles.emptyTapPlus}>{t('home.emptyTapPlus')}</Text>
            {loadError ? (
              <View style={styles.errorWrap}>
                <Text style={styles.errorText}>{loadError}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={fetchSessions}>
                  <Text style={styles.retryBtnText}>{t('home.retry')}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </Animated.ScrollView>
      ) : (
        <Animated.FlatList
          data={orderedSessions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={listHeader ?? undefined}
          renderItem={({ item }) =>
            isChoreography ? (
              <ChoreographyHubListRow
                title={item.name}
                subtitle={sessionMetaLine(item)}
                rightMeta={formatDate(item.created_at)}
                onPress={() => router.push(`/session/${item.id}`)}
              />
            ) : (
              <ListRow
                title={item.name}
                subtitle={sessionMetaLine(item)}
                rightMeta={formatDate(item.created_at)}
                onPress={() => router.push(`/session/${item.id}`)}
              />
            )
          }
        style={{ transform: [{ translateY: contentTranslateY }] }}
        />
      )}
      {sheetsReady && (
        <>
          <NewSessionEntrySheet
            bottomSheetRef={newEntrySheetRef}
            onBlankSession={() => createSheetRef.current?.snapToIndex(0)}
            onSessionWithReference={() => firstSessionSheetRef.current?.snapToIndex(0)}
            onRecordOnly={() => router.push('/session/camera')}
            onBlankSessionOpenCamera={handleBlankSessionOpenCamera}
          />
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

function createHomeStyles(colors: ThemePalette, choreography = false) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.ground,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing['6'],
      paddingTop: theme.spacing['4'],
      paddingBottom: theme.spacing['5'],
      backgroundColor: choreography ? colors.ground : theme.light.surfaceElevated,
      borderBottomWidth: 1,
      borderBottomColor: choreography ? colors.border : theme.light.borderLight,
      ...(choreography ? {} : theme.shadows.sm),
    },
    titleBlock: {
      flex: 1,
      paddingRight: 12,
    },
    topBarTitle: {
      fontSize: theme.typography.sizes['3xl'],
      fontWeight: theme.typography.weights.extrabold,
      fontFamily: theme.typography.displayFamily,
      color: colors.active,
      letterSpacing: theme.typography.letterSpacing.tight,
      lineHeight: theme.typography.lineHeights.tight,
    },
    topBarSubtitle: {
      marginTop: theme.spacing['0.5'],
      fontSize: theme.typography.sizes.sm,
      color: colors.muted,
      fontWeight: theme.typography.weights.medium,
      lineHeight: theme.typography.lineHeights.snug,
    },
    coachWrap: {
      marginHorizontal: 20,
      marginBottom: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: spacing.radiusMd,
      borderWidth: 1,
      borderColor: colors.capture,
      backgroundColor: colors.chrome,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    coachText: {
      flex: 1,
      fontSize: 12,
      fontWeight: '600',
      color: colors.active,
      lineHeight: 17,
    },
    coachDismiss: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.capture,
    },
    addButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.blueMd,
    },
    addButtonText: {
      color: '#FFFFFF',
      fontSize: theme.typography.sizes['4xl'],
      fontWeight: theme.typography.weights.light,
      marginTop: -2,
      lineHeight: theme.typography.lineHeights.tight,
    },
    scroll: { flex: 1 },
    scrollContent: {
      paddingBottom: 32,
      paddingTop: 4,
    },
    loadingBlock: {
      paddingTop: 8,
      paddingBottom: 32,
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: 10,
    },
    loadingText: {
      fontSize: 14,
      color: colors.muted,
    },
    hubBlock: {
      paddingHorizontal: 20,
      paddingTop: 8,
    },
    hubEmptyTitle: {
      fontSize: theme.typography.sizes['2xl'],
      fontWeight: theme.typography.weights.bold,
      color: colors.active,
      marginBottom: theme.spacing['2'],
      lineHeight: theme.typography.lineHeights.tight,
    },
    hubEmptySubtitle: {
      fontSize: theme.typography.sizes.lg,
      lineHeight: theme.typography.lineHeights.relaxed,
      color: colors.muted,
      marginBottom: theme.spacing['4'],
    },
    emptyPrimaryBtn: {
      alignSelf: 'stretch',
      backgroundColor: colors.capture,
      borderRadius: theme.spacing.radiusMd,
      paddingVertical: 14,
      paddingHorizontal: 20,
      alignItems: 'center',
      marginBottom: theme.spacing['3'],
    },
    emptyPrimaryBtnText: {
      color: '#ffffff',
      fontSize: theme.typography.sizes.base,
      fontWeight: theme.typography.weights.bold,
      fontFamily: theme.typography.monoFamily,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    emptyTapPlus: {
      fontSize: theme.typography.sizes.base,
      lineHeight: theme.typography.lineHeights.normal,
      color: colors.muted,
      fontWeight: theme.typography.weights.semibold,
    },
    listContent: {
      paddingHorizontal: choreography ? 0 : 20,
      paddingTop: 4,
      paddingBottom: 32,
    },
    errorWrap: {
      marginTop: 20,
      alignItems: 'center',
      gap: 10,
    },
    errorText: {
      color: colors.muted,
      fontSize: 13,
      textAlign: 'center',
    },
    retryBtn: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: spacing.radiusMd,
      paddingVertical: 10,
      paddingHorizontal: 14,
      backgroundColor: colors.chrome,
    },
    retryBtnText: {
      color: colors.active,
      fontSize: 13,
      fontWeight: '700',
    },
    inboxBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: theme.spacing['6'],
      marginTop: theme.spacing['3'],
      marginBottom: theme.spacing['4'],
      paddingVertical: theme.spacing['4'],
      paddingHorizontal: theme.spacing['5'],
      borderRadius: theme.spacing.radiusXl,
      backgroundColor: colors.primaryBg,
      borderWidth: 1,
      borderColor: colors.primary,
      ...theme.shadows.blueSm,
    },
    inboxDot: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.primary,
      marginRight: theme.spacing['4'],
    },
    inboxBannerText: { 
      color: colors.active, 
      fontSize: theme.typography.sizes.lg, 
      fontWeight: theme.typography.weights.semibold, 
      fontFamily: theme.typography.displayFamily,
      flex: 1,
      lineHeight: theme.typography.lineHeights.snug,
      letterSpacing: theme.typography.letterSpacing.tight,
    },
    inboxBannerChev: { 
      color: colors.muted, 
      fontSize: theme.typography.sizes['2xl'], 
      marginLeft: theme.spacing['1.5'],
      fontWeight: theme.typography.weights.light,
    },
  });
}

