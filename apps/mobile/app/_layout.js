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
/**
 * Root layout. Entry: expo-router/entry -> app/_layout.tsx
 * SAFE FIRST FRAME: First paint is a minimal View+Text (no GestureHandlerRootView)
 * so we get a visible screen even if GHR/Reanimated crashes on mount.
 *
 * ISOLATION TOOL: Set MINIMAL_BOOT_TEST = true to verify the JS bundle renders at all.
 * Bypass everything (GHR, session, Supabase, redirects) — just a plain View+Text.
 * If this renders: bundle is fine. If blank: native/entry issue.
 * Set back to false before shipping.
 */
const MINIMAL_BOOT_TEST = false;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_2 = require("react");
const expo_router_1 = require("expo-router");
const SplashScreen = __importStar(require("expo-splash-screen"));
const react_native_toast_message_1 = __importDefault(require("react-native-toast-message"));
const useSession_1 = require("../lib/hooks/useSession");
const useShareIntent_1 = require("../lib/hooks/useShareIntent");
const theme_1 = require("../lib/theme");
const devBypassAuth_1 = require("../lib/devBypassAuth");
const api_1 = require("../lib/api");
let GestureHandlerRootView = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    GestureHandlerRootView = require('react-native-gesture-handler').GestureHandlerRootView ?? null;
}
catch (e) {
    console.error('[BOOT] react-native-gesture-handler unavailable — GHR disabled:', e);
}
const SPLASH_MAX_VISIBLE_MS = 4000;
const SAFE_FIRST_FRAME_MS = 500; // show "Roam" briefly so first paint is visible
const INIT_TIMEOUT_MS = 8000; // after this, force skip auth / show fallback
// --- Instrumentation ---
console.log('[BOOT] 1. app/_layout.tsx loaded');
console.log('[BOOT] 2. env', {
    hasSupabaseUrl: !!process.env.EXPO_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    hasApiUrl: !!process.env.EXPO_PUBLIC_API_URL,
});
SplashScreen.preventAutoHideAsync().catch(() => { });
// --- Error boundary (outermost to catch GHR/Reanimated crashes) ---
class RootErrorBoundary extends react_1.default.Component {
    state = { error: null };
    static getDerivedStateFromError(error) {
        return { error };
    }
    componentDidCatch(error, info) {
        console.error('[BOOT] RootErrorBoundary caught:', error?.message, info?.componentStack);
    }
    render() {
        if (this.state.error) {
            return (<react_native_1.View style={errorStyles.container}>
          <react_native_1.Text style={errorStyles.title}>App error</react_native_1.Text>
          <react_native_1.Text style={errorStyles.message}>{this.state.error.message}</react_native_1.Text>
          <react_native_1.TouchableOpacity style={errorStyles.button} onPress={() => this.setState({ error: null })}>
            <react_native_1.Text style={errorStyles.buttonText}>Try again</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>);
        }
        return this.props.children;
    }
}
const errorStyles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#330000',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    title: { fontSize: 18, fontWeight: '700', color: '#ffcccc', marginBottom: 8 },
    message: { fontSize: 14, color: '#ffaaaa', textAlign: 'center', marginBottom: 16 },
    button: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: '#555' },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
