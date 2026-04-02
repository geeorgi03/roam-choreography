/**
 * Handle Supabase auth redirect from email confirmation / magic link.
 * Call this when the app opens via a deep link (roam://auth/callback#...).
 */
export declare function createSessionFromUrl(url: string, supabase: {
    auth: {
        setSession: (params: {
            access_token: string;
            refresh_token: string;
        }) => Promise<{
            data: unknown;
            error: unknown;
        }>;
    };
}): Promise<boolean>;
//# sourceMappingURL=authRedirect.d.ts.map