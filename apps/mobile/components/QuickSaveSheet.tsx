import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';
import { theme } from '../lib/theme';
import { useSession } from '../lib/hooks/useSession';
import { API_BASE } from '../lib/api';
import { saveClip, saveInboxClip, type SaveClipResult } from '../lib/saveClip';
import type { Session as SessionType } from '@roam/types';
import { CreateSessionSheet } from './CreateSessionSheet';

type Mode = 'saved' | 'picker';

export interface QuickSaveSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  videoUri: string | null;
  secondaryVideoUri?: string | null;
  dualPairId?: string;
  sessionId?: string | null;
  sectionName?: string | null;
  onDone: (next?: { navigateTo?: string }) => void;
}

export function QuickSaveSheet({
  bottomSheetRef,
  videoUri,
  secondaryVideoUri,
  dualPairId,
  sessionId,
  sectionName,
  onDone,
}: QuickSaveSheetProps) {
  const snapPoints = useMemo(() => ['55%'], []);
  const { session } = useSession();
  const [mode, setMode] = useState<Mode>('saved');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<SessionType[]>([]);
  const didLoadSessionsRef = useRef(false);
  const createSessionSheetRef = useRef<BottomSheet | null>(null);
  const primarySaveResultsRef = useRef<Map<string, SaveClipResult>>(new Map());
  const primarySaveInFlightRef = useRef<Map<string, Promise<SaveClipResult>>>(new Map());

  const savePrimaryOnce = useCallback(async (key: string, saver: () => Promise<SaveClipResult>) => {
    const committed = primarySaveResultsRef.current.get(key);
    if (committed?.ok) return committed;

    const inFlight = primarySaveInFlightRef.current.get(key);
    if (inFlight) return inFlight;

    const run = saver().finally(() => {
      primarySaveInFlightRef.current.delete(key);
    });
    primarySaveInFlightRef.current.set(key, run);
    const result = await run;
    if (result.ok) {
      primarySaveResultsRef.current.set(key, result);
    }
    return result;
  }, []);

  const showSecondarySaveWarning = useCallback((text1: string, text2: string) => {
    Toast.show({ type: 'error', text1, text2 });
  }, []);

  const loadSessions = useCallback(async () => {
    if (!session?.access_token) return;
    if (didLoadSessionsRef.current) return;
    didLoadSessionsRef.current = true;
    try {
      let res = await fetch(`${API_BASE}/sessions/`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.status === 404) {
        res = await fetch(`${API_BASE}/sessions`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      }
      if (!res.ok) return;
      const body = (await res.json()) as { sessions: SessionType[] };
      setSessions(Array.isArray(body.sessions) ? body.sessions : []);
    } catch {
      // ignore
    }
  }, [session?.access_token]);

  const saveToSession = useCallback(async (targetSessionId: string) => {
    if (!videoUri) return false;
    if (!session?.access_token) return false;
    setLoading(true);
    try {
      const primaryKey = `session:${targetSessionId}:primary:${videoUri}:${dualPairId ?? 'none'}`;
      const r = await savePrimaryOnce(primaryKey, () =>
        saveClip(
          targetSessionId,
          videoUri,
          'Clip',
          session.access_token,
          undefined,
          dualPairId
        )
      );
      if (!r.ok) {
        Toast.show({ type: 'error', text1: 'Could not save clip' });
        return false;
      }
      let secondaryFailed = false;
      if (dualPairId && secondaryVideoUri) {
        const secondaryResult = await saveClip(
          targetSessionId,
          secondaryVideoUri,
          'Clip',
          session.access_token,
          undefined,
          dualPairId
        );
        if (!secondaryResult.ok) {
          secondaryFailed = true;
          showSecondarySaveWarning('Saved with warning', 'Primary clip saved, second clip failed');
        }
      }
      if (!secondaryFailed) {
        Toast.show({ type: 'success', text1: 'Saved' });
      }
      bottomSheetRef.current?.close();
      onDone({ navigateTo: `/session/${targetSessionId}` });
      return true;
    } finally {
      setLoading(false);
    }
  }, [videoUri, secondaryVideoUri, dualPairId, session?.access_token, bottomSheetRef, onDone, savePrimaryOnce, showSecondarySaveWarning]);

  const saveToSectionSession = useCallback(async () => {
    if (!sessionId) return false;
    if (!videoUri) return false;
    if (!session?.access_token) return false;
    setLoading(true);
    try {
      // Pass sectionName so the upload queue creates a section_clips entry
      // once the server clip_id is confirmed.
      const primaryKey = `section:${sessionId}:${sectionName ?? 'none'}:primary:${videoUri}:${dualPairId ?? 'none'}`;
      const r = await savePrimaryOnce(primaryKey, () =>
        saveClip(
          sessionId,
          videoUri,
          'Clip',
          session.access_token,
          sectionName ?? undefined,
          dualPairId
        )
      );
      if (!r.ok) {
        Toast.show({ type: 'error', text1: 'Could not save clip' });
        return false;
      }
      let secondaryFailed = false;
      if (dualPairId && secondaryVideoUri) {
        const secondaryResult = await saveClip(
          sessionId,
          secondaryVideoUri,
          'Clip',
          session.access_token,
          sectionName ?? undefined,
          dualPairId
        );
        if (!secondaryResult.ok) {
          secondaryFailed = true;
          showSecondarySaveWarning('Saved with warning', 'Primary clip saved, second clip failed');
        }
      }
      if (!secondaryFailed) {
        Toast.show({ type: 'success', text1: 'Saved' });
      }
      bottomSheetRef.current?.close();
      onDone();
      return true;
    } finally {
      setLoading(false);
    }
  }, [sessionId, sectionName, videoUri, secondaryVideoUri, dualPairId, session?.access_token, bottomSheetRef, onDone, savePrimaryOnce, showSecondarySaveWarning]);

  const saveLater = useCallback(async () => {
    if (!videoUri) return false;
    if (!session?.access_token) return false;
    setLoading(true);
    try {
      const primaryKey = `inbox:primary:${videoUri}:${dualPairId ?? 'none'}`;
      const primaryResult = await savePrimaryOnce(primaryKey, () =>
        saveInboxClip(
          videoUri,
          'Clip',
          session.access_token,
          dualPairId
        )
      );
      if (!primaryResult.ok) {
        if (primaryResult.reason === 'plan_limit_reached') {
          Toast.show({ type: 'error', text1: 'Upload limit reached' });
        } else {
          Toast.show({ type: 'error', text1: 'Could not save to Inbox', text2: primaryResult.message });
        }
        return false;
      }
      let secondaryFailed = false;
      if (dualPairId && secondaryVideoUri) {
        const secondaryResult = await saveInboxClip(
          secondaryVideoUri,
          'Clip',
          session.access_token,
          dualPairId
        );
        if (!secondaryResult.ok) {
          secondaryFailed = true;
          showSecondarySaveWarning(
            'Saved to Inbox with warning',
            secondaryResult.reason === 'plan_limit_reached'
              ? 'Primary clip saved, second clip hit upload limit'
              : 'Primary clip saved, second clip failed'
          );
        }
      }
      if (!secondaryFailed) {
        Toast.show({ type: 'success', text1: 'Saved to Inbox' });
      }
      bottomSheetRef.current?.close();
      onDone({ navigateTo: '/inbox' });
      return true;
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Could not save to Inbox' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [videoUri, secondaryVideoUri, dualPairId, session?.access_token, bottomSheetRef, onDone, savePrimaryOnce, showSecondarySaveWarning]);

  const canSaveToCurrentSection = Boolean(sessionId && sectionName);

  return (
    <BottomSheet
      ref={bottomSheetRef as React.RefObject<BottomSheet>}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={styles.sheet}
      handleIndicatorStyle={styles.handle}
      onChange={(idx) => {
        if (idx >= 0) loadSessions().catch(() => {});
      }}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Save clip</Text>

        {mode === 'saved' ? (
          <>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={saveLater}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.light.active} size="small" />
              ) : (
                <Text style={styles.secondaryBtnText}>Later</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => createSessionSheetRef.current?.snapToIndex(0)}
              disabled={loading}
            >
              <Text style={styles.secondaryBtnText}>+ New session</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => {
                setMode('picker');
              }}
              disabled={loading}
            >
              <Text style={styles.primaryBtnText}>Existing →</Text>
            </TouchableOpacity>

            {canSaveToCurrentSection ? (
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => {
                  void saveToSectionSession();
                }}
                disabled={loading}
              >
                <Text style={styles.secondaryBtnText}>{`Save to ${sectionName}`}</Text>
              </TouchableOpacity>
            ) : null}
          </>
        ) : null}

        {mode === 'picker' ? (
          <>
            <Text style={styles.subTitle}>Choose a session</Text>
            <ScrollView style={styles.listScroll} contentContainerStyle={styles.list}>
              {sessions.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.sessionRow}
                  onPress={() => saveToSession(s.id)}
                  disabled={loading}
                >
                  <Text style={styles.sessionText} numberOfLines={1}>
                    {s.name}
                  </Text>
                  <Text style={styles.chev}>→</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.linkBtn} onPress={() => setMode('saved')} disabled={loading}>
              <Text style={styles.linkText}>Back</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>
      <CreateSessionSheet
        bottomSheetRef={createSessionSheetRef}
        onCreated={(newSession) => {
          if (!session?.access_token || !videoUri) return;
          setLoading(true);
          void (async () => {
            try {
              const primaryKey = `session:${newSession.id}:primary:${videoUri}:${dualPairId ?? 'none'}`;
              const primaryResult = await savePrimaryOnce(primaryKey, () =>
                saveClip(
                  newSession.id,
                  videoUri,
                  'Clip',
                  session.access_token,
                  undefined,
                  dualPairId
                )
              );
              if (!primaryResult.ok) {
                Toast.show({ type: 'error', text1: 'Could not save clip' });
                return;
              }
              let secondaryFailed = false;
              if (dualPairId && secondaryVideoUri) {
                const secondaryResult = await saveClip(
                  newSession.id,
                  secondaryVideoUri,
                  'Clip',
                  session.access_token,
                  undefined,
                  dualPairId
                );
                if (!secondaryResult.ok) {
                  secondaryFailed = true;
                  showSecondarySaveWarning(
                    'Saved with warning',
                    'Primary clip saved, second clip failed'
                  );
                }
              }
              if (!secondaryFailed) {
                Toast.show({ type: 'success', text1: 'Saved' });
              }
              bottomSheetRef.current?.close();
              onDone({ navigateTo: `/session/${newSession.id}` });
            } finally {
              setLoading(false);
            }
          })();
        }}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: { backgroundColor: theme.light.ground },
  handle: { backgroundColor: theme.light.inactive },
  content: { padding: 20, paddingBottom: 40, gap: 10 },
  title: { color: theme.light.active, fontSize: 18, fontWeight: '800', marginBottom: 4 },
  subTitle: { color: theme.light.muted, fontSize: 13, marginBottom: 6 },
  primaryBtn: {
    backgroundColor: theme.light.mine,
    borderRadius: theme.borderRadius,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: theme.light.chrome, fontSize: 16, fontWeight: '800' },
  secondaryBtn: {
    backgroundColor: theme.light.chrome,
    borderWidth: 1,
    borderColor: theme.light.border,
    borderRadius: theme.borderRadius,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: { color: theme.light.active, fontSize: 16, fontWeight: '700' },
  linkBtn: { paddingVertical: 10, alignItems: 'center' },
  linkText: { color: theme.light.mine, fontWeight: '800' },
  listScroll: { maxHeight: 240 },
  list: { gap: 10 },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius,
    borderWidth: 1,
    borderColor: theme.light.border,
    backgroundColor: theme.light.chrome,
  },
  sessionText: { color: theme.light.active, fontSize: 16, fontWeight: '700', flex: 1, marginRight: 10 },
  chev: { color: theme.light.muted, fontSize: 18 },
});

