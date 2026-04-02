export type InboxClip = {
    id: string;
    user_id: string;
    session_id: string | null;
    label: string;
    upload_status: string;
    mux_playback_id: string | null;
    recorded_at: string;
    created_at: string;
};
export declare function useInbox(): {
    clips: InboxClip[];
    count: number;
    staleClips: InboxClip[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    refreshCount: () => Promise<void>;
    assignClip: (clipId: string, sessionId: string, sectionName?: string) => Promise<boolean>;
    deleteClip: (clipId: string) => Promise<boolean>;
};
//# sourceMappingURL=useInbox.d.ts.map