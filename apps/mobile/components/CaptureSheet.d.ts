import React from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
export interface CaptureSheetProps {
    bottomSheetRef: React.RefObject<BottomSheet | null>;
    onRecord: () => void;
    onInbox?: () => void;
    inboxCount?: number;
    sectionName?: string | null;
}
export declare function CaptureSheet({ bottomSheetRef, onRecord, onInbox, inboxCount, sectionName, }: CaptureSheetProps): React.JSX.Element;
//# sourceMappingURL=CaptureSheet.d.ts.map