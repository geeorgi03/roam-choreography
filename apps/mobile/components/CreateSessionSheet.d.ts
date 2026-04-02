import React from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
export interface CreateSessionSheetProps {
    bottomSheetRef: React.RefObject<BottomSheet | null>;
    onCreated: (session: {
        id: string;
        name: string;
        created_at: string;
        user_id: string;
    }) => void;
    onPaywallRequired?: () => void;
}
export declare function CreateSessionSheet({ bottomSheetRef, onCreated, onPaywallRequired, }: CreateSessionSheetProps): React.JSX.Element;
//# sourceMappingURL=CreateSessionSheet.d.ts.map