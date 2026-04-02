"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const expo_auth_session_1 = require("expo-auth-session");
const useSupabaseSafe_1 = require("../../lib/hooks/useSupabaseSafe");
const theme_1 = require("../../lib/theme");
const devBypassAuth_1 = require("../../lib/devBypassAuth");
function SignUpScreen() {
    const { supabase, error: configError, loading: configLoading } = (0, useSupabaseSafe_1.useSupabaseSafe)();
    const [email, setEmail] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [message, setMessage] = (0, react_1.useState)(null);
    async function handleSignUp() {
        if (!supabase)
            return;
        setError(null);
        setMessage(null);
        setLoading(true);
        const redirectTo = (0, expo_auth_session_1.makeRedirectUri)({ path: 'auth/callback' });
        const { error: e } = await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: redirectTo },
        });
        setLoading(false);
        if (e) {
            setError(e.message);
            return;
        }
        setMessage('Check your email to confirm your account.');
    }
    if (configLoading) {
        return (<react_native_1.View style={styles.container}>
        <react_native_1.View style={styles.content}>
          <react_native_1.ActivityIndicator size="large" color={theme_1.theme.textPrimary}/>
        </react_native_1.View>
      </react_native_1.View>);
    }
    if (configError || !supabase) {
        const isConfig = configError?.message?.includes('EXPO_PUBLIC_');
        return (<react_native_1.View style={styles.container}>
        <react_native_1.View style={styles.content}>
          <react_native_1.Text style={styles.brandTitle}>Roam</react_native_1.Text>
          <react_native_1.Text style={[styles.error, { marginBottom: 24 }]}>
            {isConfig
                ? 'Sign-up is not configured for this build. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in EAS environment variables, then create a new build.'
                : configError?.message ?? 'Something went wrong.'}
          </react_native_1.Text>
          <react_native_1.TouchableOpacity style={styles.link} onPress={() => expo_router_1.router.replace('/auth/sign-in')}>
            <react_native_1.Text style={styles.linkText}>Back to sign in</react_native_1.Text>
          </react_native_1.TouchableOpacity>
          {__DEV__ && (<react_native_1.TouchableOpacity style={[styles.link, { marginTop: 16 }]} onPress={() => {
                    (0, devBypassAuth_1.setDevBypassAuth)(true);
                    expo_router_1.router.replace('/(app)');
                }}>
              <react_native_1.Text style={[styles.linkText, { color: theme_1.theme.brandGreen }]}>Open app (dev only)</react_native_1.Text>
            </react_native_1.TouchableOpacity>)}
        </react_native_1.View>
      </react_native_1.View>);
    }
    return (<react_native_1.KeyboardAvoidingView style={styles.container} behavior={react_native_1.Platform.OS === 'ios' ? 'padding' : 'height'}>
      <react_native_1.View style={styles.content}>
        <react_native_1.Text style={styles.brandTitle}>Roam</react_native_1.Text>
        <react_native_1.Text style={styles.tagline}>Capture-first choreography tool</react_native_1.Text>
        <react_native_1.View style={styles.form}>
          <react_native_1.Text style={styles.label}>Email</react_native_1.Text>
          <react_native_1.TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor={theme_1.theme.textSecondary} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false}/>
          <react_native_1.Text style={styles.label}>Password</react_native_1.Text>
          <react_native_1.TextInput style={styles.input} placeholder="••••••••" placeholderTextColor={theme_1.theme.textSecondary} value={password} onChangeText={setPassword} secureTextEntry/>
          {error ? <react_native_1.Text style={styles.error}>{error}</react_native_1.Text> : null}
          {message ? <react_native_1.Text style={styles.message}>{message}</react_native_1.Text> : null}
          <react_native_1.TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSignUp} disabled={loading || !supabase}>
            <react_native_1.Text style={styles.buttonText}>{loading ? 'Creating…' : 'Create account'}</react_native_1.Text>
          </react_native_1.TouchableOpacity>
          <react_native_1.TouchableOpacity style={styles.link} onPress={() => expo_router_1.router.replace('/auth/sign-in')}>
            <react_native_1.Text style={styles.linkText}>Already have an account? Sign in</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>
        {__DEV__ && (<react_native_1.TouchableOpacity style={[styles.link, { marginTop: 8 }]} onPress={() => {
                (0, devBypassAuth_1.setDevBypassAuth)(true);
                expo_router_1.router.replace('/(app)');
            }}>
            <react_native_1.Text style={[styles.linkText, { color: theme_1.theme.brandGreen }]}>Open app (dev only)</react_native_1.Text>
          </react_native_1.TouchableOpacity>)}
      </react_native_1.View>
    </react_native_1.KeyboardAvoidingView>);
}
exports.default = SignUpScreen;
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme_1.theme.background,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    brandTitle: {
        fontSize: 36,
        fontWeight: '700',
        color: theme_1.theme.brandGreen,
        marginBottom: 8,
    },
    tagline: {
        fontSize: 14,
        color: theme_1.theme.textSecondary,
        marginBottom: 32,
    },
    form: {
        backgroundColor: '#1a1a1a',
        borderRadius: theme_1.theme.borderRadius,
        padding: 24,
        borderWidth: 1,
        borderColor: '#222',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme_1.theme.textPrimary,
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#222',
        borderRadius: theme_1.theme.borderRadius,
        padding: 16,
        fontSize: 16,
        color: theme_1.theme.textPrimary,
        marginBottom: 20,
    },
    error: {
        color: '#e74c3c',
        fontSize: 14,
        marginBottom: 16,
    },
    message: {
        color: theme_1.theme.textSecondary,
        fontSize: 14,
        marginBottom: 16,
    },
    button: {
        backgroundColor: theme_1.theme.brandGreen,
        borderRadius: theme_1.theme.borderRadius,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#111',
        fontSize: 16,
        fontWeight: '600',
    },
    link: {
        marginTop: 24,
        alignItems: 'center',
    },
    linkText: {
        color: theme_1.theme.textSecondary,
        fontSize: 14,
    },
});
//# sourceMappingURL=sign-up.js.map