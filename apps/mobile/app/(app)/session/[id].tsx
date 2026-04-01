import React, { useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, BackHandler } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
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
import { theme } from '../../../lib/theme';

const colors = theme.light;

function SessionShellContent() {
  const { id, tab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const {
    activeTab,
    activeSheetId,
    closeSheet,
    openSheet,
    selectedClipForSheet,
    setSelectedClipForSheet,
    openClipSheet,
    setActiveTab,
  } = useSessionContext();

  // ── Bottom-sheet refs ────────────────────────────────────────────────────
  const shareSheetRef = useRef<BottomSheet | null>(null);
  const captureSheetRef = useRef<BottomSheet | null>(null);
  const clipShareSheetRef = useRef<BottomSheet | null>(null);
  const notePinSheetRef = useRef<BottomSheet | null>(null);

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

  // ── Navigation header setup ─────────────────────────────────────────────
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => openSheet('share')}
          >
            <Text style={styles.headerIcon}>⎘</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => {}}
          >
            <Text style={styles.headerIcon}>⋮</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, openSheet]);

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
        ref={shareSheetRef}
        sessionId={id!}
        onClose={() => closeSheet()}
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
        onClose={() => closeSheet()}
      />
      <ClipShareSheet
        ref={clipShareSheetRef}
        clip={selectedClipForSheet}
        onClose={() => closeSheet()}
      />
      <NotePinSheet
        ref={notePinSheetRef}
        note={null}
        onSave={async () => {}}
        onClose={() => closeSheet()}
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
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.chrome,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    color: colors.active,
    fontSize: 14,
  },
  tabContent: {
    flex: 1,
  },
});
