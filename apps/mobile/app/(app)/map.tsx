import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { MMKV } from 'react-native-mmkv';
import { theme } from '../../lib/theme';

const homeStorage = new MMKV({ id: 'home-state' });

export default function MapScreen() {
  const navigated = useRef(false);

  useEffect(() => {
    const lastId = homeStorage.getString('last_session_id');
    if (!navigated.current && lastId) {
      navigated.current = true;
      router.replace(`/(app)/session/${lastId}?tab=map`);
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>No active session</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.light.ground,
  },
  text: {
    color: theme.light.muted,
    fontSize: 16,
  },
});
