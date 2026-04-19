import { router, Tabs } from 'expo-router';
import { View } from 'react-native';
import { getActiveSessionId } from '../../lib/storage';
import { useInboxCount } from '../../lib/contexts/InboxCountContext';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useTranslation } from '../../lib/i18n';
import { IconInbox } from '../../components/icons/SessionChromeIcons';
import { AppTabHeaderRight } from '../../components/AppTabHeaderRight';
import { HeaderBackButton } from '../../components/HeaderBackButton';

export default function AppStackLayout() {
  const { count } = useInboxCount();
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.ground },
        headerTintColor: colors.active,
        headerTitleStyle: { fontWeight: '700' },
        tabBarStyle: { backgroundColor: colors.ground },
        tabBarActiveTintColor: colors.active,
        tabBarInactiveTintColor: colors.muted,
        headerRight: () => <AppTabHeaderRight showProfileLink={route.name !== 'profile'} />,
        headerLeft: route.name === 'profile' ? () => <HeaderBackButton /> : undefined,
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: t('tabs.song'),
          tabBarLabel: t('tabs.song'),
        }}
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
      <Tabs.Screen
        name="library"
        options={{
          title: t('tabs.library'),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: t('tabs.inbox'),
          headerShown: true,
          tabBarIcon: ({ focused }) => (
            <View style={{ opacity: focused ? 1 : 0.55 }}>
              <IconInbox size={22} color={focused ? colors.active : colors.muted} />
            </View>
          ),
          tabBarBadge: count > 0 ? count : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
          headerShown: true,
          title: t('tabs.profile'),
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
