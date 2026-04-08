import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { makeRedirectUri } from 'expo-auth-session';
import { useSupabaseSafe } from '../../lib/hooks/useSupabaseSafe';
import { theme } from '../../lib/theme';
import { setDevBypassAuth } from '../../lib/devBypassAuth';
import { useTranslation } from '../../lib/i18n';

export default function SignUpScreen() {
  const { t } = useTranslation();
  const { supabase, error: configError, loading: configLoading } = useSupabaseSafe();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSignUp() {
    if (!supabase) return;
    setError(null);
    setMessage(null);
    setLoading(true);
    const redirectTo = makeRedirectUri({ path: 'auth/callback' });
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
    setMessage(t('signUp.confirmEmail'));
  }

  if (configLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={theme.light.active} />
        </View>
      </View>
    );
  }

  if (configError || !supabase) {
    const isConfig = configError?.message?.includes('EXPO_PUBLIC_');
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.brandTitle}>{t('signUp.brandTitle')}</Text>
          <Text style={[styles.error, { marginBottom: 24 }]}>
            {isConfig
              ? t('signUp.configError')
              : configError?.message ?? t('signUp.genericError')}
          </Text>
          <TouchableOpacity
            style={styles.link}
            onPress={() => router.replace('/auth/sign-in')}
          >
            <Text style={styles.linkText}>{t('signUp.backToSignIn')}</Text>
          </TouchableOpacity>
          {__DEV__ && (
            <TouchableOpacity
              style={[styles.link, { marginTop: 16 }]}
              onPress={() => {
                setDevBypassAuth(true);
                router.replace('/(app)');
              }}
            >
              <Text style={[styles.linkText, { color: theme.light.mine }]}>{t('signUp.openAppDev')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.brandTitle}>{t('signUp.brandTitle')}</Text>
        <Text style={styles.tagline}>{t('signUp.tagline')}</Text>
        <View style={styles.form}>
          <Text style={styles.label}>{t('signUp.email')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('signUp.emailPlaceholder')}
            placeholderTextColor={theme.light.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.label}>{t('signUp.password')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('signUp.passwordPlaceholder')}
            placeholderTextColor={theme.light.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading || !supabase}
          >
            <Text style={styles.buttonText}>{loading ? t('signUp.creating') : t('signUp.createAccount')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.link}
            onPress={() => router.replace('/auth/sign-in')}
          >
            <Text style={styles.linkText}>{t('signUp.alreadyHaveAccount')}</Text>
          </TouchableOpacity>
        </View>
        {__DEV__ && (
          <TouchableOpacity
            style={[styles.link, { marginTop: 8 }]}
            onPress={() => {
              setDevBypassAuth(true);
              router.replace('/(app)');
            }}
          >
            <Text style={[styles.linkText, { color: theme.light.mine }]}>{t('signUp.openAppDev')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.light.ground,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.light.active,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: theme.light.muted,
    marginBottom: 32,
  },
  form: {
    backgroundColor: theme.light.chrome,
    borderRadius: theme.borderRadius,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.light.border,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.light.active,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.light.ground,
    borderRadius: theme.borderRadius,
    borderWidth: 1,
    borderColor: theme.light.border,
    padding: 16,
    fontSize: 16,
    color: theme.light.active,
    marginBottom: 20,
  },
  error: {
    color: theme.light.amber,
    fontSize: 14,
    marginBottom: 16,
  },
  message: {
    color: theme.light.muted,
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    backgroundColor: theme.light.mine,
    borderRadius: theme.borderRadius,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: theme.light.ground,
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    color: theme.light.muted,
    fontSize: 14,
  },
});
