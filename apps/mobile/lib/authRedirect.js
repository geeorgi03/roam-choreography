"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSessionFromUrl = void 0;
/**
 * Handle Supabase auth redirect from email confirmation / magic link.
 * Call this when the app opens via a deep link (roam://auth/callback#...).
 */
async function createSessionFromUrl(url, supabase) {
    try {
        const parsed = new URL(url);
        let accessToken = null;
        let refreshToken = null;
        if (parsed.hash && parsed.hash.length > 1) {
            const hashParams = new URLSearchParams(parsed.hash.slice(1));
            accessToken = hashParams.get('access_token');
            refreshToken = hashParams.get('refresh_token');
        }
        if (!accessToken || !refreshToken) {
            const searchParams = parsed.searchParams;
            accessToken = accessToken ?? searchParams.get('access_token');
            refreshToken = refreshToken ?? searchParams.get('refresh_token');
        }
        if (!accessToken || !refreshToken) {
            return false;
        }
        const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
        });
        if (error) {
            console.error('[authRedirect] setSession failed:', error.message ?? error);
            return false;
        }
        return true;
    }
    catch (e) {
        console.error('[authRedirect] createSessionFromUrl failed:', e);
        return false;
    }
}
exports.createSessionFromUrl = createSessionFromUrl;
//# sourceMappingURL=authRedirect.js.map