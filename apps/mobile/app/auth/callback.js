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
/**
 * Auth callback screen — handles deep link from email confirmation.
 * When user clicks the confirmation link, Supabase redirects to roam://auth/callback#access_token=...
 * The root layout's Linking listener processes the URL; this screen is a fallback that shows
 * "Email confirmed" and redirects if the user lands here.
 */
const react_1 = require("react");
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const Linking = __importStar(require("expo-linking"));
const useSupabaseSafe_1 = require("../../lib/hooks/useSupabaseSafe");
const authRedirect_1 = require("../../lib/authRedirect");
const theme_1 = require("../../lib/theme");
function AuthCallbackScreen() {
    const { supabase } = (0, useSupabaseSafe_1.useSupabaseSafe)();
    const [status, setStatus] = (0, react_1.useState)('loading');
    (0, react_1.useEffect)(() => {
        let mounted = true;
        const subscription = Linking.addEventListener('url', async (event) => {
            if (!mounted)
                return;
            const url = event.url;
            if (!url.includes('auth/callback') || !supabase)
                return;
            const ok = await (0, authRedirect_1.createSessionFromUrl)(url, supabase);
            if (!mounted)
                return;
            if (ok) {
                setStatus('success');
                expo_router_1.router.replace('/(app)');
            }
            else {
                setStatus('error');
            }
        });
        (async () => {
            const url = await Linking.getInitialURL();
            if (!url || !supabase) {
                if (mounted)
                    setStatus('error');
                return;
            }
            const ok = await (0, authRedirect_1.createSessionFromUrl)(url, supabase);
            if (!mounted)
                return;
            if (ok) {
                setStatus('success');
                expo_router_1.router.replace('/(app)');
            }
            else {
                setStatus('error');
            }
        })();
        return () => {
            mounted = false;
            subscription.remove();
        };
    }, [supabase]);
    if (status === 'success') {
        return (<react_native_1.View style={styles.container}>
        <react_native_1.Text style={styles.text}>Email confirmed!</react_native_1.Text>
        <react_native_1.Text style={styles.subtext}>Taking you to the app…</react_native_1.Text>
        <react_native_1.ActivityIndicator size="large" color={theme_1.theme.textPrimary} style={{ marginTop: 24 }}/>
      </react_native_1.View>);
    }
    if (status === 'error') {
        return (<react_native_1.View style={styles.container}>
        <react_native_1.Text style={styles.text}>Something went wrong</react_native_1.Text>
        <react_native_1.Text style={styles.subtext}>Please try signing in again.</react_native_1.Text>
        <react_native_1.Text style={[styles.subtext, { marginTop: 24, color: theme_1.theme.textPrimary }]} onPress={() => expo_router_1.router.replace('/auth/sign-in')}>
          Back to sign in
        </react_native_1.Text>
      </react_native_1.View>);
    }
    return (<react_native_1.View style={styles.container}>
      <react_native_1.ActivityIndicator size="large" color={theme_1.theme.textPrimary}/>
      <react_native_1.Text style={[styles.subtext, { marginTop: 16 }]}>Confirming your email…</react_native_1.Text>
    </react_native_1.View>);
}
exports.default = AuthCallbackScreen;
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme_1.theme.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    text: {
        fontSize: 20,
        fontWeight: '700',
        color: theme_1.theme.textPrimary,
        textAlign: 'center',
    },
    subtext: {
        fontSize: 14,
        color: theme_1.theme.textSecondary,
        textAlign: 'center',
        marginTop: 8,
    },
});
//# sourceMappingURL=callback.js.map