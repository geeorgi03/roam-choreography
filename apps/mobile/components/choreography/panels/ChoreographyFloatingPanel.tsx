import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useChoreographyTheme } from '../../../lib/contexts/ChoreographyThemeContext';
import { sectionColorForIndex } from '../../../lib/choreographyTheme';
import type { ThemePalette } from '../../../lib/contexts/ThemeContext';
import { useSessionContext } from '../../../lib/contexts/SessionContext';
import { useChoreographyWorkbench } from '../../../lib/contexts/ChoreographyWorkbenchContext';
import type { SectionEntry } from '@roam/types';
import { sectionsWithSpan } from '../../../lib/premiumUtils';
import { MonoCaps, DisplayTitle } from '../ChoreographyPrimitives';
import { useLyricsLookup } from '../../../lib/hooks/useLyricsLookup';
import { useChoreographyFonts } from '../../../lib/hooks/useChoreographyFonts';

type Props = {
  onClose: () => void;
};

export function ChoreographyFloatingPanel({ onClose }: Props) {
  const colors = useChoreographyTheme();
  const fonts = useChoreographyFonts();
  const styles = useMemo(() => createStyles(colors, fonts.body), [colors, fonts.body]);
  const { floatingPanel, setCanvasClip, canvasClip } = useChoreographyWorkbench();
  const {
    musicTrack,
    durationMs,
    activeSection,
    setActiveSection,
    clips,
    playheadMs,
    openClipSheet,
  } = useSessionContext();
  const lyrics = useLyricsLookup();

  const sections = musicTrack?.sections ?? [];
  const spans = useMemo(
    () => sectionsWithSpan(sections as SectionEntry[], Math.max(durationMs, 1)),
    [sections, durationMs]
  );

  const sectionClips = clips.filter((c) => {
    const sec = (c as { section?: string }).section;
    return !activeSection || activeSection === 'Section' || sec === activeSection || !sec;
  });

  const activeLyricLine = lyrics.lines.find(
    (line, i, arr) =>
      playheadMs >= line.timeMs &&
      (i === arr.length - 1 || playheadMs < (arr[i + 1]?.timeMs ?? Number.MAX_SAFE_INTEGER))
  );

  if (!floatingPanel) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.scrim} onPress={onClose} />
      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <DisplayTitle>
            {floatingPanel === 'sections'
              ? 'Sections'
              : floatingPanel === 'lyrics'
                ? 'Lyrics'
                : floatingPanel === 'takes'
                  ? 'Takes'
                  : 'Draw'}
          </DisplayTitle>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>

        {floatingPanel === 'sections' ? (
          <ScrollView style={styles.scroll}>
            {spans.map((s, i) => (
              <Pressable
                key={`${s.label}-${i}`}
                style={styles.sectionRow}
                onPress={() => setActiveSection(s.label)}
              >
                <View style={[styles.stripe, { backgroundColor: sectionColorForIndex(i) }]} />
                <Text style={[styles.rowTitle, activeSection === s.label && styles.rowActive]}>
                  {s.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        {floatingPanel === 'lyrics' ? (
          <View style={styles.scroll}>
            <TextInput
              style={styles.input}
              placeholder="Artist - Title"
              placeholderTextColor={colors.muted}
              value={lyrics.query}
              onChangeText={lyrics.setQuery}
            />
            <Pressable style={styles.fetchBtn} onPress={() => void lyrics.fetch()}>
              {lyrics.loading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <MonoCaps style={{ color: colors.primary }}>Fetch lyrics</MonoCaps>
              )}
            </Pressable>
            {lyrics.error ? <Text style={styles.error}>{lyrics.error}</Text> : null}
            <ScrollView style={styles.lyricsScroll}>
              {lyrics.lines.map((line) => (
                <Text
                  key={`${line.timeMs}-${line.text}`}
                  style={[
                    styles.lyricLine,
                    activeLyricLine?.timeMs === line.timeMs && styles.lyricActive,
                  ]}
                >
                  {line.text}
                </Text>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {floatingPanel === 'takes' ? (
          <ScrollView style={styles.scroll}>
            {sectionClips.map((clip, idx) => {
              const isRef = clip.clip_type === 'REF';
              const selected = canvasClip?.local_id === clip.local_id;
              return (
                <Pressable
                  key={clip.local_id}
                  style={[styles.takeRow, selected && styles.takeSelected]}
                  onPress={() => {
                    setCanvasClip(clip);
                    openClipSheet(clip);
                  }}
                >
                  <MonoCaps style={{ color: isRef ? colors.ref : colors.primary }}>
                    {isRef ? 'REF' : `TAKE ${idx + 1}`}
                  </MonoCaps>
                  <Text style={styles.takeLabel}>{clip.label ?? 'Clip'}</Text>
                </Pressable>
              );
            })}
            {sectionClips.length === 0 ? (
              <MonoCaps style={styles.empty}>No ready clips in this section</MonoCaps>
            ) : null}
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}

function createStyles(colors: ThemePalette, bodyFont: string) {
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 20,
      flexDirection: 'row',
    },
    scrim: { flex: 1 },
    panel: {
      width: 278,
      maxWidth: '78%',
      backgroundColor: 'rgba(17, 17, 23, 0.97)',
      borderLeftWidth: 1,
      borderLeftColor: colors.border,
      paddingTop: 12,
    },
    panelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      marginBottom: 8,
    },
    close: { color: colors.muted, fontSize: 18 },
    scroll: { flex: 1, paddingHorizontal: 14 },
    sectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    stripe: { width: 4, height: 28, borderRadius: 2, marginRight: 10 },
    rowTitle: { fontSize: 15, fontFamily: bodyFont, color: colors.active },
    rowActive: { color: colors.primary, fontWeight: '700' },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 10,
      color: colors.active,
      fontFamily: bodyFont,
      marginBottom: 8,
    },
    fetchBtn: {
      alignItems: 'center',
      paddingVertical: 10,
      marginBottom: 8,
    },
    error: { color: colors.error, fontSize: 12, marginBottom: 8 },
    lyricsScroll: { maxHeight: 320 },
    lyricLine: {
      fontSize: 13,
      fontFamily: bodyFont,
      color: colors.muted,
      paddingVertical: 6,
    },
    lyricActive: {
      fontSize: 15,
      color: colors.active,
      fontWeight: '600',
    },
    takeRow: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    takeSelected: { backgroundColor: colors.primaryBg },
    takeLabel: {
      marginTop: 4,
      fontSize: 14,
      fontFamily: bodyFont,
      color: colors.active,
    },
    empty: { marginTop: 16, textAlign: 'center' },
  });
}
