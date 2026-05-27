import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, BackHandler, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { useLocalSearchParams, useRouter } from 'expo-router';
import BottomSheet from '@gorhom/bottom-sheet';
import { SessionProvider, useSessionContext } from '../../../lib/contexts/SessionContext';
import { FeelingStrip } from '../../../components/session/FeelingStrip';
import { SessionTabBar } from '../../../components/session/SessionTabBar';
import { TransportBar } from '../../../components/session/TransportBar';
import { PremiumWorkbenchTab } from '../../../components/premium-workbench/PremiumWorkbenchTab';
import { SongMapTab } from '../../../components/session/SongMapTab';
import { SpatialTab } from '../../../components/session/SpatialTab';
import { GroupTab } from '../../../components/session/GroupTab';
import { ShareSheet } from '../../../components/ShareSheet';
import { CaptureSheet } from '../../../components/CaptureSheet';
import { ClipShareSheet } from '../../../components/ClipShareSheet';
import { NotePinSheet } from '../../../components/NotePinSheet';
import { ClipViewerSheet } from '../../../components/session/ClipViewerSheet';
import { OfflineBanner } from '../../../components/session/OfflineBanner';
import { PaywallSheet } from '../../../components/PaywallSheet';
import { useTheme, type ThemePalette } from '../../../lib/contexts/ThemeContext';
import { useTabletLandscape } from '../../../lib/hooks/useTabletLandscape';
import { SessionTabletShell } from '../../../components/landscape';
import { ChoreographyShell } from '../../../components/choreography';
import { SessionCollabProvider, useSessionCollab } from '../../../lib/contexts/SessionCollabContext';
import { DancerSessionView } from '../../../components/session/DancerSessionView';
import { USE_CHOREOGRAPHY_UI } from '../../../lib/choreographyUiFlag';
import { setActiveSessionId } from '../../../lib/storage';
import { setLastOpenedSessionId } from '../../../lib/homeHubState';
import { addUploadQueueListener } from '../../../services/uploadQueue';
import { useSession } from '../../../lib/hooks/useSession';
import { saveClip } from '../../../lib/saveClip';

