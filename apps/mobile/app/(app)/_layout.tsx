import { router, Tabs } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';
import { getActiveSessionId } from '../../lib/storage';
import { theme } from '../../lib/theme';

export default function AppStackLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.light.ground },
        headerTintColor: theme.light.active,
        headerTitleStyle: { fontWeight: '700' },
        tabBarStyle: { backgroundColor: theme.light.ground },
        tabBarActiveTintColor: theme.light.active,
        tabBarInactiveTintColor: theme.light.muted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Session',
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/profile')} style={{ padding: 8 }}>
              <Text style={{ color: theme.light.active, fontSize: 20 }}>⚙</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{ title: 'Map' }}
        listeners={{
          tabPress: (e) => {
            const activeSessionId = getActiveSessionId();
            if (activeSessionId) {
              e.preventDefault();
              router.push(`/session/${activeSessionId}?tab=map`);
            }
          },
        }}
      />
      <Tabs.Screen name="library" options={{ title: 'Library' }} />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="session/[id]"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="session/song-map"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="session/spatial"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="session/group"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="session/beat-grid"
        options={{
          title: '',
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="session/camera"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="session/music-setup"
        options={{
          title: '',
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="session/youtube-player"
        options={{
          title: '',
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="session/clip-player"
        options={{
          href: null,
          presentation: 'modal',
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
