import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  type LayoutChangeEvent,
} from 'react-native';
import { ExternalRefWebPlayer } from '../media/ExternalRefWebPlayer';
import { Video, ResizeMode, type AVPlaybackStatus } from 'expo-av';
import YoutubeIframe from 'react-native-youtube-iframe';
import { useChoreographyTheme } from '../../lib/contexts/ChoreographyThemeContext';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import type { ClipRow } from '../../lib/database';
import { useChoreographyWorkbench } from '../../lib/contexts/ChoreographyWorkbenchContext';
import {
  extractYoutubeVideoId,
  getClipVideoUri,
  isBilibiliUrl,
  isExternalRefClip,
  isXiaohongshuUrl,
  isYoutubeUrl,
  resolveSourceUrl,
  uploadStatusLabel,
} from '../../lib/clipPlayback';

type Props = {
  clip: ClipRow | null;
  practiceLoupe?: boolean;
};

export function ChoreographyMuxVideo({ clip, practiceLoupe }: Props) {
  const colors = useChoreographyTheme();
  const videoRef = useRef<Video>(null);
  const { isPlaying, playbackSpeed, setPlayheadMs, setDurationMs } = useSessionContext();
  const { mirror, loupe, setLoupe } = useChoreographyWorkbench();
  const [youtubeReady, setYoutubeReady] = useState(false);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });

  const avUri = clip ? getClipVideoUri(clip) : null;
  const refUrl = clip ? resolveSourceUrl(clip) : null;
  const youtubeId = refUrl && isYoutubeUrl(refUrl) ? extractYoutubeVideoId(refUrl) : null;
  const externalRef = clip && isExternalRefClip(clip) && !avUri;

  useEffect(() => {
    void (async () => {
      const v = videoRef.current;
      if (!v || !avUri) return;
      try {
        await v.setRateAsync(playbackSpeed, true);
      } catch {
        /* ignore */
      }
    })();
  }, [playbackSpeed, avUri]);

  useEffect(() => {
    void (async () => {
      const v = videoRef.current;
      if (!v || !avUri) return;
      try {
        if (isPlaying) await v.playAsync();
        else await v.pauseAsync();
      } catch {
        /* ignore */
      }
    })();
  }, [isPlaying, avUri]);

  const onStatus = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    if (status.durationMillis != null) setDurationMs(status.durationMillis);
    if (status.positionMillis != null) setPlayheadMs(status.positionMillis);
  };

  if (!clip) {
    return <View style={[styles.placeholder, { backgroundColor: colors.chrome }]} />;
  }

  if (avUri) {
    return (
      <Pressable
        style={styles.wrap}
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
          key={avUri}
          source={{ uri: avUri }}
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
              source={{ uri: avUri }}
              style={styles.loupeVideo}
              resizeMode={ResizeMode.COVER}
              shouldPlay={false}
            />
          </View>
        ) : null}
      </Pressable>
    );
  }

  if (youtubeId) {
    return (
      <View
        style={styles.wrap}
        onLayout={(e: LayoutChangeEvent) => {
          const { width, height } = e.nativeEvent.layout;
          if (width > 0 && height > 0) setFrameSize({ width, height });
        }}
      >
        {frameSize.height > 0 ? (
          <YoutubeIframe
            height={frameSize.height}
            width={frameSize.width}
            videoId={youtubeId}
            play={isPlaying}
            onReady={() => setYoutubeReady(true)}
            webViewStyle={styles.youtubeWeb}
            webViewProps={{
              style: styles.youtubeWeb,
              allowsFullscreenVideo: true,
            }}
          />
        ) : null}
        {!youtubeReady ? (
          <View style={styles.refOverlay}>
            <Text style={styles.refHint}>Loading reference…</Text>
          </View>
        ) : null}
      </View>
    );
  }

  if (
    externalRef &&
    refUrl &&
    (isBilibiliUrl(refUrl) || isXiaohongshuUrl(refUrl))
  ) {
    return (
      <View style={styles.wrap}>
        <ExternalRefWebPlayer url={refUrl} style={styles.wrap} />
        <View style={styles.embedCaption} pointerEvents="none">
          <Text style={styles.refHint}>
            Use controls in the embed. Roam playhead may not track external players.
          </Text>
        </View>
      </View>
    );
  }

  const statusLabel = uploadStatusLabel(clip.upload_status);
  return (
    <View style={[styles.placeholder, { backgroundColor: colors.chrome }]}>
      <Text style={styles.refHint}>
        {statusLabel ?? 'No video for this take yet'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, overflow: 'hidden' },
  video: { flex: 1, width: '100%', height: '100%' },
  mirror: { transform: [{ scaleX: -1 }] },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
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
  youtubeWeb: { flex: 1, alignSelf: 'stretch' },
  refOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  refTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  refHint: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  embedCaption: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
});
