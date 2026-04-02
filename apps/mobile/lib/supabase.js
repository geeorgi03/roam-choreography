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
exports.supabaseInitError = exports.supabase = void 0;
const SecureStore = __importStar(require("expo-secure-store"));
const db_1 = require("@roam/db");
console.log('[BOOT] supabase module loading');
const secureStorage = {
    getItem: (key) => SecureStore.getItemAsync(key),
    setItem: (key, value) => SecureStore.setItemAsync(key, value),
    removeItem: (key) => SecureStore.deleteItemAsync(key),
};
// Never throw at module-evaluation time — route files import this module eagerly
// (expo-router evaluates all routes on startup). A throw here puts the module in
// a broken state so that even the lazy import() in useSession gets undefined.
let supabase = null;
exports.supabase = supabase;
let supabaseInitError = null;
exports.supabaseInitError = supabaseInitError;
try {
    exports.supabase = supabase = (0, db_1.createSupabaseClientFromExpoEnv)({
        auth: {
            storage: secureStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
    });
    console.log('[BOOT] Supabase client created');
}
catch (e) {
    exports.supabaseInitError = supabaseInitError = e instanceof Error ? e : new Error(String(e));
    console.error('[BOOT] Supabase init error (check EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY):', supabaseInitError.message);
}
//# sourceMappingURL=supabase.js.map