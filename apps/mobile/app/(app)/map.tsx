import { useCallback, useEffect } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { getActiveSessionId } from '../../lib/storage';
import { theme } from '../../lib/theme';

export default function MapScreen() {
  const redirectToActiveSession = useCallback(() => {
    const activeSessionId = getActiveSessionId();
    if (activeSessionId) {
      router.push(`/session/${activeSessionId}?tab=map`);
    }
  }, []);

  useEffect(() => {
    redirectToActiveSession();
  }, [redirectToActiveSession]);

  useFocusEffect(redirectToActiveSession);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>No active session. Start one from Session tab.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.light.ground,
    paddingHorizontal: 24,
  },
  text: {
    color: theme.light.muted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
});
