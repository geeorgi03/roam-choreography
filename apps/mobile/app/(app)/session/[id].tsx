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
import { theme } from '../../../lib/theme';

const colors = theme.light;

function SessionShellContent() {
  const { id, tab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const router = useRouter();
  const {
    activeTab,
    activeSheetId,
    closeSheet,
    selectedClipForSheet,
    setActiveTab,
    sessionName,
    musicTrack,
    clips,
  } = useSessionContext();

  // ── Bottom-sheet refs ────────────────────────────────────────────────────
  const shareSheetRef = useRef<BottomSheet | null>(null);
  const captureSheetRef = useRef<BottomSheet | null>(null);
  const clipShareSheetRef = useRef<BottomSheet | null>(null);
  const notePinSheetRef = useRef<BottomSheet | null>(null);
  const clipViewerSheetRef = useRef<BottomSheet | null>(null);

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

  // ── Tab parameter mapping on mount ────────────────────────────────────────
  useEffect(() => {
    if (tab) {
      let targetTab: string;
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
        onClose={() => closeSheet('share')}
      />
      <CaptureSheet
        ref={captureSheetRef}
        sessionId={id!}
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
        onClose={() => closeSheet('capture')}
      />
      <ClipShareSheet
        ref={clipShareSheetRef}
        clip={selectedClipForSheet}
        onClose={() => closeSheet('clip-share')}
      />
      <NotePinSheet
        ref={notePinSheetRef}
        note={null}
        onSave={async () => {}}
        onClose={() => closeSheet('note-pin')}
      />
      <ClipViewerSheet 
        ref={clipViewerSheetRef} 
        onClose={() => closeSheet('clip-viewer')} 
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
