export type NotePin = {
    id: string;
    session_id: string;
    timecode_ms: number;
    text: string | null;
    audio_storage_path: string | null;
    color: string | null;
    created_at: string;
};
export declare function useNotePins(sessionId: string | null): {
    notes: NotePin[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    createNote: (input: {
        timecode_ms: number;
        text?: string | null;
        audio_storage_path?: string | null;
        color?: string | null;
    }) => Promise<NotePin | null>;
    deleteNote: (noteId: string) => Promise<boolean>;
};
//# sourceMappingURL=useNotePins.d.ts.map