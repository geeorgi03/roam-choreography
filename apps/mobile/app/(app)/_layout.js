"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const expo_router_1 = require("expo-router");
const react_native_1 = require("react-native");
const storage_1 = require("../../lib/storage");
const theme_1 = require("../../lib/theme");
const InboxCountContext_1 = require("../../lib/contexts/InboxCountContext");
function AppStackLayout() {
    const { count } = (0, InboxCountContext_1.useInboxCount)();
    return (<expo_router_1.Tabs screenOptions={{
            headerStyle: { backgroundColor: theme_1.theme.light.ground },
            headerTintColor: theme_1.theme.light.active,
            headerTitleStyle: { fontWeight: '700' },
            tabBarStyle: { backgroundColor: theme_1.theme.light.ground },
            tabBarActiveTintColor: theme_1.theme.light.active,
            tabBarInactiveTintColor: theme_1.theme.light.muted,
        }}>
      <expo_router_1.Tabs.Screen name="index" options={{
            title: 'Session',
            headerRight: () => (<react_native_1.TouchableOpacity onPress={() => expo_router_1.router.push('/profile')} style={{ padding: 8 }}>
              <react_native_1.Text style={{ color: theme_1.theme.light.active, fontSize: 20 }}>⚙</react_native_1.Text>
            </react_native_1.TouchableOpacity>),
        }}/>
      <expo_router_1.Tabs.Screen name="map" options={{ title: 'Map' }} listeners={{
            tabPress: (e) => {
                const activeSessionId = (0, storage_1.getActiveSessionId)();
                if (activeSessionId) {
                    e.preventDefault();
                    expo_router_1.router.push(`/session/${activeSessionId}?tab=map`);
                }
            },
        }}/>
      <expo_router_1.Tabs.Screen name="library" options={{ title: 'Library' }}/>
      <expo_router_1.Tabs.Screen name="inbox" options={{
            title: 'Inbox',
            headerShown: true,
            tabBarIcon: ({ focused }) => (<react_native_1.Text style={{
                    color: focused ? theme_1.theme.light.active : theme_1.theme.light.muted,
                    fontSize: 18,
                }}>
              🔔
            </react_native_1.Text>),
            tabBarBadge: count > 0 ? count : undefined,
        }}/>
      <expo_router_1.Tabs.Screen name="profile" options={{
            href: null,
            headerShown: false,
        }}/>
      <expo_router_1.Tabs.Screen name="session/[id]" options={{
            href: null,
            headerShown: false,
        }}/>
      <expo_router_1.Tabs.Screen name="session/song-map" options={{
            href: null,
            headerShown: false,
        }}/>
      <expo_router_1.Tabs.Screen name="session/spatial" options={{
            href: null,
            headerShown: false,
        }}/>
      <expo_router_1.Tabs.Screen name="session/group" options={{
            href: null,
            headerShown: false,
        }}/>
      <expo_router_1.Tabs.Screen name="session/camera" options={{
            href: null,
            headerShown: false,
        }}/>
      <expo_router_1.Tabs.Screen name="session/music-setup" options={{
            title: '',
            href: null,
            headerShown: false,
        }}/>
      <expo_router_1.Tabs.Screen name="session/youtube-player" options={{
            title: '',
            href: null,
            headerShown: false,
        }}/>
      <expo_router_1.Tabs.Screen name="session/clip-player" options={{
            href: null,
            presentation: 'modal',
            headerShown: false,
        }}/>
    </expo_router_1.Tabs>);
}
exports.default = AppStackLayout;
//# sourceMappingURL=_layout.js.map