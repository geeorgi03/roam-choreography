import { type ClipRow } from '../database';
export declare function useClips(sessionId: string | null, onPlanLimitReached?: () => void): {
    clips: ClipRow[];
    refresh: () => void;
    retryClip: (local_id: string) => void;
    updateLocalClip: (local_id: string, updates: Partial<Pick<ClipRow, 'upload_status' | 'upload_progress'>>) => void;
};
//# sourceMappingURL=useClips.d.ts.map