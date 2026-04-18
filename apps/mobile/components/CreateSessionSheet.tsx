import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { theme } from '../lib/theme';
import { useSession } from '../lib/hooks/useSession';
import { apiRequest, ApiRequestError } from '../lib/api';
import type { Session } from '@roam/types';
import { RetryPrompt } from './RetryPrompt';

const defaultName = () =>
  new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

export interface CreateSessionSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  onCreated: (session: Session) => void;
  onPaywallRequired?: () => void;
}

export function CreateSessionSheet({
  bottomSheetRef,
  onCreated,
  onPaywallRequired,
}: CreateSessionSheetProps) {
  const { session } = useSession();
  const [name, setName] = useState(defaultName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryable, setRetryable] = useState(false);

  const reset = () => {
    setError(null);
    setRetryable(false);
  };

  const parseJsonSafe = async (res: Response): Promise<{ parsed: unknown; raw: string }> => {
    const raw = await res.text();
    if (!raw) return { parsed: null, raw: '' };
    try {
      return { parsed: JSON.parse(raw), raw };
    } catch {
      return { parsed: null, raw };
    }
  };

  const postCreateSession = async (path: string) => {
    return apiRequest(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session!.access_token}`,
      },
      body: JSON.stringify({ name: name.trim() || defaultName() }),
      retries: 0,
    });
  };

  const handleCreate = async () => {
    if (!session?.access_token) {
      const msg =
        'Not signed in. Close this sheet, open Profile, sign in again, then try Create again.';
      setRetryable(false);
      setError(msg);
      return;
    }
    setError(null);
    setRetryable(false);
    setLoading(true);
    try {
      // Try with trailing slash first (some proxies require it), then without.
      let res = await postCreateSession('/sessions/');
      if (res.status === 404) {
        res = await postCreateSession('/sessions');
      }
      const { parsed: data, raw } = await parseJsonSafe(res);

      if (res.status === 403 && (data as { error?: string })?.error === 'plan_limit_reached') {
        bottomSheetRef.current?.close();
        onPaywallRequired?.();
        return;
      }
      if (!res.ok) {
        const msg =
          (data as { error?: string })?.error ??
          (raw ? `HTTP ${res.status}: ${raw.slice(0, 200)}` : `HTTP ${res.status} ${res.statusText}`);
        throw new Error(msg || 'Request failed');
      }
      const newSession = data as { id?: string; name?: string; created_at?: string; user_id?: string };
      if (!newSession?.id) {
        throw new Error('Server returned no session id');
      }
      onCreated({
        id: newSession.id as string,
        name: (newSession.name as string) ?? (name.trim() || defaultName()),
        created_at: (newSession.created_at as string) ?? new Date().toISOString(),
        user_id: (newSession.user_id as string) ?? '',
        phrase: null,
        quality_target: null,
      });
      bottomSheetRef.current?.close();
    } catch (e) {
      if (e instanceof ApiRequestError) {
        if (e.reason === 'http' && e.status === 403) {
          try {
            const parsed = e.bodyText ? (JSON.parse(e.bodyText) as { error?: string }) : null;
            if (parsed?.error === 'plan_limit_reached') {
              bottomSheetRef.current?.close();
              onPaywallRequired?.();
              return;
            }
          } catch {
            // ignore parse failures
          }
        }
        if (e.reason === 'timeout' || e.reason === 'network') {
          setRetryable(true);
          setError('Connection issue while creating session.');
        } else {
          setRetryable(false);
          setError(e.message || 'Failed to create session');
        }
      } else {
        const message = e instanceof Error ? e.message : 'Failed to create session';
        setRetryable(false);
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef as React.RefObject<BottomSheet>}
      index={-1}
      snapPoints={['40%']}
      enablePanDownToClose
      onChange={(i) => {
        if (i === -1) reset();
      }}
      backgroundStyle={styles.sheet}
      handleIndicatorStyle={styles.handle}
    >
      <View style={styles.content}>
        <Text style={styles.title}>New session</Text>
        <TextInput
          style={styles.input}
          placeholder="Session name"
          placeholderTextColor={theme.light.muted}
          value={name}
          onChangeText={setName}
          editable={!loading}
        />
        {retryable && error ? (
          <RetryPrompt message={error} onRetry={handleCreate} loading={loading} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.light.chrome} size="small" />
          ) : (
            <Text style={styles.buttonText}>Start session</Text>
          )}
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: theme.light.ground,
  },
  handle: {
    backgroundColor: theme.light.inactive,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.light.active,
    marginBottom: 12,
  },
  input: {
    backgroundColor: theme.light.chrome,
    borderWidth: 1,
    borderColor: theme.light.border,
    borderRadius: theme.borderRadius,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: theme.light.active,
    marginBottom: 12,
  },
  errorText: {
    color: '#e57373',
    fontSize: 14,
    marginBottom: 8,
  },
  button: {
    backgroundColor: theme.light.mine,
    borderWidth: 1,
    borderColor: theme.light.border,
    borderRadius: theme.borderRadius,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: theme.light.chrome,
    fontSize: 16,
    fontWeight: '600',
  },
});
