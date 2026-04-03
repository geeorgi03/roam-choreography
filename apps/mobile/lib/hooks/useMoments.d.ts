import type { FormationData, Moment, QualityData } from '@roam/types';
export default function useMoments(sessionId: string | null): {
    moments: Moment[];
    isLoading: boolean;
    createMoment: (name: string, beatPositionMs: number) => Promise<Moment | null>;
    renameMoment: (momentId: string, name: string) => Promise<void>;
    updateFormation: (momentId: string, formation: FormationData | null) => Promise<void>;
    updateQuality: (momentId: string, quality: QualityData | null) => Promise<void>;
    mergeMoment: (row: Moment) => void;
    removeMoment: (momentId: string) => void;
};
//# sourceMappingURL=useMoments.d.ts.map