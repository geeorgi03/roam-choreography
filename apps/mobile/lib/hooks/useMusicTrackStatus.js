"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMusicTrackStatus = void 0;
const react_1 = require("react");
const supabase_1 = require("../supabase");
function useMusicTrackStatus(sessionId) {
    const [musicTrack, setMusicTrack] = (0, react_1.useState)(null);
    const refetch = async () => {
        if (!sessionId)
            return;
        if (!supabase_1.supabase)
            return;
        const { data } = await supabase_1.supabase
            .from('music_tracks')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        setMusicTrack(data ?? null);
    };
    (0, react_1.useEffect)(() => {
        if (!sessionId) {
            setMusicTrack(null);
            return;
        }
        if (!supabase_1.supabase)
            return;
        let mounted = true;
        let channel = null;
        (async () => {
            const { data } = await supabase_1.supabase
                .from('music_tracks')
                .select('*')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (mounted)
                setMusicTrack(data ?? null);
        })();
        channel = supabase_1.supabase
            .channel(`music_tracks:session_id=eq.${sessionId}`)
            .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'music_tracks',
            filter: `session_id=eq.${sessionId}`,
        }, (payload) => {
            if (mounted)
                setMusicTrack(payload.new);
        })
            .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'music_tracks',
            filter: `session_id=eq.${sessionId}`,
        }, (payload) => {
            if (mounted)
                setMusicTrack(payload.new);
        })
            .subscribe();
        return () => {
            mounted = false;
            if (channel)
                supabase_1.supabase?.removeChannel(channel);
        };
    }, [sessionId]);
    const isAnalysing = musicTrack?.analysis_status === 'pending' || musicTrack?.analysis_status === 'processing';
    return { musicTrack, isAnalysing, refetch };
}
exports.useMusicTrackStatus = useMusicTrackStatus;
//# sourceMappingURL=useMusicTrackStatus.js.map