import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '../../../lib/theme';

const colors = theme.light;

export default function SpatialRedirect() {
  const router = useRouter();
  const { sessionId, id } = useLocalSearchParams<{ sessionId?: string; id?: string }>();
  const resolvedSessionId =
    typeof sessionId === 'string' && sessionId.length > 0
      ? sessionId
      : typeof id === 'string' && id.length > 0
        ? id
        : null;

  useEffect(() => {
    if (resolvedSessionId) {
      router.replace({
        pathname: '../[id]',
        params: { id: resolvedSessionId, tab: 'spatial' },
      });
    }
  }, [resolvedSessionId, router]);

  if (!resolvedSessionId) {
    return null;
  }

  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ground },
});