// --- Safe first frame: View + Text only, no GHR, no theme (inline styles) ---
const safeFirstFrameStyles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: { color: '#fff', fontSize: 24, fontWeight: '700' },
});
function SafeFirstFrame({ children }) {
    const [showRealApp, setShowRealApp] = (0, react_1.useState)(false);
    const [initTimedOut, setInitTimedOut] = (0, react_1.useState)(false);
    const readyRef = (0, react_1.useRef)(false);
    (0, react_2.useEffect)(() => {
        console.log('[BOOT] 3. SafeFirstFrame mounted, hiding splash');
        SplashScreen.hideAsync().catch(() => { });
        const minShow = setTimeout(() => {
            if (readyRef.current)
                return;
            readyRef.current = true;
            console.log('[BOOT] 4. SafeFirstFrame min delay done, showing real app');
            setShowRealApp(true);
        }, SAFE_FIRST_FRAME_MS);
        const guard = setTimeout(() => {
            setInitTimedOut(true);
            console.warn('[BOOT] init timeout reached');
        }, INIT_TIMEOUT_MS);
        return () => {
            clearTimeout(minShow);
            clearTimeout(guard);
        };
    }, []);
    // First paint: only this. No GestureHandlerRootView, no session, no router.
    if (!showRealApp) {
        return (<react_native_1.View style={safeFirstFrameStyles.container}>
        <react_native_1.Text style={safeFirstFrameStyles.text}>Roam</react_native_1.Text>
        {initTimedOut && (<react_native_1.TouchableOpacity style={{ marginTop: 24, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: '#333' }} onPress={() => {
                    readyRef.current = true;
                    setShowRealApp(true);
                }}>
            <react_native_1.Text style={{ color: '#fff' }}>Continue</react_native_1.Text>
          </react_native_1.TouchableOpacity>)}
      </react_native_1.View>);
    }
    return <>{children}</>;
}
// --- Main app tree (GestureHandlerRootView + session + router) ---
function RootNavigator() {
    const { session, loading, error } = (0, useSession_1.useSession)();
    const { pendingShareUrl, pendingShareMeta, clearPendingShare, createRefClip } = (0, useShareIntent_1.useShareIntent)();
    const pathname = (0, expo_router_1.usePathname)();
    const [ignoreSessionError, setIgnoreSessionError] = (0, react_1.useState)(false);
    const [skipToAuth, setSkipToAuth] = (0, react_1.useState)(false);
    const [showSkipOption, setShowSkipOption] = (0, react_1.useState)(false);
    const [sessionNameInput, setSessionNameInput] = (0, react_1.useState)('');
    const devBypass = (0, devBypassAuth_1.getDevBypassAuth)();
    const uploadQueueRef = (0, react_1.useRef)(null);
    const splashHiddenRef = (0, react_1.useRef)(false);
    (0, react_2.useEffect)(() => {
        console.log('[BOOT] 5. RootNavigator mounted');
    }, []);
    (0, react_2.useEffect)(() => {
        const t = setTimeout(() => {
            if (splashHiddenRef.current)
                return;
            splashHiddenRef.current = true;
            SplashScreen.hideAsync().catch(() => { });
        }, SPLASH_MAX_VISIBLE_MS);
        return () => clearTimeout(t);
    }, []);
    (0, react_2.useEffect)(() => {
        const t = setTimeout(() => {
            if (loading && !skipToAuth) {
                console.warn('[BOOT] boot hung >5s (session still loading)');
            }
        }, 5000);
        return () => clearTimeout(t);
    }, [loading, skipToAuth]);
    const readyToHide = !loading || error != null || skipToAuth;
    (0, react_2.useEffect)(() => {
        if (!readyToHide || splashHiddenRef.current)
            return;
        splashHiddenRef.current = true;
        SplashScreen.hideAsync().catch(() => { });
    }, [readyToHide]);
    (0, react_2.useEffect)(() => {
        const t = setTimeout(() => setShowSkipOption(true), 3000);
        return () => clearTimeout(t);
    }, []);
    // Handle auth deep link (email confirmation, magic link)
    (0, react_2.useEffect)(() => {
        const handleUrl = async (url) => {
            if (!url || !url.includes('auth/callback'))
                return;
            const { supabase } = await import('../lib/supabase');
            if (!supabase)
                return;
            const { createSessionFromUrl } = await import('../lib/authRedirect');
            const ok = await createSessionFromUrl(url, supabase);
            if (ok)
                expo_router_1.router.replace('/(app)');
        };
        react_native_1.Linking.getInitialURL().then(handleUrl);
        const sub = react_native_1.Linking.addEventListener('url', ({ url }) => handleUrl(url));
        return () => sub.remove();
    }, []);
    (0, react_2.useEffect)(() => {
        let cancelled = false;
        import('../services/uploadQueue')
            .then(({ uploadQueue }) => {
            if (!cancelled)
                uploadQueueRef.current = uploadQueue;
        })
            .catch((err) => {
            if (__DEV__)
                console.warn('[RootLayout] uploadQueue load failed:', err);
        });
        const sub = react_native_1.AppState.addEventListener('change', (nextState) => {
            if (nextState === 'active')
                uploadQueueRef.current?.onAppForeground();
        });
        return () => {
            cancelled = true;
            sub.remove();
        };
    }, []);
    const navReady = !!(0, expo_router_1.useRootNavigationState)()?.key;
    const handleCreateSessionAndAddClip = async () => {
        if (!session?.access_token || !pendingShareUrl || !pendingShareMeta)
            return;
        try {
            const response = await fetch(`${api_1.API_BASE}/sessions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    name: sessionNameInput.trim() || 'New Session',
                }),
            });
            if (!response.ok) {
                throw new Error(`Failed to create session: ${response.status}`);
            }
            const { id: newSessionId } = await response.json();
            await createRefClip(newSessionId, pendingShareUrl, pendingShareMeta);
            clearPendingShare();
            setSessionNameInput('');
            expo_router_1.router.replace(`/session/${newSessionId}`);
        }
        catch (error) {
            console.error('Error creating session and adding clip:', error);
            react_native_toast_message_1.default.show({
                type: 'error',
                text1: 'Failed to create session',
                text2: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };
    // Use router.replace inside useEffect — never <Redirect> — to avoid
    // "navigate before mounting Root Layout" errors. Defer by one frame so
    // the navigator container is fully committed before we push a route.
    (0, react_2.useEffect)(() => {
        if (!navReady || loading)
            return;
        if (error && !ignoreSessionError)
            return;
        const t = setTimeout(() => {
            if (!session && !skipToAuth && !devBypass) {
                if (!pathname || !pathname.startsWith('/auth')) {
                    expo_router_1.router.replace('/auth/sign-up');
                }
                return;
            }
            if (session && pathname?.startsWith('/auth')) {
                expo_router_1.router.replace('/(app)');
            }
        }, 0);
        return () => clearTimeout(t);
    }, [navReady, loading, session, skipToAuth, devBypass, error, ignoreSessionError, pathname]);
    if (loading && !skipToAuth) {
        return (<react_native_1.View style={styles.loading}>
        <react_native_1.ActivityIndicator size="large" color={theme_1.theme.textPrimary}/>
        {showSkipOption && (<react_native_1.TouchableOpacity style={styles.continueButton} onPress={() => setSkipToAuth(true)}>
            <react_native_1.Text style={styles.continueButtonText}>Get started</react_native_1.Text>
          </react_native_1.TouchableOpacity>)}
      </react_native_1.View>);
    }
    if (error && !ignoreSessionError) {
        const isConfigError = error.message.includes('EXPO_PUBLIC_SUPABASE_URL') ||
            error.message.includes('EXPO_PUBLIC_SUPABASE_ANON_KEY');
        return (<react_native_1.View style={styles.loading}>
        <react_native_1.Text style={styles.errorTitle}>Something went wrong</react_native_1.Text>
        <react_native_1.Text style={styles.errorText}>{error.message}</react_native_1.Text>
        {isConfigError && (<react_native_1.Text style={styles.errorHint}>
            Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in EAS environment variables for your build profile.
          </react_native_1.Text>)}
        <react_native_1.TouchableOpacity style={styles.continueButton} onPress={() => setIgnoreSessionError(true)}>
          <react_native_1.Text style={styles.continueButtonText}>Continue anyway</react_native_1.Text>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>);
    }
    return (<>
      <expo_router_1.Stack screenOptions={{ headerShown: false }}/>
      <react_native_toast_message_1.default />
      
      {pendingShareUrl && (<react_native_1.Modal visible={true} transparent={true} animationType="fade" onRequestClose={clearPendingShare}>
          <react_native_1.View style={modalStyles.overlay}>
            <react_native_1.View style={modalStyles.container}>
              <react_native_1.Text style={modalStyles.title}>Create Session</react_native_1.Text>
              <react_native_1.Text style={modalStyles.subtitle}>
                Add {pendingShareMeta?.title || pendingShareUrl} to a new session
              </react_native_1.Text>
              
              <react_native_1.TextInput style={modalStyles.input} placeholder="Session name" value={sessionNameInput} onChangeText={setSessionNameInput} autoFocus={true}/>
              
              <react_native_1.View style={modalStyles.buttons}>
                <react_native_1.TouchableOpacity style={[modalStyles.button, modalStyles.cancelButton]} onPress={clearPendingShare}>
                  <react_native_1.Text style={modalStyles.cancelButtonText}>Cancel</react_native_1.Text>
                </react_native_1.TouchableOpacity>
                
                <react_native_1.TouchableOpacity style={[modalStyles.button, modalStyles.createButton]} onPress={handleCreateSessionAndAddClip}>
                  <react_native_1.Text style={modalStyles.createButtonText}>Create & Add</react_native_1.Text>
                </react_native_1.TouchableOpacity>
              </react_native_1.View>
            </react_native_1.View>
          </react_native_1.View>
        </react_native_1.Modal>)}
    </>);
}
function AppTree() {
    // If GHR failed to load (native module missing), render without it so the app
    // is at least visible. Gesture-driven components (BottomSheet) will not work
    // until the native module is correctly linked, but auth + navigation still render.
    if (!GestureHandlerRootView) {
        console.warn('[BOOT] GestureHandlerRootView unavailable — rendering without GHR');
        return (<SafeFirstFrame>
        <react_native_1.View style={{ flex: 1 }}>
          <RootNavigator />
        </react_native_1.View>
      </SafeFirstFrame>);
    }
    return (<SafeFirstFrame>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RootNavigator />
      </GestureHandlerRootView>
    </SafeFirstFrame>);
}
function RootLayout() {
    console.log('[BOOT] 0. RootLayout render');
    if (MINIMAL_BOOT_TEST) {
        return (<react_native_1.View style={{ flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }}>
        <react_native_1.Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>MINIMAL BOOT OK</react_native_1.Text>
        <react_native_1.Text style={{ color: '#888', fontSize: 14, marginTop: 8 }}>Set MINIMAL_BOOT_TEST=false to restore app</react_native_1.Text>
      </react_native_1.View>);
    }
    return (<RootErrorBoundary>
      <AppTree />
    </RootErrorBoundary>);
}
exports.default = RootLayout;
const styles = react_native_1.StyleSheet.create({
    loading: {
        flex: 1,
        backgroundColor: theme_1.theme.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme_1.theme.textPrimary,
        marginBottom: 8,
    },
    errorText: {
        fontSize: 14,
        color: theme_1.theme.textSecondary,
        textAlign: 'center',
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    errorHint: {
        fontSize: 12,
        color: theme_1.theme.textSecondary,
        textAlign: 'center',
        paddingHorizontal: 32,
        maxWidth: 320,
    },
    continueButton: {
        marginTop: 16,
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: '#333',
        borderRadius: theme_1.theme.borderRadius,
    },
    continueButtonText: {
        color: theme_1.theme.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
});
const modalStyles = react_native_1.StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    container: {
        backgroundColor: theme_1.theme.light.ground,
        borderRadius: theme_1.theme.borderRadius,
        padding: 24,
        width: '100%',
        maxWidth: 320,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: theme_1.theme.textPrimary,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: theme_1.theme.textSecondary,
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: theme_1.theme.light.border,
        borderRadius: theme_1.theme.borderRadius,
        padding: 12,
        fontSize: 16,
        color: theme_1.theme.textPrimary,
        backgroundColor: theme_1.theme.light.ground,
        marginBottom: 20,
    },
    buttons: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: theme_1.theme.borderRadius,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme_1.theme.light.border,
    },
    createButton: {
        backgroundColor: theme_1.theme.light.ref,
    },
    cancelButtonText: {
        color: theme_1.theme.textSecondary,
        fontSize: 16,
        fontWeight: '600',
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
//# sourceMappingURL=_layout.js.map