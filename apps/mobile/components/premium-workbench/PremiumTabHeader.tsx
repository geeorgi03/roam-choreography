import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../lib/theme';
import { useTheme, type ThemePalette } from '../../lib/contexts/ThemeContext';
import { useSessionContext } from '../../lib/contexts/SessionContext';

export function PremiumTabHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { activeSection } = useSessionContext();

  return (
    <View style={styles.wrap}>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.sectionPill}>
        <Text style={styles.sectionPillText} numberOfLines={1}>
          {activeSection}
        </Text>
      </View>
    </View>
  );
}

function createStyles(colors: ThemePalette) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hair ?? colors.border,
      backgroundColor: colors.chrome,
    },
    textBlock: { flex: 1, minWidth: 0, paddingRight: 12 },
    title: {
      fontFamily: theme.typography.serifFamily ?? theme.typography.brandFamily,
      fontSize: 18,
      color: colors.active,
      letterSpacing: -0.1,
    },
    subtitle: {
      fontSize: 12,
      color: colors.text3 ?? colors.muted,
      marginTop: 2,
    },
    sectionPill: {
      maxWidth: 120,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.hair2 ?? colors.border,
      backgroundColor: colors.surface,
    },
    sectionPillText: {
      fontFamily: theme.typography.monoFamily,
      fontSize: 10,
      textTransform: 'uppercase',
      color: colors.text3 ?? colors.muted,
    },
  });
}
