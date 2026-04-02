import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { theme } from '../../lib/theme';

const colors = theme.light;

export function FeelingStrip() {
  const { sessionName } = useSessionContext();
  const [phrase, setPhrase] = useState('');
  const [phraseEditing, setPhraseEditing] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.sessionName} numberOfLines={1}>
        {sessionName}
      </Text>
      <View>
        {phraseEditing ? (
          <TextInput
            style={styles.phrase}
            value={phrase}
            onChangeText={setPhrase}
            onBlur={() => setPhraseEditing(false)}
            autoFocus
            placeholder="add a feeling phrase..."
            placeholderTextColor={colors.muted}
          />
        ) : (
          <TouchableOpacity activeOpacity={0.8} onPress={() => setPhraseEditing(true)}>
            <Text style={styles.phrase} numberOfLines={1}>
              {phrase || 'add a feeling phrase…'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.dot} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    backgroundColor: colors.amberBg,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    position: 'relative',
  },
  sessionName: {
    fontFamily: theme.typography.displayFamily,
    fontSize: 22,
    fontWeight: '500',
    color: colors.active,
  },
  phrase: {
    fontFamily: theme.typography.displayFamily,
    fontStyle: 'italic',
    fontSize: 16,
    color: colors.muted,
    marginLeft: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.amber,
    position: 'absolute',
    top: 8,
    right: 12,
  },
});
