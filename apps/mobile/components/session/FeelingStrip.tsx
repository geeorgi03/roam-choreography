import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image } from 'react-native';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { theme } from '../../lib/theme';

const colors = theme.light;

/** `clip_url` on the session is the Mux playback id; legacy rows may store an HLS URL. */
function qualityTargetThumbnailUri(
  clipUrl: string,
  timestampMs: number
): string {
  const trimmed = clipUrl.trim();
  const timeSec = Math.max(0, timestampMs / 1000);
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const streamMatch = trimmed.match(/stream\.mux\.com\/([^/?#]+)/i);
    if (streamMatch) {
      const id = streamMatch[1].replace(/\.m3u8$/i, '');
      return `https://image.mux.com/${id}/thumbnail.jpg?time=${timeSec}`;
    }
    return trimmed;
  }
  return `https://image.mux.com/${trimmed}/thumbnail.jpg?time=${timeSec}`;
}

const phraseBaseStyle = {
  fontFamily: theme.typography.displayFamily,
  fontStyle: 'italic' as const,
  color: colors.muted,
};

export function FeelingStrip() {
  const { sessionName, sessionPhrase, updateSessionMeta, openSheet, qualityTarget } = useSessionContext();
  const [phrase, setPhrase] = useState('');
  const [phraseEditing, setPhraseEditing] = useState(false);
  const [nameEditing, setNameEditing] = useState(false);
  const [name, setName] = useState('');

  // Sync with context values
  useEffect(() => {
    setPhrase(sessionPhrase || '');
  }, [sessionPhrase]);

  useEffect(() => {
    setName(sessionName);
  }, [sessionName]);

  const handlePhraseBlur = async () => {
    setPhraseEditing(false);
    await updateSessionMeta({ phrase: phrase.trim() || null });
  };

  const handleNameBlur = async () => {
    setNameEditing(false);
    await updateSessionMeta({ name: name.trim() || 'Session' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.textContent}>
        <View>
          {nameEditing ? (
            <TextInput
              style={styles.sessionName}
              value={name}
              onChangeText={setName}
              onBlur={handleNameBlur}
              autoFocus
              placeholder='Session name...'
              placeholderTextColor={colors.muted}
            />
          ) : (
            <TouchableOpacity activeOpacity={0.8} onPress={() => setNameEditing(true)}>
              <Text style={styles.sessionName} numberOfLines={1}>
                {name || 'Session'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View>
          {phraseEditing ? (
            <TextInput
              style={styles.phrase}
              value={phrase}
              onChangeText={setPhrase}
              onBlur={handlePhraseBlur}
              autoFocus
              placeholder='add a feeling phrase...'
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
        {qualityTarget && (
          <View style={styles.qualityTargetRow}>
            <Image
              style={styles.qualityTargetThumb}
              source={{
                uri: qualityTargetThumbnailUri(qualityTarget.clip_url, qualityTarget.timestamp_ms),
              }}
            />
            <Text style={styles.qualityTargetLabel}>what I'm reaching for</Text>
          </View>
        )}
      </View>
      <View style={styles.iconRow}>
        <TouchableOpacity style={styles.iconButton} onPress={() => openSheet('share')} activeOpacity={0.8}>
          <Text style={styles.iconText}>↗</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => {}} activeOpacity={0.8}>
          <Text style={styles.iconText}>⋮</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 56,
    backgroundColor: colors.amberBg,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  textContent: {
    flexShrink: 1,
  },
  sessionName: {
    fontFamily: theme.typography.displayFamily,
    fontSize: 22,
    fontWeight: '500',
    color: colors.active,
  },
  phrase: {
    ...phraseBaseStyle,
    fontSize: 16,
    marginLeft: 12,
  },
  qualityTargetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  qualityTargetThumb: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
  qualityTargetLabel: {
    ...phraseBaseStyle,
    fontSize: 12,
  },
  iconRow: {
    marginLeft: 'auto',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 14,
    color: colors.muted,
  },
});