import React from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
export interface QuickSaveSheetProps {
    bottomSheetRef: React.RefObject<BottomSheet | null>;
    videoUri: string | null;
    secondaryVideoUri?: string | null;
    dualPairId?: string;
    sessionId?: string | null;
    sectionName?: string | null;
    onDone: (next?: {
        navigateTo?: string;
    }) => void;
}
export declare function QuickSaveSheet({ bottomSheetRef, videoUri, secondaryVideoUri, dualPairId, sessionId, sectionName, onDone, }: QuickSaveSheetProps): React.JSX.Element;
//# sourceMappingURL=QuickSaveSheet.d.ts.map