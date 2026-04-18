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

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AppState, ActivityIndicator, StyleSheet, View, Text, TextInput, TouchableOpacity, Modal, Linking } from 'react-native';
import { Stack, usePathname, useRootNavigationState, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import Toast from 'react-native-toast-message';
import { useSession } from '../lib/hooks/useSession';
import { useShareIntent } from '../lib/hooks/useShareIntent';
import { theme } from '../lib/theme';
import { getDevBypassAuth } from '../lib/devBypassAuth';
import { API_BASE } from '../lib/api';
import { drainQueue } from '../lib/writeQueue';
import OfflineBanner from '../components/OfflineBanner';
import NetInfo from '@react-native-community/netinfo';
import ErrorBoundary from '../components/ErrorBoundary';
import { InboxCountProvider } from '../lib/contexts/InboxCountContext';
import { ThemeProvider } from '../lib/contexts/ThemeContext';

// Defensive require: if RNGestureHandlerModule is missing from the native binary
// (e.g. NDK mismatch in EAS build), getEnforcing() throws at module-eval time and
// kills the entire JS bundle before RootLayout renders — causing a silent white screen.
// Using require() inside try/catch means the throw is caught and we degrade gracefully.
type GHRType = React.ComponentType<{ style?: object; children: React.ReactNode }>;
let GestureHandlerRootView: GHRType | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  GestureHandlerRootView = (require('react-native-gesture-handler') as { GestureHandlerRootView: GHRType }).GestureHandlerRootView ?? null;
} catch (e) {
  console.error('[BOOT] react-native-gesture-handler unavailable — GHR disabled:', e);
}

const SPLASH_MAX_VISIBLE_MS = 4_000;
const SAFE_FIRST_FRAME_MS = 500; // show "Roam" briefly so first paint is visible
const INIT_TIMEOUT_MS = 8_000; // after this, force skip auth / show fallback

// --- Instrumentation ---
console.log('[BOOT] 1. app/_layout.tsx loaded');
console.log('[BOOT] 2. env', {
  hasSupabaseUrl: !!process.env.EXPO_PUBLIC_SUPABASE_URL,
  hasSupabaseKey: !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  hasApiUrl: !!process.env.EXPO_PUBLIC_API_URL,
});

SplashScreen.preventAutoHideAsync().catch(() => {});

// --- Error boundary (outermost to catch GHR/Reanimated crashes) ---
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[BOOT] RootErrorBoundary caught:', error?.message, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>App error</Text>
          <Text style={errorStyles.message}>{this.state.error.message}</Text>
          <TouchableOpacity
            style={errorStyles.button}
            onPress={() => this.setState({ error: null })}
          >
            <Text style={errorStyles.buttonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.light.ground,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: { fontSize: 18, fontWeight: '700', color: theme.light.active, marginBottom: 8 },
  message: { fontSize: 14, color: theme.light.muted, textAlign: 'center', marginBottom: 16 },
  button: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: theme.light.mine,
  },
  buttonText: { color: theme.light.ground, fontSize: 16, fontWeight: '600' },
});

// --- Safe first frame: View + Text only, no GHR, no theme (inline styles) ---
const safeFirstFrameStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: { color: '#fff', fontSize: 24, fontWeight: '700' },
});

