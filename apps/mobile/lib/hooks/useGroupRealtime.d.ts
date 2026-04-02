interface GroupParticipant {
    id: string;
    session_id: string;
    user_id: string;
    display_name: string;
    color: string;
    role: 'choreographer' | 'dancer';
    position_x: number | null;
    position_y: number | null;
    position_note: string | null;
    last_seen_at: string | null;
    created_at: string;
}
interface BroadcastRow {
    id: string;
    session_id: string;
    sender_id: string;
    message: string;
    created_at: string;
}
export declare function useGroupRealtime(sessionId: string, accessToken: string | undefined, shareToken?: string | null): {
    participants: GroupParticipant[];
    myParticipant: GroupParticipant | null;
    isChoreographer: boolean;
    broadcasts: BroadcastRow[];
    sendBroadcast: (message: string) => Promise<boolean>;
    updatePosition: (x: number, y: number, note?: string) => Promise<void>;
};
export {};
//# sourceMappingURL=useGroupRealtime.d.ts.map