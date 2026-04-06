import React from 'react';
import type { ClipRow } from '../../lib/database';
interface ClipViewerSheetStandaloneProps {
    clip: ClipRow | null;
    sessionId: string | null;
    onClose: () => void;
}
export declare const ClipViewerSheetStandalone: React.ForwardRefExoticComponent<ClipViewerSheetStandaloneProps & React.RefAttributes<import("@gorhom/bottom-sheet/lib/typescript/types").BottomSheetMethods>>;
export {};
//# sourceMappingURL=ClipViewerSheetStandalone.d.ts.map