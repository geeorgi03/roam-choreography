import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChoreographyTheme } from '../../lib/contexts/ChoreographyThemeContext';
import type { ThemePalette } from '../../lib/contexts/ThemeContext';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { useTranslation } from '../../lib/i18n';
import { MonoCaps } from './ChoreographyPrimitives';
import { getDeviceTier, uxTokens } from '../../lib/designTokens';

export type ChoreographyViewId = 'work' | 'practice' | 'map' | 'library' | 'explore';

const NAV: { id: ChoreographyViewId; labelKey: string }[] = [
  { id: 'work', labelKey: 'choreo.nav.work' },
  { id: 'practice', labelKey: 'choreo.nav.practiceBeta' },
  { id: 'map', labelKey: 'choreo.nav.map' },
  { id: 'library', labelKey: 'choreo.nav.library' },
];

type Props = {
  view: ChoreographyViewId;
  onChangeView: (v: ChoreographyViewId) => void;
  onSettings?: () => void;
  workCollapsed?: boolean;
  onToggleWorkCollapsed?: () => void;
};

export function ChoreographyTopChrome({
  view,
  onChangeView,
  onSettings,
  workCollapsed = false,
  onToggleWorkCollapsed,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const tier = getDeviceTier(width);
  const colors = useChoreographyTheme();
  const styles = useMemo(() => createStyles(colors, insets.top, tier), [colors, insets.top, tier]);
  const { sessionName } = useSessionContext();
  const { t } = useTranslation();

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <View style={styles.logoDot} />
        <Text style={styles.sessionName} numberOfLines={1}>
          {sessionName}
        </Text>
        {view === 'work' && onToggleWorkCollapsed ? (
          <Pressable onPress={onToggleWorkCollapsed} style={styles.collapseBtn} hitSlop={8}>
            <MonoCaps style={{ color: colors.active }}>
              {workCollapsed ? t('choreo.workbench.expand') : t('choreo.workbench.collapse')}
            </MonoCaps>
          </Pressable>
        ) : null}
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
                {t(item.labelKey)}
              </MonoCaps>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemePalette, topInset: number, tier: 'phone' | 'tablet') {
  return StyleSheet.create({
    root: {
      paddingTop: topInset + uxTokens.spacing.sm,
      paddingBottom: uxTokens.spacing.sm,
      paddingHorizontal: uxTokens.spacing.md,
      backgroundColor: colors.ground,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: uxTokens.spacing.sm,
      marginBottom: uxTokens.spacing.sm,
      minHeight: 36,
      backgroundColor: colors.surfaceGlass,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: uxTokens.radius.md,
      paddingHorizontal: uxTokens.spacing.md,
      paddingVertical: uxTokens.spacing.sm,
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
      fontSize: uxTokens.typography.title[tier] - 3,
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
      paddingHorizontal: 10,
      paddingVertical: uxTokens.spacing.xs,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    collapseBtn: {
      paddingHorizontal: 10,
      paddingVertical: uxTokens.spacing.xs,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    settingsIcon: {
      fontSize: uxTokens.typography.nav[tier],
      color: colors.muted,
    },
    navRow: {
      flexDirection: 'row',
      gap: 6,
      backgroundColor: colors.surfaceGlassDark,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      padding: 4,
    },
    navItem: {
      paddingHorizontal: uxTokens.spacing.md,
      paddingVertical: uxTokens.spacing.xs + 1,
      borderRadius: 999,
    },
    navItemActive: {
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.primaryBg,
    },
  });
}
