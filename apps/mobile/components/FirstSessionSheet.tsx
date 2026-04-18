import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { theme } from '../lib/theme';
import { useSession } from '../lib/hooks/useSession';
import { API_BASE } from '../lib/api';
import type { Session } from '@roam/types';

const colors = theme.night;
const spacing = theme.spacing;

export interface FirstSessionSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  onCreated: (session: Session) => void;
  onPaywallRequired?: () => void;
}

export function FirstSessionSheet({
  bottomSheetRef,
  onCreated,
  onPaywallRequired,
}: FirstSessionSheetProps) {
  const { session } = useSession();

  const nameInputRef = useRef<TextInput | null>(null);

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [musicUrl, setMusicUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep(1);
    setName('');
    setMusicUrl('');
    setError(null);
  };

  const parseJsonSafe = async (res: Response): Promise<unknown> => {
    const raw = await res.text();
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const postCreateSession = async (path: string, body: unknown) => {
    return fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session!.access_token}`,
      },
      body: JSON.stringify(body),
    });
  };

  const handleCreate = async () => {
    if (!session?.access_token) {
      const msg =
        'Not signed in. Close this sheet, open Profile, sign in again, then try Create again.';
      setError(msg);
      Alert.alert('Can’t create session', msg);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const body = {
        name: name.trim(),
        ...(musicUrl.trim() ? { music_url: musicUrl.trim() } : {}),
      };

      // Try with trailing slash first (some proxies require it), then without.
      let res = await postCreateSession('/sessions/', body);
      if (res.status === 404) {
        res = await postCreateSession('/sessions', body);
      }

      const data = await parseJsonSafe(res);

      if (res.status === 403 && (data as { error?: string })?.error === 'plan_limit_reached') {
        bottomSheetRef.current?.close();
        onPaywallRequired?.();
        return;
      }

      if (!res.ok) {
        const msg =
          (data as { error?: string })?.error ??
          `HTTP ${res.status} ${res.statusText}`;
        throw new Error(msg || 'Request failed');
      }

      onCreated(data as Session);
      bottomSheetRef.current?.close();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to create session';
      setError(message);
      Alert.alert('Create session failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef as unknown as React.Ref<BottomSheet>}
      index={-1}
      snapPoints={['70%']}
      enablePanDownToClose
      onChange={(i) => {
        if (i === -1) reset();
      }}
      backgroundStyle={styles.sheet}
      handleIndicatorStyle={styles.handle}
    >
      <View style={[styles.content, { paddingBottom: 40 }]}>
        {step === 1 ? (
          <>
            <Text style={[styles.stepTitle, { color: colors.active }]}>Name your session</Text>
            <TextInput
              ref={nameInputRef}
              autoFocus
              placeholder="light feet study"
              placeholderTextColor={colors.muted}
              style={[
                styles.input,
                {
                  backgroundColor: colors.ground,
                  borderColor: colors.border,
                  color: colors.active,
                  fontSize: 20,
                },
              ]}
              value={name}
              onChangeText={setName}
              editable={!loading}
            />

            {error ? <Text style={[styles.errorText, { color: colors.capture }]}>{error}</Text> : null}

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!name.trim() || loading) && styles.buttonDisabled,
              ]}
              onPress={() => {
                if (name.trim()) setStep(2);
              }}
              disabled={!name.trim() || loading}
            >
              <Text style={[styles.primaryButtonText, { color: colors.chrome }]}>Next →</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Text style={[styles.stepTitle, { color: colors.active }]}>Add a reference video?</Text>
            <Text style={[styles.subtext, { color: colors.muted }]}>Paste a YouTube or Bilibili URL</Text>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.ground,
                  borderColor: colors.border,
                  color: colors.active,
                },
              ]}
              placeholder="https://youtube.com/..."
              placeholderTextColor={colors.muted}
              value={musicUrl}
              onChangeText={setMusicUrl}
              autoCapitalize="none"
              keyboardType="url"
              editable={!loading}
            />

            {error ? <Text style={[styles.errorText, { color: colors.capture }]}>{error}</Text> : null}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  loading && styles.buttonDisabled,
                ]}
                onPress={() => {
                  handleCreate();
                }}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.muted} />
                ) : (
                  <Text style={[styles.secondaryButtonText, { color: colors.muted }]}>Skip</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  loading && styles.buttonDisabled,
                ]}
                onPress={() => handleCreate()}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.chrome} />
                ) : (
                  <Text style={[styles.primaryButtonText, { color: colors.chrome }]}>Start →</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : null}

      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.chrome,
  },
  handle: {
    backgroundColor: colors.border,
  },
  content: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'left',
  },
  subtext: {
    fontSize: 14,
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: spacing.radiusMd,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: colors.mine,
    borderRadius: spacing.radiusMd,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: colors.mine,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: spacing.radiusMd,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'left',
  },
  step3Container: {
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

