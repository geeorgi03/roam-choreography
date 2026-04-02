import React from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
export interface NotePinSheetProps {
    bottomSheetRef: React.RefObject<BottomSheet | null>;
    /** Session id required to upload audio to a portable storage path. */
    sessionId?: string;
    timecode: string;
    sectionName: string;
    initialText?: string | null;
    initialAudioUri?: string | null;
    onSave: (data: {
        text?: string;
        audioUri?: string;
    }) => Promise<void> | void;
    onDelete?: () => Promise<void> | void;
}
export declare function NotePinSheet({ bottomSheetRef, sessionId, timecode, sectionName, initialText, initialAudioUri, onSave, onDelete, }: NotePinSheetProps): React.JSX.Element;
//# sourceMappingURL=NotePinSheet.d.ts.map