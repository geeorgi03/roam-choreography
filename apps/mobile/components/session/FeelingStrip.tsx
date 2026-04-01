import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { theme } from '../../lib/theme';

const colors = theme.light;
const spacing = theme.spacing;

export function FeelingStrip() {
  const { activeSection, musicTrack } = useSessionContext();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.sectionText}>{activeSection}</Text>
        {musicTrack?.bpm && (
          <Text style={styles.bpmText}>{Math.round(musicTrack.bpm)} BPM</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.chrome,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
  },
  scrollContent: {
    alignItems: 'center',
    gap: 12,
  },
  sectionText: {
    color: colors.active,
    fontSize: 14,
    fontWeight: '700',
  },
  bpmText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
});
