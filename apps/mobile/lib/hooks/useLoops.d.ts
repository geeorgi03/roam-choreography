/// <reference types="react" />
import type { Loop } from '@roam/types';
export default function useLoops(sessionId: string | null, sourceUrl: string | null): {
    loops: Loop[];
    isLoading: boolean;
    createLoop: (startMs: number, endMs: number, color: string) => Promise<Loop | null>;
    deleteLoop: (loopId: string) => Promise<boolean>;
    fetchLoops: () => Promise<void>;
    setLoops: import("react").Dispatch<import("react").SetStateAction<Loop[]>>;
};
//# sourceMappingURL=useLoops.d.ts.map