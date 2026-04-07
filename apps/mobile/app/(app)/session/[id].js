"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const SessionContext_1 = require("../../../lib/contexts/SessionContext");
const FeelingStrip_1 = require("../../../components/session/FeelingStrip");
const SessionTabBar_1 = require("../../../components/session/SessionTabBar");
const TransportBar_1 = require("../../../components/session/TransportBar");
const WorkbenchTab_1 = require("../../../components/session/WorkbenchTab");
const SongMapTab_1 = require("../../../components/session/SongMapTab");
const SpatialTab_1 = require("../../../components/session/SpatialTab");
const GroupTab_1 = require("../../../components/session/GroupTab");
const ShareSheet_1 = require("../../../components/ShareSheet");
const CaptureSheet_1 = require("../../../components/CaptureSheet");
const ClipShareSheet_1 = require("../../../components/ClipShareSheet");
const NotePinSheet_1 = require("../../../components/NotePinSheet");
const ClipViewerSheet_1 = require("../../../components/session/ClipViewerSheet");
const OfflineBanner_1 = require("../../../components/session/OfflineBanner");
const theme_1 = require("../../../lib/theme");
const storage_1 = require("../../../lib/storage");
const colors = theme_1.theme.light;
function SessionShellContent() {
    const { id, tab } = (0, expo_router_1.useLocalSearchParams)();
    const router = (0, expo_router_1.useRouter)();
    const { activeTab, activeSheetId, closeSheet, closeSheetIfActive, selectedClipForSheet, setActiveTab, sessionName, musicTrack, clips, } = (0, SessionContext_1.useSessionContext)();
    // ── Bottom-sheet refs ────────────────────────────────────────────────────
    const shareSheetRef = (0, react_1.useRef)(null);
    const captureSheetRef = (0, react_1.useRef)(null);
    const clipShareSheetRef = (0, react_1.useRef)(null);
    const notePinSheetRef = (0, react_1.useRef)(null);
    const clipViewerSheetRef = (0, react_1.useRef)(null);
    // ── Sheet coordinator effects ───────────────────────────────────────────
    (0, react_1.useEffect)(() => {
        if (activeSheetId === 'share') {
            shareSheetRef.current?.snapToIndex(0);
        }
        else {
            shareSheetRef.current?.close();
        }
    }, [activeSheetId]);
    (0, react_1.useEffect)(() => {
        if (activeSheetId === 'capture') {
            captureSheetRef.current?.snapToIndex(0);
        }
        else {
            captureSheetRef.current?.close();
        }
    }, [activeSheetId]);
    (0, react_1.useEffect)(() => {
        if (activeSheetId === 'clip-share') {
            clipShareSheetRef.current?.snapToIndex(0);
        }
        else {
            clipShareSheetRef.current?.close();
        }
    }, [activeSheetId]);
    (0, react_1.useEffect)(() => {
        if (activeSheetId === 'note-pin') {
            notePinSheetRef.current?.snapToIndex(0);
        }
        else {
            notePinSheetRef.current?.close();
        }
    }, [activeSheetId]);
    (0, react_1.useEffect)(() => {
        if (activeSheetId === 'clip-viewer') {
            clipViewerSheetRef.current?.snapToIndex(0);
        }
        else {
            clipViewerSheetRef.current?.close();
        }
    }, [activeSheetId]);
    // ── Tab parameter mapping on mount ────────────────────────────────────────
    (0, react_1.useEffect)(() => {
        if (tab) {
            let targetTab;
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
    (0, react_1.useEffect)(() => {
        if (id) {
            (0, storage_1.setActiveSessionId)(id);
        }
    }, [id]);
    // ── Back handling ───────────────────────────────────────────────────────
    (0, react_1.useEffect)(() => {
        const handleBackPress = () => {
            if (activeSheetId) {
                closeSheet();
                return true;
            }
            return false;
        };
        const subscription = react_native_1.BackHandler.addEventListener('hardwareBackPress', handleBackPress);
        return () => subscription.remove();
    }, [activeSheetId, closeSheet]);
    // ── Tab content rendering ───────────────────────────────────────────────
    const renderTabContent = () => {
        switch (activeTab) {
            case 'workbench':
                return <WorkbenchTab_1.WorkbenchTab />;
            case 'song-map':
                return <SongMapTab_1.SongMapTab />;
            case 'spatial':
                return <SpatialTab_1.SpatialTab />;
            case 'group':
                return <GroupTab_1.GroupTab />;
            default:
                return <WorkbenchTab_1.WorkbenchTab />;
        }
    };
    // ── Transport variant based on active tab ───────────────────────────────
    const transportVariant = activeTab === 'workbench' ? 'full' : 'reduced';
    const untaggedClipCount = clips.filter((clip) => {
        return (!clip.move_name &&
            !clip.style &&
            !clip.energy &&
            !clip.difficulty &&
            clip.bpm == null &&
            !clip.notes);
    }).length;
    return (<react_native_1.View style={styles.container}>
      <OfflineBanner_1.OfflineBanner />
      <FeelingStrip_1.FeelingStrip />
      <SessionTabBar_1.SessionTabBar />
      
      <react_native_1.View style={styles.tabContent}>
        {renderTabContent()}
      </react_native_1.View>

      <TransportBar_1.TransportBar variant={transportVariant}/>

      {/* Sheets */}
      <ShareSheet_1.ShareSheet sessionId={id} sessionName={sessionName} hasMusic={!!musicTrack} untaggedClipCount={untaggedClipCount} bottomSheetRef={shareSheetRef} onClose={() => closeSheetIfActive('share')}/>
      <CaptureSheet_1.CaptureSheet ref={captureSheetRef} sessionId={id} sectionName="Section" inboxCount={0} onRecord={() => router.push({ pathname: './camera', params: { id: id, sectionName: 'Section' } })} onInbox={() => router.push({
            pathname: '/inbox',
            params: { sessionId: id, sectionName: 'Section' },
        })} onClose={() => closeSheetIfActive('capture')}/>
      <ClipShareSheet_1.ClipShareSheet ref={clipShareSheetRef} clip={selectedClipForSheet} onClose={() => closeSheetIfActive('clip-share')}/>
      <NotePinSheet_1.NotePinSheet ref={notePinSheetRef} note={null} onSave={async () => { }} onClose={() => closeSheetIfActive('note-pin')}/>
      <ClipViewerSheet_1.ClipViewerSheet ref={clipViewerSheetRef} onClose={() => closeSheetIfActive('clip-viewer')}/>
    </react_native_1.View>);
}
function SessionWorkbenchScreen() {
    const { id } = (0, expo_router_1.useLocalSearchParams)();
    if (!id) {
        return null;
    }
    return (<SessionContext_1.SessionProvider sessionId={id}>
      <SessionShellContent />
    </SessionContext_1.SessionProvider>);
}
exports.default = SessionWorkbenchScreen;
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.ground,
    },
    tabContent: {
        flex: 1,
    },
});
//# sourceMappingURL=%5Bid%5D.js.map