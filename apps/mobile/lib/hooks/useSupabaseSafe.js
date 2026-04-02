"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSupabaseSafe = void 0;
const react_1 = require("react");
/**
 * Loads the Supabase client without crashing when env vars are missing.
 * Use on auth screens so "Continue to sign in" / "Continue anyway" still show a usable screen.
 */
function useSupabaseSafe() {
    const [state, setState] = (0, react_1.useState)({
        supabase: null,
        error: null,
        loading: true,
    });
    (0, react_1.useEffect)(() => {
        let mounted = true;
        import('../supabase')
            .then(({ supabase }) => {
            if (mounted)
                setState({ supabase, error: null, loading: false });
        })
            .catch((err) => {
            if (mounted) {
                setState({
                    supabase: null,
                    error: err instanceof Error ? err : new Error(String(err)),
                    loading: false,
                });
            }
        });
        return () => {
            mounted = false;
        };
    }, []);
    return state;
}
exports.useSupabaseSafe = useSupabaseSafe;
//# sourceMappingURL=useSupabaseSafe.js.map