function SessionShellContent() {
  const { colors } = useTheme();
  const { isTabletLandscape } = useTabletLandscape();
  const { isDancerMode } = useSessionCollab();
  const styles = useMemo(() => createSessionShellStyles(colors), [colors]);
  const { id, tab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const router = useRouter();
  const {
    activeTab,
    activeSheetId,
    closeSheet,
    closeSheetIfActive,
    selectedClipForSheet,
    setActiveTab,
    sessionName,
    musicTrack,
    clips,
    openSheet,
    activeSection,
  } = useSessionContext();
  const { session: authSession } = useSession();

  // ── Bottom-sheet refs ────────────────────────────────────────────────────
  const shareSheetRef = useRef<BottomSheet | null>(null);
  const captureSheetRef = useRef<BottomSheet | null>(null);
  const clipShareSheetRef = useRef<BottomSheet | null>(null);
  const notePinSheetRef = useRef<BottomSheet | null>(null);
  const clipViewerSheetRef = useRef<BottomSheet | null>(null);
  const paywallSheetRef = useRef<BottomSheet | null>(null);

  const handleImportVideo = useCallback(async () => {
    captureSheetRef.current?.close();
    if (!id || !authSession?.access_token) {
      Alert.alert('', 'Sign in to import video.');
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow access to your video library.');
      return;
    }
    const pick = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
    });
    if (pick.canceled || !pick.assets[0]?.uri) return;
    const result = await saveClip(
      id,
      pick.assets[0].uri,
      'Import',
      authSession.access_token,
      activeSection ?? undefined,
      undefined,
      'MINE'
    );
    if (result.ok) {
      Toast.show({ type: 'success', text1: 'Video imported', text2: 'Uploading…' });
      return;
    }
    if (result.reason === 'plan_limit_reached') {
      openSheet('paywall');
      return;
    }
    Alert.alert(
      'Import failed',
      result.reason === 'error' ? result.message : 'Could not import video'
    );
  }, [id, authSession?.access_token, activeSection, openSheet]);

  // ── Sheet coordinator effects ───────────────────────────────────────────
  useEffect(() => {
    if (activeSheetId === 'share') {
      shareSheetRef.current?.snapToIndex(0);
    } else {
      shareSheetRef.current?.close();
    }
  }, [activeSheetId]);

  useEffect(() => {
    if (activeSheetId === 'capture') {
      captureSheetRef.current?.snapToIndex(0);
    } else {
      captureSheetRef.current?.close();
    }
  }, [activeSheetId]);

  useEffect(() => {
    if (activeSheetId === 'clip-share') {
      clipShareSheetRef.current?.snapToIndex(0);
    } else {
      clipShareSheetRef.current?.close();
    }
  }, [activeSheetId]);

  useEffect(() => {
    if (activeSheetId === 'note-pin') {
      notePinSheetRef.current?.snapToIndex(0);
    } else {
      notePinSheetRef.current?.close();
    }
  }, [activeSheetId]);

  useEffect(() => {
    if (activeSheetId === 'clip-viewer') {
      clipViewerSheetRef.current?.snapToIndex(0);
    } else {
      clipViewerSheetRef.current?.close();
    }
  }, [activeSheetId]);

  useEffect(() => {
    if (activeSheetId === 'paywall') {
      paywallSheetRef.current?.snapToIndex(0);
    } else {
      paywallSheetRef.current?.close();
    }
  }, [activeSheetId]);

  // ── Tab parameter mapping on mount ────────────────────────────────────────
  useEffect(() => {
    if (tab) {
      let targetTab: 'song-map' | 'spatial' | 'group';
      switch (tab) {
        case 'map':
          targetTab = 'song-map';
          break;
        case 'spatial':
          targetTab = 'spatial';
          break;
        case 'group':
          targetTab = 'group';
          break;
        default:
          return;
      }
      setActiveTab(targetTab);
    }
  }, [tab, setActiveTab]);

  // ── Set active session ID on mount ─────────────────────────────────────────
  useEffect(() => {
    if (id) {
      setActiveSessionId(id);
      setLastOpenedSessionId(id);
    }
  }, [id]);

  useEffect(() => {
    const unsubscribe = addUploadQueueListener((event) => {
      if (event.reason === 'plan_limit_reached') {
        openSheet('paywall');
      }
    });
    return unsubscribe;
  }, [openSheet]);

  // ── Back handling ───────────────────────────────────────────────────────
  useEffect(() => {
    const handleBackPress = () => {
      if (activeSheetId) {
        closeSheet();
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => subscription.remove();
  }, [activeSheetId, closeSheet]);

  // ── Tab content rendering ───────────────────────────────────────────────
  const renderTabContent = () => {
    switch (activeTab) {
      case 'workbench':
        return <PremiumWorkbenchTab />;
      case 'song-map':
        return <SongMapTab />;
      case 'spatial':
        return <SpatialTab />;
      case 'group':
        return <GroupTab />;
      default:
        return <PremiumWorkbenchTab />;
    }
  };

  // ── Transport variant based on active tab ───────────────────────────────
  const transportVariant = activeTab === 'workbench' ? 'hidden' : 'reduced';
  const untaggedClipCount = clips.filter((clip) => {
    return (
      !clip.move_name &&
      !clip.style &&
      !clip.energy &&
      !clip.difficulty &&
      clip.bpm == null &&
      !clip.notes
    );
  }).length;

  const tabBody = renderTabContent();

  if (USE_CHOREOGRAPHY_UI && !isDancerMode) {
    return (
      <View style={styles.container}>
        <OfflineBanner />
        <ChoreographyShell />
        <ShareSheet
          sessionId={id!}
          sessionName={sessionName}
          hasMusic={!!musicTrack}
          untaggedClipCount={untaggedClipCount}
          bottomSheetRef={shareSheetRef}
          onClose={() => closeSheetIfActive('share')}
        />
        <CaptureSheet
          bottomSheetRef={captureSheetRef}
          sectionName={activeSection}
          inboxCount={0}
          onRecord={() =>
            router.push({
              pathname: './camera',
              params: { id: id!, sectionName: activeSection },
            })
          }
          onImportVideo={handleImportVideo}
          onInbox={() =>
            router.push({
              pathname: '/inbox',
              params: { sessionId: id!, sectionName: activeSection },
            })
          }
        />
        <ClipShareSheet
          bottomSheetRef={clipShareSheetRef}
          clipId={selectedClipForSheet?.server_id ?? null}
          clipLabel={selectedClipForSheet?.label ?? 'Clip'}
          sectionName={activeSection}
          duration="0:00"
        />
        <NotePinSheet
          bottomSheetRef={notePinSheetRef}
          sessionId={id}
          timecode="00:00.0"
          sectionName={activeSection}
          onSave={async () => {}}
        />
        <ClipViewerSheet
          ref={clipViewerSheetRef}
          onClose={() => closeSheetIfActive('clip-viewer')}
        />
        <PaywallSheet
          bottomSheetRef={paywallSheetRef}
          onDismiss={() => closeSheetIfActive('paywall')}
        />
      </View>
    );
  }

  if (isDancerMode) {
    return (
      <View style={styles.container}>
        <OfflineBanner />
        <DancerSessionView />
        <ShareSheet
          sessionId={id!}
          sessionName={sessionName}
          hasMusic={!!musicTrack}
          untaggedClipCount={untaggedClipCount}
          bottomSheetRef={shareSheetRef}
          onClose={() => closeSheetIfActive('share')}
        />
        <CaptureSheet
          bottomSheetRef={captureSheetRef}
          sectionName={activeSection}
          inboxCount={0}
          onRecord={() =>
            router.push({
              pathname: './camera',
              params: { id: id!, sectionName: activeSection },
            })
          }
          onImportVideo={handleImportVideo}
          onInbox={() =>
            router.push({
              pathname: '/inbox',
              params: { sessionId: id!, sectionName: activeSection },
            })
          }
        />
        <ClipViewerSheet
          ref={clipViewerSheetRef}
          onClose={() => closeSheetIfActive('clip-viewer')}
        />
        <PaywallSheet
          bottomSheetRef={paywallSheetRef}
          onDismiss={() => closeSheetIfActive('paywall')}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <OfflineBanner />
      {isTabletLandscape ? (
        <>
          {activeTab !== 'workbench' ? <FeelingStrip /> : null}
          <View style={styles.tabContent}>
            <SessionTabletShell>{tabBody}</SessionTabletShell>
          </View>
          {transportVariant !== 'hidden' ? (
            <TransportBar variant={transportVariant} />
          ) : null}
        </>
      ) : (
        <>
          {activeTab !== 'workbench' ? <FeelingStrip /> : null}
          <SessionTabBar />
          <View style={styles.tabContent}>{tabBody}</View>
          {transportVariant !== 'hidden' ? (
            <TransportBar variant={transportVariant} />
          ) : null}
        </>
      )}

      {/* Sheets */}
      <ShareSheet
        sessionId={id!}
        sessionName={sessionName}
        hasMusic={!!musicTrack}
        untaggedClipCount={untaggedClipCount}
        bottomSheetRef={shareSheetRef}
        onClose={() => closeSheetIfActive('share')}
      />
      <CaptureSheet
        bottomSheetRef={captureSheetRef}
        sectionName="Section"
        inboxCount={0}
        onRecord={() =>
          router.push({ pathname: './camera', params: { id: id!, sectionName: 'Section' } })
        }
        onImportVideo={handleImportVideo}
        onInbox={() =>
          router.push({
            pathname: '/inbox',
            params: { sessionId: id!, sectionName: 'Section' },
          })
        }
      />
      <ClipShareSheet
        bottomSheetRef={clipShareSheetRef}
        clipId={selectedClipForSheet?.server_id ?? null}
        clipLabel={selectedClipForSheet?.label ?? 'Clip'}
        sectionName="Section"
        duration="0:00"
      />
      <NotePinSheet
        bottomSheetRef={notePinSheetRef}
        sessionId={id}
        timecode="00:00.0"
        sectionName="Section"
        onSave={async () => {}}
      />
      <ClipViewerSheet 
        ref={clipViewerSheetRef} 
        onClose={() => closeSheetIfActive('clip-viewer')} 
      />
      <PaywallSheet
        bottomSheetRef={paywallSheetRef}
        onDismiss={() => closeSheetIfActive('paywall')}
      />
    </View>
  );
}

export default function SessionWorkbenchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return null;
  }

  return (
    <SessionProvider sessionId={id}>
      <SessionCollabProvider sessionId={id}>
        <SessionShellContent />
      </SessionCollabProvider>
    </SessionProvider>
  );
}

