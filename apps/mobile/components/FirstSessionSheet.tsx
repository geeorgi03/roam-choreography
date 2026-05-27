import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import BottomSheet from '@gorhom/bottom-sheet';
import { theme } from '../lib/theme';
import { useSession } from '../lib/hooks/useSession';
import { apiRequest, ApiRequestError } from '../lib/api';
import { useTranslation } from '../lib/i18n';
import type { Session } from '@roam/types';
import { RetryPrompt } from './RetryPrompt';

const colors = theme.light;
const spacing = theme.spacing;
const YOUTUBE_URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/i;
const BILIBILI_URL_REGEX = /^(https?:\/\/)?(www\.)?(bilibili\.com\/video\/|b23\.tv\/)[\w/-]+/i;

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
  const { t } = useTranslation();

  const nameInputRef = useRef<TextInput | null>(null);

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [musicUrl, setMusicUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryable, setRetryable] = useState(false);

  const reset = () => {
    setStep(1);
    setName('');
    setMusicUrl('');
    setError(null);
    setRetryable(false);
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
    return apiRequest(`${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session!.access_token}`,
      },
      body: JSON.stringify(body),
      retries: 0,
    });
  };

  const handleCreate = async () => {
    if (!session?.access_token) {
      const msg =
        'Not signed in. Close this sheet, open Profile, sign in again, then try Create again.';
      setError(msg);
      return;
    }

    const connectivity = await NetInfo.fetch();
    if (!connectivity.isConnected) {
      setRetryable(false);
      setError("You're offline. Connect and try again.");
      return;
    }

    setError(null);
    setRetryable(false);
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

      onCreated(data as Session);
      bottomSheetRef.current?.close();
    } catch (e) {
      if (e instanceof TypeError) {
        setRetryable(true);
        setError(t('firstSession.offlineError'));
        return;
      }
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
          const message = e.message || 'Failed to create session';
          setRetryable(false);
          setError(message);
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

  const validateMusicUrl = (url: string): boolean => {
    const trimmed = url.trim();
    if (!trimmed) return true;
    return YOUTUBE_URL_REGEX.test(trimmed) || BILIBILI_URL_REGEX.test(trimmed);
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

            {retryable && error ? (
              <RetryPrompt message={error} onRetry={handleCreate} loading={loading} />
            ) : error ? (
              <Text style={[styles.errorText, { color: colors.capture }]}>{error}</Text>
            ) : null}

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

            {retryable && error ? (
              <RetryPrompt message={error} onRetry={handleCreate} loading={loading} />
            ) : error ? (
              <Text style={[styles.errorText, { color: colors.capture }]}>{error}</Text>
            ) : null}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  loading && styles.buttonDisabled,
                ]}
                onPress={() => {
                  if (!validateMusicUrl(musicUrl)) {
                    setRetryable(false);
                    setError(t('firstSession.invalidUrl'));
                    return;
                  }
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
                onPress={() => {
                  if (!validateMusicUrl(musicUrl)) {
                    setRetryable(false);
                    setError(t('firstSession.invalidUrl'));
                    return;
                  }
                  handleCreate();
                }}
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

