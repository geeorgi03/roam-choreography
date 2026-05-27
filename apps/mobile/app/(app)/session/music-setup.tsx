import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import BottomSheet from '@gorhom/bottom-sheet';

import { apiRequest, ApiRequestError } from '../../../lib/api';
import { useSession } from '../../../lib/hooks/useSession';
import { theme } from '../../../lib/theme';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { PaywallSheet } from '../../../components/PaywallSheet';
import { useTranslation } from '../../../lib/i18n';
import { getActiveSessionId } from '../../../lib/storage';
import { getDeviceTier, uxTokens } from '../../../lib/designTokens';

export default function MusicSetupScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const tier = getDeviceTier(width);
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId?: string; id?: string }>();
  const { session } = useSession();
  const paywallSheetRef = useRef<BottomSheet | null>(null);

  const sessionId = useMemo(() => {
    const fromSessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;
    const fromId = Array.isArray(params.id) ? params.id[0] : params.id;
    if (typeof fromSessionId === 'string' && fromSessionId.trim()) return fromSessionId;
    if (typeof fromId === 'string' && fromId.trim()) return fromId;
    const activeSessionId = getActiveSessionId();
    if (activeSessionId) return activeSessionId;
    return null;
  }, [params.id, params.sessionId]);

  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!session?.access_token) {
      setError(t('musicSetup.needSignIn'));
      return;
    }
    if (!sessionId) {
      setError(t('musicSetup.missingSessionId'));
      return;
    }
    const trimmed = youtubeUrl.trim();
    if (!trimmed) {
      setError(t('musicSetup.pasteUrl'));
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await apiRequest(`/sessions/${sessionId}/music`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ youtube_url: trimmed }),
        timeoutMs: 12_000,
        retries: 2,
      });

      const json = (await res.json().catch(() => null)) as
        | { music_track_id?: string; reason?: string; error?: string }
        | null;

      if (!res.ok) {
        if (res.status === 403 && json?.reason === 'plan_limit_reached') {
          paywallSheetRef.current?.snapToIndex(0);
          return;
        }
        setError(json?.error ?? t('musicSetup.unableToAddUrl'));
        return;
      }

      if (!json?.music_track_id) {
        setError(t('musicSetup.trackMissingId'));
        return;
      }

      router.replace({
        pathname: '/session/youtube-player',
        params: {
          sessionId,
          musicTrackId: json.music_track_id,
        },
      });
    } catch (error) {
      if (error instanceof ApiRequestError && error.reason === 'timeout') {
        setError(t('musicSetup.networkTimeout'));
      } else {
        setError(t('musicSetup.networkError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const styles = useMemo(() => createStyles(colors, tier), [colors, tier]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('musicSetup.title')}</Text>
      <Text style={styles.subtitle}>
        {t('musicSetup.subtitle')}
      </Text>

      <TextInput
        style={styles.input}
        value={youtubeUrl}
        onChangeText={setYoutubeUrl}
        placeholder={t('musicSetup.placeholder')}
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!sessionId ? (
        <TouchableOpacity style={styles.secondaryAction} onPress={() => router.replace('/')} activeOpacity={0.85}>
          <Text style={styles.secondaryActionText}>{t('tabs.home')}</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()} disabled={loading}>
          <Text style={styles.secondaryBtnText}>{t('musicSetup.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.primaryBtnText}>{t('musicSetup.continue')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <PaywallSheet bottomSheetRef={paywallSheetRef} />
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors'], tier: 'phone' | 'tablet') {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.ground,
      padding: tier === 'tablet' ? 24 : 16,
    },
    title: {
      color: colors.active,
      fontSize: uxTokens.typography.title[tier],
      fontWeight: '800',
      marginBottom: 6,
    },
    subtitle: {
      color: colors.muted,
      fontSize: uxTokens.typography.subtitle[tier],
      lineHeight: 18,
      marginBottom: 14,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: theme.borderRadius,
      backgroundColor: colors.chrome,
      color: colors.active,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: uxTokens.typography.body[tier],
    },
    error: {
      color: '#c0392b',
      marginTop: 10,
      fontSize: uxTokens.typography.caption[tier],
    },
    secondaryAction: {
      marginTop: 12,
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.chrome,
    },
    secondaryActionText: {
      color: colors.muted,
      fontSize: uxTokens.typography.caption[tier],
      fontWeight: '600',
    },
    actions: {
      marginTop: 16,
      flexDirection: 'row',
      gap: 10,
    },
    secondaryBtn: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: theme.borderRadius,
      backgroundColor: colors.chrome,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
    },
    secondaryBtnText: {
      color: colors.muted,
      fontSize: uxTokens.typography.body[tier],
      fontWeight: '600',
    },
    primaryBtn: {
      flex: 1,
      borderRadius: theme.borderRadius,
      backgroundColor: colors.active,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      minHeight: 46,
    },
    primaryBtnDisabled: {
      opacity: 0.6,
    },
    primaryBtnText: {
      color: '#ffffff',
      fontSize: uxTokens.typography.body[tier],
      fontWeight: '700',
    },
  });
}
