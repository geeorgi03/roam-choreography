import React from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
import type { Session } from '@roam/types';
export interface FirstSessionSheetProps {
    bottomSheetRef: React.RefObject<BottomSheet | null>;
    onCreated: (session: Session) => void;
    onPaywallRequired?: () => void;
}
export declare function FirstSessionSheet({ bottomSheetRef, onCreated, onPaywallRequired, }: FirstSessionSheetProps): React.JSX.Element;
//# sourceMappingURL=FirstSessionSheet.d.ts.map