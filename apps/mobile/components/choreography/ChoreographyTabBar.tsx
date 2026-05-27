import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { choreographyPalette } from '../../lib/choreographyTheme';
import { useChoreographyFonts } from '../../lib/hooks/useChoreographyFonts';

export function ChoreographyTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const fonts = useChoreographyFonts();
  const colors = choreographyPalette;
  const styles = useMemo(
    () => createStyles(colors, insets.bottom, fonts.mono),
    [colors, insets.bottom, fonts.mono]
  );

  return (
    <View style={styles.bar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key]!;
        const href = (options as { href?: string | null }).href;
        if (href === null) return null;
        const label =
          options.tabBarLabel !== undefined
            ? String(options.tabBarLabel)
            : options.title !== undefined
              ? options.title
              : route.name;
        const focused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };
        return (
          <Pressable key={route.key} onPress={onPress} style={styles.item}>
            <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
            {focused ? <View style={styles.dot} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(
  colors: typeof choreographyPalette,
  bottomInset: number,
  monoFont: string
) {
  return StyleSheet.create({
    bar: {
      flexDirection: 'row',
      backgroundColor: colors.ground,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingBottom: bottomInset + 4,
      paddingTop: 8,
    },
    item: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 4,
    },
    label: {
      fontSize: 10,
      fontFamily: monoFont,
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: colors.muted,
    },
    labelFocused: {
      color: colors.active,
      fontWeight: '700',
    },
    dot: {
      marginTop: 4,
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.primary,
    },
  });
}
