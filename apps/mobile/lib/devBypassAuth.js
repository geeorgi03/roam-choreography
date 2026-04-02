"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDevBypassAuth = exports.getDevBypassAuth = void 0;
/**
 * Dev-only: allow opening the main app without signing in.
 * Used when testing on device/emulator without Supabase configured.
 */
let _devBypassAuth = false;
function getDevBypassAuth() {
    return _devBypassAuth;
}
exports.getDevBypassAuth = getDevBypassAuth;
function setDevBypassAuth(value) {
    _devBypassAuth = value;
}
exports.setDevBypassAuth = setDevBypassAuth;
//# sourceMappingURL=devBypassAuth.js.map