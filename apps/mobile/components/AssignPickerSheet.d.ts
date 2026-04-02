import React from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
export type SessionListItem = {
    id: string;
    name: string;
    created_at: string;
    user_id: string;
};
export interface AssignPickerSheetProps {
    bottomSheetRef: React.RefObject<BottomSheet | null>;
    onPick: (session: SessionListItem) => Promise<boolean> | boolean;
    onCreateNewSession?: () => void;
    title?: string;
}
export declare function AssignPickerSheet({ bottomSheetRef, onPick, onCreateNewSession, title, }: AssignPickerSheetProps): React.JSX.Element;
//# sourceMappingURL=AssignPickerSheet.d.ts.map