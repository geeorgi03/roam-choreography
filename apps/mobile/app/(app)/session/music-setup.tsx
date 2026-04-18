import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import BottomSheet from '@gorhom/bottom-sheet';

import { API_BASE } from '../../../lib/api';
import { useSession } from '../../../lib/hooks/useSession';
import { theme } from '../../../lib/theme';
import { PaywallSheet } from '../../../components/PaywallSheet';

const colors = theme.light;

export default function MusicSetupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId?: string; id?: string }>();
  const { session } = useSession();
  const paywallSheetRef = useRef<BottomSheet | null>(null);

  const sessionId = useMemo(() => {
    if (typeof params.sessionId === 'string' && params.sessionId.trim()) return params.sessionId;
    if (typeof params.id === 'string' && params.id.trim()) return params.id;
    return null;
  }, [params.id, params.sessionId]);

  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!session?.access_token) {
      setError('You need to be signed in.');
      return;
    }
    if (!sessionId) {
      setError('Missing session id.');
      return;
    }
    const trimmed = youtubeUrl.trim();
    if (!trimmed) {
      setError('Paste a YouTube or Bilibili URL.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/music`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ youtube_url: trimmed }),
      });

      const json = (await res.json().catch(() => null)) as
        | { music_track_id?: string; reason?: string; error?: string }
        | null;

      if (!res.ok) {
        if (res.status === 403 && json?.reason === 'plan_limit_reached') {
          paywallSheetRef.current?.snapToIndex(0);
          return;
        }
        setError(json?.error ?? 'Unable to add this music URL.');
        return;
      }

      if (!json?.music_track_id) {
        setError('Music track was created without an id. Try again.');
        return;
      }

      router.replace({
        pathname: './youtube-player',
        params: {
          sessionId,
          musicTrackId: json.music_track_id,
        },
      });
    } catch {
      setError('Network error while adding music. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add music</Text>
      <Text style={styles.subtitle}>
        Paste a YouTube or Bilibili URL to attach music and open section alignment.
      </Text>

      <TextInput
        style={styles.input}
        value={youtubeUrl}
        onChangeText={setYoutubeUrl}
        placeholder="https://youtube.com/watch?v=..."
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()} disabled={loading}>
          <Text style={styles.secondaryBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.primaryBtnText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>

      <PaywallSheet bottomSheetRef={paywallSheetRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ground,
    padding: 16,
  },
  title: {
    color: colors.active,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
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
    fontSize: 14,
  },
  error: {
    color: '#c0392b',
    marginTop: 10,
    fontSize: 12,
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
    fontSize: 14,
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
    fontSize: 14,
    fontWeight: '700',
  },
});
