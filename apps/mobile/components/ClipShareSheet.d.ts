import React from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
export interface ClipShareSheetProps {
    clipId: string | null;
    clipLabel: string;
    sectionName: string;
    duration: string;
    bottomSheetRef: React.RefObject<BottomSheet | null>;
}
export declare function ClipShareSheet({ clipId, clipLabel, sectionName, duration, bottomSheetRef, }: ClipShareSheetProps): React.JSX.Element;
//# sourceMappingURL=ClipShareSheet.d.ts.map