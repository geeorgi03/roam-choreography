import { router, Tabs } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';
import { theme } from '../../lib/theme';

export default function AppStackLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: theme.light.ground },
        tabBarActiveTintColor: theme.light.active,
        tabBarInactiveTintColor: theme.light.muted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Session',
          headerStyle: { backgroundColor: theme.light.ground },
          headerTintColor: theme.light.active,
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/(app)/profile')} style={{ padding: 8 }}>
              <Text style={{ color: theme.light.active, fontSize: 20 }}>⚙</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen name="map" options={{ title: 'Map' }} />
      <Tabs.Screen name="library" options={{ title: 'Library' }} />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="session/[id]"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="session/song-map"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="session/spatial"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="session/group"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="session/clip-player"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
          presentation: 'modal',
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
