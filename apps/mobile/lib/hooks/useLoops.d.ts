import type { Loop } from '@roam/types';
export default function useLoops(sessionId: string | null, sourceUrl: string | null): {
    loops: Loop[];
    isLoading: boolean;
    createLoop: (startMs: number, endMs: number, color: string) => Promise<Loop | null>;
    deleteLoop: (loopId: string) => Promise<boolean>;
    fetchLoops: () => Promise<void>;
};
//# sourceMappingURL=useLoops.d.ts.map