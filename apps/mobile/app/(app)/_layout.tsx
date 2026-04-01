import { Stack } from 'expo-router';
import { theme } from '../../lib/theme';

export default function AppStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.light.ground },
        headerTintColor: theme.light.active,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Roam' }} />
      <Stack.Screen name="library" options={{ title: 'Library' }} />
      <Stack.Screen name="profile" options={{ title: 'Profile' }} />
      <Stack.Screen
        name="session/[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="session/song-map"
        options={{
          title: 'Song Map',
        }}
      />
      <Stack.Screen
        name="session/spatial"
        options={{
          title: 'Spatial',
        }}
      />
      <Stack.Screen
        name="session/group"
        options={{
          title: 'Group',
        }}
      />
      <Stack.Screen
        name="session/clip-player"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
