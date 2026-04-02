import type { SupabaseClient } from '@supabase/supabase-js';
type SupabaseSafe = {
    supabase: SupabaseClient | null;
    error: Error | null;
    loading: boolean;
};
/**
 * Loads the Supabase client without crashing when env vars are missing.
 * Use on auth screens so "Continue to sign in" / "Continue anyway" still show a usable screen.
 */
export declare function useSupabaseSafe(): SupabaseSafe;
export {};
//# sourceMappingURL=useSupabaseSafe.d.ts.map