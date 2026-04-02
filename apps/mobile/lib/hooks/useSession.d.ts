import type { Session } from '@supabase/supabase-js';
export declare function useSession(): {
    session: Session | null;
    user: import("@supabase/supabase-js").AuthUser | null;
    loading: boolean;
    error: Error | null;
};
//# sourceMappingURL=useSession.d.ts.map