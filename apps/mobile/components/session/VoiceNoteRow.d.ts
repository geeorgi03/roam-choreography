import React from 'react';
export type VoiceNoteRowProps = {
    noteId: string;
    audioStoragePath: string;
    isActive: boolean;
    onRequestPlay: (noteId: string) => void;
    onPlaybackEnded: (noteId: string) => void;
};
export declare function VoiceNoteRow({ noteId, audioStoragePath, isActive, onRequestPlay, onPlaybackEnded, }: VoiceNoteRowProps): React.JSX.Element;
//# sourceMappingURL=VoiceNoteRow.d.ts.map