import { router, Tabs } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';
import { getActiveSessionId } from '../../lib/storage';
import { theme } from '../../lib/theme';
import { useInboxCount } from '../../lib/contexts/InboxCountContext';

export default function AppStackLayout() {
  const { count } = useInboxCount();

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
        name="inbox"
        options={{
          title: 'Inbox',
          headerShown: true,
          tabBarIcon: ({ focused }) => (
            <Text
              style={{
                color: focused ? theme.light.active : theme.light.muted,
                fontSize: 18,
              }}
            >
              🔔
            </Text>
          ),
          tabBarBadge: count > 0 ? count : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
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
        name="session/camera"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="session/music-setup"
        options={{
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
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
