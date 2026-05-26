import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Text, Image } from 'react-native';
import type { SectionEntry } from '@roam/types';
import { useChoreographyTheme } from '../../lib/contexts/ChoreographyThemeContext';
import { sectionColorForIndex } from '../../lib/choreographyTheme';
import type { ThemePalette } from '../../lib/contexts/ThemeContext';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { sectionsWithSpan } from '../../lib/premiumUtils';
import { getDrawStrokes } from '../../lib/choreographyDrawStrokes';
import type { ClipRow } from '../../lib/database';
import { MonoCaps } from './ChoreographyPrimitives';

const TRACKS = [
  { id: 'song', label: 'Song' },
  { id: 'lyrics', label: 'Lyrics' },
  { id: 'mine', label: 'My video' },
  { id: 'ref', label: 'Reference' },
  { id: 'draw', label: 'Drawing' },
] as const;

function muxThumb(clip: ClipRow): string | null {
  if (!clip.mux_playback_id) return null;
  return `https://image.mux.com/${clip.mux_playback_id}/thumbnail.jpg?width=96&height=54&fit_mode=smartcrop`;
}

export function ChoreographyComposeView() {
  const colors = useChoreographyTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    musicTrack,
    durationMs,
    clips,
    sectionClips,
    activeSection,
    sessionId,
    sessionPhrase,
  } = useSessionContext();
  const sections = musicTrack?.sections ?? [];
  const totalMs = Math.max(durationMs, 1);
  const spans = useMemo(
    () => sectionsWithSpan(sections as SectionEntry[], totalMs),
    [sections, totalMs]
  );

  const clipByServerId = useMemo(() => {
    const map = new Map<string, ClipRow>();
    for (const c of clips) {
      if (c.server_id) map.set(c.server_id, c);
    }
    return map;
  }, [clips]);

  const clipsForSection = useMemo(() => {
    const bySection = new Map<string, ClipRow[]>();
    for (const sc of sectionClips) {
      const clip = clipByServerId.get(sc.clip_id);
      if (!clip) continue;
      const list = bySection.get(sc.section_label) ?? [];
      list.push(clip);
      bySection.set(sc.section_label, list);
    }
    if (bySection.size === 0) {
      for (const c of clips) {
        const label = activeSection || 'Section';
        const list = bySection.get(label) ?? [];
        list.push(c);
        bySection.set(label, list);
      }
    }
    return bySection;
  }, [sectionClips, clipByServerId, clips, activeSection]);

  const mineClips = useMemo(
    () => clips.filter((c) => c.clip_type !== 'REF'),
    [clips]
  );
  const refClips = useMemo(
    () => clips.filter((c) => c.clip_type === 'REF'),
    [clips]
  );

  const drawCount = useMemo(() => {
    if (!sessionId) return 0;
    return getDrawStrokes(sessionId, activeSection).length;
  }, [sessionId, activeSection]);

  const renderLaneBlocks = (
    trackClips: ClipRow[],
    variant: 'mine' | 'ref'
  ) => (
    <View style={styles.laneInner}>
      {spans.length === 0 ? (
        <MonoCaps>No sections on song map</MonoCaps>
      ) : (
        spans.map((span, spanIndex) => {
          const inSection = (clipsForSection.get(span.label) ?? []).filter((c) =>
            trackClips.some((t) => t.local_id === c.local_id)
          );
          const fallback =
            span.label === activeSection
              ? trackClips.filter(
                  (c) => !(clipsForSection.get(span.label) ?? []).length
                )
              : [];
          const rowClips = inSection.length > 0 ? inSection : fallback;
          return (
            <View
              key={`${span.label}-${spanIndex}`}
              style={[styles.laneSeg, { flex: span.flex }]}
            >
              {rowClips.slice(0, 4).map((clip) => {
                const thumb = muxThumb(clip);
                return (
                  <View
                    key={clip.local_id}
                    style={[
                      styles.clipBlock,
                      variant === 'ref' && styles.clipBlockRef,
                    ]}
                  >
                    {thumb ? (
                      <Image source={{ uri: thumb }} style={styles.clipThumb} />
                    ) : (
                      <View style={styles.clipThumbPlaceholder} />
                    )}
                    <Text style={styles.clipBlockLabel} numberOfLines={1}>
                      {clip.label ?? clip.move_name ?? 'Clip'}
                    </Text>
                  </View>
                );
              })}
            </View>
          );
        })
      )}
    </View>
  );

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <MonoCaps style={styles.hint}>
        Compose · {sessionPhrase ? sessionPhrase : 'read-only timeline'}
      </MonoCaps>
      <View style={styles.ruler}>
        {spans.length > 0 ? (
          spans.map((s, i) => (
            <View key={`${s.label}-${i}`} style={styles.rulerSegWrap}>
              <View
                style={[
                  styles.rulerSeg,
                  { flex: s.flex, backgroundColor: sectionColorForIndex(i) },
                ]}
              />
              <Text style={styles.rulerLabel} numberOfLines={1}>
                {s.label}
              </Text>
            </View>
          ))
        ) : (
          <MonoCaps>No sections</MonoCaps>
        )}
      </View>

      {TRACKS.map((track) => (
        <View key={track.id} style={styles.trackRow}>
          <Text style={styles.trackLabel}>{track.label}</Text>
          <View style={styles.trackLane}>
            {track.id === 'song' ? (
              <View style={styles.laneInner}>
                {spans.map((s, i) => (
                  <View
                    key={`${s.label}-${i}`}
                    style={[
                      styles.songSeg,
                      { flex: s.flex, borderColor: sectionColorForIndex(i) },
                    ]}
                  >
                    <MonoCaps style={{ color: sectionColorForIndex(i) }}>
                      {s.label}
                    </MonoCaps>
                  </View>
                ))}
              </View>
            ) : null}
            {track.id === 'lyrics' ? (
              <MonoCaps>
                {musicTrack?.lyrics_url ? 'Lyrics linked' : 'Open Lyrics panel for lines'}
              </MonoCaps>
            ) : null}
            {track.id === 'mine' ? renderLaneBlocks(mineClips, 'mine') : null}
            {track.id === 'ref' ? renderLaneBlocks(refClips, 'ref') : null}
            {track.id === 'draw' ? (
              <MonoCaps>
                {drawCount} stroke{drawCount === 1 ? '' : 's'} on {activeSection}
              </MonoCaps>
            ) : null}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function createStyles(colors: ThemePalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: '#090910' },
    content: { padding: 16, paddingBottom: 32 },
    hint: { marginBottom: 12 },
    ruler: {
      flexDirection: 'row',
      marginBottom: 16,
      gap: 2,
    },
    rulerSegWrap: { flex: 1, minWidth: 24 },
    rulerSeg: { height: 8, borderRadius: 4 },
    rulerLabel: {
      marginTop: 4,
      fontSize: 9,
      color: colors.muted,
      textTransform: 'uppercase',
    },
    trackRow: {
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      overflow: 'hidden',
    },
    trackLabel: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 12,
      fontWeight: '700',
      color: colors.muted,
      backgroundColor: colors.chrome,
    },
    trackLane: {
      padding: 10,
      minHeight: 52,
      justifyContent: 'center',
    },
    laneInner: { flexDirection: 'row', minHeight: 48, gap: 2 },
    laneSeg: {
      minWidth: 28,
      padding: 4,
      gap: 4,
      justifyContent: 'flex-start',
    },
    songSeg: {
      minWidth: 28,
      padding: 6,
      borderRadius: 6,
      borderWidth: 1,
      backgroundColor: colors.chrome,
      justifyContent: 'center',
    },
    clipBlock: {
      borderRadius: 6,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.surfaceElevated,
      marginBottom: 4,
    },
    clipBlockRef: { borderColor: colors.ref },
    clipThumb: { width: '100%', height: 36 },
    clipThumbPlaceholder: {
      width: '100%',
      height: 36,
      backgroundColor: colors.chrome,
    },
    clipBlockLabel: {
      fontSize: 9,
      color: colors.active,
      paddingHorizontal: 4,
      paddingVertical: 2,
    },
  });
}
