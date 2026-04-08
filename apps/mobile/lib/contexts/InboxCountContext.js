"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useInboxCount = exports.InboxCountProvider = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const supabase_1 = require("../supabase");
const api_1 = require("../api");
const database_1 = require("../database");
const InboxCountContext = (0, react_1.createContext)(null);
async function authHeader() {
    if (!supabase_1.supabase)
        return null;
    const { data: { session }, } = await supabase_1.supabase.auth.getSession();
    const token = session?.access_token;
    if (!token)
        return null;
    return { Authorization: `Bearer ${token}` };
}
function InboxCountProvider({ children }) {
    const [count, setCount] = (0, react_1.useState)(0);
    const refreshInFlight = (0, react_1.useRef)(null);
    const refreshCount = (0, react_1.useCallback)(async () => {
        if (refreshInFlight.current)
            return refreshInFlight.current;
        const p = (async () => {
            try {
                const headers = await authHeader();
                if (!headers) {
                    setCount(0);
                    return;
                }
                const res = await fetch(`${api_1.API_BASE}/inbox/count`, { headers });
                if (!res.ok)
                    return;
                const body = (await res.json());
                const serverCount = typeof body.count === 'number' ? body.count : 0;
                // Include locally-pending clips (no server_id yet) in the badge count
                let localPending = 0;
                try {
                    localPending = (0, database_1.getInboxClips)().filter((r) => !r.server_id && r.upload_status !== 'failed')
                        .length;
                }
                catch {
                    // ignore
                }
                setCount(serverCount + localPending);
            }
            catch {
                // ignore lightweight count failures
            }
        })().finally(() => {
            refreshInFlight.current = null;
        });
        refreshInFlight.current = p;
        return p;
    }, []);
    (0, react_1.useEffect)(() => {
        refreshCount().catch(() => { });
    }, [refreshCount]);
    (0, react_1.useEffect)(() => {
        const sub = react_native_1.AppState.addEventListener('change', (next) => {
            if (next === 'active') {
                refreshCount().catch(() => { });
            }
        });
        return () => sub.remove();
    }, [refreshCount]);
    const value = (0, react_1.useMemo)(() => ({ count, refreshCount }), [count, refreshCount]);
    return <InboxCountContext.Provider value={value}>{children}</InboxCountContext.Provider>;
}
exports.InboxCountProvider = InboxCountProvider;
function useInboxCount() {
    const ctx = (0, react_1.useContext)(InboxCountContext);
    if (!ctx)
        throw new Error('useInboxCount must be used within an InboxCountProvider');
    return ctx;
}
exports.useInboxCount = useInboxCount;
//# sourceMappingURL=InboxCountContext.js.map