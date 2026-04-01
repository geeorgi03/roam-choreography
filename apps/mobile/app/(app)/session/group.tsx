import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '../../../lib/theme';

const colors = theme.light;

export default function GroupRedirect() {
  const router = useRouter();
  const { sessionId, id, share_token, token } = useLocalSearchParams<{
    sessionId?: string;
    id?: string;
    share_token?: string;
    token?: string;
  }>();
  const resolvedSessionId =
    typeof sessionId === 'string' && sessionId.length > 0
      ? sessionId
      : typeof id === 'string' && id.length > 0
        ? id
        : null;
  const resolvedShareToken = typeof share_token === 'string' && share_token.length > 0 ? share_token : undefined;
  const resolvedToken = typeof token === 'string' && token.length > 0 ? token : undefined;

  useEffect(() => {
    if (resolvedSessionId) {
      router.replace({
        pathname: '../[id]',
        params: {
          id: resolvedSessionId,
          tab: 'group',
          ...(resolvedShareToken ? { share_token: resolvedShareToken } : {}),
          ...(resolvedToken ? { token: resolvedToken } : {}),
        },
      });
    }
  }, [resolvedSessionId, resolvedShareToken, resolvedToken, router]);

  if (!resolvedSessionId) {
    return null;
  }

  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ground },
});
