import React from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
import type { ClipRow } from '../lib/database';
export interface TagHistorySheetProps {
    clip: ClipRow | null;
    bottomSheetRef: React.RefObject<BottomSheet | null>;
    onRestored: (updatedClip: ClipRow) => void;
}
export declare function TagHistorySheet({ clip, bottomSheetRef, onRestored, }: TagHistorySheetProps): React.JSX.Element;
//# sourceMappingURL=TagHistorySheet.d.ts.map