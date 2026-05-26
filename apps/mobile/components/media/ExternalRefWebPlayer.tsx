import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import {
  bilibiliEmbedUrl,
  isBilibiliUrl,
  isXiaohongshuUrl,
  resolveSourceUrl,
} from '../../lib/clipPlayback';
import type { ClipRow } from '../../lib/database';

type Props = {
  url: string;
  style?: StyleProp<ViewStyle>;
};

export function ExternalRefWebPlayer({ url, style }: Props) {
  const uri = isBilibiliUrl(url) ? bilibiliEmbedUrl(url) ?? url : url;

  return (
    <View style={[styles.wrap, style]}>
      <WebView
        source={{ uri }}
        style={styles.web}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        originWhitelist={['*']}
      />
    </View>
  );
}

export function ExternalRefWebPlayerForClip({
  clip,
  style,
}: {
  clip: ClipRow;
  style?: StyleProp<ViewStyle>;
}) {
  const url = resolveSourceUrl(clip);
  if (!url) return null;
  if (!isBilibiliUrl(url) && !isXiaohongshuUrl(url) && !/^https?:\/\//i.test(url)) {
    return null;
  }
  return <ExternalRefWebPlayer url={url} style={style} />;
}

const styles = StyleSheet.create({
  wrap: { flex: 1, overflow: 'hidden', backgroundColor: '#000' },
  web: { flex: 1, backgroundColor: '#000' },
});
