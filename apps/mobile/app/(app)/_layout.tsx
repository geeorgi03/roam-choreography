import { router, Tabs } from 'expo-router';
import { TouchableOpacity, Text, View } from 'react-native';
import { getActiveSessionId } from '../../lib/storage';
import { useInboxCount } from '../../lib/contexts/InboxCountContext';
import { useTheme } from '../../lib/contexts/ThemeContext';

export default function AppStackLayout() {
  const { count } = useInboxCount();
  const { colors, toggleMode, mode } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.ground },
        headerTintColor: colors.active,
        headerTitleStyle: { fontWeight: '700' },
        tabBarStyle: { backgroundColor: colors.ground },
        tabBarActiveTintColor: colors.active,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Session',
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={toggleMode}
                style={{ padding: 8 }}
                accessibilityRole="button"
                accessibilityLabel={mode === 'night' ? 'Switch to day mode' : 'Switch to night mode'}
              >
                <Text style={{ fontSize: 20 }}>{mode === 'night' ? '☀' : '🌙'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/profile')} style={{ padding: 8 }}>
                <Text style={{ color: colors.active, fontSize: 20 }}>⚙</Text>
              </TouchableOpacity>
            </View>
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
                color: focused ? colors.active : colors.muted,
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
