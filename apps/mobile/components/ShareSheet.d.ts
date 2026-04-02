import React from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
export interface ShareSheetProps {
    sessionId: string;
    sessionName: string;
    hasMusic: boolean;
    untaggedClipCount: number;
    bottomSheetRef: React.RefObject<BottomSheet | null>;
    onClose: () => void;
}
export declare function ShareSheet({ sessionId, sessionName, hasMusic, untaggedClipCount, bottomSheetRef, onClose, }: ShareSheetProps): React.JSX.Element;
//# sourceMappingURL=ShareSheet.d.ts.map