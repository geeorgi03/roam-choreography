import React from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
export interface FeedbackSheetProps {
    bottomSheetRef: React.RefObject<BottomSheet | null>;
    sessionId: string;
    clipId: string;
    onClose: () => void;
}
export interface FeedbackSheetHandle {
    reset: () => void;
}
export declare const FeedbackSheet: React.ForwardRefExoticComponent<FeedbackSheetProps & React.RefAttributes<FeedbackSheetHandle>>;
//# sourceMappingURL=FeedbackSheet.d.ts.map