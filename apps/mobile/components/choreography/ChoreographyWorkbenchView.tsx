import React, { useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Text,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import type { SectionEntry } from '@roam/types';
import { useChoreographyTheme } from '../../lib/contexts/ChoreographyThemeContext';
import { choreographyCanvas, sectionColorForIndex } from '../../lib/choreographyTheme';
import type { ThemePalette } from '../../lib/contexts/ThemeContext';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { ChoreographyWorkbenchProvider, useChoreographyWorkbench } from '../../lib/contexts/ChoreographyWorkbenchContext';
import { sectionsWithSpan } from '../../lib/premiumUtils';
import { GlassBar, SectionPill, MonoCaps } from './ChoreographyPrimitives';
import { ChoreographyTransport } from './ChoreographyTransport';
import { ChoreographyMuxVideo } from './ChoreographyMuxVideo';
import { ChoreographyToolRail } from './ChoreographyToolRail';
import { ChoreographyFloatingPanel } from './panels/ChoreographyFloatingPanel';
import { ChoreographyDrawCanvas } from './ChoreographyDrawCanvas';
import { ChoreographyComposeView } from './ChoreographyComposeView';
import { useChoreographyFonts } from '../../lib/hooks/useChoreographyFonts';
import { useTranslation } from '../../lib/i18n';
import { getDeviceTier, uxTokens } from '../../lib/designTokens';

function WorkbenchBody() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const tier = getDeviceTier(width);
  const colors = useChoreographyTheme();
  const fonts = useChoreographyFonts();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, fonts.display, tier), [colors, fonts.display, tier]);
  const {
    musicTrack,
    activeSection,
    setActiveSection,
    clips,
    sessionId,
    playbackSpeed,
    setPlaybackSpeed,
  } = useSessionContext();
  const { canvasMode, mirror, setMirror, canvasClip, setCanvasClip, closePanel } =
    useChoreographyWorkbench();

  const sections = musicTrack?.sections ?? [];
  const spans = useMemo(
    () => sectionsWithSpan(sections as SectionEntry[], Math.max(1, 240000)),
    [sections]
  );

  const sectionClips = useMemo(
    () =>
      clips.filter((c) => {
        const sec = (c as { section?: string }).section;
        return !activeSection || sec === activeSection || activeSection === 'Section' || !sec;
      }),
    [clips, activeSection]
  );

  const cycleSpeed = () => {
    const steps = [0.5, 0.75, 1, 1.25, 1.5];
    const idx = steps.indexOf(playbackSpeed);
    setPlaybackSpeed(steps[(idx + 1) % steps.length] ?? 1);
  };

  const goRecord = useCallback(() => {
    router.push({
      pathname: './camera',
      params: { id: sessionId, sectionName: activeSection },
    });
  }, [router, sessionId, activeSection]);

  const canvasBg =
    canvasMode === 'practice'
      ? choreographyCanvas.practice
      : canvasMode === 'draw' || canvasMode === 'compose'
        ? choreographyCanvas.practice
        : choreographyCanvas.video;

  return (
    <View style={styles.root}>
      <View style={[styles.canvas, { backgroundColor: canvasBg }]}>
        {canvasMode === 'draw' ? (
          <ChoreographyDrawCanvas />
        ) : canvasMode === 'compose' ? (
          <ChoreographyComposeView />
        ) : (
          <>
            {canvasMode !== 'video' ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.sectionScroll}
                contentContainerStyle={styles.sectionScrollContent}
              >
                {spans.length > 0 ? (
                  spans.map((s, i) => (
                    <SectionPill
                      key={`${s.label}-${i}`}
                      label={s.label}
                      active={activeSection === s.label}
                      color={sectionColorForIndex(i)}
                      onPress={() => {
                        closePanel();
                        setActiveSection(s.label);
                      }}
                    />
                  ))
                ) : (
                  <SectionPill
                    label={activeSection}
                    active
                    color={colors.primary}
                    onPress={closePanel}
                  />
                )}
              </ScrollView>
            ) : null}

            <View style={styles.canvasTopRight}>
              <Pressable onPress={() => setMirror(!mirror)}>
                <GlassBar style={styles.toolChip}>
                  <MonoCaps>{mirror ? t('choreo.workbench.mirrorOn') : t('choreo.workbench.mirror')}</MonoCaps>
                </GlassBar>
              </Pressable>
              <Pressable onPress={cycleSpeed}>
                <GlassBar style={styles.toolChip}>
                  <MonoCaps>{playbackSpeed.toFixed(2).replace(/\.?0+$/, '')}×</MonoCaps>
                </GlassBar>
              </Pressable>
            </View>

            <View style={styles.videoArea}>
              <ChoreographyMuxVideo
                clip={canvasClip}
                practiceLoupe={canvasMode === 'practice'}
              />
            </View>

            {canvasMode === 'video' ? (
              <View style={styles.bottomFloat}>
                <Pressable style={styles.recordBtn} onPress={goRecord}>
                  <View style={styles.recordDot} />
                  <Text style={[styles.recordLabel, { fontFamily: fonts.display }]}>
                    {t('choreo.workbench.record')}
                  </Text>
                </Pressable>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.clipStrip}
                  contentContainerStyle={styles.clipStripContent}
                >
                  {sectionClips.slice(0, 12).map((clip) => {
                    const isRef = clip.clip_type === 'REF';
                    const selected = canvasClip?.local_id === clip.local_id;
                    return (
                      <Pressable
                        key={clip.local_id}
                        style={[
                          styles.clipChip,
                          isRef && styles.clipChipRef,
                          selected && styles.clipChipSelected,
                        ]}
                        onPress={() => setCanvasClip(clip)}
                      >
                        <MonoCaps style={{ color: isRef ? colors.ref : colors.primary }}>
                          {isRef ? t('choreo.clip.ref') : t('choreo.clip.mine')}
                        </MonoCaps>
                        <Text style={styles.clipLabel} numberOfLines={1}>
                          {clip.label ?? clip.move_name ?? t('choreo.clip.clip')}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            <ChoreographyToolRail />
            <ChoreographyFloatingPanel onClose={closePanel} />
          </>
        )}
      </View>
      <ChoreographyTransport />
    </View>
  );
}

export function ChoreographyWorkbenchView() {
  return (
    <ChoreographyWorkbenchProvider>
      <WorkbenchBody />
    </ChoreographyWorkbenchProvider>
  );
}

function createStyles(colors: ThemePalette, displayFont: string, tier: 'phone' | 'tablet') {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.ground },
    canvas: { flex: 1 },
    sectionScroll: {
      position: 'absolute',
      top: uxTokens.spacing.sm,
      left: uxTokens.spacing.sm,
      right: 72,
      maxHeight: 44,
      zIndex: 2,
    },
    sectionScrollContent: { gap: 8, paddingRight: 12 },
    canvasTopRight: {
      position: 'absolute',
      top: uxTokens.spacing.sm,
      right: 56,
      gap: uxTokens.spacing.xs,
      zIndex: 2,
      alignItems: 'flex-end',
    },
    toolChip: { paddingHorizontal: 10, paddingVertical: 8 },
    videoArea: {
      flex: 1,
      marginTop: tier === 'tablet' ? 64 : 56,
      marginBottom: tier === 'tablet' ? 116 : 100,
    },
    bottomFloat: {
      position: 'absolute',
      bottom: 16,
      left: uxTokens.spacing.sm,
      right: 56,
      gap: uxTokens.spacing.sm,
      zIndex: 3,
      flexDirection: 'row',
      alignItems: 'center',
    },
    recordBtn: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: tier === 'tablet' ? 22 : 18,
      paddingVertical: tier === 'tablet' ? 13 : 11,
      borderRadius: 999,
      borderWidth: 2,
      borderColor: colors.primary,
      backgroundColor: colors.primaryBg,
    },
    recordDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
    },
    recordLabel: {
      fontSize: uxTokens.typography.nav[tier],
      fontWeight: '900',
      letterSpacing: 2,
      color: colors.primary,
    },
    clipStrip: { flex: 1, maxHeight: 72 },
    clipStripContent: { paddingHorizontal: 12, gap: 8 },
    clipChip: {
      width: 120,
      padding: 10,
      borderRadius: 10,
      backgroundColor: colors.surfaceGlass,
      borderWidth: 1,
      borderColor: colors.border,
    },
    clipChipRef: { borderColor: colors.ref },
    clipChipSelected: { borderColor: colors.primary, borderWidth: 2 },
    clipLabel: { marginTop: 4, fontSize: 12, color: colors.active, fontWeight: '600' },
  });
}
