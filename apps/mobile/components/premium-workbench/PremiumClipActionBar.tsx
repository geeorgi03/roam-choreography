import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../lib/theme';
import { useTheme, type ThemePalette } from '../../lib/contexts/ThemeContext';

type Action = {
  key: string;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
};

export function PremiumClipActionBar({ actions }: { actions: Action[] }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      {actions.map((action) => (
        <Pressable
          key={action.key}
          style={[styles.cell, action.disabled && styles.cellDisabled]}
          onPress={action.onPress}
          disabled={action.disabled || !action.onPress}
        >
          <Text style={styles.cellLabel}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function createStyles(colors: ThemePalette) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: 6,
      paddingVertical: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.hair ?? colors.border,
      marginBottom: 12,
    },
    cell: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: colors.surface,
      alignItems: 'center',
    },
    cellDisabled: { opacity: 0.4 },
    cellLabel: {
      fontFamily: theme.typography.monoFamily,
      fontSize: 9,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: colors.text3 ?? colors.muted,
      fontWeight: '600',
    },
  });
}
