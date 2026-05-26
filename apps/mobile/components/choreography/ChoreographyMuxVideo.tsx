import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, type LayoutChangeEvent } from 'react-native';
import { Video, ResizeMode, type AVPlaybackStatus } from 'expo-av';
import { useChoreographyTheme } from '../../lib/contexts/ChoreographyThemeContext';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import type { ClipRow } from '../../lib/database';
import { useChoreographyWorkbench } from '../../lib/contexts/ChoreographyWorkbenchContext';

type Props = {
  clip: ClipRow | null;
  practiceLoupe?: boolean;
};

export function ChoreographyMuxVideo({ clip, practiceLoupe }: Props) {
  const colors = useChoreographyTheme();
  const videoRef = useRef<Video>(null);
  const { isPlaying, playbackSpeed, playheadMs, setPlayheadMs, durationMs, setDurationMs } =
    useSessionContext();
  const { mirror, loupe, setLoupe } = useChoreographyWorkbench();
  const layoutRef = useRef({ width: 1, height: 1 });

  const uri = clip?.mux_playback_id
    ? `https://stream.mux.com/${clip.mux_playback_id}.m3u8`
    : null;

  useEffect(() => {
    void (async () => {
      const v = videoRef.current;
      if (!v) return;
      try {
        await v.setRateAsync(playbackSpeed, true);
      } catch {
        /* ignore */
      }
    })();
  }, [playbackSpeed, uri]);

  useEffect(() => {
    void (async () => {
      const v = videoRef.current;
      if (!v) return;
      try {
        if (isPlaying) await v.playAsync();
        else await v.pauseAsync();
      } catch {
        /* ignore */
      }
    })();
  }, [isPlaying, uri]);

  const onStatus = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    if (status.durationMillis != null) setDurationMs(status.durationMillis);
    if (status.positionMillis != null) setPlayheadMs(status.positionMillis);
  };

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    layoutRef.current = { width, height };
  };

  if (!uri) {
    return <View style={[styles.placeholder, { backgroundColor: colors.chrome }]} />;
  }

  return (
    <Pressable
      style={styles.wrap}
      onLayout={onLayout}
      onPressIn={
        practiceLoupe
          ? (e) => {
              const { locationX, locationY } = e.nativeEvent;
              setLoupe({ x: locationX, y: locationY });
            }
          : undefined
      }
      onPressOut={practiceLoupe ? () => setLoupe(null) : undefined}
    >
      <Video
        ref={videoRef}
        key={uri}
        source={{ uri }}
        style={[styles.video, mirror && styles.mirror]}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={isPlaying}
        rate={playbackSpeed}
        onPlaybackStatusUpdate={onStatus}
        useNativeControls={false}
      />
      {practiceLoupe && loupe ? (
        <View
          pointerEvents="none"
          style={[
            styles.loupe,
            {
              left: Math.max(8, loupe.x - 48),
              top: Math.max(8, loupe.y - 48),
              borderColor: colors.primary,
            },
          ]}
        >
          <Video
            source={{ uri }}
            style={styles.loupeVideo}
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
          />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, overflow: 'hidden' },
  video: { flex: 1, width: '100%', height: '100%' },
  mirror: { transform: [{ scaleX: -1 }] },
  placeholder: { flex: 1 },
  loupe: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  loupeVideo: { width: '100%', height: '100%' },
});
