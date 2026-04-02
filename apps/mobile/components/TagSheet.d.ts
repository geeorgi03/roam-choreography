import React from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
import type { ClipRow } from '../lib/database';
export interface TagSheetProps {
    clip: ClipRow | null;
    bottomSheetRef: React.RefObject<BottomSheet | null>;
    onSaved: (updatedClip: ClipRow) => void;
    musicTrackBpm?: number | null;
}
export declare function TagSheet({ clip, bottomSheetRef, onSaved, musicTrackBpm, }: TagSheetProps): React.JSX.Element;
//# sourceMappingURL=TagSheet.d.ts.map