"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const expo_router_1 = require("expo-router");
function AuthLayout() {
    return (<expo_router_1.Stack screenOptions={{ headerShown: false }}>
      <expo_router_1.Stack.Screen name="sign-in"/>
      <expo_router_1.Stack.Screen name="sign-up"/>
      <expo_router_1.Stack.Screen name="callback" options={{ headerShown: false }}/>
    </expo_router_1.Stack>);
}
exports.default = AuthLayout;
//# sourceMappingURL=_layout.js.map