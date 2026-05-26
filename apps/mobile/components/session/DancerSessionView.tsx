import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, type ThemePalette } from '../../lib/contexts/ThemeContext';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { useSessionCollab } from '../../lib/contexts/SessionCollabContext';
import { useTranslation } from '../../lib/i18n';
import { theme } from '../../lib/theme';
import { PremiumSectionLab } from '../premium-workbench/PremiumSectionLab';
import { PremiumTransportDock } from '../premium-workbench/PremiumTransportDock';
import { CollabStatusBar } from './CollabStatusBar';

/**
 * Simplified session UI for invited dancers: section lab + transport + choreographer notes.
 */
export function DancerSessionView() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { sessionName, activeSection, openSheet, openClipSheet, clips, sectionClips } =
    useSessionContext();
  const { connectionStatus, participants, broadcasts } = useSessionCollab();

  const latestNote = broadcasts[0]?.message?.trim() ?? null;

  const displayClips = useMemo(() => {
    const sectionIds = new Set(
      sectionClips
        .filter((sc) => sc.section_label === activeSection)
        .map((sc) => sc.clip_id)
    );
    const filtered = clips.filter((c) => !c.server_id || sectionIds.has(c.server_id));
    return filtered.length > 0 ? filtered : clips;
  }, [clips, sectionClips, activeSection]);

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.backA11y')}
        >
          <Text style={styles.backChev}>‹</Text>
        </Pressable>
        <View style={styles.titleBlock}>
          <Text style={styles.roleLabel}>{t('dancer.roleLabel')}</Text>
          <Text style={styles.sessionTitle} numberOfLines={1}>
            {sessionName}
          </Text>
        </View>
      </View>

      <View style={styles.collabWrap}>
        <CollabStatusBar
          compact
          connected={connectionStatus.isConnected}
          hasError={connectionStatus.hasError}
          participantCount={participants.length}
          showInvite={false}
        />
      </View>

      {latestNote ? (
        <View style={styles.noteCard}>
          <Text style={styles.noteKicker}>{t('dancer.choreographerNote')}</Text>
          <Text style={styles.noteBody}>{latestNote}</Text>
        </View>
      ) : null}

      <PremiumSectionLab />

      {displayClips.length > 0 ? (
        <Pressable style={styles.viewTakesBtn} onPress={() => openClipSheet(displayClips[0])}>
          <Text style={styles.viewTakesText}>{t('dancer.viewLatestTake')}</Text>
        </Pressable>
      ) : null}

      <Pressable
        style={styles.recordFab}
        onPress={() => openSheet('capture')}
        accessibilityRole="button"
        accessibilityLabel={t('dancer.recordTake')}
      >
        <Text style={styles.recordFabText}>{t('dancer.recordTake')}</Text>
      </Pressable>

      <PremiumTransportDock />
    </View>
  );
}

function createStyles(colors: ThemePalette) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.ground,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hair ?? colors.border,
    },
    backBtn: { padding: 4, marginRight: 4 },
    backChev: { fontSize: 28, color: colors.muted, lineHeight: 28 },
    titleBlock: { flex: 1, minWidth: 0 },
    roleLabel: {
      fontFamily: theme.typography.monoFamily,
      fontSize: 9,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: colors.capture,
      fontWeight: '700',
    },
    sessionTitle: {
      fontFamily: theme.typography.serifFamily ?? theme.typography.brandFamily,
      fontSize: 20,
      color: colors.active,
    },
    collabWrap: { paddingHorizontal: 16, paddingBottom: 4 },
    noteCard: {
      marginHorizontal: 16,
      marginBottom: 8,
      padding: 12,
      borderRadius: 10,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.hair ?? colors.border,
    },
    noteKicker: {
      fontFamily: theme.typography.monoFamily,
      fontSize: 9,
      color: colors.text4 ?? colors.muted,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    noteBody: {
      fontSize: 14,
      color: colors.active,
      fontFamily: theme.typography.bodyFamily,
    },
    viewTakesBtn: {
      marginHorizontal: 16,
      marginBottom: 8,
      paddingVertical: 10,
      alignItems: 'center',
    },
    viewTakesText: {
      fontFamily: theme.typography.monoFamily,
      fontSize: 10,
      color: colors.text3 ?? colors.muted,
      textTransform: 'uppercase',
    },
    recordFab: {
      position: 'absolute',
      right: 16,
      bottom: 132,
      backgroundColor: colors.capture,
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 999,
      zIndex: 20,
    },
    recordFabText: {
      fontFamily: theme.typography.monoFamily,
      fontSize: 11,
      fontWeight: '700',
      color: '#fff',
      textTransform: 'uppercase',
    },
  });
}
