import type { MusicTrack } from '@roam/types';
export declare function useMusicTrackStatus(sessionId: string | null): {
    musicTrack: MusicTrack | null;
    isAnalysing: boolean;
    refetch: () => Promise<void>;
};
//# sourceMappingURL=useMusicTrackStatus.d.ts.map