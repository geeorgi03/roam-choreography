import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Audio, type AVPlaybackStatus } from 'expo-av';
import { ClipRow } from '../database';
import { SectionClip } from '@roam/types';
import { useClips } from '../hooks/useClips';
import { useMusicTrackStatus } from '../hooks/useMusicTrackStatus';
import { useNotePins } from '../hooks/useNotePins';
import { useInbox } from '../hooks/useInbox';
import { useSession } from '../hooks/useSession';
import { supabase } from '../supabase';
import { API_BASE } from '../api';

export interface SessionContextValue {
  sessionId: string;
  sessionName: string;
  setSessionName: (name: string) => void;
  activeTab: 'workbench' | 'spatial' | 'beat-grid' | 'song-map' | 'group';
  setActiveTab: (tab: SessionContextValue['activeTab']) => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
  activeMoment: string | null;
  setActiveMoment: (moment: string | null) => void;
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
  deleteNote: (id: string) => void;
  inboxCount: number;
  refreshCount: () => Promise<void>;
  
  // Handlers
  handlePlayPause: () => void;
  handleSeekBack: () => void;
  handleSeekForward: () => void;
  handleLoopToggle: () => void;
  
  // Sheet functions
  openSheet: (id: string) => void;
  closeSheet: () => void;
  openClipSheet: (clip: ClipRow) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ sessionId, children }: { sessionId: string; children: React.ReactNode }) {
  // State
  const [sessionName, setSessionName] = useState('Session');
  const [activeTab, setActiveTab] = useState<SessionContextValue['activeTab']>('workbench');
  const [activeSection, setActiveSection] = useState('Section');
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
  
  // Refs
  const soundRef = useRef<Audio.Sound | null>(null);
  
  // Hooks
  const { clips, retryClip } = useClips(sessionId);
  const { musicTrack, isAnalysing } = useMusicTrackStatus(sessionId);
  const { notes, createNote, deleteNote } = useNotePins(sessionId);
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
        const name = (data as { session?: { name?: string } }).session?.name;
        if (name) setSessionName(name);
      } catch {
        // ignore
      }
    })();
  }, [sessionId, session?.access_token]);

  useEffect(() => {
    refreshCount().catch(() => {});
  }, [refreshCount]);

  useEffect(() => {
    if (!sessionId || !session?.access_token) return;
    fetch(`${API_BASE}/sessions/${sessionId}/assembly`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) => {
        if (Array.isArray(data)) setSectionClips(data as SectionClip[]);
      })
      .catch(() => {});
  }, [sessionId, session?.access_token]);

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

  // Sheet functions
  const openSheet = useCallback((id: string) => {
    setActiveSheetId(id);
  }, []);

  const closeSheet = useCallback(() => {
    setActiveSheetId(null);
    setSelectedClipForSheet(null);
    
    if (wasPlayingBeforeSheet) {
      soundRef.current?.playAsync();
      setIsPlaying(true);
      setWasPlayingBeforeSheet(false);
    }
  }, [wasPlayingBeforeSheet]);

  const openClipSheet = useCallback((clip: ClipRow) => {
    setWasPlayingBeforeSheet(isPlaying);
    if (isPlaying) {
      soundRef.current?.pauseAsync();
      setIsPlaying(false);
    }
    setSelectedClipForSheet(clip);
    openSheet('clip-viewer');
  }, [isPlaying, openSheet]);

  const value: SessionContextValue = {
    sessionId,
    sessionName,
    setSessionName,
    activeTab,
    setActiveTab,
    activeSection,
    setActiveSection,
    activeMoment,
    setActiveMoment,
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
    
    // Handlers
    handlePlayPause,
    handleSeekBack,
    handleSeekForward,
    handleLoopToggle,
    
    // Sheet functions
    openSheet,
    closeSheet,
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
