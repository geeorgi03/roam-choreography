"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useShare = void 0;
const react_1 = require("react");
const supabase_1 = require("../supabase");
const api_1 = require("../api");
function useShare(sessionId) {
    const [shareUrl, setShareUrl] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const share = (0, react_1.useCallback)(async () => {
        if (!sessionId)
            return null;
        if (!supabase_1.supabase)
            return null;
        setLoading(true);
        setError(null);
        try {
            const { data: { session } } = await supabase_1.supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) {
                setError('Not signed in');
                return null;
            }
            const res = await fetch(`${api_1.API_BASE}/sessions/${sessionId}/share`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setError(body.error ?? 'Failed to create share link');
                return null;
            }
            const body = (await res.json());
            setShareUrl(body.url);
            return body.url;
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Network error');
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [sessionId]);
    const revoke = (0, react_1.useCallback)(async () => {
        if (!sessionId)
            return false;
        if (!supabase_1.supabase)
            return false;
        setLoading(true);
        setError(null);
        try {
            const { data: { session } } = await supabase_1.supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) {
                setError('Not signed in');
                return false;
            }
            const res = await fetch(`${api_1.API_BASE}/sessions/${sessionId}/share`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setError(body.error ?? 'Failed to revoke');
                return false;
            }
            setShareUrl(null);
            return true;
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Network error');
            return false;
        }
        finally {
            setLoading(false);
        }
    }, [sessionId]);
    return {
        shareUrl,
        share,
        revoke,
        isShared: shareUrl !== null,
        loading,
        error,
    };
}
exports.useShare = useShare;
//# sourceMappingURL=useShare.js.map