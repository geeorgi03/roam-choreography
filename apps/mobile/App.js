"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Fallback root component for EAS Build when expo/AppEntry.js is used instead of expo-router/entry.
 * Re-exports the expo-router app so the default Expo entry can resolve ../../App.
 */
const expo_router_1 = require("expo-router");
function App() {
    const ctx = require.context('./app', true, /\.(js|jsx|ts|tsx)$/);
    return <expo_router_1.ExpoRoot context={ctx}/>;
}
exports.default = App;
//# sourceMappingURL=App.js.map