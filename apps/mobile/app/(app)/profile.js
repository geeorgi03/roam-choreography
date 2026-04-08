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
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const react_native_1 = require("react-native");
const WebBrowser = __importStar(require("expo-web-browser"));
const expo_router_1 = require("expo-router");
const theme_1 = require("../../lib/theme");
const useSession_1 = require("../../lib/hooks/useSession");
const api_1 = require("../../lib/api");
const i18n_1 = require("../../lib/i18n");
const SUCCESS_URL = 'https://roamdance.com/billing/success';
const PORTAL_RETURN_URL = 'https://roamdance.com/profile';
function ProfileScreen() {
    const { t } = (0, i18n_1.useTranslation)();
    const { session } = (0, useSession_1.useSession)();
    const [plan, setPlan] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [checkoutLoading, setCheckoutLoading] = (0, react_1.useState)(false);
    const [portalLoading, setPortalLoading] = (0, react_1.useState)(false);
    const supabaseRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        import('../../lib/supabase')
            .then(({ supabase }) => { supabaseRef.current = supabase; })
            .catch(() => { });
    }, []);
    (0, react_1.useEffect)(() => {
        if (!session?.access_token) {
            setLoading(false);
            return;
        }
        (async () => {
            try {
                const res = await fetch(`${api_1.API_BASE}/billing/me`, {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                });
                const data = (await res.json());
                if (res.ok)
                    setPlan(data.plan ?? 'free');
            }
            finally {
                setLoading(false);
            }
        })();
    }, [session?.access_token]);
    (0, react_1.useEffect)(() => {
        const userId = session?.user?.id;
        if (!userId || !supabaseRef.current)
            return;
        const sb = supabaseRef.current;
        const channel = sb.channel(`profile-plan-${userId}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${userId}` }, (payload) => {
            const planVal = payload.new?.plan;
            if (typeof planVal === 'string' && planVal.length > 0) {
                setPlan(planVal);
            }
        }).subscribe();
        return () => {
            sb.removeChannel(channel);
        };
    }, [session?.access_token, session?.user?.id]);
    const handleUpgrade = async () => {
        if (!session?.access_token)
            return;
        setCheckoutLoading(true);
        try {
            const res = await fetch(`${api_1.API_BASE}/billing/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ plan: 'creator' }),
            });
            const data = (await res.json());
            if (!res.ok)
                throw new Error(data.error ?? 'Checkout failed');
            const url = data.checkout_url;
            if (url)
                await WebBrowser.openAuthSessionAsync(url, SUCCESS_URL);
        }
        finally {
            setCheckoutLoading(false);
        }
    };
    const handleManageSubscription = async () => {
        if (!session?.access_token)
            return;
        setPortalLoading(true);
        try {
            const res = await fetch(`${api_1.API_BASE}/billing/portal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({}),
            });
            const data = (await res.json());
            if (!res.ok)
                throw new Error(data.error ?? 'Portal failed');
            const url = data.portal_url;
            if (url)
                await WebBrowser.openAuthSessionAsync(url, PORTAL_RETURN_URL);
        }
        finally {
            setPortalLoading(false);
        }
    };
    const [showDev, setShowDev] = (0, react_1.useState)(false);
    const [apiUrlInput, setApiUrlInput] = (0, react_1.useState)((0, api_1.getApiBaseOverride)() ?? '');
    const [devTapCount, setDevTapCount] = (0, react_1.useState)(0);
    const handleDevTap = () => {
        const next = devTapCount + 1;
        setDevTapCount(next);
        if (next >= 5) {
            setShowDev(true);
            setDevTapCount(0);
        }
    };
    const handleSaveApiUrl = () => {
        const trimmed = apiUrlInput.trim();
        if (trimmed && !trimmed.startsWith('http')) {
            react_native_1.Alert.alert(t('profile.invalidUrl'), t('profile.invalidUrlMsg'));
            return;
        }
        (0, api_1.setApiBaseOverride)(trimmed || null);
        react_native_1.Alert.alert(trimmed ? t('profile.apiUrlUpdated') : t('profile.apiUrlReset'), trimmed
            ? t('profile.apiCallsNowUse').replace('{url}', trimmed)
            : t('profile.apiUrlResetBody').replace('{url}', api_1.API_BASE));
    };
    if (loading) {
        return (<react_native_1.View style={styles.container}>
        <react_native_1.ActivityIndicator color={theme_1.theme.light.active} size="large"/>
      </react_native_1.View>);
    }
    const planLabel = plan === 'free'
        ? t('profile.planFree')
        : plan === 'creator'
            ? t('profile.planCreator')
            : plan === 'pro'
                ? t('profile.planPro')
                : plan === 'studio'
                    ? t('profile.planStudio')
                    : t('profile.planFree');
    return (<react_native_1.ScrollView style={styles.scrollContainer} contentContainerStyle={styles.container}>
      <react_native_1.View style={styles.section}>
        <react_native_1.Text style={styles.label}>{t('profile.currentPlan')}</react_native_1.Text>
        <react_native_1.TouchableOpacity onPress={handleDevTap} activeOpacity={1}>
          <react_native_1.View style={[styles.planBadge, plan !== 'free' && styles.planBadgePaid]}>
            <react_native_1.Text style={styles.planText}>{planLabel}</react_native_1.Text>
          </react_native_1.View>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>

      {plan === 'free' && (<react_native_1.TouchableOpacity style={[styles.button, checkoutLoading && styles.buttonDisabled]} onPress={handleUpgrade} disabled={checkoutLoading}>
          {checkoutLoading ? (<react_native_1.ActivityIndicator color={theme_1.theme.light.active} size="small"/>) : (<react_native_1.Text style={styles.buttonText}>{t('profile.upgrade')}</react_native_1.Text>)}
        </react_native_1.TouchableOpacity>)}

      {plan && plan !== 'free' && (<react_native_1.TouchableOpacity style={[styles.button, portalLoading && styles.buttonDisabled]} onPress={handleManageSubscription} disabled={portalLoading}>
          {portalLoading ? (<react_native_1.ActivityIndicator color={theme_1.theme.light.active} size="small"/>) : (<react_native_1.Text style={styles.buttonText}>{t('profile.manageSubscription')}</react_native_1.Text>)}
        </react_native_1.TouchableOpacity>)}

      {showDev && (<react_native_1.View style={styles.devSection}>
          <react_native_1.Text style={styles.devTitle}>{t('profile.devSettings')}</react_native_1.Text>
          <react_native_1.Text style={styles.devLabel}>{t('profile.devApiBaseUrl')}</react_native_1.Text>
          <react_native_1.Text style={styles.devHint}>
            {t('profile.devCurrent')}
            {api_1.API_BASE}
          </react_native_1.Text>
          <react_native_1.TextInput style={styles.devInput} value={apiUrlInput} onChangeText={setApiUrlInput} placeholder={t('profile.devApiBaseUrlPlaceholder')} placeholderTextColor={theme_1.theme.light.muted} autoCapitalize="none" autoCorrect={false} keyboardType="url"/>
          <react_native_1.View style={styles.devButtonRow}>
            <react_native_1.TouchableOpacity style={styles.devButton} onPress={handleSaveApiUrl}>
              <react_native_1.Text style={styles.devButtonText}>{t('profile.devSave')}</react_native_1.Text>
            </react_native_1.TouchableOpacity>
            <react_native_1.TouchableOpacity style={[styles.devButton, styles.devButtonSecondary]} onPress={() => {
                setApiUrlInput('');
                (0, api_1.setApiBaseOverride)(null);
                react_native_1.Alert.alert(t('profile.devReset'), t('profile.devResetMsg'));
            }}>
              <react_native_1.Text style={styles.devButtonText}>{t('profile.devReset')}</react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>
        </react_native_1.View>)}
      <react_native_1.TouchableOpacity style={styles.signOutButton} onPress={async () => {
            try {
                if (!supabaseRef.current) {
                    const { supabase } = await import('../../lib/supabase');
                    supabaseRef.current = supabase;
                }
                if (!supabaseRef.current)
                    throw new Error('Supabase client is not available.');
                const { error } = await supabaseRef.current.auth.signOut();
                if (error)
                    throw error;
                expo_router_1.router.replace('/auth/sign-in');
            }
            catch (e) {
                react_native_1.Alert.alert(t('profile.signOutFailed'), t('profile.signOutFailedMsg'));
            }
        }}>
        <react_native_1.Text style={styles.signOutButtonText}>{t('profile.signOut')}</react_native_1.Text>
      </react_native_1.TouchableOpacity>
    </react_native_1.ScrollView>);
}
exports.default = ProfileScreen;
const styles = react_native_1.StyleSheet.create({
    scrollContainer: {
        flex: 1,
        backgroundColor: theme_1.theme.light.ground,
    },
    container: {
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
        flexGrow: 1,
    },
    section: {
        marginBottom: 24,
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        color: theme_1.theme.light.muted,
        marginBottom: 8,
    },
    planBadge: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: theme_1.theme.spacing.radiusMd,
        borderWidth: 1,
        borderColor: theme_1.theme.light.muted,
    },
    planBadgePaid: {
        borderColor: theme_1.theme.light.mine,
        backgroundColor: theme_1.theme.light.mineBg,
    },
    planText: {
        fontSize: 18,
        fontWeight: '700',
        color: theme_1.theme.light.active,
    },
    button: {
        backgroundColor: theme_1.theme.light.mine,
        borderWidth: 1,
        borderColor: theme_1.theme.light.muted,
        borderRadius: theme_1.theme.spacing.radiusMd,
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
        color: theme_1.theme.light.active,
    },
    devSection: {
        marginTop: 40,
        width: '100%',
        borderTopWidth: 1,
        borderTopColor: theme_1.theme.light.border,
        paddingTop: 20,
    },
    devTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: theme_1.theme.light.muted,
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    devLabel: {
        fontSize: 14,
        color: theme_1.theme.light.active,
        marginBottom: 4,
    },
    devHint: {
        fontSize: 12,
        color: theme_1.theme.light.muted,
        marginBottom: 8,
    },
    devInput: {
        backgroundColor: theme_1.theme.light.ground,
        color: theme_1.theme.light.active,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        borderWidth: 1,
        borderColor: theme_1.theme.light.border,
        marginBottom: 12,
    },
    devButtonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    devButton: {
        flex: 1,
        backgroundColor: theme_1.theme.light.border,
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
    },
    devButtonSecondary: {
        backgroundColor: theme_1.theme.light.ground,
        borderWidth: 1,
        borderColor: theme_1.theme.light.border,
    },
    devButtonText: {
        color: theme_1.theme.light.active,
        fontSize: 14,
        fontWeight: '600',
    },
    signOutButton: {
        marginTop: 40,
        borderWidth: 1,
        borderColor: theme_1.theme.light.mine,
        backgroundColor: theme_1.theme.light.ground,
        borderRadius: theme_1.theme.spacing.radiusMd,
        paddingVertical: 14,
        paddingHorizontal: 24,
        minWidth: 200,
        alignItems: 'center',
    },
    signOutButtonText: {
        color: theme_1.theme.light.active,
        fontSize: 16,
        fontWeight: '600',
    },
});
//# sourceMappingURL=profile.js.map