function createSessionShellStyles(colors: ThemePalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.ground, // #0A0908 - ROAM dark background
    },
    content: {
      flex: 1,
      paddingTop: 8,
    },
    tabContent: {
      flex: 1,
    },
    // ROAM Design Screens specific styles
    sessionHeader: {
      backgroundColor: colors.surface, // #1E1C18 - Phone silhouette color
      borderBottomWidth: 1,
      borderBottomColor: colors.border, // #3A3530 - Phone border color
      paddingHorizontal: 24,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    sessionTitle: {
      fontFamily: 'Georgia, serif', // Georgia serif from ROAM wordmark
      fontSize: 24,
      fontWeight: '600',
      color: colors.active, // #F4EBD6 - Warm off-white text
      flex: 1,
    },
    sessionActions: {
      flexDirection: 'row',
      gap: 8,
    },
    sessionActionButton: {
      width: 40,
      height: 40,
      backgroundColor: colors.surfaceElevated, // #252322
      borderWidth: 1,
      borderColor: colors.border, // #3A3530
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    videoContainer: {
      backgroundColor: colors.surface, // #1E1C18
      margin: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border, // #3A3530
      overflow: 'hidden',
    },
    videoPlayer: {
      width: '100%',
      height: 300,
      backgroundColor: colors.surfaceElevated, // #252322
    },
    videoControls: {
      backgroundColor: 'rgba(30, 28, 24, 0.9)',
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    playButton: {
      width: 48,
      height: 48,
      backgroundColor: colors.primary, // #E06E3F - Coral accent
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressBar: {
      flex: 1,
      height: 4,
      backgroundColor: colors.border, // #3A3530
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary, // #E06E3F - Coral accent
      width: '45%',
    },
    timeText: {
      fontSize: 12,
      color: colors.muted, // #B8B3A8
    },
    clipsGrid: {
      padding: 16,
    },
    clipsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    clipsTitle: {
      fontFamily: 'Georgia, serif',
      fontSize: 20,
      fontWeight: '600',
      color: colors.active, // #F4EBD6
    },
    clipsGridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    clipItem: {
      width: '48%',
      backgroundColor: colors.surface, // #1E1C18
      borderWidth: 1,
      borderColor: colors.border, // #3A3530
      borderRadius: 12,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    clipThumbnail: {
      width: 60,
      height: 60,
      backgroundColor: colors.surfaceElevated, // #252322
      borderRadius: 8,
      marginRight: 12,
      borderWidth: 1,
      borderColor: colors.border, // #3A3530
    },
    clipInfo: {
      flex: 1,
    },
    clipName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.active, // #F4EBD6
      marginBottom: 2,
    },
    clipDuration: {
      fontSize: 12,
      color: colors.muted, // #B8B3A8
    },
  });
}

// ...
