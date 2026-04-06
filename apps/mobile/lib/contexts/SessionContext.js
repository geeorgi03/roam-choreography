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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSessionContext = exports.SessionProvider = void 0;
const react_1 = __importStar(require("react"));
const expo_av_1 = require("expo-av");
const useClips_1 = require("../hooks/useClips");
const useMusicTrackStatus_1 = require("../hooks/useMusicTrackStatus");
const useNotePins_1 = require("../hooks/useNotePins");
const useMoments_1 = __importDefault(require("../hooks/useMoments"));
const useInbox_1 = require("../hooks/useInbox");
const useSession_1 = require("../hooks/useSession");
const supabase_1 = require("../supabase");
const api_1 = require("../api");
const storage_1 = require("../storage");
const sessionCache_1 = require("../sessionCache");
const writeQueue_1 = require("../writeQueue");
const SessionContext = (0, react_1.createContext)(null);
function SessionProvider({ sessionId, children }) {
    // State
    const [sessionName, setSessionName] = (0, react_1.useState)('Session');
    const [sessionPhrase, setSessionPhrase] = (0, react_1.useState)(null);
    const [qualityTarget, setQualityTarget] = (0, react_1.useState)(null);
    const [activeTab, setActiveTab] = (0, react_1.useState)('workbench');
    const [activeSection, setActiveSectionState] = (0, react_1.useState)('Section');
    const [activeMoment, setActiveMoment] = (0, react_1.useState)(null);
    const [isPlaying, setIsPlaying] = (0, react_1.useState)(false);
    const [playheadMs, setPlayheadMs] = (0, react_1.useState)(0);
    const [durationMs, setDurationMs] = (0, react_1.useState)(0);
    const [playbackSpeed, setPlaybackSpeed] = (0, react_1.useState)(1);
    const [loopRegion, setLoopRegion] = (0, react_1.useState)(null);
    const [loopOpenAt, setLoopOpenAt] = (0, react_1.useState)(null);
    const [musicUrl, setMusicUrl] = (0, react_1.useState)(null);
    const [activeSheetId, setActiveSheetId] = (0, react_1.useState)(null);
    const [wasPlayingBeforeSheet, setWasPlayingBeforeSheet] = (0, react_1.useState)(false);
    const [selectedClipForSheet, setSelectedClipForSheet] = (0, react_1.useState)(null);
    const [sectionClips, setSectionClips] = (0, react_1.useState)([]);
    const [sessionMode, setSessionModeState] = (0, react_1.useState)(() => (0, storage_1.getSessionMode)(sessionId));
    // Refs
    const soundRef = (0, react_1.useRef)(null);
    const activeSheetIdRef = (0, react_1.useRef)(null);
    const wasPlayingBeforeSheetRef = (0, react_1.useRef)(false);
    // Hooks
    const { clips, retryClip } = (0, useClips_1.useClips)(sessionId);
    const { musicTrack, isAnalysing } = (0, useMusicTrackStatus_1.useMusicTrackStatus)(sessionId);
    const { notes, createNote, deleteNote } = (0, useNotePins_1.useNotePins)(sessionId);
    const { moments, isLoading: isLoadingMoments, connectionStatus: momentsConnectionStatus, createMoment, renameMoment, deleteMoment, mergeMoment, removeMoment, updateFormation, updateQuality, } = (0, useMoments_1.default)(sessionId);
    const { count: inboxCount, refreshCount } = (0, useInbox_1.useInbox)();
    const { session } = (0, useSession_1.useSession)();
    // Effects from original session file
    (0, react_1.useEffect)(() => {
        if (!sessionId || !session?.access_token)
            return;
        (async () => {
            try {
                const res = await fetch(`${api_1.API_BASE}/sessions/${sessionId}`, {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                });
                if (!res.ok)
                    return;
                const data = await res.json();
                const name = data.session?.name;
                const phrase = data.session?.phrase;
                const quality_target = data.session?.quality_target;
                if (name)
                    setSessionName(name);
                if (phrase !== undefined)
                    setSessionPhrase(phrase ?? null);
                if (quality_target !== undefined)
                    setQualityTarget(quality_target ?? null);
            }
            catch {
                const cached = (0, sessionCache_1.getCachedSession)(sessionId);
                if (cached) {
                    setSessionName(cached.session.name);
                    setSessionPhrase(cached.session.phrase ?? null);
                    setQualityTarget(cached.session.quality_target ?? null);
                }
            }
        })();
    }, [sessionId, session?.access_token]);
    (0, react_1.useEffect)(() => {
        refreshCount().catch(() => { });
    }, [refreshCount]);
    (0, react_1.useEffect)(() => {
        if (activeMoment === null && moments.length > 0) {
            setActiveMoment(moments[0].id);
        }
    }, [moments, activeMoment]);
    (0, react_1.useEffect)(() => {
        if (!sessionId || !session?.access_token)
            return;
        fetch(`${api_1.API_BASE}/sessions/${sessionId}/assembly`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
        })
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => {
            if (Array.isArray(data))
                setSectionClips(data);
        })
            .catch(() => {
            const cached = (0, sessionCache_1.getCachedSession)(sessionId);
            if (cached)
                setSectionClips(cached.sections);
        });
    }, [sessionId, session?.access_token]);
    (0, react_1.useEffect)(() => {
        if (!sessionId)
            return;
        (0, sessionCache_1.cacheSession)(sessionId, {
            session: {
                name: sessionName,
                phrase: sessionPhrase,
                quality_target: qualityTarget,
            },
            sections: sectionClips,
            clips: [],
            cachedAt: Date.now(),
        });
    }, [sessionId, sessionName, sessionPhrase, qualityTarget, sectionClips]);
    (0, react_1.useEffect)(() => {
        const path = musicTrack?.storage_path;
        if (!path || !supabase_1.supabase) {
            setMusicUrl(null);
            return;
        }
        supabase_1.supabase.storage
            .from('audio')
            .createSignedUrl(path, 86400)
            .then(({ data, error }) => {
            if (error) {
                setMusicUrl(null);
                return;
            }
            setMusicUrl(data.signedUrl);
        });
    }, [musicTrack?.storage_path]);
    // Audio lifecycle
    (0, react_1.useEffect)(() => {
        return () => {
            if (soundRef.current) {
                soundRef.current.unloadAsync();
            }
        };
    }, []);
    (0, react_1.useEffect)(() => {
        if (!musicUrl)
            return;
        const loadAudio = async () => {
            try {
                if (soundRef.current) {
                    await soundRef.current.unloadAsync();
                }
                const { sound } = await expo_av_1.Audio.Sound.createAsync({ uri: musicUrl }, {
                    shouldPlay: isPlaying,
                    volume: 1.0,
                    rate: playbackSpeed,
                    isLooping: !!loopRegion,
                });
                soundRef.current = sound;
                sound.setOnPlaybackStatusUpdate((status) => {
                    if (status.isLoaded) {
                        const position = status.positionMillis || 0;
                        const duration = status.durationMillis || 0;
                        setPlayheadMs(position);
                        setDurationMs(duration);
                        if (loopRegion) {
                            if (position >= loopRegion.end) {
                                sound.setPositionAsync(loopRegion.start);
                            }
                        }
                        if (status.didJustFinish && !loopRegion) {
                            setIsPlaying(false);
                        }
                    }
                });
                await sound.setRateAsync(playbackSpeed, true);
            }
            catch (error) {
                console.error('Error loading audio:', error);
            }
        };
        loadAudio();
    }, [musicUrl]);
    (0, react_1.useEffect)(() => {
        if (soundRef.current) {
            soundRef.current.setRateAsync(playbackSpeed, true);
        }
    }, [playbackSpeed]);
    (0, react_1.useEffect)(() => {
        activeSheetIdRef.current = activeSheetId;
    }, [activeSheetId]);
    (0, react_1.useEffect)(() => {
        wasPlayingBeforeSheetRef.current = wasPlayingBeforeSheet;
    }, [wasPlayingBeforeSheet]);
    // Reload session mode when sessionId changes
    (0, react_1.useEffect)(() => {
        setSessionModeState((0, storage_1.getSessionMode)(sessionId));
    }, [sessionId]);
    // Initialize active section from storage
    (0, react_1.useEffect)(() => {
        const storedSection = (0, storage_1.getActiveSection)(sessionId);
        if (storedSection) {
            setActiveSectionState(storedSection);
        }
    }, [sessionId]);
    // Wrapper function to persist active section changes
    const setActiveSection = (0, react_1.useCallback)((section) => {
        setActiveSectionState(section);
        (0, storage_1.setActiveSection)(sessionId, section);
    }, [sessionId]);
    // Wrapper function to handle tab switches and update active section ID
    const setActiveTabWithSectionTracking = (0, react_1.useCallback)((tab) => {
        setActiveTab(tab);
        // Set active section ID based on tab for share intent
        (0, storage_1.setActiveSectionId)(tab);
    }, [setActiveTab]);
    // Handlers
    const handlePlayPause = (0, react_1.useCallback)(() => {
        if (!soundRef.current)
            return;
        if (isPlaying) {
            soundRef.current.pauseAsync();
            setIsPlaying(false);
        }
        else {
            soundRef.current.playAsync();
            setIsPlaying(true);
        }
    }, [isPlaying]);
    const handleSeekBack = (0, react_1.useCallback)(() => {
        const newPosition = Math.max(0, playheadMs - 5000);
        if (soundRef.current) {
            soundRef.current.setPositionAsync(newPosition);
        }
        setPlayheadMs(newPosition);
    }, [playheadMs]);
    const handleSeekForward = (0, react_1.useCallback)(() => {
        const newPosition = Math.min(durationMs, playheadMs + 5000);
        if (soundRef.current) {
            soundRef.current.setPositionAsync(newPosition);
        }
        setPlayheadMs(newPosition);
    }, [playheadMs, durationMs]);
    const handleLoopToggle = (0, react_1.useCallback)(() => {
        if (loopOpenAt === null) {
            setLoopOpenAt(playheadMs);
        }
        else {
            const start = Math.min(loopOpenAt, playheadMs);
            const end = Math.max(loopOpenAt, playheadMs);
            setLoopRegion({ start, end });
            setLoopOpenAt(null);
            if (soundRef.current) {
                soundRef.current.setPositionAsync(start);
                soundRef.current.setIsLoopingAsync(true);
            }
        }
    }, [loopOpenAt, playheadMs]);
    const handleClearLoop = (0, react_1.useCallback)(() => {
        setLoopRegion(null);
        setLoopOpenAt(null);
        soundRef.current?.setIsLoopingAsync(false);
    }, []);
    // Sheet functions
    const openSheet = (0, react_1.useCallback)((id) => {
        activeSheetIdRef.current = id;
        setActiveSheetId(id);
    }, []);
    const closeSheet = (0, react_1.useCallback)((expectedSheetId) => {
        const currentActiveSheetId = activeSheetIdRef.current;
        if (expectedSheetId && currentActiveSheetId !== expectedSheetId) {
            return;
        }
        activeSheetIdRef.current = null;
        setActiveSheetId(null);
        setSelectedClipForSheet(null);
        if (wasPlayingBeforeSheetRef.current) {
            soundRef.current?.playAsync();
            setIsPlaying(true);
            wasPlayingBeforeSheetRef.current = false;
            setWasPlayingBeforeSheet(false);
        }
    }, []);
    const closeSheetIfActive = (0, react_1.useCallback)((sheetId) => {
        if (activeSheetIdRef.current !== sheetId)
            return;
        closeSheet(sheetId);
    }, [closeSheet]);
    const openClipSheet = (0, react_1.useCallback)((clip) => {
        wasPlayingBeforeSheetRef.current = isPlaying;
        setWasPlayingBeforeSheet(isPlaying);
        if (isPlaying) {
            soundRef.current?.pauseAsync();
            setIsPlaying(false);
        }
        setSelectedClipForSheet(clip);
        openSheet('clip-viewer');
    }, [isPlaying, openSheet]);
    const jumpToSongMap = (0, react_1.useCallback)(() => {
        const nextMapMoment = activeMoment ?? moments[0]?.id ?? null;
        if (nextMapMoment && nextMapMoment !== activeMoment) {
            setActiveMoment(nextMapMoment);
        }
        closeSheet();
        setActiveTab('song-map');
    }, [activeMoment, moments, closeSheet, setActiveTab]);
    const setSessionMode = (0, react_1.useCallback)((mode) => {
        setSessionModeState(mode);
        (0, storage_1.setSessionMode)(sessionId, mode);
    }, [sessionId]);
    const updateSessionMeta = (0, react_1.useCallback)(async (meta) => {
        if (!sessionId || !session?.access_token)
            return;
        const snapshotName = sessionName;
        const snapshotPhrase = sessionPhrase;
        if (meta.name !== undefined) {
            setSessionName(meta.name.trim());
        }
        if (meta.phrase !== undefined) {
            setSessionPhrase(meta.phrase?.trim() || null);
        }
        try {
            const res = await fetch(`${api_1.API_BASE}/sessions/${sessionId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify(meta),
            });
            if (!res.ok) {
                const error = new Error(`Failed to update session meta: ${res.status}`);
                if ((0, writeQueue_1.isNetworkError)(error)) {
                    (0, writeQueue_1.enqueueWrite)({
                        endpoint: `${api_1.API_BASE}/sessions/${sessionId}`,
                        method: 'PATCH',
                        body: JSON.stringify(meta),
                    });
                    return;
                }
                setSessionName(snapshotName);
                setSessionPhrase(snapshotPhrase);
                return;
            }
            const data = await res.json();
            const updatedName = 'name' in data ? data.name : data.session?.name;
            const updatedPhrase = 'phrase' in data ? data.phrase : data.session?.phrase;
            if (updatedName !== undefined)
                setSessionName(updatedName);
            if (updatedPhrase !== undefined)
                setSessionPhrase(updatedPhrase ?? null);
        }
        catch (error) {
            if ((0, writeQueue_1.isNetworkError)(error)) {
                (0, writeQueue_1.enqueueWrite)({
                    endpoint: `${api_1.API_BASE}/sessions/${sessionId}`,
                    method: 'PATCH',
                    body: JSON.stringify(meta),
                });
                return;
            }
            setSessionName(snapshotName);
            setSessionPhrase(snapshotPhrase);
        }
    }, [sessionId, session?.access_token, sessionName, sessionPhrase]);
    const value = {
        sessionId,
        sessionName,
        sessionPhrase,
        qualityTarget,
        setQualityTarget,
        setSessionName,
        updateSessionMeta,
        activeTab,
        setActiveTab: setActiveTabWithSectionTracking,
        activeSection,
        setActiveSection,
        activeMoment,
        setActiveMoment,
        jumpToSongMap,
        isPlaying,
        setIsPlaying,
        playheadMs,
        setPlayheadMs,
        durationMs,
        setDurationMs,
        playbackSpeed,
        setPlaybackSpeed,
        loopRegion,
        setLoopRegion,
        loopOpenAt,
        setLoopOpenAt,
        musicUrl,
        activeSheetId,
        setActiveSheetId,
        wasPlayingBeforeSheet,
        setWasPlayingBeforeSheet,
        selectedClipForSheet,
        setSelectedClipForSheet,
        sectionClips,
        setSectionClips,
        soundRef,
        sessionMode,
        setSessionMode,
        // Hooks data
        clips,
        retryClip,
        musicTrack,
        isAnalysing,
        notes,
        createNote,
        deleteNote,
        inboxCount,
        refreshCount,
        moments,
        isLoadingMoments,
        momentsConnectionStatus,
        createMoment,
        renameMoment,
        deleteMoment,
        mergeMoment,
        removeMoment,
        updateFormation,
        updateQuality,
        // Handlers
        handlePlayPause,
        handleSeekBack,
        handleSeekForward,
        handleLoopToggle,
        handleClearLoop,
        // Sheet functions
        openSheet,
        closeSheet,
        closeSheetIfActive,
        openClipSheet,
    };
    return (<SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>);
}
exports.SessionProvider = SessionProvider;
function useSessionContext() {
    const context = (0, react_1.useContext)(SessionContext);
    if (context === null) {
        throw new Error('useSessionContext must be used within a SessionProvider');
    }
    return context;
}
exports.useSessionContext = useSessionContext;
//# sourceMappingURL=SessionContext.js.map