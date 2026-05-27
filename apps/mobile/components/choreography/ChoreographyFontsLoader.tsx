import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { USE_CHOREOGRAPHY_UI } from '../../lib/choreographyUiFlag';
import { useChoreographyFonts } from '../../lib/hooks/useChoreographyFonts';

export function ChoreographyFontsLoader({ children }: { children: React.ReactNode }) {
  const fonts = useChoreographyFonts();
  if (USE_CHOREOGRAPHY_UI && !fonts.ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color="#FF2D6B" size="large" />
      </View>
    );
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: '#09090E',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
