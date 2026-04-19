import { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  ScrollView,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { theme } from '../../lib/theme';
import { useSession } from '../../lib/hooks/useSession';
import type { Plan } from '@roam/types';
type SupabaseClient = Awaited<typeof import('../../lib/supabase')>['supabase'];

import { API_BASE, getApiBaseOverride, setApiBaseOverride } from '../../lib/api';
import { useTranslation } from '../../lib/i18n';
import type { LocalePreference } from '../../lib/i18n';
import { useTheme, type ThemePalette } from '../../lib/contexts/ThemeContext';
const SUCCESS_URL = 'https://roamdance.com/billing/success';
const PORTAL_RETURN_URL = 'https://roamdance.com/profile';

const LOCALE_MENU: { value: LocalePreference; labelKey: string }[] = [
  { value: 'system', labelKey: 'profile.langOptionSystem' },
  { value: 'en', labelKey: 'profile.langOptionEn' },
  { value: 'ja', labelKey: 'profile.langOptionJa' },
  { value: 'ko', labelKey: 'profile.langOptionKo' },
  { value: 'zh', labelKey: 'profile.langOptionZh' },
  { value: 'km', labelKey: 'profile.langOptionKm' },
];

export default function ProfileScreen() {
  const { t, preference, setLocalePreference } = useTranslation();
  const { colors, mode, toggleMode } = useTheme();
  const styles = useMemo(() => createProfileStyles(colors), [colors]);
  const { session } = useSession();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const supabaseRef = useRef<SupabaseClient | null>(null);

  useEffect(() => {
    import('../../lib/supabase')
      .then(({ supabase }) => { supabaseRef.current = supabase; })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/billing/me`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = (await res.json()) as { plan?: Plan; error?: string };
        if (res.ok) setPlan((data.plan as Plan) ?? 'free');
      } finally {
        setLoading(false);
      }
    })();
  }, [session?.access_token]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId || !supabaseRef.current) return;
    const sb = supabaseRef.current;
    const channel = sb.channel(`profile-plan-${userId}`).on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
      (payload) => {
        const planVal = (payload.new as { plan?: string | null })?.plan;
        if (typeof planVal === 'string' && planVal.length > 0) {
          setPlan(planVal as Plan);
        }
      }
    ).subscribe();
    return () => {
      sb.removeChannel(channel);
    };
  }, [session?.access_token, session?.user?.id]);

  const handleUpgrade = async () => {
    if (!session?.access_token) return;
    setCheckoutLoading(true);
    try {
      const res = await fetch(`${API_BASE}/billing/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan: 'creator' }),
      });
      const data = (await res.json()) as { checkout_url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Checkout failed');
      const url = data.checkout_url;
      if (url) await WebBrowser.openAuthSessionAsync(url, SUCCESS_URL);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!session?.access_token) return;
    setPortalLoading(true);
    try {
      const res = await fetch(`${API_BASE}/billing/portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as { portal_url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Portal failed');
      const url = data.portal_url;
      if (url) await WebBrowser.openAuthSessionAsync(url, PORTAL_RETURN_URL);
    } finally {
      setPortalLoading(false);
    }
  };

  const [showDev, setShowDev] = useState(false);
  const [apiUrlInput, setApiUrlInput] = useState(getApiBaseOverride() ?? '');
  const [devTapCount, setDevTapCount] = useState(0);

  const handleDevTap = () => {
    const next = devTapCount + 1;
    setDevTapCount(next);
    if (next >= 5) {
      setShowDev(true);
      setDevTapCount(0);
    }
  };

  const languageHint =
    preference === 'system'
      ? t('profile.languageHintSystem')
      : t('profile.languageHintFixed').replace(
          '{name}',
          t(LOCALE_MENU.find((x) => x.value === preference)?.labelKey ?? 'profile.langOptionEn')
        );

  const openLanguagePicker = () => {
    const labels = LOCALE_MENU.map((item) => t(item.labelKey));
    const cancel = t('profile.langPickerCancel');

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...labels, cancel],
          cancelButtonIndex: labels.length,
          title: t('profile.chooseLanguage'),
        },
        (idx) => {
          if (idx == null || idx === labels.length) return;
          setLocalePreference(LOCALE_MENU[idx].value);
        }
      );
      return;
    }

    Alert.alert(
      t('profile.chooseLanguage'),
      undefined,
      [
        ...LOCALE_MENU.map((item) => ({
          text: t(item.labelKey),
          onPress: () => setLocalePreference(item.value),
        })),
        { text: cancel, style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handleSaveApiUrl = () => {
    const trimmed = apiUrlInput.trim();
    if (trimmed && !trimmed.startsWith('http')) {
      Alert.alert(t('profile.invalidUrl'), t('profile.invalidUrlMsg'));
      return;
    }
    setApiBaseOverride(trimmed || null);
    Alert.alert(
      trimmed ? t('profile.apiUrlUpdated') : t('profile.apiUrlReset'),
      trimmed
        ? t('profile.apiCallsNowUse').replace('{url}', trimmed)
        : t('profile.apiUrlResetBody').replace('{url}', API_BASE),
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.active} size="large" />
      </View>
    );
  }

  const planLabel =
    plan === 'free'
      ? t('profile.planFree')
      : plan === 'creator'
        ? t('profile.planCreator')
        : plan === 'pro'
          ? t('profile.planPro')
          : plan === 'studio'
            ? t('profile.planStudio')
            : t('profile.planFree');

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.container}>
      <View style={styles.appearanceRow}>
        <View>
          <Text style={styles.appearanceLabel}>{t('profile.appearance')}</Text>
          <Text style={styles.appearanceHint}>
            {mode === 'night' ? t('profile.nightMode') : t('profile.dayMode')}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.appearanceBtn, mode === 'night' && styles.appearanceBtnActive]}
          onPress={toggleMode}
          activeOpacity={0.85}
        >
          <Text style={styles.appearanceBtnText}>
            {mode === 'night' ? '☀ ' + t('profile.dayMode') : '🌙 ' + t('profile.nightMode')}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.appearanceRow}
        onPress={openLanguagePicker}
        activeOpacity={0.88}
      >
        <View>
          <Text style={styles.appearanceLabel}>{t('profile.language')}</Text>
          <Text style={styles.appearanceHint}>{languageHint}</Text>
        </View>
        <Text style={styles.languageChevron}>›</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.label}>{t('profile.currentPlan')}</Text>
        <TouchableOpacity onPress={handleDevTap} activeOpacity={1}>
          <View style={[styles.planBadge, plan !== 'free' && styles.planBadgePaid]}>
            <Text style={styles.planText}>{planLabel}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {plan === 'free' && (
        <TouchableOpacity
          style={[styles.button, checkoutLoading && styles.buttonDisabled]}
          onPress={handleUpgrade}
          disabled={checkoutLoading}
        >
          {checkoutLoading ? (
            <ActivityIndicator color={colors.active} size="small" />
          ) : (
            <Text style={styles.buttonText}>{t('profile.upgrade')}</Text>
          )}
        </TouchableOpacity>
      )}

      {plan && plan !== 'free' && (
        <TouchableOpacity
          style={[styles.button, portalLoading && styles.buttonDisabled]}
          onPress={handleManageSubscription}
          disabled={portalLoading}
        >
          {portalLoading ? (
            <ActivityIndicator color={colors.active} size="small" />
          ) : (
            <Text style={styles.buttonText}>{t('profile.manageSubscription')}</Text>
          )}
        </TouchableOpacity>
      )}

      {showDev && (
        <View style={styles.devSection}>
          <Text style={styles.devTitle}>{t('profile.devSettings')}</Text>
          <Text style={styles.devLabel}>{t('profile.devApiBaseUrl')}</Text>
          <Text style={styles.devHint}>
            {t('profile.devCurrent')}
            {API_BASE}
          </Text>
          <TextInput
            style={styles.devInput}
            value={apiUrlInput}
            onChangeText={setApiUrlInput}
            placeholder={t('profile.devApiBaseUrlPlaceholder')}
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <View style={styles.devButtonRow}>
            <TouchableOpacity style={styles.devButton} onPress={handleSaveApiUrl}>
              <Text style={styles.devButtonText}>{t('profile.devSave')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.devButton, styles.devButtonSecondary]}
              onPress={() => {
                setApiUrlInput('');
                setApiBaseOverride(null);
                Alert.alert(t('profile.devReset'), t('profile.devResetMsg'));
              }}
            >
              <Text style={styles.devButtonText}>{t('profile.devReset')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <TouchableOpacity
        style={styles.signOutButton}
        onPress={async () => {
          try {
            if (!supabaseRef.current) {
              const { supabase } = await import('../../lib/supabase');
              supabaseRef.current = supabase;
            }

            if (!supabaseRef.current) throw new Error('Supabase client is not available.');

            const { error } = await supabaseRef.current.auth.signOut();
            if (error) throw error;

            router.replace('/auth/sign-in');
          } catch (e) {
            Alert.alert(t('profile.signOutFailed'), t('profile.signOutFailedMsg'));
          }
        }}
      >
        <Text style={styles.signOutButtonText}>{t('profile.signOut')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function createProfileStyles(colors: ThemePalette) {
  return StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: colors.ground,
  },
  container: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1,
  },
  appearanceRow: {
    width: '100%',
    maxWidth: 360,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: theme.spacing.radiusMd,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.chrome,
  },
  appearanceLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.active,
  },
  appearanceHint: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  appearanceBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.spacing.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.ground,
  },
  appearanceBtnActive: {
    borderColor: colors.mine,
    backgroundColor: colors.mineBg,
  },
  appearanceBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.active,
  },
  languageChevron: {
    fontSize: 22,
    color: colors.muted,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 8,
  },
  planBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: theme.spacing.radiusMd,
    borderWidth: 1,
    borderColor: colors.muted,
  },
  planBadgePaid: {
    borderColor: colors.mine,
    backgroundColor: colors.mineBg,
  },
  planText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.active,
  },
  button: {
    backgroundColor: colors.mine,
    borderWidth: 1,
    borderColor: colors.muted,
    borderRadius: theme.spacing.radiusMd,
    paddingVertical: 14,
    paddingHorizontal: 24,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.active,
  },
  devSection: {
    marginTop: 40,
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 20,
  },
  devTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.muted,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  devLabel: {
    fontSize: 14,
    color: colors.active,
    marginBottom: 4,
  },
  devHint: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 8,
  },
  devInput: {
    backgroundColor: colors.ground,
    color: colors.active,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  devButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  devButton: {
    flex: 1,
    backgroundColor: colors.border,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  devButtonSecondary: {
    backgroundColor: colors.ground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  devButtonText: {
    color: colors.active,
    fontSize: 14,
    fontWeight: '600',
  },
  signOutButton: {
    marginTop: 40,
    borderWidth: 1,
    borderColor: colors.mine,
    backgroundColor: colors.ground,
    borderRadius: theme.spacing.radiusMd,
    paddingVertical: 14,
    paddingHorizontal: 24,
    minWidth: 200,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: colors.active,
    fontSize: 16,
    fontWeight: '600',
  },
});
}
