import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTheme, type ThemePalette } from '../../lib/contexts/ThemeContext';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { PremiumWorkbenchTopBar } from './PremiumWorkbenchTopBar';
import { PremiumSongHeader } from './PremiumSongHeader';
import { PremiumSectionMap } from './PremiumSectionMap';
import { PremiumLoopPanel } from './PremiumLoopPanel';
import { PremiumTakesList } from './PremiumTakesList';
import { PremiumSectionLab } from './PremiumSectionLab';
import { useTabletLandscape } from '../../lib/hooks/useTabletLandscape';
import { PremiumWorkbenchEmpty, type EmptyMode } from './PremiumWorkbenchEmpty';
import { PremiumTransportDock } from './PremiumTransportDock';
import { SessionCollabBar } from '../session/SessionCollabBar';

const DOCK_PADDING = 120;

export function PremiumWorkbenchTab() {
  const { colors } = useTheme();
  const { isTabletLandscape } = useTabletLandscape();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { musicTrack, isAnalysing, clips, sectionClips } = useSessionContext();

  const emptyMode: EmptyMode | null = useMemo(() => {
    if (!musicTrack) return 'no-music';
    if (isAnalysing) return null;
    const hasClips = clips.length > 0 || sectionClips.length > 0;
    if (!hasClips) return 'ready-no-clips';
    return null;
  }, [musicTrack, isAnalysing, clips.length, sectionClips.length]);

  return (
    <View style={styles.root}>
      <PremiumWorkbenchTopBar />
      <SessionCollabBar compact />
      {emptyMode ? (
        <PremiumWorkbenchEmpty mode={emptyMode} />
      ) : isTabletLandscape ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <PremiumSongHeader />
          <PremiumSectionMap />
          <PremiumLoopPanel />
          <PremiumTakesList />
        </ScrollView>
      ) : (
        <PremiumSectionLab />
      )}
      <PremiumTransportDock />
    </View>
  );
}

function createStyles(colors: ThemePalette) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.ground,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: DOCK_PADDING,
    },
  });
}
