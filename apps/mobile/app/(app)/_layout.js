"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const expo_router_1 = require("expo-router");
const theme_1 = require("../../lib/theme");
function AppStackLayout() {
    return (<expo_router_1.Stack screenOptions={{
            headerStyle: { backgroundColor: theme_1.theme.light.ground },
            headerTintColor: theme_1.theme.light.active,
            headerTitleStyle: { fontWeight: '700' },
        }}>
      <expo_router_1.Stack.Screen name="index" options={{ title: 'Roam' }}/>
      <expo_router_1.Stack.Screen name="library" options={{ title: 'Library' }}/>
      <expo_router_1.Stack.Screen name="profile" options={{ title: 'Profile' }}/>
      <expo_router_1.Stack.Screen name="session/[id]" options={{
            headerShown: false,
        }}/>
      <expo_router_1.Stack.Screen name="session/song-map" options={{
            title: 'Song Map',
        }}/>
      <expo_router_1.Stack.Screen name="session/spatial" options={{
            title: 'Spatial',
        }}/>
      <expo_router_1.Stack.Screen name="session/group" options={{
            title: 'Group',
        }}/>
      <expo_router_1.Stack.Screen name="session/clip-player" options={{
            presentation: 'modal',
            headerShown: false,
        }}/>
    </expo_router_1.Stack>);
}
exports.default = AppStackLayout;
//# sourceMappingURL=_layout.js.map