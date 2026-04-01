import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../lib/theme';

const colors = theme.light;

export function SongMapTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Song Map</Text>
      <Text style={styles.placeholder}>Song map content will be displayed here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ground,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    color: colors.active,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  placeholder: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
  },
});
