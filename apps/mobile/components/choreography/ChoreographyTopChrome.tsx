import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChoreographyTheme } from '../../lib/contexts/ChoreographyThemeContext';
import type { ThemePalette } from '../../lib/contexts/ThemeContext';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { MonoCaps } from './ChoreographyPrimitives';

export type ChoreographyViewId = 'work' | 'map' | 'library' | 'explore';

const NAV: { id: ChoreographyViewId; label: string }[] = [
  { id: 'work', label: 'Work' },
  { id: 'map', label: 'Map' },
  { id: 'library', label: 'Library' },
  { id: 'explore', label: 'Explore' },
];

type Props = {
  view: ChoreographyViewId;
  onChangeView: (v: ChoreographyViewId) => void;
  onSettings?: () => void;
};

export function ChoreographyTopChrome({ view, onChangeView, onSettings }: Props) {
  const insets = useSafeAreaInsets();
  const colors = useChoreographyTheme();
  const styles = useMemo(() => createStyles(colors, insets.top), [colors, insets.top]);
  const { sessionName } = useSessionContext();

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <View style={styles.logoDot} />
        <Text style={styles.sessionName} numberOfLines={1}>
          {sessionName}
        </Text>
        <Pressable onPress={onSettings} style={styles.settingsBtn} hitSlop={10}>
          <Text style={styles.settingsIcon}>⚙</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.navRow}
      >
        {NAV.map((item) => {
          const active = view === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => onChangeView(item.id)}
              style={[styles.navItem, active && styles.navItemActive]}
            >
              <MonoCaps style={active ? { color: colors.active } : undefined}>
                {item.label}
              </MonoCaps>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemePalette, topInset: number) {
  return StyleSheet.create({
    root: {
      paddingTop: topInset + 4,
      paddingBottom: 8,
      paddingHorizontal: 12,
      backgroundColor: colors.ground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 8,
      minHeight: 36,
    },
    logoDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
    },
    nameRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    sessionName: {
      flex: 1,
      fontSize: 16,
      fontWeight: '700',
      color: colors.active,
    },
    pencil: {
      fontSize: 14,
      color: colors.muted,
    },
    nameEditRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    nameInput: {
      flex: 1,
      fontSize: 16,
      color: colors.active,
      borderBottomWidth: 1,
      borderBottomColor: colors.primary,
      paddingVertical: 2,
    },
    nameAction: {
      fontSize: 18,
      color: colors.primary,
      fontWeight: '700',
    },
    playingPill: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: colors.primaryBg,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    settingsBtn: {
      padding: 4,
    },
    settingsIcon: {
      fontSize: 18,
      color: colors.muted,
    },
    navRow: {
      flexDirection: 'row',
      gap: 4,
    },
    navItem: {
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    navItemActive: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
      backgroundColor: 'transparent',
    },
  });
}
