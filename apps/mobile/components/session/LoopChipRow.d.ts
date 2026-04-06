import React from 'react';
import type { Loop } from '@roam/types';
interface LoopChipRowProps {
    sessionId: string | null;
    sourceUrl: string | null;
    currentPositionMs: number;
    onSeek: (ms: number) => void;
    onActiveLoopChange?: (loop: Loop | null) => void;
}
export default function LoopChipRow({ sessionId, sourceUrl, currentPositionMs, onSeek, onActiveLoopChange, }: LoopChipRowProps): React.JSX.Element | null;
export {};
//# sourceMappingURL=LoopChipRow.d.ts.map