import React, { createContext, useContext, useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { Audio, type AVPlaybackStatus } from 'expo-av';
import NetInfo from '@react-native-community/netinfo';
import { ClipRow, getClipsForSession } from '../database';
import { FormationData, Moment, QualityData, SectionClip } from '@roam/types';
import { useClips } from '../hooks/useClips';
import { useMusicTrackStatus } from '../hooks/useMusicTrackStatus';
import { useNotePins } from '../hooks/useNotePins';
import useMoments, { type ConnectionStatus } from '../hooks/useMoments';
import { useInbox } from '../hooks/useInbox';
import { useSession } from '../hooks/useSession';
import { supabase } from '../supabase';
import { API_BASE } from '../api';
import {
  getSessionMode,
  setSessionMode as setSessionModeStorage,
  getActiveSection,
  setActiveSection as persistActiveSection,
  setActiveSectionId,
  getLoopState,
  setLoopState as setLoopStateStorage,
  getLoopOpenAt,
  setLoopOpenAt as setLoopOpenAtStorage,
} from '../storage';
import { cacheSession, getCachedSession } from '../sessionCache';
import { enqueue, isNetworkError } from '../writeQueue';

export interface SessionContextValue {
  sessionId: string;
  sessionName: string;
  sessionPhrase: string | null;
  qualityTarget: { clip_url: string; timestamp_ms: number; source_clip_id: string } | null;
  setQualityTarget: (qt: { clip_url: string; timestamp_ms: number; source_clip_id: string } | null) => void;
  setSessionName: (name: string) => void;
  updateSessionMeta: (meta: { name?: string; phrase?: string | null }) => Promise<void>;
  activeTab: 'workbench' | 'spatial' | 'song-map' | 'group';
  setActiveTab: (tab: SessionContextValue['activeTab']) => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
  activeMoment: string | null;
  setActiveMoment: (moment: string | null) => void;
  jumpToSongMap: () => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  playheadMs: number;
  setPlayheadMs: (ms: number) => void;
  durationMs: number;
  setDurationMs: (ms: number) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  loopRegion: { start: number; end: number } | null;
  setLoopRegion: (region: { start: number; end: number } | null) => void;
  loopOpenAt: number | null;
  setLoopOpenAt: (ms: number | null) => void;
  musicUrl: string | null;
  activeSheetId: string | null;
  setActiveSheetId: (id: string | null) => void;
  wasPlayingBeforeSheet: boolean;
  setWasPlayingBeforeSheet: (playing: boolean) => void;
  selectedClipForSheet: ClipRow | null;
  setSelectedClipForSheet: (clip: ClipRow | null) => void;
  sectionClips: SectionClip[];
  setSectionClips: (clips: SectionClip[]) => void;
  soundRef: React.RefObject<Audio.Sound | null>;
  
  // Hooks data
  clips: ClipRow[];
  retryClip: (local_id: string) => void;
  musicTrack: any;
  isAnalysing: boolean;
  notes: any[];
  createNote: (note: any) => void;
  deleteNote: (id: string) => Promise<boolean>;
  inboxCount: number;
  refreshCount: () => Promise<void>;
  
  // Handlers
  handlePlayPause: () => void;
  handleSeekBack: () => void;
  handleSeekForward: () => void;
  handleLoopToggle: () => void;
  handleClearLoop: () => void;
  
  // Sheet functions
  openSheet: (id: string) => void;
  closeSheet: (expectedSheetId?: string) => void;
  closeSheetIfActive: (sheetId: string) => void;
  openClipSheet: (clip: ClipRow) => void;

  moments: Moment[];
  isLoadingMoments: boolean;
  momentsConnectionStatus: ConnectionStatus;
  createMoment: (name: string, beatPositionMs: number) => Promise<Moment | null>;
  renameMoment: (momentId: string, name: string) => Promise<void>;
  deleteMoment: (momentId: string) => Promise<boolean>;
  mergeMoment: (row: Moment) => void;
  removeMoment: (momentId: string) => void;
  updateFormation: (momentId: string, formation: FormationData | null) => Promise<void>;
  updateQuality: (momentId: string, quality: QualityData | null) => Promise<void>;
  sessionMode: boolean;
  setSessionMode: (mode: boolean) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ sessionId, children }: { sessionId: string; children: React.ReactNode }) {
  // State
  const [sessionName, setSessionName] = useState('Session');
  const [sessionPhrase, setSessionPhrase] = useState<string | null>(null);
  const [qualityTarget, setQualityTarget] = useState<{ clip_url: string; timestamp_ms: number; source_clip_id: string } | null>(null);
  const [activeTab, setActiveTab] = useState<SessionContextValue['activeTab']>('workbench');
  const [activeSection, setActiveSectionState] = useState('Section');
  const [activeMoment, setActiveMoment] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadMs, setPlayheadMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [loopRegion, setLoopRegion] = useState<{ start: number; end: number } | null>(null);
  const [loopOpenAt, setLoopOpenAt] = useState<number | null>(null);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const [wasPlayingBeforeSheet, setWasPlayingBeforeSheet] = useState(false);
  const [selectedClipForSheet, setSelectedClipForSheet] = useState<ClipRow | null>(null);
  const [sectionClips, setSectionClips] = useState<SectionClip[]>([]);
  const [sessionMode, setSessionModeState] = useState<boolean>(() => getSessionMode(sessionId));
  const [offlineClips, setOfflineClips] = useState<ClipRow[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  
  // Refs
  const soundRef = useRef<Audio.Sound | null>(null);
  /** Disk snapshot of clips from MMKV, read before any cache write (hydration). */
  const diskClipsSnapshotRef = useRef<ClipRow[]>([]);
  /** True after seed effect has applied cached clips for the current sessionId (avoids write-before-seed overwrite). */
  const hasSeeded = useRef(false);
  const prevIsOnlineRef = useRef<boolean | null>(null);
  const activeSheetIdRef = useRef<string | null>(null);
  const wasPlayingBeforeSheetRef = useRef(false);
  
  // Hooks
  const { clips, retryClip } = useClips(sessionId);
  const { musicTrack, isAnalysing } = useMusicTrackStatus(sessionId);
  const { notes, createNote, deleteNote } = useNotePins(sessionId);
  const {
    moments,
    isLoading: isLoadingMoments,
    connectionStatus: momentsConnectionStatus,
    createMoment,
    renameMoment,
    deleteMoment,
    mergeMoment,
    removeMoment,
    updateFormation,
    updateQuality,
  } = useMoments(sessionId);
  const { count: inboxCount, refreshCount } = useInbox();
  const { session } = useSession();

  // Effects from original session file
  useEffect(() => {
    if (!sessionId || !session?.access_token) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const name = (data as { session?: { name?: string; phrase?: string; quality_target?: any } }).session?.name;
        const phrase = (data as { session?: { name?: string; phrase?: string; quality_target?: any } }).session?.phrase;
        const quality_target = (data as { session?: { name?: string; phrase?: string; quality_target?: any } }).session?.quality_target;
        if (name) setSessionName(name);
        if (phrase !== undefined) setSessionPhrase(phrase ?? null);
        if (quality_target !== undefined) setQualityTarget(quality_target ?? null);
      } catch {
        const cached = getCachedSession(sessionId);
        if (cached) {
          setSessionName(cached.session.name);
          setSessionPhrase(cached.session.phrase ?? null);
          setQualityTarget(cached.session.quality_target ?? null);
        }
      }
    })();
  }, [sessionId, session?.access_token]);

  useEffect(() => {
    refreshCount().catch(() => {});
  }, [refreshCount]);

  useEffect(() => {
    if (activeMoment === null && moments.length > 0) {
      setActiveMoment(moments[0].id);
    }
  }, [moments, activeMoment]);

  useEffect(() => {
    if (!sessionId || !session?.access_token) return;
    fetch(`${API_BASE}/sessions/${sessionId}/assembly`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) => {
        if (Array.isArray(data)) setSectionClips(data as SectionClip[]);
      })
      .catch(() => {
        const cached = getCachedSession(sessionId);
        if (cached) setSectionClips(cached.sections as SectionClip[]);
      });
  }, [sessionId, session?.access_token]);

  useLayoutEffect(() => {
    hasSeeded.current = false;
    if (!sessionId) {
      diskClipsSnapshotRef.current = [];
      setOfflineClips([]);
      hasSeeded.current = true;
      return;
    }
    const cached = getCachedSession(sessionId);
    const diskClips =
      cached && Array.isArray(cached.clips) ? (cached.clips as ClipRow[]) : [];
    diskClipsSnapshotRef.current = diskClips;
    setOfflineClips(diskClips.length > 0 ? diskClips : []);
    hasSeeded.current = true;
  }, [sessionId]);

  useEffect(() => {
    let cancelled = false;
    void NetInfo.fetch().then((state) => {
      if (!cancelled) {
        setIsOffline(!state.isConnected);
        setIsOnline(state.isConnected === true && state.isInternetReachable !== false);
      }
    });
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
      setIsOnline(state.isConnected === true && state.isInternetReachable !== false);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const prev = prevIsOnlineRef.current;
    prevIsOnlineRef.current = isOnline;
    if (isOnline && prev === false) {
      setOfflineClips([]);
    }
  }, [isOnline]);

  useEffect(() => {
    if (!isOffline && clips.length > 0) {
      setOfflineClips([]);
    }
  }, [isOffline, clips.length]);

  useEffect(() => {
    if (isOnline || !sessionId) return;
    const cached = getCachedSession(sessionId);
    const disk = cached && Array.isArray(cached.clips) ? (cached.clips as ClipRow[]) : [];
    setOfflineClips(disk);
  }, [isOnline, sessionId]);

  useEffect(() => {
    if (!sessionId || !hasSeeded.current) return;
    const localSnap = getClipsForSession(sessionId);
    let clipsToPersist: ClipRow[];
    if (clips.length > 0) {
      clipsToPersist = clips;
    } else if (localSnap.length > 0) {
      clipsToPersist = localSnap;
    } else if (!isOnline && diskClipsSnapshotRef.current.length > 0) {
      clipsToPersist = diskClipsSnapshotRef.current;
    } else {
      clipsToPersist = [];
    }
    cacheSession(sessionId, {
      session: {
        name: sessionName,
        phrase: sessionPhrase,
        quality_target: qualityTarget,
      },
      sections: sectionClips,
      clips: clipsToPersist,
      cachedAt: Date.now(),
    });
    diskClipsSnapshotRef.current = clipsToPersist;
  }, [sessionId, sessionName, sessionPhrase, qualityTarget, sectionClips, clips, isOnline]);

  useEffect(() => {
    const path = musicTrack?.storage_path;
    if (!path || !supabase) {
      setMusicUrl(null);
      return;
    }
    supabase.storage
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
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (!musicUrl) return;

    const loadAudio = async () => {
      try {
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
        }

        const { sound } = await Audio.Sound.createAsync(
          { uri: musicUrl },
          {
            shouldPlay: isPlaying,
            volume: 1.0,
            rate: playbackSpeed,
            isLooping: !!loopRegion,
          }
        );

        soundRef.current = sound;

        sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
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
      } catch (error) {
        console.error('Error loading audio:', error);
      }
    };

    loadAudio();
  }, [musicUrl]);

  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.setRateAsync(playbackSpeed, true);
    }
  }, [playbackSpeed]);

  useEffect(() => {
    activeSheetIdRef.current = activeSheetId;
  }, [activeSheetId]);

  useEffect(() => {
    wasPlayingBeforeSheetRef.current = wasPlayingBeforeSheet;
  }, [wasPlayingBeforeSheet]);

  // Reload session mode when sessionId changes
  useEffect(() => {
    setSessionModeState(getSessionMode(sessionId));
  }, [sessionId]);

  // Initialize active section from storage
  useEffect(() => {
    const storedSection = getActiveSection(sessionId);
    if (storedSection) {
      setActiveSectionState(storedSection);
    }
  }, [sessionId]);

  // Hydrate loop state when sessionId changes
  useEffect(() => {
    const storedLoopRegion = getLoopState(sessionId);
    setLoopRegion(storedLoopRegion ?? null);

    const storedLoopOpenAt = getLoopOpenAt(sessionId);
    setLoopOpenAt(storedLoopOpenAt ?? null);
  }, [sessionId]);

  // Persist loop region changes
  useEffect(() => {
    setLoopStateStorage(sessionId, loopRegion);
  }, [loopRegion, sessionId]);

  // Persist loop open-at changes
  useEffect(() => {
    setLoopOpenAtStorage(sessionId, loopOpenAt);
  }, [loopOpenAt, sessionId]);

  // Wrapper function to persist active section changes
  const setActiveSection = useCallback((section: string) => {
    setActiveSectionState(section);
    persistActiveSection(sessionId, section);
  }, [sessionId]);

  // Wrapper function to handle tab switches and update active section ID
  const setActiveTabWithSectionTracking = useCallback((tab: SessionContextValue['activeTab']) => {
    setActiveTab(tab);
    // Set active section ID based on tab for share intent
    setActiveSectionId(tab);
  }, [setActiveTab]);

  // Handlers
  const handlePlayPause = useCallback(() => {
    if (!soundRef.current) return;
    
    if (isPlaying) {
      soundRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      soundRef.current.playAsync();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handleSeekBack = useCallback(() => {
    const newPosition = Math.max(0, playheadMs - 5000);
    if (soundRef.current) {
      soundRef.current.setPositionAsync(newPosition);
    }
    setPlayheadMs(newPosition);
  }, [playheadMs]);

  const handleSeekForward = useCallback(() => {
    const newPosition = Math.min(durationMs, playheadMs + 5000);
    if (soundRef.current) {
      soundRef.current.setPositionAsync(newPosition);
    }
    setPlayheadMs(newPosition);
  }, [playheadMs, durationMs]);

  const handleLoopToggle = useCallback(() => {
    if (loopOpenAt === null) {
      setLoopOpenAt(playheadMs);
    } else {
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

  const handleClearLoop = useCallback(() => {
    setLoopRegion(null);
    setLoopOpenAt(null);
    soundRef.current?.setIsLoopingAsync(false);
  }, []);

  // Sheet functions
  const openSheet = useCallback((id: string) => {
    activeSheetIdRef.current = id;
    setActiveSheetId(id);
  }, []);

  const closeSheet = useCallback((expectedSheetId?: string) => {
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

  const closeSheetIfActive = useCallback((sheetId: string) => {
    if (activeSheetIdRef.current !== sheetId) return;
    closeSheet(sheetId);
  }, [closeSheet]);

  const openClipSheet = useCallback((clip: ClipRow) => {
    wasPlayingBeforeSheetRef.current = isPlaying;
    setWasPlayingBeforeSheet(isPlaying);
    if (isPlaying) {
      soundRef.current?.pauseAsync();
      setIsPlaying(false);
    }
    setSelectedClipForSheet(clip);
    openSheet('clip-viewer');
  }, [isPlaying, openSheet]);

  const jumpToSongMap = useCallback(() => {
    const nextMapMoment = activeMoment ?? moments[0]?.id ?? null;
    if (nextMapMoment && nextMapMoment !== activeMoment) {
      setActiveMoment(nextMapMoment);
    }
    closeSheet();
    setActiveTab('song-map');
  }, [activeMoment, moments, closeSheet, setActiveTab]);

  const setSessionMode = useCallback((mode: boolean) => {
    setSessionModeState(mode);
    setSessionModeStorage(sessionId, mode);
  }, [sessionId]);

  const updateSessionMeta = useCallback(async (meta: { name?: string; phrase?: string | null }) => {
    if (!sessionId || !session?.access_token) return;

    const snapshotName = sessionName;
    const snapshotPhrase = sessionPhrase;

    if (meta.name !== undefined) {
      setSessionName(meta.name.trim());
    }
    if (meta.phrase !== undefined) {
      setSessionPhrase(meta.phrase?.trim() || null);
    }

    try {
      const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(meta),
      });

      if (!res.ok) {
        setSessionName(snapshotName);
        setSessionPhrase(snapshotPhrase);
        return;
      }

      const data = await res.json() as { name?: string; phrase?: string } | { session: { name?: string; phrase?: string | null } };
      const updatedName = 'name' in data ? (data as any).name : (data as any).session?.name;
      const updatedPhrase = 'phrase' in data ? (data as any).phrase : (data as any).session?.phrase;
      
      if (updatedName !== undefined) setSessionName(updatedName);
      if (updatedPhrase !== undefined) setSessionPhrase(updatedPhrase ?? null);
    } catch (error) {
      if (isNetworkError(error)) {
        enqueue({
          endpoint: `${API_BASE}/sessions/${sessionId}`,
          method: 'PATCH',
          body: JSON.stringify(meta),
          timestamp: Date.now(),
        });
        return;
      }
      setSessionName(snapshotName);
      setSessionPhrase(snapshotPhrase);
    }
  }, [sessionId, session?.access_token, sessionName, sessionPhrase]);

  const value: SessionContextValue = {
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
    clips: isOffline && clips.length === 0 ? offlineClips : clips,
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

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  const context = useContext(SessionContext);
  if (context === null) {
    throw new Error('useSessionContext must be used within a SessionProvider');
  }
  return context;
}
