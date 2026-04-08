import React from 'react';
import type { ClipRow } from '../../lib/database';
import type { NotePin } from '../../lib/hooks/useNotePins';
interface ClipViewerSheetStandaloneProps {
    clip: ClipRow | null;
    sessionId: string | null;
    onClose: () => void;
    allClips?: ClipRow[];
    allNotes?: NotePin[];
    onOpenClip?: (clip: ClipRow) => void;
}
export declare const ClipViewerSheetStandalone: React.ForwardRefExoticComponent<ClipViewerSheetStandaloneProps & React.RefAttributes<import("@gorhom/bottom-sheet/lib/typescript/types").BottomSheetMethods>>;
export {};
//# sourceMappingURL=ClipViewerSheetStandalone.d.ts.map