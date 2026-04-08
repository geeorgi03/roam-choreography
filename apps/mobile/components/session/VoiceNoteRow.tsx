import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Audio, type AVPlaybackStatus } from 'expo-av';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../../lib/theme';
import { supabase } from '../../lib/supabase';

const colors = theme.light;

export type VoiceNoteRowProps = {
  noteId: string;
  audioStoragePath: string;
  isActive: boolean;
  onRequestPlay: (noteId: string) => void;
  onPlaybackEnded: (noteId: string) => void;
};

async function resolveAudioUri(audioStoragePath: string): Promise<string | null> {
  if (audioStoragePath.startsWith('http://') || audioStoragePath.startsWith('https://')) {
    return audioStoragePath;
  }
  if (audioStoragePath.startsWith('file://')) {
    return audioStoragePath;
  }
  if (!supabase) return null;

  const { data, error } = await supabase.storage.from('audio').createSignedUrl(audioStoragePath, 3600);
  if (!error && data?.signedUrl) return data.signedUrl;

  const publicUrl = supabase.storage.from('audio').getPublicUrl(audioStoragePath).data.publicUrl;
  return publicUrl || null;
}

export function VoiceNoteRow({
  noteId,
  audioStoragePath,
  isActive,
  onRequestPlay,
  onPlaybackEnded,
}: VoiceNoteRowProps) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const mountedRef = useRef(true);
  const [isLoading, setIsLoading] = useState(false);

  const stopPlayback = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
    } catch {
      // ignore playback cleanup failures
    } finally {
      soundRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopPlayback().catch(() => {});
    };
  }, [stopPlayback]);

  useEffect(() => {
    if (!isActive) {
      stopPlayback().catch(() => {});
      return;
    }

    let cancelled = false;
    const start = async () => {
      setIsLoading(true);
      try {
        const uri = await resolveAudioUri(audioStoragePath);
        if (!uri || cancelled || !mountedRef.current) return;

        await stopPlayback();
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true },
          (status: AVPlaybackStatus) => {
            if (!status.isLoaded) return;
            if (status.didJustFinish) {
              onPlaybackEnded(noteId);
            }
          }
        );
        if (cancelled || !mountedRef.current) {
          await sound.unloadAsync();
          return;
        }
        soundRef.current = sound;
      } catch {
        onPlaybackEnded(noteId);
      } finally {
        if (!cancelled && mountedRef.current) setIsLoading(false);
      }
    };

    start().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [audioStoragePath, isActive, noteId, onPlaybackEnded, stopPlayback]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, isActive && styles.buttonActive]}
        activeOpacity={0.8}
        onPress={() => {
          if (isActive) {
            onPlaybackEnded(noteId);
            return;
          }
          onRequestPlay(noteId);
        }}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={isActive ? '#ffffff' : colors.muted} />
        ) : (
          <Text style={[styles.buttonText, isActive && styles.buttonTextActive]}>
            {isActive ? 'Pause' : 'Play'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 4,
  },
  button: {
    minWidth: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.chrome,
  },
  buttonActive: {
    borderColor: colors.mine,
    backgroundColor: colors.mine,
  },
  buttonText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  buttonTextActive: {
    color: '#ffffff',
  },
});
