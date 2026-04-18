import { useCallback, useEffect, useMemo } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { getActiveSessionId } from '../../lib/storage';
import { theme } from '../../lib/theme';
import { useTheme, type ThemePalette } from '../../lib/contexts/ThemeContext';

export default function MapScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createMapStyles(colors), [colors]);
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

function createMapStyles(colors: ThemePalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.ground,
      paddingHorizontal: 24,
    },
    text: {
      color: colors.muted,
      fontSize: 16,
      lineHeight: 24,
      textAlign: 'center',
    },
  });
}
