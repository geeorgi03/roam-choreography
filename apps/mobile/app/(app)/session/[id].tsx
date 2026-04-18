import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import BottomSheet from '@gorhom/bottom-sheet';
import { SessionProvider, useSessionContext } from '../../../lib/contexts/SessionContext';
import { FeelingStrip } from '../../../components/session/FeelingStrip';
import { SessionTabBar } from '../../../components/session/SessionTabBar';
import { TransportBar } from '../../../components/session/TransportBar';
import { WorkbenchTab } from '../../../components/session/WorkbenchTab';
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
import { theme } from '../../../lib/theme';
import { setActiveSessionId } from '../../../lib/storage';
import { addUploadQueueListener } from '../../../services/uploadQueue';

const colors = theme.light;

function SessionShellContent() {
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
  } = useSessionContext();

  // ── Bottom-sheet refs ────────────────────────────────────────────────────
  const shareSheetRef = useRef<BottomSheet | null>(null);
  const captureSheetRef = useRef<BottomSheet | null>(null);
  const clipShareSheetRef = useRef<BottomSheet | null>(null);
  const notePinSheetRef = useRef<BottomSheet | null>(null);
  const clipViewerSheetRef = useRef<BottomSheet | null>(null);
  const paywallSheetRef = useRef<BottomSheet | null>(null);

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
        return <WorkbenchTab />;
      case 'song-map':
        return <SongMapTab />;
      case 'spatial':
        return <SpatialTab />;
      case 'group':
        return <GroupTab />;
      default:
        return <WorkbenchTab />;
    }
  };

  // ── Transport variant based on active tab ───────────────────────────────
  const transportVariant = activeTab === 'workbench' ? 'full' : 'reduced';
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

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <FeelingStrip />
      <SessionTabBar />
      
      <View style={styles.tabContent}>
        {renderTabContent()}
      </View>

      <TransportBar variant={transportVariant} />

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
      <SessionShellContent />
    </SessionProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ground,
  },
  tabContent: {
    flex: 1,
  },
});
