import React, { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { useTheme, type ThemePalette } from '../../lib/contexts/ThemeContext';
import { theme } from '../../lib/theme';
import { PremiumSectionMap } from '../premium-workbench/PremiumSectionMap';
import { PremiumLoopPanel } from '../premium-workbench/PremiumLoopPanel';
import { PremiumTakesList } from '../premium-workbench/PremiumTakesList';
import { SessionCollabBar } from '../session/SessionCollabBar';
import { useTranslation } from '../../lib/i18n';

const TAB_ITEMS = [
  { id: 'workbench' as const, labelKey: 'session.tab.workbench' },
  { id: 'song-map' as const, labelKey: 'session.tab.songMap' },
  { id: 'spatial' as const, labelKey: 'session.tab.spatial' },
  { id: 'group' as const, labelKey: 'session.tab.group' },
] as const;

export function SessionTabletShell({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();
  const { activeTab, setActiveTab, closeSheet, sessionName } = useSessionContext();

  const sidebarW = theme.landscape.sidebar.width;
  const panelW = theme.landscape.rightPanel.width;

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <View style={[styles.sidebar, { width: sidebarW }]}>
          <Text style={styles.sessionTitle} numberOfLines={2}>
            {sessionName}
          </Text>
          <SessionCollabBar compact embedded />
          <View style={styles.tabList}>
            {TAB_ITEMS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  style={[styles.tabItem, active && styles.tabItemActive]}
                  onPress={() => {
                    closeSheet();
                    setActiveTab(tab.id);
                  }}
                >
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                    {t(tab.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.main}>{children}</View>

        <View style={[styles.rightPanel, { width: panelW }]}>
          <ScrollView
            style={styles.rightScroll}
            contentContainerStyle={styles.rightScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.panelHeading}>Section & loop</Text>
            <PremiumSectionMap />
            <PremiumLoopPanel />
            <PremiumTakesList />
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

function createStyles(colors: ThemePalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.ground },
    row: { flex: 1, flexDirection: 'row' },
    sidebar: {
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: colors.hair ?? colors.border,
      backgroundColor: colors.chrome,
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 8,
    },
    sessionTitle: {
      fontFamily: theme.typography.serifFamily ?? theme.typography.brandFamily,
      fontSize: 20,
      color: colors.active,
      letterSpacing: -0.2,
      marginBottom: 10,
    },
    tabList: { gap: 6, marginTop: 8 },
    tabItem: {
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.hair2 ?? colors.border,
    },
    tabItemActive: {
      borderColor: colors.capture,
      backgroundColor: colors.surface,
    },
    tabLabel: {
      fontFamily: theme.typography.bodyFamily,
      fontSize: 14,
      fontWeight: '600',
      color: colors.text3 ?? colors.muted,
    },
    tabLabelActive: { color: colors.active },
    main: {
      flex: 1,
      minWidth: theme.landscape.canvas.minWidth,
      backgroundColor: colors.ground,
    },
    rightPanel: {
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: colors.hair ?? colors.border,
      backgroundColor: colors.chrome,
    },
    rightScroll: { flex: 1 },
    rightScrollContent: { paddingBottom: 24 },
    panelHeading: {
      fontFamily: theme.typography.monoFamily,
      fontSize: 10,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: colors.text4 ?? colors.muted,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 4,
    },
  });
}
