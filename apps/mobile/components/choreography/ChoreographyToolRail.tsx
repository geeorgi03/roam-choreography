import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { useChoreographyTheme } from '../../lib/contexts/ChoreographyThemeContext';
import type { ThemePalette } from '../../lib/contexts/ThemeContext';
import {
  useChoreographyWorkbench,
  type CanvasMode,
  type FloatingPanelId,
} from '../../lib/contexts/ChoreographyWorkbenchContext';
import { MonoCaps } from './ChoreographyPrimitives';

export function ChoreographyToolRail() {
  const colors = useChoreographyTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    canvasMode,
    setCanvasMode,
    floatingPanel,
    togglePanel,
    closePanel,
  } = useChoreographyWorkbench();

  const panelBtn = (id: Exclude<FloatingPanelId, null>, label: string) => {
    const active = floatingPanel === id;
    return (
      <Pressable
        style={[styles.btn, active && styles.btnActive]}
        onPress={() => togglePanel(id)}
      >
        <MonoCaps style={active ? { color: colors.active } : undefined}>{label}</MonoCaps>
      </Pressable>
    );
  };

  const modeBtn = (mode: CanvasMode, label: string) => {
    const active = canvasMode === mode;
    return (
      <Pressable
        style={[styles.btn, active && styles.btnMode]}
        onPress={() => {
          closePanel();
          setCanvasMode(mode);
        }}
      >
        <MonoCaps style={active ? { color: colors.primary } : undefined}>{label}</MonoCaps>
      </Pressable>
    );
  };

  return (
    <View style={styles.rail}>
      {panelBtn('sections', '▦')}
      {panelBtn('lyrics', '♪')}
      {panelBtn('takes', '▤')}
      <View style={styles.divider} />
      {modeBtn('practice', '◎')}
      {modeBtn('draw', '✎')}
      {modeBtn('video', '▸')}
      {modeBtn('compose', '≡')}
    </View>
  );
}

function createStyles(colors: ThemePalette) {
  return StyleSheet.create({
    rail: {
      position: 'absolute',
      right: 10,
      top: '26%',
      zIndex: 10,
      gap: 6,
      padding: 6,
      borderRadius: 12,
      backgroundColor: colors.surfaceGlass,
      borderWidth: 1,
      borderColor: colors.border,
    },
    btn: {
      paddingHorizontal: 8,
      paddingVertical: 9,
      borderRadius: 8,
      alignItems: 'center',
      minWidth: 40,
    },
    btnActive: {
      backgroundColor: colors.surfaceElevated,
    },
    btnMode: {
      backgroundColor: colors.primaryBg,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 4,
    },
  });
}
