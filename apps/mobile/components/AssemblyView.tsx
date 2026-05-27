import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { theme } from '../lib/theme';
import { useSession } from '../lib/hooks/useSession';
import { useMusicTrackStatus } from '../lib/hooks/useMusicTrackStatus';
import { useClips } from '../lib/hooks/useClips';
import type { SectionClip, SectionEntry } from '@roam/types';
import type { ClipRow } from '../lib/database';
import { apiRequest, ApiRequestError } from '../lib/api';

// Lazy require so a native-module init error doesn't prevent route discovery
let GestureDetector: React.ComponentType<{ gesture: unknown; children: React.ReactNode }> =
  ({ children }) => <>{children}</>;
let Gesture: { Pan: () => { onBegin: (fn: (e: { translationX: number }) => unknown) => unknown; onUpdate: (fn: (e: { translationX: number }) => unknown) => unknown; onEnd: (fn: (e: { translationX: number }) => void) => unknown } } = {
  Pan: () => ({ onBegin: () => ({}), onUpdate: () => ({}), onEnd: () => ({}) }),
};
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const gh = require('react-native-gesture-handler') as typeof import('react-native-gesture-handler');
  GestureDetector = gh.GestureDetector as unknown as typeof GestureDetector;
  Gesture = gh.Gesture as unknown as typeof Gesture;
} catch (_) {
  // gesture handler unavailable — drag-to-assign disabled
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LEFT_WIDTH = SCREEN_WIDTH * 0.55;
const RIGHT_WIDTH = SCREEN_WIDTH * 0.45;
const colors = theme.light;
const spacing = theme.spacing;

type Assignment = {
  section_label: string;
  section_start_ms: number;
  clip_id: string;
  position: number;
};

export function AssemblyView({
  sessionId,
  onBack,
}: {
  sessionId: string;
  onBack?: () => void;
}) {
  const { session } = useSession();
  const { musicTrack } = useMusicTrackStatus(sessionId);
  const { clips } = useClips(sessionId, undefined);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedSection, setSelectedSection] = useState<SectionEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [assemblyRevision, setAssemblyRevision] = useState<string | null>(null);

  const sections = (musicTrack?.sections ?? []) as SectionEntry[];

  const mapAssignments = useCallback((payload: unknown): Assignment[] => {
    const list = Array.isArray(payload)
      ? payload
      : payload && typeof payload === 'object' && 'assignments' in payload
        ? (payload as { assignments?: unknown }).assignments
        : [];
    return (Array.isArray(list) ? list : []).map((a) => {
      const row = a as SectionClip;
      return {
        section_label: row.section_label,
        section_start_ms: row.section_start_ms,
        clip_id: row.clip_id,
        position: row.position,
      };
    });
  }, []);

  const loadAssignments = useCallback(async () => {
    if (!sessionId || !session?.access_token) return;
    const res = await apiRequest(`/sessions/${sessionId}/assembly`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      timeoutMs: 8_000,
      retries: 2,
    });
    setAssemblyRevision(res.headers.get('x-assembly-revision'));
    const data = (await res.json()) as unknown;
    setAssignments(mapAssignments(data));
  }, [session?.access_token, sessionId, mapAssignments]);

  useEffect(() => {
    if (!sessionId || !session?.access_token) return;
    let mounted = true;
    (async () => {
      try {
        await loadAssignments();
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [sessionId, session?.access_token, loadAssignments]);

  const persistAssignments = useCallback(
    async (next: Assignment[]) => {
      if (!sessionId || !session?.access_token) return;
      try {
        const res = await apiRequest(`/sessions/${sessionId}/assembly`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            ...(assemblyRevision ? { 'x-assembly-revision': assemblyRevision } : {}),
          },
          body: JSON.stringify({ assignments: next }),
          timeoutMs: 10_000,
          retries: 1,
        });
        setAssemblyRevision(res.headers.get('x-assembly-revision'));
        const data = (await res.json()) as unknown;
        const mapped = mapAssignments(data);
        setAssignments(mapped.length > 0 ? mapped : next);
      } catch (error) {
        if (error instanceof ApiRequestError && error.status === 409) {
          setSaveError('Assembly changed elsewhere. Reloaded latest state.');
          await loadAssignments();
          return;
        }
        setSaveError('Could not save assembly changes. Please try again.');
      }
    },
    [sessionId, session?.access_token, assemblyRevision, mapAssignments, loadAssignments]
  );

  const getClipsForSection = useCallback(
    (section: SectionEntry) => {
      return assignments
        .filter(
          (a) =>
            a.section_label === section.label && a.section_start_ms === section.start_ms
        )
        .sort((a, b) => a.position - b.position)
        .map((a) => clips.find((c) => c.server_id === a.clip_id))
        .filter((c): c is ClipRow => !!c);
    },
    [assignments, clips]
  );

  const handleAddClip = useCallback(
    (clipId: string) => {
      if (!selectedSection) return;
      const existing = assignments.filter(
        (a) =>
          a.section_label === selectedSection.label &&
          a.section_start_ms === selectedSection.start_ms
      );
      const maxPos = existing.length > 0 ? Math.max(...existing.map((a) => a.position)) : -1;
      const next: Assignment[] = [
        ...assignments,
        {
          section_label: selectedSection.label,
          section_start_ms: selectedSection.start_ms,
          clip_id: clipId,
          position: maxPos + 1,
        },
      ];
      persistAssignments(next);
    },
    [selectedSection, assignments, persistAssignments]
  );

  const handleRemoveClip = useCallback(
    (section: SectionEntry, clipId: string) => {
      const next = assignments.filter(
        (a) =>
          !(
            a.section_label === section.label &&
            a.section_start_ms === section.start_ms &&
            a.clip_id === clipId
          )
      );
      persistAssignments(next);
    },
    [assignments, persistAssignments]
  );

  const handleReorder = useCallback(
    (section: SectionEntry, clipIds: string[]) => {
      const other = assignments.filter(
        (a) =>
          !(
            a.section_label === section.label &&
            a.section_start_ms === section.start_ms
          )
      );
      const reordered: Assignment[] = clipIds.map((clip_id, position) => ({
        section_label: section.label,
        section_start_ms: section.start_ms,
        clip_id,
        position,
      }));
      persistAssignments([...other, ...reordered]);
    },
    [assignments, persistAssignments]
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.placeholderText}>Loading…</Text>
      </View>
    );
  }

  if (sections.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.placeholderText}>
          Set up music with sections first
        </Text>
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {saveError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{saveError}</Text>
        </View>
      ) : null}
      <View style={styles.row}>
        <View style={[styles.panel, { width: LEFT_WIDTH }]}>
          <Text style={styles.panelTitle}>Sections</Text>
          <FlatList
            data={sections}
            keyExtractor={(item) => `${item.label}-${item.start_ms}`}
            renderItem={({ item }) => {
              const sectionClips = getClipsForSection(item);
              const isSelected =
                selectedSection?.label === item.label &&
                selectedSection?.start_ms === item.start_ms;
              return (
                <View style={styles.sectionRow}>
                  <TouchableOpacity
                    style={[styles.sectionHeader, isSelected && styles.sectionHeaderSelected]}
                    onPress={() => setSelectedSection(item)}
                  >
                    <Text style={styles.sectionLabel}>{item.label}</Text>
                    <Text style={styles.sectionTime}>
                      {Math.floor(item.start_ms / 1000)}s
                    </Text>
                  </TouchableOpacity>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.assignedClips}
                    contentContainerStyle={styles.assignedClipsContent}
                  >
                    {sectionClips.map((clip) => (
                      <AssignedClipThumb
                        key={clip.server_id ?? clip.local_id}
                        clip={clip}
                        section={item}
                        onRemove={() => handleRemoveClip(item, clip.server_id!)}
                        onReorder={(newOrder) =>
                          handleReorder(item, newOrder.map((c) => c.server_id!))
                        }
                        allClips={sectionClips}
                      />
                    ))}
                  </ScrollView>
                </View>
              );
            }}
          />
        </View>
        <View style={[styles.panel, { width: RIGHT_WIDTH }]}>
          <Text style={styles.panelTitle}>Clips</Text>
          <View style={styles.clipGrid}>
            {clips
              .filter((c) => c.server_id && c.upload_status === 'ready')
              .map((clip) => (
                <TouchableOpacity
                  key={clip.server_id!}
                  style={styles.clipThumbWrap}
                  onPress={() => selectedSection && handleAddClip(clip.server_id!)}
                  disabled={!selectedSection}
                >
                  <Image
                    source={{
                      uri: `https://image.mux.com/${clip.mux_playback_id}/thumbnail.jpg?time=0`,
                    }}
                    style={styles.clipThumbImg}
                  />
                  <Text style={styles.clipThumbLabel} numberOfLines={1}>
                    {clip.move_name ?? clip.label ?? 'Clip'}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        </View>
      </View>
      {onBack && (
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function AssignedClipThumb({
  clip,
  onRemove,
  onReorder,
  allClips,
}: {
  clip: ClipRow;
  section: SectionEntry;
  onRemove: () => void;
  onReorder: (clips: ClipRow[]) => void;
  allClips: ClipRow[];
}) {
  const panGesture = Gesture.Pan()
    .onEnd((e) => {
      if (Math.abs(e.translationX) > 40) {
        const idx = allClips.findIndex((c) => c.server_id === clip.server_id);
        if (idx < 0) return;
        const next = [...allClips];
        const targetIdx = e.translationX > 0 ? idx + 1 : idx - 1;
        if (targetIdx >= 0 && targetIdx < next.length) {
          [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
          onReorder(next);
        }
      }
    });

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.assignedThumbWrap}>
        <Image
          source={{
            uri: `https://image.mux.com/${clip.mux_playback_id}/thumbnail.jpg?time=0`,
          }}
          style={styles.assignedThumbImg}
        />
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={onRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.removeBtnText}>×</Text>
        </TouchableOpacity>
      </View>
    </GestureDetector>
  );
}

const t = theme.light;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.ground,
  },
  row: {
    flexDirection: 'row',
    flex: 1,
  },
  errorBanner: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: 'rgba(255, 90, 90, 0.12)',
  },
  errorBannerText: {
    color: colors.active,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  panel: {
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.active,
    marginBottom: 12,
  },
  sectionRow: {
    marginBottom: 16,
  },
  sectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.chrome,
    marginBottom: 8,
  },
  sectionHeaderSelected: {
    backgroundColor: colors.amberBg,
    borderWidth: 1,
    borderColor: colors.warm,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.active,
  },
  sectionTime: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  assignedClips: {
    maxHeight: 80,
  },
  assignedClipsContent: {
    gap: 8,
    paddingRight: 8,
  },
  assignedThumbWrap: {
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  assignedThumbImg: {
    width: 64,
    height: 64,
  },
  removeBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(58,52,45,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    color: colors.chrome,
    fontSize: 16,
    fontWeight: '600',
  },
  clipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  clipThumbWrap: {
    width: (RIGHT_WIDTH - 24 - 16) / 2,
    aspectRatio: 16 / 9,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.chrome,
  },
  clipThumbImg: {
    width: '100%',
    height: '100%',
  },
  clipThumbLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 4,
    fontSize: 10,
    color: colors.chrome,
    backgroundColor: 'rgba(58,52,45,0.6)',
  },
  placeholderText: {
    fontSize: 16,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 48,
  },
  backBtn: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.chrome,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.active,
  },
});
