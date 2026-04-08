import React from 'react';
import { Audio } from 'expo-av';
import type { Session } from '@supabase/supabase-js';
import { ClipRow } from '../database';
import { FormationData, Moment, QualityData, SectionClip } from '@roam/types';
import { type ConnectionStatus } from '../hooks/useMoments';
export interface SessionContextValue {
    session: Session | null;
    sessionId: string;
    sessionName: string;
    sessionPhrase: string | null;
    qualityTarget: {
        clip_url: string;
        timestamp_ms: number;
        source_clip_id: string;
    } | null;
    setQualityTarget: (qt: {
        clip_url: string;
        timestamp_ms: number;
        source_clip_id: string;
    } | null) => void;
    setSessionName: (name: string) => void;
    updateSessionMeta: (meta: {
        name?: string;
        phrase?: string | null;
    }) => Promise<void>;
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
    loopRegion: {
        start: number;
        end: number;
    } | null;
    setLoopRegion: (region: {
        start: number;
        end: number;
    } | null) => void;
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
    clips: ClipRow[];
    retryClip: (local_id: string) => void;
    musicTrack: any;
    isAnalysing: boolean;
    notes: any[];
    createNote: (note: any) => void;
    deleteNote: (id: string) => Promise<boolean>;
    inboxCount: number;
    refreshCount: () => Promise<void>;
    handlePlayPause: () => void;
    handleSeekBack: () => void;
    handleSeekForward: () => void;
    handleLoopToggle: () => void;
    handleClearLoop: () => void;
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
export declare function SessionProvider({ sessionId, children }: {
    sessionId: string;
    children: React.ReactNode;
}): React.JSX.Element;
export declare function useSessionContext(): SessionContextValue;
//# sourceMappingURL=SessionContext.d.ts.map