import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useChoreographyTheme } from '../../../lib/contexts/ChoreographyThemeContext';
import type { ThemePalette } from '../../../lib/contexts/ThemeContext';
import { useChoreographyFonts } from '../../../lib/hooks/useChoreographyFonts';
import { MonoCaps } from '../ChoreographyPrimitives';

export function ChoreographyHubListRow({
  title,
  subtitle,
  rightMeta,
  onPress,
}: {
  title: string;
  subtitle?: string;
  rightMeta?: string;
  onPress: () => void;
}) {
  const colors = useChoreographyTheme();
  const fonts = useChoreographyFonts();
  const styles = useMemo(() => createStyles(colors, fonts.body), [colors, fonts.body]);

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.main}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightMeta ? <MonoCaps style={styles.meta}>{rightMeta}</MonoCaps> : null}
    </Pressable>
  );
}

function createStyles(colors: ThemePalette, bodyFont: string) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginBottom: 10,
      padding: 14,
      borderRadius: 14,
      backgroundColor: colors.surfaceGlass,
      borderWidth: 1,
      borderColor: colors.border,
    },
    main: { flex: 1, paddingRight: 8 },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.active,
      fontFamily: bodyFont,
    },
    subtitle: {
      marginTop: 4,
      fontSize: 9,
      fontWeight: '600',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: colors.muted,
    },
    meta: { color: colors.muted },
  });
}
