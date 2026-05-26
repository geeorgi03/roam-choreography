import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Session } from '@roam/types';
import { ChoreographyThemeProvider, useChoreographyTheme } from '../../lib/contexts/ChoreographyThemeContext';
import { useChoreographyFonts } from '../../lib/hooks/useChoreographyFonts';
import { MonoCaps } from '../choreography/ChoreographyPrimitives';
import type { ThemePalette } from '../../lib/contexts/ThemeContext';
import { GALLERY_SHELL_BG, thumbColorsForIndex } from '../../lib/projectGalleryTheme';
import { useTranslation } from '../../lib/i18n';

export type ProjectGalleryProps = {
  sessions: Session[];
  loading: boolean;
  loadError: string | null;
  onRetry: () => void;
  onOpenSession: (sessionId: string) => void;
  onNewProject: () => void;
  onSettings: () => void;
  inboxCount?: number;
  onInboxPress?: () => void;
  sessionMetaLine: (session: Session) => string;
};

type FilterId = 'all' | 'recent';

function GalleryBody({
  sessions,
  loading,
  loadError,
  onRetry,
  onOpenSession,
  onNewProject,
  onSettings,
  inboxCount = 0,
  onInboxPress,
  sessionMetaLine,
}: ProjectGalleryProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const colors = useChoreographyTheme();
  const fonts = useChoreographyFonts();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterId>('all');

  const cols = width >= 900 ? 4 : width >= 600 ? 3 : 2;
  const gap = 16;
  const pad = 20;
  const tileWidth = (width - pad * 2 - gap * (cols - 1)) / cols;

  const styles = useMemo(
    () => createStyles(colors, fonts.display, fonts.body, fonts.mono),
    [colors, fonts.display, fonts.body, fonts.mono]
  );

  const filtered = useMemo(() => {
    if (filter === 'all') return sessions;
    const week = Date.now() - 7 * 86400000;
    return sessions.filter((s) => new Date(s.created_at).getTime() >= week);
  }, [sessions, filter]);

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 8) },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.brand}>ROAM</Text>
        <View style={styles.headerActions}>
          <View style={styles.headerActionRow}>
            <Pressable
              onPress={() => setFilter((prev) => (prev === 'recent' ? 'all' : 'recent'))}
              hitSlop={8}
            >
              <Text style={styles.headerLink}>{t('gallery.select')}</Text>
            </Pressable>
            <Pressable onPress={onNewProject} hitSlop={8}>
              <Text style={styles.headerLink}>{t('gallery.import')}</Text>
            </Pressable>
            <Pressable onPress={onSettings} hitSlop={8}>
              <Text style={styles.headerLink}>{t('gallery.settings')}</Text>
            </Pressable>
            <Pressable
              style={styles.plusBtn}
              onPress={onNewProject}
              accessibilityLabel={t('gallery.newProjectA11y')}
            >
              <Text style={styles.plusText}>+</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {inboxCount > 0 && onInboxPress ? (
        <Pressable style={styles.inboxPill} onPress={onInboxPress}>
          <MonoCaps style={styles.inboxPillText}>
            {t('home.unorganisedClipsBanner').replace('{count}', String(inboxCount))}
          </MonoCaps>
        </Pressable>
      ) : null}

      {loading && sessions.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>{t('home.loading')}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.grid, { paddingHorizontal: pad }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.gridInner, { gap }]}>
            {filtered.map((project, index) => {
              const [c1, c2] = thumbColorsForIndex(index);
              const clipCount = project.clip_count ?? 0;
              return (
                <Pressable
                  key={project.id}
                  style={{ width: tileWidth }}
                  onPress={() => onOpenSession(project.id)}
                >
                  <View style={[styles.tileThumb, { width: tileWidth, height: tileWidth }]}>
                    <View style={[styles.thumbFill, { backgroundColor: c1 }]} />
                    <View style={[styles.thumbFill2, { backgroundColor: c2 }]} />
                    {clipCount > 1 ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{clipCount}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.tileTitle} numberOfLines={1}>
                    {project.name}
                  </Text>
                  <Text style={styles.tileSub} numberOfLines={1}>
                    {sessionMetaLine(project)}
                  </Text>
                </Pressable>
              );
            })}

            <Pressable style={{ width: tileWidth }} onPress={onNewProject}>
              <View style={[styles.newTile, { width: tileWidth, height: tileWidth }]}>
                <Text style={styles.newPlus}>+</Text>
              </View>
              <Text style={styles.newLabel}>{t('gallery.newProject')}</Text>
              <Text style={styles.tileSub}>{t('gallery.newProjectSub')}</Text>
            </Pressable>
          </View>

          {loadError && sessions.length === 0 ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{loadError}</Text>
              <Pressable style={styles.retryBtn} onPress={onRetry}>
                <Text style={styles.retryText}>{t('home.retry')}</Text>
              </Pressable>
            </View>
          ) : null}

          {!loading && filtered.length === 0 && sessions.length > 0 ? (
            <Text style={styles.emptyFilter}>{t('gallery.noRecent')}</Text>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

export function ProjectGalleryScreen(props: ProjectGalleryProps) {
  return (
    <ChoreographyThemeProvider>
      <GalleryBody {...props} />
    </ChoreographyThemeProvider>
  );
}

function createStyles(
  colors: ThemePalette,
  displayFont: string,
  bodyFont: string,
  monoFont: string
) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: GALLERY_SHELL_BG,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      height: 56,
    },
    brand: {
      fontFamily: displayFont,
      fontSize: 28,
      fontWeight: '900',
      letterSpacing: -0.5,
      color: '#fff',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 18,
    },
    headerLink: {
      fontFamily: bodyFont,
      fontSize: 15,
      fontWeight: '500',
      color: 'rgba(255,255,255,0.75)',
    },
    plusBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    plusText: {
      color: '#fff',
      fontSize: 18,
      lineHeight: 20,
      fontWeight: '300',
    },
    inboxPill: {
      marginHorizontal: 20,
      marginBottom: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: colors.primaryBg,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    inboxPillText: {
      color: colors.primary,
    },
    // (filter chips are intentionally removed to match the Procreate-style header)
    loadingWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    loadingText: {
      fontFamily: bodyFont,
      fontSize: 14,
      color: 'rgba(255,255,255,0.45)',
    },
    grid: {
      paddingBottom: 24,
    },
    gridInner: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    tileThumb: {
      borderRadius: 22,
      marginBottom: 8,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.28,
      shadowRadius: 18,
      elevation: 10,
    },
    thumbFill: {
      ...StyleSheet.absoluteFillObject,
    },
    thumbFill2: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: '55%',
      height: '55%',
      opacity: 0.85,
      borderTopLeftRadius: 24,
    },
    badge: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      backgroundColor: 'rgba(0,0,0,0.55)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    badgeText: {
      fontFamily: monoFont,
      fontSize: 10,
      color: '#fff',
    },
    tileTitle: {
      fontFamily: bodyFont,
      fontSize: 13,
      fontWeight: '500',
      color: 'rgba(255,255,255,0.9)',
    },
    tileSub: {
      fontFamily: bodyFont,
      fontSize: 11,
      color: 'rgba(255,255,255,0.35)',
      marginTop: 2,
    },
    newTile: {
      borderRadius: 22,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: 'rgba(255,255,255,0.15)',
      backgroundColor: 'rgba(255,255,255,0.06)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    newPlus: {
      fontSize: 32,
      color: 'rgba(255,255,255,0.3)',
      fontWeight: '300',
    },
    newLabel: {
      fontFamily: bodyFont,
      fontSize: 13,
      fontWeight: '500',
      color: 'rgba(255,255,255,0.45)',
    },
    errorBox: {
      marginTop: 24,
      padding: 16,
      alignItems: 'center',
    },
    errorText: {
      fontFamily: bodyFont,
      fontSize: 13,
      color: 'rgba(255,255,255,0.5)',
      textAlign: 'center',
      marginBottom: 12,
    },
    retryBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.primary,
    },
    retryText: {
      fontFamily: bodyFont,
      fontSize: 14,
      fontWeight: '600',
      color: '#fff',
    },
    emptyFilter: {
      fontFamily: bodyFont,
      fontSize: 13,
      color: 'rgba(255,255,255,0.4)',
      textAlign: 'center',
      marginTop: 16,
      width: '100%',
    },
  });
}
