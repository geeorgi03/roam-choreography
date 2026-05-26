import React, { useMemo, useState } from 'react';
import { View, StyleSheet, PanResponder, Pressable, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useChoreographyTheme } from '../../lib/contexts/ChoreographyThemeContext';
import type { ThemePalette } from '../../lib/contexts/ThemeContext';
import { MonoCaps } from './ChoreographyPrimitives';

const COLORS = ['#FF2D6B', '#FFE135', '#3B82F6', '#10B981', '#F59E0B', '#EEEEF5', '#8B5CF6', '#fff'];

export function ChoreographyDrawCanvas() {
  const colors = useChoreographyTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [livePaths, setLivePaths] = useState<string[]>([]);
  const [draft, setDraft] = useState<string | null>(null);
  const [stroke, setStroke] = useState('#FF2D6B');
  const [eraser, setEraser] = useState(false);

  const panHandlers = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          setDraft(`M ${locationX} ${locationY}`);
        },
        onPanResponderMove: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          setDraft((d) => (d ? `${d} L ${locationX} ${locationY}` : null));
        },
        onPanResponderRelease: () => {
          setDraft((d) => {
            if (d) setLivePaths((p) => [...p, d]);
            return null;
          });
        },
      }).panHandlers,
    []
  );

  const allPaths = draft ? [...livePaths, draft] : livePaths;

  return (
    <View style={styles.root} {...panHandlers}>
      <Svg style={StyleSheet.absoluteFill}>
        {allPaths.map((d, i) => (
          <Path
            key={`${i}-${d.length}`}
            d={d}
            stroke={eraser ? colors.ground : stroke}
            strokeWidth={eraser ? 24 : 3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </Svg>
      <View style={styles.toolbar}>
        <MonoCaps>Draw</MonoCaps>
        <View style={styles.swatches}>
          {COLORS.map((c) => (
            <Pressable
              key={c}
              style={[styles.swatch, { backgroundColor: c }, stroke === c && styles.swatchOn]}
              onPress={() => {
                setEraser(false);
                setStroke(c);
              }}
            />
          ))}
        </View>
        <Pressable onPress={() => setEraser((e) => !e)} style={styles.toolBtn}>
          <Text style={styles.toolBtnText}>{eraser ? 'Pen' : 'Erase'}</Text>
        </Pressable>
        <Pressable onPress={() => setLivePaths([])} style={styles.toolBtn}>
          <Text style={styles.toolBtnText}>Clear</Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(colors: ThemePalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: '#090910' },
    toolbar: {
      position: 'absolute',
      bottom: 12,
      left: 12,
      right: 12,
      padding: 12,
      borderRadius: 14,
      backgroundColor: colors.surfaceGlass,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
    },
    swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    swatch: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: colors.border },
    swatchOn: { borderColor: colors.primary, borderWidth: 2 },
    toolBtn: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: colors.surfaceElevated,
    },
    toolBtnText: { color: colors.active, fontSize: 12, fontWeight: '600' },
  });
}