function SafeFirstFrame({ children }: { children: React.ReactNode }) {
  const [showRealApp, setShowRealApp] = useState(false);
  const [initTimedOut, setInitTimedOut] = useState(false);
  const readyRef = useRef(false);

  useEffect(() => {
    console.log('[BOOT] 3. SafeFirstFrame mounted, hiding splash');
    SplashScreen.hideAsync().catch(() => {});

    const minShow = setTimeout(() => {
      if (readyRef.current) return;
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
    return (
      <View style={safeFirstFrameStyles.container}>
        <Text style={safeFirstFrameStyles.text}>Roam</Text>
        {initTimedOut && (
          <TouchableOpacity
            style={{ marginTop: 24, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: '#333' }}
            onPress={() => {
              readyRef.current = true;
              setShowRealApp(true);
            }}
          >
            <Text style={{ color: '#fff' }}>Continue</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return <>{children}</>;
}

// --- Main app tree (GestureHandlerRootView + session + router) ---
function RootNavigator() {
  const { session, loading, error } = useSession();
  const { pendingShareUrl, pendingShareMeta, clearPendingShare, createRefClip } = useShareIntent();
  const pathname = usePathname();
  const [ignoreSessionError, setIgnoreSessionError] = useState(false);
  const [skipToAuth, setSkipToAuth] = useState(false);
  const [showSkipOption, setShowSkipOption] = useState(false);
  const [sessionNameInput, setSessionNameInput] = useState('');
  const devBypass = getDevBypassAuth();
  const uploadQueueRef = useRef<{ onAppForeground: () => void } | null>(null);
  const splashHiddenRef = useRef(false);
  const isDrainingQueueRef = useRef(false);

  const drainIfNotDraining = useCallback(async (token: string) => {
    if (isDrainingQueueRef.current) return;
    isDrainingQueueRef.current = true;
    try {
      await drainQueue(token);
    } finally {
      isDrainingQueueRef.current = false;
    }
  }, []);

  useEffect(() => {
    console.log('[BOOT] 5. RootNavigator mounted');
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (splashHiddenRef.current) return;
      splashHiddenRef.current = true;
      SplashScreen.hideAsync().catch(() => {});
    }, SPLASH_MAX_VISIBLE_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (loading && !skipToAuth) {
        console.warn('[BOOT] boot hung >5s (session still loading)');
      }
    }, 5_000);
    return () => clearTimeout(t);
  }, [loading, skipToAuth]);

  const readyToHide = !loading || error != null || skipToAuth;
  useEffect(() => {
    if (!readyToHide || splashHiddenRef.current) return;
    splashHiddenRef.current = true;
    SplashScreen.hideAsync().catch(() => {});
  }, [readyToHide]);

  useEffect(() => {
    const t = setTimeout(() => setShowSkipOption(true), 3000);
    return () => clearTimeout(t);
  }, []);

  // Handle auth deep link (email confirmation, magic link)
  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url || !url.includes('auth/callback')) return;
      const { supabase } = await import('../lib/supabase');
      if (!supabase) return;
      const { createSessionFromUrl } = await import('../lib/authRedirect');
      const ok = await createSessionFromUrl(url, supabase);
      if (ok) router.replace('/(app)');
    };
    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    let cancelled = false;
    import('../services/uploadQueue')
      .then(({ uploadQueue }) => {
        if (!cancelled) uploadQueueRef.current = uploadQueue;
      })
      .catch((err) => {
        if (__DEV__) console.warn('[RootLayout] uploadQueue load failed:', err);
      });
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        uploadQueueRef.current?.onAppForeground();
        if (session?.access_token) {
          drainIfNotDraining(session.access_token).catch(() => {});
        }
      }
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [session?.access_token]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        if (session?.access_token) {
          drainIfNotDraining(session.access_token).catch(() => {});
        }
      }
    });
    return unsubscribe;
  }, [session?.access_token]);

  const navReady = !!useRootNavigationState()?.key;

  const handleCreateSessionAndAddClip = async () => {
    if (!session?.access_token || !pendingShareUrl || !pendingShareMeta) return;

    try {
      const response = await fetch(`${API_BASE}/sessions`, {
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
      router.replace(`/session/${newSessionId}`);
    } catch (error) {
      console.error('Error creating session and adding clip:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to create session',
        text2: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Use router.replace inside useEffect — never <Redirect> — to avoid
  // "navigate before mounting Root Layout" errors. Defer by one frame so
  // the navigator container is fully committed before we push a route.
  useEffect(() => {
    if (!navReady || loading) return;
    if (error && !ignoreSessionError) return;

    const t = setTimeout(() => {
      if (!session && !skipToAuth && !devBypass) {
        if (!pathname || !pathname.startsWith('/auth')) {
          router.replace('/auth/sign-up');
        }
        return;
      }
      if (session && pathname?.startsWith('/auth')) {
        router.replace('/(app)');
      }
    }, 0);
    return () => clearTimeout(t);
  }, [navReady, loading, session, skipToAuth, devBypass, error, ignoreSessionError, pathname]);

  if (loading && !skipToAuth) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.textPrimary} />
        {showSkipOption && (
          <TouchableOpacity style={styles.continueButton} onPress={() => setSkipToAuth(true)}>
            <Text style={styles.continueButtonText}>Get started</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (error && !ignoreSessionError) {
    const isConfigError =
      error.message.includes('EXPO_PUBLIC_SUPABASE_URL') ||
      error.message.includes('EXPO_PUBLIC_SUPABASE_ANON_KEY');
    return (
      <View style={styles.loading}>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorText}>{error.message}</Text>
        {isConfigError && (
          <Text style={styles.errorHint}>
            Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in EAS environment variables for your build profile.
          </Text>
        )}
        <TouchableOpacity style={styles.continueButton} onPress={() => setIgnoreSessionError(true)}>
          <Text style={styles.continueButtonText}>Continue anyway</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <ErrorBoundary>
        <InboxCountProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </InboxCountProvider>
      </ErrorBoundary>
      <Toast />
      <OfflineBanner />
      
      {pendingShareUrl && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={clearPendingShare}
        >
          <View style={modalStyles.overlay}>
            <View style={modalStyles.container}>
              <Text style={modalStyles.title}>Create Session</Text>
              <Text style={modalStyles.subtitle}>
                Add {pendingShareMeta?.title || pendingShareUrl} to a new session
              </Text>
              
              <TextInput
                style={modalStyles.input}
                placeholder="Session name"
                value={sessionNameInput}
                onChangeText={setSessionNameInput}
                autoFocus={true}
              />
              
              <View style={modalStyles.buttons}>
                <TouchableOpacity
                  style={[modalStyles.button, modalStyles.cancelButton]}
                  onPress={clearPendingShare}
                >
                  <Text style={modalStyles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[modalStyles.button, modalStyles.createButton]}
                  onPress={handleCreateSessionAndAddClip}
                >
                  <Text style={modalStyles.createButtonText}>Create & Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

function AppTree() {
  // If GHR failed to load (native module missing), render without it so the app
  // is at least visible. Gesture-driven components (BottomSheet) will not work
  // until the native module is correctly linked, but auth + navigation still render.
  if (!GestureHandlerRootView) {
    console.warn('[BOOT] GestureHandlerRootView unavailable — rendering without GHR');
    return (
      <SafeFirstFrame>
        <View style={{ flex: 1 }}>
          <ThemeProvider>
            <RootNavigator />
          </ThemeProvider>
        </View>
      </SafeFirstFrame>
    );
  }
  return (
    <SafeFirstFrame>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <RootNavigator />
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeFirstFrame>
  );
}

export default function RootLayout() {
  console.log('[BOOT] 0. RootLayout render');
  if (MINIMAL_BOOT_TEST) {
    return (
      <View style={{ flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>MINIMAL BOOT OK</Text>
        <Text style={{ color: '#888', fontSize: 14, marginTop: 8 }}>Set MINIMAL_BOOT_TEST=false to restore app</Text>
      </View>
    );
  }
  return (
    <RootErrorBoundary>
      <AppTree />
    </RootErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  errorHint: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
    maxWidth: 320,
  },
  continueButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#333',
    borderRadius: theme.borderRadius,
  },
  continueButtonText: {
    color: theme.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  container: {
    backgroundColor: theme.light.ground,
    borderRadius: theme.borderRadius,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.light.border,
    borderRadius: theme.borderRadius,
    padding: 12,
    fontSize: 16,
    color: theme.textPrimary,
    backgroundColor: theme.light.ground,
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
    borderRadius: theme.borderRadius,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.light.border,
  },
  createButton: {
    backgroundColor: theme.light.ref,
  },
  cancelButtonText: {
    color: theme.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
