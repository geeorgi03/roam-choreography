import type { FormationData, Moment, QualityData } from '@roam/types';
interface ConnectionStatus {
    isConnected: boolean;
    hasError: boolean;
    errorMessage?: string;
}
export default function useMoments(sessionId: string | null): {
    moments: Moment[];
    isLoading: boolean;
    connectionStatus: ConnectionStatus;
    createMoment: (name: string, beatPositionMs: number) => Promise<Moment | null>;
    renameMoment: (momentId: string, name: string) => Promise<void>;
    updateFormation: (momentId: string, formation: FormationData | null) => Promise<void>;
    updateQuality: (momentId: string, quality: QualityData | null) => Promise<void>;
    mergeMoment: (row: Moment) => void;
    removeMoment: (momentId: string) => void;
};
export {};
//# sourceMappingURL=useMoments_fixed.d.ts.map