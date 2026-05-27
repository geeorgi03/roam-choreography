import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, Pressable, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useChoreographyTheme } from '../../lib/contexts/ChoreographyThemeContext';
import type { ThemePalette } from '../../lib/contexts/ThemeContext';
import {
  getDrawStrokes,
  setDrawStrokes,
  type ChoreographyDrawStroke,
} from '../../lib/choreographyDrawStrokes';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { useTranslation } from '../../lib/i18n';
import { MonoCaps } from './ChoreographyPrimitives';

const COLORS = ['#FF2D6B', '#FFE135', '#3B82F6', '#10B981', '#F59E0B', '#EEEEF5', '#8B5CF6', '#fff'];

export function ChoreographyDrawCanvas() {
  const colors = useChoreographyTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { sessionId, activeSection } = useSessionContext();
  const [strokes, setStrokes] = useState<ChoreographyDrawStroke[]>([]);
  const [draft, setDraft] = useState<string | null>(null);
  const [strokeColor, setStrokeColor] = useState('#FF2D6B');
  const [eraser, setEraser] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;

  const persist = useCallback(
    (next: ChoreographyDrawStroke[]) => {
      if (!sessionId) return;
      setDrawStrokes(sessionId, activeSection, next);
    },
    [sessionId, activeSection]
  );

  const schedulePersist = useCallback(
    (next: ChoreographyDrawStroke[]) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => persist(next), 280);
    },
    [persist]
  );

  useEffect(() => {
    if (!sessionId) {
      setStrokes([]);
      return;
    }
    setStrokes(getDrawStrokes(sessionId, activeSection));
    setDraft(null);
  }, [sessionId, activeSection]);

  useEffect(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    },
    []
  );

  const commitStroke = useCallback(
    (d: string) => {
      const stroke: ChoreographyDrawStroke = {
        id: `ch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        d,
        color: eraser ? colors.ground : strokeColor,
        width: eraser ? 24 : 3,
      };
      setStrokes((prev) => {
        const next = [...prev, stroke];
        schedulePersist(next);
        return next;
      });
    },
    [colors.ground, eraser, schedulePersist, strokeColor]
  );

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
            if (d) commitStroke(d);
            return null;
          });
        },
      }).panHandlers,
    [commitStroke]
  );

  const clearAll = () => {
    setStrokes([]);
    setDraft(null);
    persist([]);
  };

  const allPaths = useMemo(() => {
    const live = draft
      ? [
          {
            id: '__draft__',
            d: draft,
            color: eraser ? colors.ground : strokeColor,
            width: eraser ? 24 : 3,
          },
        ]
      : [];
    return [...strokes, ...live];
  }, [colors.ground, draft, eraser, strokeColor, strokes]);

  return (
    <View style={styles.root} {...panHandlers}>
      <View style={styles.sectionTag}>
        <MonoCaps>{activeSection}</MonoCaps>
      </View>
      <Svg style={StyleSheet.absoluteFill}>
        {allPaths.map((s) => (
          <Path
            key={s.id}
            d={s.d}
            stroke={s.color}
            strokeWidth={s.width}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </Svg>
      <View style={styles.toolbar}>
        <MonoCaps>Draw · {strokes.length} strokes</MonoCaps>
        <View style={styles.swatches}>
          {COLORS.map((c) => (
            <Pressable
              key={c}
              style={[styles.swatch, { backgroundColor: c }, strokeColor === c && styles.swatchOn]}
              onPress={() => {
                setEraser(false);
                setStrokeColor(c);
              }}
            />
          ))}
        </View>
        <Pressable onPress={() => setEraser((e) => !e)} style={styles.toolBtn}>
          <Text style={styles.toolBtnText}>
            {eraser ? t('choreo.draw.pen') : t('choreo.draw.erase')}
          </Text>
        </Pressable>
        <Pressable onPress={clearAll} style={styles.toolBtn}>
          <Text style={styles.toolBtnText}>{t('choreo.draw.clear')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(colors: ThemePalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: '#090910' },
    sectionTag: {
      position: 'absolute',
      top: 12,
      left: 12,
      zIndex: 2,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: colors.surfaceGlass,
      borderWidth: 1,
      borderColor: colors.border,
    },
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
