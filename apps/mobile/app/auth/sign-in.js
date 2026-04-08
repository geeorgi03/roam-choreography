"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const useSupabaseSafe_1 = require("../../lib/hooks/useSupabaseSafe");
const theme_1 = require("../../lib/theme");
const devBypassAuth_1 = require("../../lib/devBypassAuth");
const i18n_1 = require("../../lib/i18n");
function SignInScreen() {
    const { t } = (0, i18n_1.useTranslation)();
    const { supabase, error: configError, loading: configLoading } = (0, useSupabaseSafe_1.useSupabaseSafe)();
    const [email, setEmail] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    async function handleSignIn() {
        if (!supabase)
            return;
        setError(null);
        setLoading(true);
        const { error: e } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (e) {
            setError(e.message);
            return;
        }
        // Root layout will redirect to app stack
    }
    if (configLoading) {
        return (<react_native_1.View style={styles.container}>
        <react_native_1.View style={styles.content}>
          <react_native_1.ActivityIndicator size="large" color={theme_1.theme.light.active}/>
        </react_native_1.View>
      </react_native_1.View>);
    }
    if (configError || !supabase) {
        const isConfig = configError?.message?.includes('EXPO_PUBLIC_');
        return (<react_native_1.View style={styles.container}>
        <react_native_1.View style={styles.content}>
          <react_native_1.Text style={styles.brandTitle}>{t('signIn.brandTitle')}</react_native_1.Text>
          <react_native_1.Text style={[styles.error, { marginBottom: 24 }]}>
            {isConfig
                ? t('signIn.configError')
                : configError?.message ?? t('signIn.genericError')}
          </react_native_1.Text>
          <react_native_1.TouchableOpacity style={styles.link} onPress={() => expo_router_1.router.push('/auth/sign-up')}>
            <react_native_1.Text style={styles.linkText}>{t('signIn.createAccount')}</react_native_1.Text>
          </react_native_1.TouchableOpacity>
          {__DEV__ && (<react_native_1.TouchableOpacity style={[styles.link, { marginTop: 16 }]} onPress={() => {
                    (0, devBypassAuth_1.setDevBypassAuth)(true);
                    expo_router_1.router.replace('/(app)');
                }}>
              <react_native_1.Text style={[styles.linkText, { color: theme_1.theme.light.mine }]}>{t('signIn.openAppDev')}</react_native_1.Text>
            </react_native_1.TouchableOpacity>)}
        </react_native_1.View>
      </react_native_1.View>);
    }
    return (<react_native_1.KeyboardAvoidingView style={styles.container} behavior={react_native_1.Platform.OS === 'ios' ? 'padding' : 'height'}>
      <react_native_1.View style={styles.content}>
        <react_native_1.Text style={styles.brandTitle}>{t('signIn.brandTitle')}</react_native_1.Text>
        <react_native_1.Text style={styles.tagline}>{t('signIn.tagline')}</react_native_1.Text>
        <react_native_1.View style={styles.form}>
          <react_native_1.Text style={styles.label}>{t('signIn.email')}</react_native_1.Text>
          <react_native_1.TextInput style={styles.input} placeholder={t('signIn.emailPlaceholder')} placeholderTextColor={theme_1.theme.light.muted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false}/>
          <react_native_1.Text style={styles.label}>{t('signIn.password')}</react_native_1.Text>
          <react_native_1.TextInput style={styles.input} placeholder={t('signIn.passwordPlaceholder')} placeholderTextColor={theme_1.theme.light.muted} value={password} onChangeText={setPassword} secureTextEntry/>
          {error ? <react_native_1.Text style={styles.error}>{error}</react_native_1.Text> : null}
          <react_native_1.TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSignIn} disabled={loading || !supabase}>
            <react_native_1.Text style={styles.buttonText}>{loading ? t('signIn.signingIn') : t('signIn.signIn')}</react_native_1.Text>
          </react_native_1.TouchableOpacity>
          <react_native_1.TouchableOpacity style={styles.link} onPress={() => expo_router_1.router.push('/auth/sign-up')}>
            <react_native_1.Text style={styles.linkText}>{t('signIn.noAccount')}</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>
        {__DEV__ && (<react_native_1.TouchableOpacity style={[styles.link, { marginTop: 8 }]} onPress={() => {
                (0, devBypassAuth_1.setDevBypassAuth)(true);
                expo_router_1.router.replace('/(app)');
            }}>
            <react_native_1.Text style={[styles.linkText, { color: theme_1.theme.light.mine }]}>{t('signIn.openAppDev')}</react_native_1.Text>
          </react_native_1.TouchableOpacity>)}
      </react_native_1.View>
    </react_native_1.KeyboardAvoidingView>);
}
exports.default = SignInScreen;
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme_1.theme.light.ground,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    brandTitle: {
        fontSize: 36,
        fontWeight: '700',
        color: theme_1.theme.light.active,
        marginBottom: 8,
    },
    tagline: {
        fontSize: 14,
        color: theme_1.theme.light.muted,
        marginBottom: 32,
    },
    form: {
        backgroundColor: theme_1.theme.light.chrome,
        borderRadius: theme_1.theme.borderRadius,
        padding: 24,
        borderWidth: 1,
        borderColor: theme_1.theme.light.border,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme_1.theme.light.active,
        marginBottom: 8,
    },
    input: {
        backgroundColor: theme_1.theme.light.ground,
        borderRadius: theme_1.theme.borderRadius,
        borderWidth: 1,
        borderColor: theme_1.theme.light.border,
        padding: 16,
        fontSize: 16,
        color: theme_1.theme.light.active,
        marginBottom: 20,
    },
    error: {
        color: theme_1.theme.light.amber,
        fontSize: 14,
        marginBottom: 16,
    },
    button: {
        backgroundColor: theme_1.theme.light.mine,
        borderRadius: theme_1.theme.borderRadius,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: theme_1.theme.light.ground,
        fontSize: 16,
        fontWeight: '600',
    },
    link: {
        marginTop: 24,
        alignItems: 'center',
    },
    linkText: {
        color: theme_1.theme.light.muted,
        fontSize: 14,
    },
});
//# sourceMappingURL=sign-in.js.map